/// <reference types="@testing-library/jest-dom" />

/**
 * Route-level behaviour: upload, create, update, delete, auth and CSRF.
 *
 * The real `@/lib/gallery-data` runs against a faithful fake Supabase module,
 * so these tests observe real route + data-layer interaction. Auth/CSRF are
 * mocked at the helper boundary because they depend on session cookies that a
 * jsdom `NextRequest` cannot mint.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import type { DbRow } from './gallery-mocks'

const sup = vi.hoisted(() => ({ client: null as unknown, storage: null as unknown }))
const helpers = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  validateOrigin: vi.fn(),
  parseRequestBody: vi.fn(),
  generateId: vi.fn(),
  stripHtml: vi.fn((s: string) => s),
  validateGalleryBody: vi.fn(() => ({ valid: true, errors: [] })),
}))
// NOTE: the storage instance used by the route-level tests is created by
// `makeStorage()` below and registered in `install()`. The `vi.hoisted` mock
// factory must NOT define a second, competing storage implementation — doing
// so means `getSupabase().storage.from(...)` and the test's `storage.objects`
// write to different arrays, so upload/delete assertions observe nothing.
vi.mock('@/lib/supabase', () => ({
  getSupabase: () => sup.client,
  isConfigured: () => true,
  getStorageBucket: () => 'gallery',
  getStorageSchema: () => 'public',
}))

vi.mock('@/lib/api-helpers', () => helpers)

/** Per-test override points for the auth/CSRF boundary. */
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

/**
 * `vi.clearAllMocks()` clears call history without stripping implementations.
 * (`mockReset` would remove the hoisted `stripHtml`/`validateGalleryBody`
 * implementations and leave the helpers returning `undefined`.)
 */
beforeEach(() => {
  vi.clearAllMocks()
})

/* ── fake Supabase ─────────────────────────────────────────────────────── */

// Mirror of `LEGACY_RESERVED_ID_MAX` in `lib/gallery-data.ts`: ids 1-7 belong to
// the seven legacy JSON records and are reserved.
const LEGACY_RESERVED_ID_MAX = 7

