/// <reference types="@testing-library/jest-dom" />

/**
 * Regression tests for the admin read path and the publish/unpublish workflow.
 *
 * These exercise the REAL route handlers and the REAL data layer against a
 * faithful fake Supabase client — the same boundary the application uses.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { DbRow } from './gallery-mocks'

const sup = vi.hoisted(() => ({ client: null as unknown }))
const helpers = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  validateOrigin: vi.fn(),
  parseRequestBody: vi.fn(),
  generateId: vi.fn(),
  stripHtml: vi.fn((s: string) => s),
  validateGalleryBody: vi.fn(() => ({ valid: true, errors: [] })),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabase: () => sup.client,
  isConfigured: () => true,
  getStorageBucket: () => 'gallery',
  getStorageSchema: () => 'public',
}))

vi.mock('@/lib/api-helpers', () => helpers)

const auth = {
  allow(): void {
    helpers.requireAuth.mockReturnValue(null)
    helpers.validateOrigin.mockReturnValue(true)
    helpers.parseRequestBody.mockImplementation(async (req: Request) => req.json())
  },
  denyAuth(): void {
    helpers.requireAuth.mockReturnValue({ status: 401 } as never)
    helpers.validateOrigin.mockReturnValue(true)
  },
  denyOrigin(): void {
    helpers.requireAuth.mockReturnValue(null)
    helpers.validateOrigin.mockReturnValue(false)
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

/* ── fake Supabase ─────────────────────────────────────────────────────── */

function makeQuery(rows: DbRow[]) {
  // Each awaited query must start with a clean filter set: filters are scoped
  // to the chain they were applied to, not accumulated across calls.
  let filters: Array<{ field: string; value: unknown }> = []
  const updatePayloads: Array<Record<string, unknown>> = []

  const filtered = () =>
    rows.filter((row) =>
      filters.every((f) => (row as unknown as Record<string, unknown>)[f.field] === f.value),
    )

  const query: Record<string, unknown> = {
    // `select` begins a new query chain; filters are scoped to that chain, so
    // a filter from a previous read must not leak into the next one.
    select: () => {
      filters = []
      return query
    },
    order: () => query,
    eq: (field: string, value: unknown) => {
      filters.push({ field, value })
      return query
    },
    update: (partial: Record<string, unknown>) => {
      updatePayloads.push(partial)
      return {
        eq: (field: string, value: unknown) => {
          for (const row of rows) {
            if ((row as unknown as Record<string, unknown>)[field] === value) Object.assign(row, partial)
          }
          return Promise.resolve({ error: null })
        },
      }
    },
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
    maybeSingle: () => Promise.resolve({ data: filtered()[0] ?? null, error: null }),
  }

  Object.defineProperty(query, 'then', {
    value: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: filtered(), error: null }).then(resolve, reject),
    configurable: true,
    writable: true,
  })

  return { query, updatePayloads }
}

const PUBLISHED: DbRow = {
  id: 8, src: 'https://x.com/published.jpg', caption: 'Published', alt_text: 'Published',
  category: 'AI', width: 100, height: 100, is_published: true,
}
const DRAFT: DbRow = {
  id: 9, src: 'https://x.com/draft.jpg', caption: 'Draft', alt_text: 'Draft',
  category: 'AI', width: 100, height: 100, is_published: false,
}

let rows: DbRow[]
let h: ReturnType<typeof makeQuery>

function install(seed: DbRow[] = [PUBLISHED, DRAFT]) {
  rows = seed.map((r) => ({ ...r }))
  h = makeQuery(rows)
  sup.client = { from: vi.fn(() => h.query), storage: { from: vi.fn() } }
}

function apiRequest(method: string, route: string, body?: unknown): NextRequest {
  const options: ConstructorParameters<typeof NextRequest>[1] = { method }
  if (body !== undefined) {
    options.body = JSON.stringify(body)
    options.headers = { 'Content-Type': 'application/json' }
  }
  return new NextRequest(new URL(`http://localhost${route}`), options)
}

/* ── H1: admin read path ───────────────────────────────────────────────── */

describe('H1 — admin read path for unpublished records', () => {
  beforeEach(() => install())

  it('rejects an unauthenticated request to /api/gallery/all', async () => {
    auth.denyAuth()
    const { GET } = await import('@/app/api/gallery/all/route')
    const res = await GET(apiRequest('GET', '/api/gallery/all'))
    expect(res.status).toBe(401)
  })

  it('rejects an authenticated request with a mismatched origin', async () => {
    auth.denyOrigin()
    const { GET } = await import('@/app/api/gallery/all/route')
    const res = await GET(apiRequest('GET', '/api/gallery/all'))
    expect(res.status).toBe(403)
  })

  it('returns both published and unpublished records to an authenticated admin', async () => {
    auth.allow()
    const { GET } = await import('@/app/api/gallery/all/route')
    const res = await GET(apiRequest('GET', '/api/gallery/all'))
    expect(res.status).toBe(200)

    const data = await res.json()
    expect(data.map((r: { id: number }) => r.id).sort()).toEqual([8, 9])
    expect(data.find((r: { id: number }) => r.id === 9).isPublished).toBe(false)
  })

  it('public /api/gallery still excludes unpublished records', async () => {
    auth.allow()
    const { GET } = await import('@/app/api/gallery/route')
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.map((r: { id: number }) => r.id)).toEqual([8])
    expect(data.some((r: { id: number }) => r.id === 9)).toBe(false)
  })

  it('returns the established safe error response on query failure', async () => {
    auth.allow()
    const failing = {
      select: () => failing,
      order: () => failing,
      eq: () => failing,
    }
    Object.defineProperty(failing, 'then', {
      value: (res: (v: unknown) => void) => res({ data: null, error: { message: 'db down' } }),
      configurable: true,
      writable: true,
    })
    sup.client = { from: vi.fn(() => failing), storage: { from: vi.fn() } }

    const { GET } = await import('@/app/api/gallery/all/route')
    const res = await GET(apiRequest('GET', '/api/gallery/all'))
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'Failed to load gallery' })
  })
})

