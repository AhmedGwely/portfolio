/// <reference types="@testing-library/jest-dom" />

/**
 * Public publication filtering through the REAL data layer.
 *
 * `@/lib/gallery-data` is deliberately NOT mocked here. The fake Supabase
 * module records the query chain and applies `.eq()` as a genuine filter, so
 * these tests prove the production filtering logic rather than a mocked result.
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

  const query: Record<string, unknown> = {
    select: () => query,
    order: () => query,
    eq: (field: string, value: unknown) => {
      filters.push({ field, value })
      return query
    },
    update: (partial: Record<string, unknown>) => ({
      eq: (field: string, value: unknown) => {
        for (const row of rows) {
          if ((row as unknown as Record<string, unknown>)[field] === value) Object.assign(row, partial)
        }
        return Promise.resolve({ error: null })
      },
    }),
    delete: () => ({
      eq: (field: string, value: unknown) => {
        for (let i = rows.length - 1; i >= 0; i--) {
          if ((rows[i] as unknown as Record<string, unknown>)[field] === value) rows.splice(i, 1)
        }
        return Promise.resolve({ error: null })
      },
    }),
    insert: (records: Record<string, unknown>[]) => {
      for (const r of (Array.isArray(records) ? records : [records])) rows.push(r as unknown as DbRow)
      return Promise.resolve({ error: null })
    },
    maybeSingle: () => {
      const filtered = rows.filter((row) =>
        filters.every((f) => (row as unknown as Record<string, unknown>)[f.field] === f.value),
      )
      return Promise.resolve({ data: filtered[0] ?? null, error: null })
    },
  }

  Object.defineProperty(query, 'then', {
    value: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({
        data: rows.filter((row) =>
          filters.every((f) => (row as unknown as Record<string, unknown>)[f.field] === f.value),
        ),
        error: null,
      }).then(resolve, reject),
    configurable: true,
    writable: true,
  })

  return { query, filters }
}

function seed(): DbRow[] {
  return [
    { id: 1, src: 'https://cdn.example.com/1.jpg', caption: 'Published 1', alt_text: 'A published image', category: 'AI & Computer Vision', width: 800, height: 600, is_published: true },
    { id: 2, src: 'https://cdn.example.com/2.jpg', caption: 'Published 2', alt_text: 'B published image', category: 'IoT & Edge', width: 640, height: 480, is_published: true },
    { id: 3, src: 'https://cdn.example.com/3.jpg', caption: 'Draft / unpublished', alt_text: 'C draft image', category: 'AI & Computer Vision', width: 1920, height: 1080, is_published: false },
  ]
}

function install(rows: DbRow[]) {
  const { query, filters } = makeQuery(rows)
  sup.client = { from: vi.fn(() => query), storage: { from: vi.fn() } }
  return { filters }
}

describe('public publication filtering (is_published = true)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('GET /api/gallery returns only is_published = true records', async () => {
    const { filters } = install(seed())
    const { readGallery } = await import('@/lib/gallery-data')
    const result = await readGallery()

    expect(result.map((r) => r.id)).toEqual([1, 2])
    expect(result[0].id).toBe(1)
    expect(result[1].id).toBe(2)
    expect(result.find((r) => r.caption === 'Draft / unpublished')).toBeUndefined()
    // The filter must be issued as a query clause, not applied after the fact.
    expect(filters).toContainEqual({ field: 'is_published', value: true })
  })

  it('GET /api/gallery/[id] never reveals an unpublished record by id', async () => {
    install([{ ...seed()[2] }])
    const { readGalleryEntry } = await import('@/lib/gallery-data')
    expect(await readGalleryEntry(3)).toBeNull()
  })

  it('GET /api/gallery/[id] resolves a published record', async () => {
    install(seed())
    const { readGalleryEntry } = await import('@/lib/gallery-data')
    const published = await readGalleryEntry(1)
    expect(published?.id).toBe(1)
    expect(published?.caption).toBe('Published 1')
  })

  it('an unpublished record is visible on the admin read path', async () => {
    install(seed())
    const { readGalleryForAdmin } = await import('@/lib/gallery-data')
    const result = await readGalleryForAdmin()
    expect(result.map((r) => r.id)).toEqual([1, 2, 3])
  })

  it('readGalleryEntry supports the admin (unpublished-inclusive) path', async () => {
    install(seed())
    const { readGalleryEntry } = await import('@/lib/gallery-data')
    expect((await readGalleryEntry(3, { publishedOnly: false }))?.id).toBe(3)
  })

  it('mapAltTextToAlt maps the alt_text column to the application-facing alt field', async () => {
    const row: DbRow = {
      id: 42,
      src: 'https://cdn.example.com/x.jpg',
      caption: 'Test caption',
      alt_text: 'Alt text from DB',
      category: 'AI & Computer Vision',
      width: 100,
      height: 100,
      is_published: true,
    }
    const mapped = (await import('@/lib/gallery-data')).mapAltTextToAlt(row)
    expect(mapped).not.toBeNull()
    expect(mapped!.id).toBe(42)
    expect(mapped!.caption).toBe('Test caption')
    expect(mapped!.alt).toBe('Alt text from DB')
    expect(mapped!.category).toBe('AI & Computer Vision')
  })

  it('readGallery maps every DB row through mapAltTextToAlt', async () => {
    install(seed())
    const result = await (await import('@/lib/gallery-data')).readGallery()
    expect(result).toHaveLength(2)
    expect(result[0].alt).toBe('A published image')
    expect(result[1].alt).toBe('B published image')
    // The public contract must NOT expose the DB column name alt_text.
    expect(result.every((r) => 'alt_text' in r)).toBe(false)
  })
})