function makeQuery(rows: DbRow[]) {
  const calls: Array<{ method: string; args: unknown[] }> = []
  const filters: Array<{ field: string; value: unknown }> = []
  const insertCalls: Record<string, unknown>[][] = []
  const updateCalls: Array<{ partial: Record<string, unknown>; id: number }> = []
  const deleteCalls: number[] = []
  const selectCalls: string[] = []
  const insertPayloads: Record<string, unknown>[][] = []

  const filtered = () =>
    rows.filter((row) =>
      filters.every((f) => (row as unknown as Record<string, unknown>)[f.field] === f.value),
    )

  // Rows inserted by the data layer. `single()` resolves to the LAST inserted
  // row, which is what PostgREST's `INSERT ... RETURNING *` + `.single()`
  // yields for a single-row insert.
  const insertedRows: Record<string, unknown>[] = []
  const query: Record<string, unknown> = {
    single: () => Promise.resolve({ data: insertedRows[insertedRows.length - 1], error: null }),
    select: (...args: unknown[]) => {
      calls.push({ method: 'select', args })
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
    maybeSingle: () =>
      Promise.resolve({ data: filtered()[0] ?? null, error: null }),
    insert: (records: Record<string, unknown>[]) => {
      const list = Array.isArray(records) ? records : [records]
      // Record the payload BEFORE any id is applied, so a test can assert the
      // data layer omitted `id`. The original payload object must not be mutated
      // — that would make an omitted `id` look present.
      insertPayloads.push(list.map((r) => ({ ...r })))
      insertCalls.push(list)
      for (const r of list) {
        // Simulate the sequence assigning an id when the payload omits one
        // (production's `createGalleryEntry` deliberately omits `id`).
        //
        // A real BIGSERIAL sequence is INDEPENDENT of the rows currently in the
        // table: `nextval()` does not consult existing ids. Deriving
        // `max(existing)+1` here would assert a contract the production code no
        // longer has — with no rows it would yield 1, inside the reserved
        // legacy range 1-7, and a table containing a low draft id would yield a
        // value the real sequence would never produce. Start above the reserved
        // range so the generated id is always a plausible sequence value.
        if (r.id === undefined || r.id === null) {
          const maxExisting = rows.reduce((max, row) => Math.max(max, row.id), 0)
          const nextId = Math.max(maxExisting + 1, LEGACY_RESERVED_ID_MAX + 1)
          r.id = nextId
        }
        rows.push(r as unknown as DbRow)
        insertedRows.push(r)
      }
      return query
    },
  }

  Object.defineProperty(query, 'then', {
    value: (resolve: (v: unknown) => void, reject: (e: unknown) => void) =>
      Promise.resolve({ data: filtered(), error: null }).then(resolve, reject),
    configurable: true,
    writable: true,
  })

  return { query, insertCalls, updateCalls, deleteCalls, filters, selectCalls, insertedRows, insertPayloads }
}

function makeStorage() {
  // This instance is the SINGLE storage mock for the whole file. `install()`
  // wires it into `getSupabase().storage`, so the upload route's
  // `.storage.from(...)` calls and the assertions below read the same arrays.
  const objects: string[] = []
  const removeCalls: string[][] = []
  const instance = {
    upload: vi.fn(async (objectName: string, file: unknown, _opts?: unknown) => {
      objects.push(objectName)
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

// The storage cell the tests read as `storage.objects` /
// `storage.removeCalls`. `install()` repopulates it on every call, so one
// test's uploads cannot leak into the next test's assertions.
const storage = {
  instance: null as unknown as ReturnType<typeof makeStorage>['instance'],
  objects: [] as string[],
  removeCalls: [] as string[][],
}

const EXISTING: DbRow[] = [
  {
    id: 1,
    // The public URL for the object key `gallery/old.jpg`. Note the bucket name
    // appears ONCE: `.../object/public/{bucket}/{key}`. An earlier version of
    // this fixture duplicated it (`.../public/gallery/gallery/old.jpg`), which is
    // not a URL the real client would ever produce.
    src: 'https://mock.supabase.test/storage/v1/object/public/gallery/old.jpg',
    caption: 'Old',
    alt_text: 'Old',
    category: 'AI & Computer Vision',
    width: 800,
    height: 600,
    is_published: true,
    storage_key: 'gallery/old.jpg',
  },
]

let rows: DbRow[] = [...EXISTING]
let handles: ReturnType<typeof makeQuery>

/** Install a fake client whose insert auto-assigns database ids (simulating
 *  `nextval('gallery_metadata_id_seq')` on an empty sequence). Used by all
 *  create tests, which now depend on the DB-assigned id.
 *
 *  Defaults to `EXISTING` (one published row, id 1) so route-level tests can
 *  read/update/delete id 1 without seeding it themselves. `rows` is REBUILT
 *  from the argument on every call, so tests that mutate it cannot leak state
 *  into the next test. */
function install(seed: DbRow[] = [...EXISTING]) {
  rows = [...seed]
  // Reset the storage cell so one test's uploads/removals cannot leak into the
  // next test's assertions.
  const built = makeStorage()
  storage.instance = built.instance
  storage.objects = built.objects
  storage.removeCalls = built.removeCalls

  handles = makeQuery(rows)
  const { query, insertCalls, updateCalls, deleteCalls, insertedRows, insertPayloads } = handles
  ;(query as Record<string, unknown>).insert = ((records: Record<string, unknown>[]) => {
    const list = Array.isArray(records) ? records : [records]
    insertPayloads.push(list.map((r) => ({ ...r })))
    insertCalls.push(list)
    for (const r of list) {
      if (r.id === undefined || r.id === null) {
        const maxExisting = rows.reduce((max, row) => Math.max(max, row.id), 0)
        const nextId = Math.max(maxExisting + 1, LEGACY_RESERVED_ID_MAX + 1)
        r.id = nextId
      }
      rows.push(r as unknown as DbRow)
      insertedRows.push(r)
    }
    // Return the query object so .insert().select().single() resolves
    // (the simulated DB-assigned id is applied above).
    return query
  }) as unknown as typeof query.insert
  // The fake Supabase client: `.from('gallery_metadata')` returns the query
  // builder; `.from('gallery')` / `.storage.from(...)` return the storage
  // instance (with .upload(), .getPublicUrl(), .remove()), as the upload route
  // reads them after `getSupabase().storage`.
  sup.client = {
    from: vi.fn((table: string) => (table === 'gallery_metadata' ? query : storage.instance)),
    storage: {
      from: vi.fn((_bucket: string) => storage.instance),
    },
  }
  return handles
}

/* ── request helpers ───────────────────────────────────────────────────── */

function makeFile(name = 'test.jpg', type = 'image/jpeg', size = 1024): File {
  const file = new File([new Uint8Array(size)], name, { type })
  Object.defineProperty(file, 'size', { value: size, writable: true })
  return file
}

function validForm(file: File): FormData {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('caption', 'Test Caption')
  fd.append('alt', 'Test Alt')
  fd.append('category', 'Projects & Experiments')
  fd.append('width', '1920')
  fd.append('height', '1080')
  return fd
}

function uploadRequest(formData: FormData, headers: Record<string, string> = {}): NextRequest {
  const req = new NextRequest('http://localhost/api/media/upload', {
    method: 'POST',
    headers,
    body: formData,
  })
  Object.defineProperty(req, 'formData', { value: async () => formData, configurable: true })
  return req
}

function apiRequest(method: string, route: string, body?: unknown, headers: Record<string, string> = {}): NextRequest {
  const options: ConstructorParameters<typeof NextRequest>[1] = { method, headers }
  if (body !== undefined && method !== 'GET') {
    options.body = JSON.stringify(body)
    options.headers = { ...headers, 'Content-Type': 'application/json' }
  }
  return new NextRequest(new URL(`http://localhost${route}`), options)
}

/** Authorise a mutating request by default. */
function allow() {
  auth.allow()
}

/* ── tests ─────────────────────────────────────────────────────────────── */

describe('1. Valid image upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('uploads the file and returns a public Storage URL', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(validForm(makeFile())))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(typeof data.fileUrl).toBe('string')
    expect(data.fileUrl).toContain('mock.supabase.test/storage/v1/object/public/gallery')
  })

  it('returns the stored image metadata', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(validForm(makeFile())))
    const data = await res.json()
    expect(data.image.caption).toBe('Test Caption')
    expect(data.image.alt).toBe('Test Alt')
    expect(data.image.category).toBe('Projects & Experiments')
    expect(data.image.width).toBe(1920)
    expect(data.image.height).toBe(1080)
  })

  it('persists the exact Storage object key in metadata', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    await POST(uploadRequest(validForm(makeFile())))
    const inserted = handles.insertCalls[0][0]
    expect(inserted.storage_key).toBe(storage.objects[0])
  })

  it('uses a server-controlled key that ignores the uploaded filename', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    await POST(uploadRequest(validForm(makeFile('evil.exe.jpg'))))
    const key = storage.objects[0]
    expect(key).toMatch(/^gallery\/\d+-[0-9a-f-]+\.jpeg$/)
    expect(key).not.toContain('evil')
  })

  it('adds exactly one record and never deletes an existing one', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    await POST(uploadRequest(validForm(makeFile())))
    expect(handles.insertCalls).toHaveLength(1)
    expect(handles.deleteCalls).toHaveLength(0)
    expect(rows.map((r) => r.id)).toContain(1)
  })
})

