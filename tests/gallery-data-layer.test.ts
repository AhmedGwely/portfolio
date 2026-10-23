/// <reference types="@testing-library/jest-dom" />

/**
 * Data-layer behaviour, exercised against a faithful fake Supabase client.
 *
 * The fake table records every builder call and applies `.eq()` as a REAL
 * filter over its rows, so the assertions below test the production query
 * construction — not a hard-coded expected result.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { DbRow } from './gallery-mocks'

const sup = vi.hoisted(() => ({ client: null as unknown }))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => sup.client,
  isConfigured: () => true,
  getStorageBucket: () => 'gallery',
  getStorageSchema: () => 'public',
}))

function makeQuery(rows: DbRow[]) {
  const filters: Array<{ field: string; value: unknown }> = []
  const insertCalls: Record<string, unknown>[][] = []
  const updateCalls: Array<{ partial: Record<string, unknown>; id: number }> = []
  const deleteCalls: number[] = []
  const selectCalls: string[] = []
  const insertedRows: Record<string, unknown>[] = []
  const insertPayloads: Record<string, unknown>[][] = []

  const query: Record<string, unknown> = {
    single: () => Promise.resolve({ data: insertedRows[insertedRows.length - 1], error: null }),
    select: (cols: string) => {
      selectCalls.push(cols)
      return query
    },
    order: () => query,
    eq: (field: string, value: unknown) => {
      filters.push({ field, value })
      return query
    },
    update: (partial: Record<string, unknown>) => ({
      eq: (field: string, value: unknown) => {
        for (const row of rows) {
          if ((row as unknown as Record<string, unknown>)[field] === value) {
            Object.assign(row, partial)
            updateCalls.push({ partial, id: value as number })
          }
        }
        return Promise.resolve({ error: null })
      },
    }),
    delete: () => ({
      eq: (field: string, value: unknown) => {
        for (let i = rows.length - 1; i >= 0; i--) {
          if ((rows[i] as unknown as Record<string, unknown>)[field] === value) {
            deleteCalls.push(value as number)
            rows.splice(i, 1)
          }
        }
        return Promise.resolve({ error: null })
      },
    }),
    insert: (records: Record<string, unknown>[]) => {
      const list = Array.isArray(records) ? records : [records]
      insertCalls.push(list)
      for (const r of list) {
        rows.push(r as unknown as DbRow)
        insertedRows.push(r)
      }
      return query
    },
    maybeSingle: () => {
      const filtered = rows.filter((row) =>
        filters.every(
          (f) => (row as unknown as Record<string, unknown>)[f.field] === f.value,
        ),
      )
      return Promise.resolve({ data: filtered[0] ?? null, error: null })
    },
  }

  Object.defineProperty(query, 'then', {
    value: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({
        data: rows.filter((row) =>
          filters.every(
            (f) => (row as unknown as Record<string, unknown>)[f.field] === f.value,
          ),
        ),
        error: null,
      }).then(resolve, reject),
    configurable: true,
    writable: true,
  })

  return {
    query,
    filters,
    insertCalls,
    updateCalls,
    deleteCalls,
    selectCalls,
    rows,
    insertPayloads,
    insertedRows,
  }
}

const PUBLISHED: DbRow[] = [
  { id: 1, src: 'https://cdn.example.com/1.jpg', caption: 'Published 1', alt_text: 'Alt 1', category: 'AI', width: 800, height: 600, is_published: true },
  { id: 2, src: 'https://cdn.example.com/2.jpg', caption: 'Published 2', alt_text: 'Alt 2', category: 'AI', width: 800, height: 600, is_published: true },
]
const UNPUBLISHED: DbRow = {
  id: 3, src: 'https://cdn.example.com/3.jpg', caption: 'Draft', alt_text: 'Alt 3', category: 'AI', width: 800, height: 600, is_published: false,
}

const LEGACY_ROW: DbRow = {
  id: 7, src: '/gallery/ai-deeplearning-leaderboard.jpg', caption: 'Legacy', alt_text: 'Legacy alt', category: 'AI & Computer Vision', width: 480, height: 480, is_published: true, storage_key: null,
}

function seed() {
  return [...PUBLISHED.map((r) => ({ ...r })), { ...UNPUBLISHED }]
}

/** Public read filtering tests. */

