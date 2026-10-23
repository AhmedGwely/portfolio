/// <reference types="@testing-library/jest-dom" />

// ============================================================================
// tests/gallery-mocks.ts
//
// Shared, test-only fixtures for the gallery suite.
//
// These mocks are FAITHFUL to the production query chain rather than
// hardcoded: the fake Supabase table records every builder call and applies
// `.eq()` as a real filter, so the production data layer's own filtering
// logic is what the tests actually exercise.
// ============================================================================

import { vi } from 'vitest'

/** A row exactly as the `gallery_metadata` table returns it. */
export type DbRow = {
  id: number
  src: string
  caption: string
  alt_text: string
  category: string
  width: number
  height: number
  is_published: boolean
  /** Exact Storage object key, or null for a legacy `/public` asset. */
  storage_key?: string | null
}

export type StorageInstanceMock = {
  upload: ReturnType<typeof vi.fn>
  getPublicUrl: ReturnType<typeof vi.fn>
  remove: ReturnType<typeof vi.fn>
  list: ReturnType<typeof vi.fn>
}

/**
 * Fake Supabase Storage instance.
 *
 * `upload` records the exact object key it was handed, so a test can prove
 * which key was sent without trusting a hard-coded string. `remove` records
 * every key it was asked to delete, which is how the "never deletes an
 * unrelated object" assertions are made.
 */
export function makeStorageInstanceMock(initialObjects: string[] = []) {
  const objects: string[] = [...initialObjects]
  const removeCalls: string[][] = []

  const instance: StorageInstanceMock = {
    upload: vi.fn(async (key: string, _file: unknown, _opts?: unknown) => {
      objects.push(key)
      return { error: null }
    }),
    getPublicUrl: vi.fn((key: string) => ({
      data: { publicUrl: `https://mock.supabase.test/storage/v1/object/public/gallery/${key}` },
    })),
    remove: vi.fn(async (keys: string[]) => {
      removeCalls.push([...keys])
      for (const k of keys) {
        const i = objects.indexOf(k)
        if (i !== -1) objects.splice(i, 1)
      }
      return { error: null }
    }),
    list: vi.fn(async () => ({ data: [...objects], error: null })),
  }

  return { instance, objects, removeCalls }
}

/**
 * Fake Supabase table that records the query chain it was given.
 *
 * `.eq(field, value)` is applied as a genuine filter against `rows`, so
 * `.eq('is_published', true)` really does exclude drafts — the filter is not
 * asserted, it is executed.
 */
export function makeTableMock(rows: DbRow[] = []) {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const inserts: Record<string, unknown>[] = []
  const updates: Array<{ partial: Record<string, unknown>; id: number }> = []
  const deletes: number[] = []

  let eqFilters: Array<{ field: string; value: unknown }> = []

  const applyFilters = (): DbRow[] =>
    rows.filter((row) =>
      eqFilters.every((f) => (row as unknown as Record<string, unknown>)[f.field] === f.value),
    )

  const build = () => {
    const query: Record<string, unknown> = {
      select: (...args: unknown[]) => {
        calls.push({ method: 'select', args })
        return query
      },
      order: (...args: unknown[]) => {
        calls.push({ method: 'order', args })
        return query
      },
      eq: (field: string, value: unknown) => {
        calls.push({ method: 'eq', args: [field, value] })
        eqFilters.push({ field, value })
        return query
      },
      update: (partial: Record<string, unknown>) => {
        calls.push({ method: 'update', args: [partial] })
        const result = {
          eq: (field: string, value: unknown) => {
            calls.push({ method: 'update.eq', args: [field, value] })
            for (const row of rows) {
              if ((row as unknown as Record<string, unknown>)[field] === value) {
                Object.assign(row, partial)
                updates.push({ partial, id: value as number })
              }
            }
            return Promise.resolve({ error: null })
          },
        }
        return result
      },
      delete: () => {
        calls.push({ method: 'delete', args: [] })
        const result = {
          eq: (field: string, value: unknown) => {
            calls.push({ method: 'delete.eq', args: [field, value] })
            for (let i = rows.length - 1; i >= 0; i--) {
              if ((rows[i] as unknown as Record<string, unknown>)[field] === value) {
                deletes.push(value as number)
                rows.splice(i, 1)
              }
            }
            return Promise.resolve({ error: null })
          },
        }
        return result
      },
      insert: (records: Record<string, unknown>[]) => {
        calls.push({ method: 'insert', args: [records] })
        inserts.push(...(Array.isArray(records) ? records : [records]))
        rows.push(...(records as unknown as DbRow[]))
        return Promise.resolve({ error: null })
      },
    }

    // Postgrest filter builders are thenable: awaiting the chain resolves the
    // query. Emulate that so the production code path can be awaited directly.
    Object.defineProperty(query, 'then', {
      value: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
        Promise.resolve({ data: applyFilters(), error: null }).then(resolve, reject),
      configurable: true,
      writable: true,
    })

    return query
  }

  return { build, calls, inserts, updates, deletes, rows }
}

/** Build a fake Supabase client around a table + storage mock. */
export function makeSupabaseMock(rows: DbRow[] = [], objects: string[] = []) {
  const table = makeTableMock(rows)
  const storage = makeStorageInstanceMock(objects)

  const client = {
    from: vi.fn(() => table.build()),
    storage: { from: vi.fn(() => storage.instance) },
  }

  return { client, table, storage }
}

/**
 * Register a fake Supabase module for the given rows/objects and return the
 * handles a test needs to assert against.
 */
export function mockSupabaseModule(
  rows: DbRow[] = [],
  objects: string[] = [],
  bucket = 'gallery',
) {
  const { client, table, storage } = makeSupabaseMock(rows, objects)

  vi.mock('@/lib/supabase', () => ({
    supabase: client,
    anonSupabase: null,
    getStorageBucket: () => bucket,
    getStorageSchema: () => 'public',
  }))

  return { client, table, storage }
}