describe('2. Upload validation failures', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('rejects an unsupported MIME type', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(validForm(makeFile('test.txt', 'text/plain'))))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('Unsupported')
  })

  it('rejects a file larger than 5 MB', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(validForm(makeFile('big.png', 'image/png', 6 * 1024 * 1024))))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('too large')
  })

  it('rejects a missing file', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(new FormData()))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toBe('No file uploaded')
  })

  it('rejects a non-positive width', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    const fd = validForm(makeFile())
    fd.set('width', '0')
    const res = await POST(uploadRequest(fd))
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain('Width')
  })

  it('does not create a record when validation fails', async () => {
    const { POST } = await import('@/app/api/media/upload/route')
    await POST(uploadRequest(validForm(makeFile('test.txt', 'text/plain'))))
    expect(handles.insertCalls).toHaveLength(0)
  })
})

describe('3. Metadata failure after a successful upload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('returns 500 when the metadata write fails', async () => {
    const original = handles.query.insert
    // Make the insert fail.
    ;(handles.query as Record<string, unknown>).insert = () =>
      Promise.resolve({ error: { message: 'db write failed' } })

    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(validForm(makeFile())))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toBe('Internal server error')

    ;(handles.query as Record<string, unknown>).insert = original
  })

  it('removes the orphaned Storage object it just created', async () => {
    ;(handles.query as Record<string, unknown>).insert = () =>
      Promise.resolve({ error: { message: 'db write failed' } })

    const { POST } = await import('@/app/api/media/upload/route')
    await POST(uploadRequest(validForm(makeFile())))

    // The uploaded object must be cleaned up, and only that one.
    expect(storage.removeCalls).toHaveLength(1)
    expect(storage.removeCalls[0]).toHaveLength(1)
  })
})