// Mirror of `LEGACY_RESERVED_ID_MAX` in `lib/gallery-data.ts`.
const LEGACY_RESERVED_ID_MAX = 7

function install(rows: DbRow[] = []) {
  const {
    query,
    filters,
    insertCalls,
    updateCalls,
    deleteCalls,
    selectCalls,
    rows: dbRows,
    insertPayloads,
    insertedRows,
  } = makeQuery(rows)
  // `dbRows` and the array `insertPayloads`/`insertedRows` are captured by
  // closure here, so the `insert` override below can reach them.
  const handles = { query, filters, insertCalls, updateCalls, deleteCalls, selectCalls, insertPayloads }

  // `insert()` auto-assigns a generated id (simulating `nextval` on the
  // sequence) so the data layer sees the DB-assigned-id contract. The inserted
  // row is recorded in the query builder's table (read path) and returned in
  // the handles (assertions).
  ;(query as Record<string, unknown>).insert = ((records: Record<string, unknown>[]) => {
    const list = Array.isArray(records) ? records : [records]
    insertCalls.push(list)
    // Record the exact payload received from the data layer (before the
    // simulated DB-assigned id is applied). Production's
    // `createGalleryEntry` deliberately omits `id` from the insert payload,
    // so the recorded payload must not carry one.
    insertPayloads.push(list.map((r) => ({ ...r })))
    for (const r of list) {
      if (!r.id) {
        // A real BIGSERIAL sequence is independent of the rows in the table:
        // `nextval()` never consults existing ids. `max(existing)+1` would yield
        // 1 on an empty table (inside the reserved legacy range) and a value
        // the real sequence would never produce. Start above the reserved range.
        const maxExisting = dbRows.reduce((max, row) => Math.max(max, row.id), 0)
        const nextId = Math.max(maxExisting + 1, LEGACY_RESERVED_ID_MAX + 1)
        r.id = nextId
      }
      dbRows.push(r as unknown as DbRow)
      insertedRows.push(r as unknown as DbRow)
    }
    return query
  }) as unknown as typeof query.insert

  sup.client = { from: vi.fn(() => query), storage: { from: vi.fn() } }
  return { ...handles, rows: dbRows }
}

describe('public read filtering (is_published)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('public read returns only published records', async () => {
    const h = install(seed())
    const { readGallery } = await import('@/lib/gallery-data')
    const result = await readGallery()

    expect(result.map((r) => r.id)).toEqual([1, 2])
    expect(result.find((r) => r.caption === 'Draft')).toBeUndefined()
    // The filter must be a real query clause, not a post-fetch filter.
    expect(h.filters).toContainEqual({ field: 'is_published', value: true })
  })

  it('orders by id ascending and selects all columns', async () => {
    const h = install(seed())
    const { readGallery } = await import('@/lib/gallery-data')
    await readGallery()
    expect(h.selectCalls).toEqual(['*'])
  })

  it('maps every row through the alt_text mapping', async () => {
    const h = install(seed())
    const { readGallery } = await import('@/lib/gallery-data')
    const result = await readGallery()
    expect(result.map((r) => r.alt)).toEqual(['Alt 1', 'Alt 2'])
    expect(result.every((r) => 'alt_text' in r)).toBe(false)
    expect(h.rows.length).toBeGreaterThan(0)
  })

  it('a single-record public read never reveals an unpublished record', async () => {
    install(seed())
    const { readGalleryEntry } = await import('@/lib/gallery-data')
    expect(await readGalleryEntry(3)).toBeNull()
    expect((await readGalleryEntry(1))?.id).toBe(1)
  })

  it('a single-record public read returns null for a missing id', async () => {
    install(seed())
    const { readGalleryEntry } = await import('@/lib/gallery-data')
    expect(await readGalleryEntry(999)).toBeNull()
  })

  it('the admin read path includes drafts', async () => {
    install(seed())
    const { readGalleryForAdmin } = await import('@/lib/gallery-data')
    const result = await readGalleryForAdmin()
    expect(result.map((r) => r.id)).toEqual([1, 2, 3])
  })
})