/* ── H2: publish / unpublish workflow ───────────────────────────────────── */

describe('H2 — publish / unpublish workflow', () => {
  beforeEach(() => install())

  it('rejects an unauthenticated PATCH with 401', async () => {
    auth.denyAuth()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/9', { isPublished: true }),
      { params: Promise.resolve({ id: '9' }) },
    )
    expect(res.status).toBe(401)
    expect(h.updatePayloads).toHaveLength(0)
  })

  it('rejects a PATCH with a mismatched origin with 403', async () => {
    auth.denyOrigin()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/9', { isPublished: true }),
      { params: Promise.resolve({ id: '9' }) },
    )
    expect(res.status).toBe(403)
    expect(h.updatePayloads).toHaveLength(0)
  })

  it('rejects a non-boolean isPublished', async () => {
    auth.allow()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')

    for (const value of ['true', 1, 0, null, {}]) {
      const res = await PATCH(
        apiRequest('PATCH', '/api/gallery/9', { isPublished: value }),
        { params: Promise.resolve({ id: '9' }) },
      )
      expect(res.status).toBe(400)
      const body = await res.json()
      expect(body.details).toContain('isPublished must be a boolean')
    }
    expect(h.updatePayloads).toHaveLength(0)
  })

  it('publishes a draft and makes it publicly visible', async () => {
    auth.allow()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/9', { isPublished: true }),
      { params: Promise.resolve({ id: '9' }) },
    )
    expect(res.status).toBe(200)
    expect((await res.json()).isPublished).toBe(true)

    // Only is_published changed.
    expect(h.updatePayloads).toHaveLength(1)
    expect(h.updatePayloads[0]).toMatchObject({ is_published: true })

    // The public list now includes it.
    const { GET } = await import('@/app/api/gallery/route')
    const publicRes = await GET()
    const data = await publicRes.json()
    expect(data.map((r: { id: number }) => r.id).sort()).toEqual([8, 9])
  })

  it('unpublishes a record and hides it from the public list', async () => {
    auth.allow()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/8', { isPublished: false }),
      { params: Promise.resolve({ id: '8' }) },
    )
    expect(res.status).toBe(200)
    expect((await res.json()).isPublished).toBe(false)
    expect(h.updatePayloads[0]).toMatchObject({ is_published: false })

    // The public list now contains only the record that was already a draft.
    const { GET } = await import('@/app/api/gallery/route')
    const data = await (await GET()).json()
    expect(data.map((r: { id: number }) => r.id)).toEqual([])

    // ...and the admin path still shows both.
    const { GET: GET_ALL } = await import('@/app/api/gallery/all/route')
    const admin = await (await GET_ALL(apiRequest('GET', '/api/gallery/all'))).json()
    expect(admin.map((r: { id: number }) => r.id).sort()).toEqual([8, 9])
  })

  it('preserves captions, alt text, category and storage_key on publication', async () => {
    auth.allow()
    const withKey: DbRow = { ...DRAFT, storage_key: 'gallery/key.jpg', caption: 'Keep me' }
    rows = [{ ...withKey }]
    h = makeQuery(rows)
    sup.client = { from: vi.fn(() => h.query), storage: { from: vi.fn() } }

    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    await PATCH(
      apiRequest('PATCH', '/api/gallery/9', { isPublished: true }),
      { params: Promise.resolve({ id: '9' }) },
    )

    // The re-sent metadata must be the existing values, unchanged.
    expect(h.updatePayloads[0]).toMatchObject({
      caption: 'Keep me',
      alt: 'Draft',
      category: 'AI',
      src: 'https://x.com/draft.jpg',
    })
    // storage_key is not rewritten by a publication change.
    expect('storage_key' in h.updatePayloads[0]).toBe(false)
    expect(rows[0].storage_key).toBe('gallery/key.jpg')
    expect(rows[0].caption).toBe('Keep me')
  })

  it('returns 404 for a missing record and writes nothing', async () => {
    auth.allow()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/999', { isPublished: true }),
      { params: Promise.resolve({ id: '999' }) },
    )
    expect(res.status).toBe(404)
    expect(h.updatePayloads).toHaveLength(0)
  })

  it('returns 400 for a non-numeric id', async () => {
    auth.allow()
    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/abc', { isPublished: true }),
      { params: Promise.resolve({ id: 'abc' }) },
    )
    expect(res.status).toBe(400)
  })

  it('returns 500 on a database write failure, without claiming success', async () => {
    auth.allow()
    const original = h.query.update
    ;(h.query as Record<string, unknown>).update = () => ({
      eq: () => Promise.resolve({ error: { message: 'permission denied' } }),
    })

    const { PATCH } = await import('@/app/api/gallery/[id]/route')
    const res = await PATCH(
      apiRequest('PATCH', '/api/gallery/9', { isPublished: true }),
      { params: Promise.resolve({ id: '9' }) },
    )
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBeUndefined()
    ;(h.query as Record<string, unknown>).update = original
  })
})