describe('4. POST /api/gallery (create)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('creates a record and returns 201', async () => {
    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/a.jpg', caption: 'Test', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.src).toBe('https://x.com/a.jpg')
    expect(handles.insertCalls).toHaveLength(1)
    // The id is DB-assigned, so it is NOT in the insert payload. Assert against
    // the payload as captured BEFORE the mock applied the simulated id.
    expect(handles.insertPayloads[0][0]).not.toHaveProperty('id')
  })

  it('assigns an id above the reserved legacy range and returns it', async () => {
    rows.push({
      id: 5, src: 'https://x.com/d.jpg', caption: 'Draft', alt_text: 'Draft',
      category: 'AI', width: 100, height: 100, is_published: false,
    })
    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/a.jpg', caption: 'Test', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    const data = await res.json()
    // The id is DB-assigned and above the reserved legacy range 1-7.
    expect(data.id).toBeGreaterThan(7)
    expect(data.id).not.toBe(5)
  })

  it('lets the database assign the id (no client computation)', async () => {
    // Regression guard: with no rows at all, the database would assign the first
    // id from its sequence. The mock simulates this by returning the next
    // generated id, so we only assert the contract (returned id exists and is
    // above the reserved legacy range), not an exact value.
    rows = []
    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/a.jpg', caption: 'Test', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    const data = await res.json()
    expect(data.id).toBeGreaterThan(0)
    expect(data.id).toBeGreaterThan(7)
  })

  it('continues past existing higher ids', async () => {
    install([
      { id: 20, src: 'https://x.com/a.jpg', caption: 'A', alt_text: 'A', category: 'AI', width: 1, height: 1, is_published: true },
    ])

    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/b.jpg', caption: 'Test', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    const data = await res.json()
    expect(data.id).toBeGreaterThan(20)
  })

  it('rejects a body that fails validation', async () => {
    helpers.validateGalleryBody.mockReturnValueOnce({
      valid: false,
      errors: ['caption is required'],
    } as never)
    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/a.jpg', caption: '', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    expect(res.status).toBe(400)
    expect((await res.json()).details).toContain('caption is required')
  })

  it('returns 500 when the database write fails', async () => {
    ;(handles.query as Record<string, unknown>).insert = () =>
      Promise.resolve({ error: { message: 'boom' } })
    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/a.jpg', caption: 'Test', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    expect(res.status).toBe(500)
  })
})

describe('5. GET /api/gallery (list)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('lists gallery images', async () => {
    const { GET } = await import('@/app/api/gallery/route')
    const res = await GET()
    expect(res.status).toBe(200)
    expect(Array.isArray(await res.json())).toBe(true)
  })

  it('returns 500 rather than an empty list when the read fails', async () => {
    ;(handles.query as Record<string, unknown>).select = () => {
      throw new Error('db down')
    }
    const { GET } = await import('@/app/api/gallery/route')
    const res = await GET()
    expect(res.status).toBe(500)
  })
})

describe('6. Authorization and CSRF', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
  })

  it('rejects an unauthenticated upload with 401', async () => {
    auth.denyAuth()
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(uploadRequest(validForm(makeFile())))
    expect(res.status).toBe(401)
    expect(handles.insertCalls).toHaveLength(0)
  })

  it('rejects a request with a mismatched Origin with 403', async () => {
    auth.denyOrigin()
    const { POST } = await import('@/app/api/media/upload/route')
    const res = await POST(
      uploadRequest(validForm(makeFile()), { Origin: 'https://evil.example', Host: 'localhost' }),
    )
    expect(res.status).toBe(403)
    expect(handles.insertCalls).toHaveLength(0)
  })

  it('rejects an unauthenticated POST /api/gallery with 401', async () => {
    auth.denyAuth()
    const { POST } = await import('@/app/api/gallery/route')
    const res = await POST(
      apiRequest('POST', '/api/gallery', {
        src: 'https://x.com/a.jpg', caption: 'Test', alt: 'Alt', category: 'AI', width: 800, height: 600,
      }),
    )
    expect(res.status).toBe(401)
  })

  it('rejects an unauthenticated DELETE with 401', async () => {
    auth.denyAuth()
    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/1'), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(401)
  })
})