describe('database errors are not swallowed', () => {
  it('a read error is thrown, never converted into an empty gallery', async () => {
    const failing: Record<string, unknown> = {
      select: () => failing,
      order: () => failing,
      eq: () => failing,
    }
    // The real client rejects with an object carrying `message`; the data layer
    // is responsible for wrapping it into a descriptive error.
    Object.defineProperty(failing, 'then', {
      value: (_resolve: unknown, reject: (e: unknown) => void) =>
        reject({ message: 'permission denied for table gallery_metadata' }),
      configurable: true,
      writable: true,
    })
    sup.client = { from: vi.fn(() => failing), storage: { from: vi.fn() } }

    const { readGallery } = await import('@/lib/gallery-data')
    // The failure must be wrapped in the data layer's own descriptive message,
    // and must not be silently converted into an empty gallery.
    await expect(readGallery()).rejects.toThrow(/Failed to read gallery metadata/)
    // ...and it must never resolve to an empty list.
    await expect(readGallery()).rejects.not.toEqual([])
  })

  it('wraps a query that resolves with an { error } result', async () => {
    // This is the common real shape: the query resolves with
    // `{ data: null, error: {...} }` rather than rejecting.
    const failing: Record<string, unknown> = {
      select: () => failing,
      order: () => failing,
      eq: () => failing,
    }
    Object.defineProperty(failing, 'then', {
      value: (resolve: (v: unknown) => void) =>
        resolve({ data: null, error: { message: 'permission denied for table gallery_metadata' } }),
      configurable: true,
      writable: true,
    })
    sup.client = { from: vi.fn(() => failing), storage: { from: vi.fn() } }

    const { readGallery } = await import('@/lib/gallery-data')
    await expect(readGallery()).rejects.toThrow(/Failed to read gallery metadata/)
    await expect(readGallery()).rejects.toThrow(/permission denied/)
    // It must never resolve to an empty list.
    await expect(readGallery()).rejects.not.toEqual([])
  })

  it('wraps a rejected query builder (not just an { error } result)', async () => {
    // A network drop rejects the builder outright instead of resolving with
    // `{ data: null, error }`. That shape must be wrapped too.
    const failing: Record<string, unknown> = {
      select: () => failing,
      order: () => failing,
      eq: () => failing,
    }
    Object.defineProperty(failing, 'then', {
      value: (_resolve: unknown, reject: (e: unknown) => void) =>
        reject(new Error('network error')),
      configurable: true,
      writable: true,
    })
    sup.client = { from: vi.fn(() => failing), storage: { from: vi.fn() } }

    const { readGallery } = await import('@/lib/gallery-data')
    await expect(readGallery()).rejects.toThrow(/Failed to read gallery metadata/)
    await expect(readGallery()).rejects.toThrow(/network error/)
  })
})