describe('7. DELETE behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('reports full success when metadata and Storage are both deleted', async () => {
    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/1'), { params: Promise.resolve({ id: '1' }) })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toEqual({ ok: true, deleted: true, storageDeleted: true, partial: false })
    expect(handles.deleteCalls).toEqual([1])
    // The exact key from metadata, not a key reconstructed from the URL.
    expect(storage.removeCalls[0]).toEqual(['gallery/old.jpg'])
  })

  it('reports partial success when the Storage cleanup fails', async () => {
    // The record is gone but the file was not. This must NOT look like a
    // clean success.
    const failingStorage = {
      from: () => ({ remove: async () => ({ error: { message: 'bucket not found' } }) }),
    }
    storage.instance.remove = failingStorage.from().remove as never

    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/1'), { params: Promise.resolve({ id: '1' }) })

    const body = await res.json()
    expect(body.deleted).toBe(true)
    expect(body.storageDeleted).toBe(false)
    expect(body.partial).toBe(true)
    expect(body.warning).toContain('could not be removed from storage')
    // The metadata row was still deleted.
    expect(handles.deleteCalls).toEqual([1])
  })

  it('returns 500 when metadata deletion fails, without claiming success', async () => {
    ;(handles.query as Record<string, unknown>).delete = () => ({
      eq: () => Promise.resolve({ error: { message: 'permission denied' } }),
    })

    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/1'), { params: Promise.resolve({ id: '1' }) })

    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBeUndefined()
    expect(body.deleted).toBeUndefined()
  })

  it('returns 404 for a missing record and deletes nothing', async () => {
    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/999'), { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
    expect(handles.deleteCalls).toHaveLength(0)
    expect(storage.removeCalls).toHaveLength(0)
  })

  it('returns 400 for a non-numeric id', async () => {
    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/abc'), { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })

  it('does not delete a Storage object when the record owns none', async () => {
    install([
      {
        id: 9, src: '/gallery/legacy.jpg', caption: 'Legacy', alt_text: 'Legacy',
        category: 'AI', width: 100, height: 100, is_published: true, storage_key: null,
      },
    ])

    const { DELETE } = await import('@/app/api/gallery/[id]/route')
    const res = await DELETE(apiRequest('DELETE', '/api/gallery/9'), { params: Promise.resolve({ id: '9' }) })
    // No Storage object is owned, so none may be deleted. The record itself is
    // still removed, and the response reflects the real cleanup state.
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.storageDeleted).toBe(false)
    expect(body.partial).toBe(false)
    expect(storage.removeCalls).toHaveLength(0)
  })
})

describe('8. PUT behaviour', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
    allow()
  })

  it('updates one record by id and returns it', async () => {
    const { PUT } = await import('@/app/api/gallery/[id]/route')
    const res = await PUT(
      apiRequest('PUT', '/api/gallery/1', {
        src: 'https://x.com/updated.jpg', caption: 'Updated', alt: 'Updated', category: 'AI', width: 100, height: 100,
      }),
      { params: Promise.resolve({ id: '1' }) },
    )
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.caption).toBe('Updated')
    expect(handles.updateCalls.map((c) => c.id)).toEqual([1])
    expect(handles.deleteCalls).toHaveLength(0)
  })

  it('returns 404 for a missing record', async () => {
    const { PUT } = await import('@/app/api/gallery/[id]/route')
    const res = await PUT(
      apiRequest('PUT', '/api/gallery/999', {
        src: 'https://x.com/x.jpg', caption: 'X', alt: 'X', category: 'AI', width: 100, height: 100,
      }),
      { params: Promise.resolve({ id: '999' }) },
    )
    expect(res.status).toBe(404)
    expect(handles.updateCalls).toHaveLength(0)
  })

  it('returns 400 for a non-numeric id', async () => {
    const { PUT } = await import('@/app/api/gallery/[id]/route')
    const res = await PUT(
      apiRequest('PUT', '/api/gallery/abc', {
        src: 'https://x.com/x.jpg', caption: 'X', alt: 'X', category: 'AI', width: 100, height: 100,
      }),
      { params: Promise.resolve({ id: 'abc' }) },
    )
    expect(res.status).toBe(400)
  })
})

describe('9. GET /api/gallery/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    install()
  })

  it('returns a published record', async () => {
    const { GET } = await import('@/app/api/gallery/[id]/route')
    const res = await GET(apiRequest('GET', '/api/gallery/1'), { params: Promise.resolve({ id: '1' }) })
    expect(res.status).toBe(200)
    expect((await res.json()).id).toBe(1)
  })

  it('returns 404 for a missing record', async () => {
    const { GET } = await import('@/app/api/gallery/[id]/route')
    const res = await GET(apiRequest('GET', '/api/gallery/999'), { params: Promise.resolve({ id: '999' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 for a non-numeric id', async () => {
    const { GET } = await import('@/app/api/gallery/[id]/route')
    const res = await GET(apiRequest('GET', '/api/gallery/abc'), { params: Promise.resolve({ id: 'abc' }) })
    expect(res.status).toBe(400)
  })
})