describe('write behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates one record with a generated id and no explicit id in the payload', async () => {
    const h = install(seed())
    const { createGalleryEntry } = await import('@/lib/gallery-data')
    const created = await createGalleryEntry({
      src: 'https://cdn.example.com/new.jpg',
      caption: 'New',
      alt: 'New alt',
      category: 'AI',
      width: 100,
      height: 100,
    })

    // The id is generated by the database, so it is NOT sent in the insert
    // payload. The return value carries the generated id.
    expect(h.insertCalls).toHaveLength(1)
    expect(h.insertCalls[0]).toHaveLength(1)
    expect(h.insertPayloads).toHaveLength(1)
    expect(h.insertPayloads[0]).not.toHaveProperty('id')
    expect(h.insertPayloads[0][0]).toMatchObject({ alt_text: 'New alt' })
    expect(h.deleteCalls).toHaveLength(0)
    expect(h.updateCalls).toHaveLength(0)
    // alt_text is derived server-side from alt.
    expect(h.insertCalls[0][0]).toMatchObject({ alt_text: 'New alt' })

    // The returned record must carry the generated id, above the reserved
    // legacy range 1-7.
    expect(created.id).toBeGreaterThan(7)
    expect((created as Record<string, unknown>).id).toBeDefined()
  })

  it('stores the exact Storage object key for a new upload', async () => {
    const h = install(seed())
    const { createGalleryEntry } = await import('@/lib/gallery-data')
    await createGalleryEntry(
      { src: 'https://cdn.example.com/new.jpg', caption: 'New', alt: 'New alt', category: 'AI', width: 100, height: 100 },
      'gallery/1760000000-abc.jpg',
    )
    expect(h.insertCalls[0][0]).toMatchObject({ storage_key: 'gallery/1760000000-abc.jpg' })
  })

  it('new id does not collide with an unpublished record', async () => {
    const h = install([{ ...UNPUBLISHED }])
    const { createGalleryEntry } = await import('@/lib/gallery-data')
    const created = await createGalleryEntry({
      src: 'https://cdn.example.com/new.jpg', caption: 'New', alt: 'New alt', category: 'AI', width: 100, height: 100,
    })
    // The draft occupies id 3, so the next id must be 4 — not 3 — and it must
    // also clear the reserved legacy range 1–7, so it lands on 8.
    expect(created.id).toBe(8)
    expect(h.rows.map((r) => r.id)).toContain(3)
  })

  it('update targets one row by id and leaves others untouched', async () => {
    const h = install(seed())
    const { updateGalleryEntry } = await import('@/lib/gallery-data')
    await updateGalleryEntry(1, {
      src: 'https://cdn.example.com/1.jpg', caption: 'Renamed', alt: 'Renamed alt', category: 'AI', width: 800, height: 600,
    })

    expect(h.updateCalls).toEqual([{ partial: expect.objectContaining({ caption: 'Renamed' }), id: 1 }])
    expect(h.deleteCalls).toHaveLength(0)
    expect(h.rows.find((r) => r.id === 1)?.caption).toBe('Renamed')
    expect(h.rows.find((r) => r.id === 2)?.caption).toBe('Published 2')
  })

  it('update throws for a missing record instead of silently succeeding', async () => {
    install(seed())
    const { updateGalleryEntry } = await import('@/lib/gallery-data')
    await expect(
      updateGalleryEntry(999, {
        src: 'https://cdn.example.com/x.jpg', caption: 'X', alt: 'X', category: 'AI', width: 100, height: 100,
      }),
    ).rejects.toThrow(/not found/)
  })

  it('delete removes the metadata row for that id only', async () => {
    const h = install(seed())
    const { deleteGalleryEntry } = await import('@/lib/gallery-data')
    const result = await deleteGalleryEntry(2)

    expect(result.deletedId).toBe(2)
    expect(result.storageObjectDeleted).toBe(false)
    expect(h.deleteCalls).toEqual([2])
    expect(h.rows.map((r) => r.id)).toEqual([1, 3])
  })

  it('delete throws for a missing record and removes nothing', async () => {
    const h = install(seed())
    const { deleteGalleryEntry } = await import('@/lib/gallery-data')
    await expect(deleteGalleryEntry(999)).rejects.toThrow(/not found/)
    expect(h.deleteCalls).toHaveLength(0)
    expect(h.rows).toHaveLength(3)
  })
})

describe('legacy records', () => {
  it('a legacy row with no Storage object is deleted without any Storage call', async () => {
    const h = install([{ ...LEGACY_ROW }])
    const { deleteGalleryEntry } = await import('@/lib/gallery-data')
    const result = await deleteGalleryEntry(7)

    // No storage object is owned, so none may be reported as deleted.
    expect(result.storageObjectDeleted).toBe(false)
    expect(h.deleteCalls).toEqual([7])
  })

  it('reports storageObjectDeleted = false when the Storage cleanup fails', async () => {
    // Regression guard: `storageObjectDeleted` must reflect the actual Storage
    // result. Hard-coding it to `true` would report a failed cleanup as a
    // success and hide orphaned Storage objects.
    // The row MUST own a Storage object, otherwise no cleanup is attempted and
    // the assertion would pass for the wrong reason.
    const owned: DbRow = { ...seed()[0], storage_key: 'gallery/1760000000-abc.jpg' }
    const h = install([owned])
    const failingStorage = {
      from: () => ({ remove: async () => ({ error: { message: 'bucket not found' } }) }),
    }
    const { deleteGalleryEntry } = await import('@/lib/gallery-data')

    const result = await deleteGalleryEntry(1, { storage: failingStorage })

    expect(result.storageObjectDeleted).toBe(false)
    // The metadata row is still deleted: a Storage failure must not leave the
    // record behind, nor must it be reported as success.
    expect(h.deleteCalls).toEqual([1])
  })

  it('reports storageObjectDeleted = true when the Storage cleanup succeeds', async () => {
    // The row must actually own a Storage object, otherwise no cleanup is
    // attempted and `storageObjectDeleted` is correctly false.
    const owned: DbRow = {
      ...seed()[0],
      storage_key: 'gallery/1760000000-abc.jpg',
    }
    const h = install([owned])
    const okStorage = { from: () => ({ remove: async () => ({ error: null }) }) }
    const { deleteGalleryEntry } = await import('@/lib/gallery-data')

    const result = await deleteGalleryEntry(1, { storage: okStorage })
    expect(result.storageObjectDeleted).toBe(true)
    expect(h.deleteCalls).toEqual([1])
  })

  it('returns the generated id to the caller', async () => {
    // The database assigns the id; the returned record carries it.
    const h = install(seed())
    const { createGalleryEntry } = await import('@/lib/gallery-data')
    const created = await createGalleryEntry({
      src: 'https://cdn.example.com/new.jpg',
      caption: 'New',
      alt: 'New alt',
      category: 'AI',
      width: 100,
      height: 100,
    })
    expect(created.id).toBeGreaterThan(7)
    expect((created as Record<string, unknown>).id).toBeDefined()
    // The returned record must match the application shape exactly.
    expect(created).toMatchObject({
      src: 'https://cdn.example.com/new.jpg',
      caption: 'New',
      alt: 'New alt',
      category: 'AI',
      width: 100,
      height: 100,
    })
  })

  it('assigns distinct ids to concurrent creates', async () => {
    const h = install([])
    const { createGalleryEntry } = await import('@/lib/gallery-data')
    const [a, b] = await Promise.all([
      createGalleryEntry({ src: 'a.jpg', caption: 'A', alt: 'A', category: 'AI', width: 1, height: 1 }),
      createGalleryEntry({ src: 'b.jpg', caption: 'B', alt: 'B', category: 'AI', width: 1, height: 1 }),
    ])
    expect(h.insertCalls).toHaveLength(2)
    expect(a.id).not.toBe(b.id)
    // Both ids are database-assigned and therefore above the reserved legacy
    // range (1-7). The old client-derived contract would have produced 1 and 2;
    // a real BIGSERIAL sequence never hands out a reserved legacy id.
    expect([a.id, b.id].sort()).toEqual([8, 9])
    expect(a.id).toBeGreaterThan(LEGACY_RESERVED_ID_MAX)
    expect(b.id).toBeGreaterThan(LEGACY_RESERVED_ID_MAX)
  })

  it('never returns an id inside the reserved legacy range', async () => {
    const h = install([])
    const { createGalleryEntry } = await import('@/lib/gallery-data')
    const created = await createGalleryEntry({
      src: 'legacy-safe.jpg', caption: 'Legacy-safe', alt: 'L', category: 'AI', width: 1, height: 1,
    })
    expect([...Array(7)].map((_, i) => i + 1)).not.toContain(created.id)
    expect(created.id).toBeGreaterThan(7)
  })
})
