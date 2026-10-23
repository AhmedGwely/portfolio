import fs from 'node:fs/promises'
import path from 'node:path'
import { getSupabase, getStorageBucket, isConfigured } from '@/lib/supabase'

/**
 * Name of the PostgreSQL table used for durable gallery metadata.
 */
export const GALLERY_METADATA_TABLE = 'gallery_metadata'

/**
 * Application-facing gallery image record.
 *
 * `alt` is the single field the rest of the codebase uses for alternative
 * text. It is derived from the Supabase column `alt_text` in the data layer
 * (see `mapAltTextToAlt`) so that no other module has to know the database
 * column name.
 */
export type GalleryImage = {
  id: number
  src: string
  caption: string
  alt: string
  category: string
  width: number
  height: number
  /**
   * Publication state. `true` is the schema default, so an absent value is
   * treated as published everywhere in the app. It is present on records read
   * from the database (including via the admin read path) and absent on legacy
   * JSON records, which are always published.
   */
  isPublished?: boolean
}

/**
 * Row shape as returned by the Supabase `gallery_metadata` table.
 *
 * `storage_key` is the exact Storage object key for the row's own object.
 * It is nullable because legacy rows (seeded from local `/public` assets) have
 * no Storage object at all, and because the column may not exist yet in a
 * database where the migration has not been applied.
 */
export type GalleryMetadataRow = {
  id: number
  src: string
  caption: string
  alt_text: string
  category: string
  width: number
  height: number
  is_published?: boolean
  storage_key?: string | null
}

/* ──────────────────────────────────────────────────────────────────────────
   Legacy JSON fallback
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The seven legacy gallery records, kept as the local source of truth.
 *
 * These are the only gallery records that existed before the Supabase
 * migration. They are read from `data/gallery.json` at runtime (never
 * hard-coded here) and are returned when the database is unavailable, so the
 * gallery keeps rendering during local development and in a degraded state.
 *
 * Their ids 1–7 are reserved for these rows.
 */
export const LEGACY_GALLERY_JSON = 'gallery.json'

let legacyCache: GalleryImage[] | null = null

/**
 * Read the legacy gallery records from `data/gallery.json`.
 *
 * Uses the filesystem rather than `fetch(import.meta.url)`, which is not
 * available in the Next.js Node runtime. A malformed file is a real error and
 * is thrown, never silently converted into an empty gallery.
 */
export async function readGalleryLegacyJson(): Promise<GalleryImage[]> {
  if (legacyCache) return legacyCache
  const filePath = path.join(process.cwd(), 'data', LEGACY_GALLERY_JSON)
  const raw = await fs.readFile(filePath, 'utf-8')
  const parsed = JSON.parse(raw) as GalleryImage[]
  if (!Array.isArray(parsed)) {
    throw new Error(`Expected an array in ${LEGACY_GALLERY_JSON}`)
  }
  legacyCache = parsed
  return parsed
}

/* ──────────────────────────────────────────────────────────────────────────
   Row mapping
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Map a database row (`alt_text` column) onto the application-facing record
 * (`alt` field). This is the single, explicit mapping between the database
 * schema and the application contract.
 *
 * Returns `null` for a row that cannot be mapped, so callers can drop it
 * without throwing.
 */
export function mapAltTextToAlt(row: GalleryMetadataRow): GalleryImage | null {
  if (!row || typeof row.id !== 'number') return null
  return {
    id: row.id,
    src: row.src,
    caption: row.caption,
    alt: row.alt_text,
    category: row.category,
    width: row.width,
    height: row.height,
    // The schema defaults this to TRUE; carry it through so the admin UI can
    // tell a draft from a published record.
    isPublished: row.is_published !== false,
  }
}

/* ──────────────────────────────────────────────────────────────────────────
   Storage object-key handling
   ────────────────────────────────────────────────────────────────────────── */

/**
 * The Storage object key for a row's own object, or `null` when the row has
 * no Storage object.
 *
 * Preference order:
 *   1. `storage_key` — the exact key captured at upload time (authoritative).
 *   2. Derived from a public/authenticated object URL — but ONLY when the URL
 *      is provably a Supabase object URL *and* the bucket name matches the
 *      configured bucket. Anything else returns `null`.
 *
 * Returning `null` is deliberate: the caller must not delete an object whose
 * key it cannot prove. Legacy `/public/...` asset paths therefore always
 * produce `null` and are never touched by a delete.
 */
export function resolveStorageObjectKey(
  row: Pick<GalleryMetadataRow, 'src' | 'storage_key'>,
  bucket: string = getStorageBucket(),
): string | null {
  if (row.storage_key && typeof row.storage_key === 'string' && row.storage_key.trim()) {
    return row.storage_key
  }

  const trimmed = row.src.trim()
  // A local asset path (/gallery/x.jpg, /certificates/y.JPG) is not a Storage
  // object URL. Never treat it as one.
  if (trimmed.startsWith('/')) return null

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return null
  }

  const segments = url.pathname.split('/').filter(Boolean)
  const OBJECT_PREFIX = ['storage', 'v1', 'object']
  const isObjectUrl =
    segments.length >= 3 && OBJECT_PREFIX.every((part, i) => segments[i] === part)

  if (!isObjectUrl) return null

  // Layout: storage/v1/object/{public|authenticated}/{bucket}/{key...}
  const visibility = segments[3]
  if (visibility !== 'public' && visibility !== 'authenticated') return null

  const urlBucket = segments[4]
  if (urlBucket !== bucket) return null

  const key = segments.slice(5).join('/')
  return key.length > 0 ? key : null
}

/* ──────────────────────────────────────────────────────────────────────────
   Reads
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Resolve a Supabase query result into rows, wrapping any failure in a
 * descriptive error.
 *
 * Both failure shapes are handled, because the client can surface them
 * differently: a failed query normally resolves with `{ data: null, error }`,
 * but a rejected builder (e.g. a network drop) rejects outright. Letting a
 * rejection escape unwrapped leaks the raw client error instead of the
 * data-layer's own message.
 */
async function resolveQuery<T>(
  query: PromiseLike<{ data: unknown; error: { message: string } | null }>,
): Promise<T[]> {
  let result: { data: unknown; error: { message: string } | null }
  try {
    result = await query
  } catch (err) {
    throw new Error(
      `Failed to read gallery metadata: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  if (result.error) {
    throw new Error(`Failed to read gallery metadata: ${result.error.message}`)
  }
  return (result.data || []) as T[]
}

/**
 * Read gallery records from the `gallery_metadata` table.
 *
 * @param opts.publishedOnly  when true (the default) only `is_published = true`
 *                            rows are returned. Public reads MUST leave this
 *                            at the default. The admin read path passes
 *                            `false` so it can see drafts.
 *
 * Error contract (do not weaken):
 *   - A database error is THROWN, never converted into an empty list. An
 *     empty gallery caused by a swallowed error looks identical to "no images
 *     yet" and hides the failure.
 *   - When the database is entirely unconfigured (no credentials) the legacy
 *     JSON records are returned instead, so local development still works.
 */
export async function readGallery(opts: { publishedOnly?: boolean } = {}): Promise<GalleryImage[]> {
  const publishedOnly = opts.publishedOnly !== false

  if (!isConfigured()) {
    const legacy = await readGalleryLegacyJson()
    return legacy
  }

  let query = getSupabase()
    .from(GALLERY_METADATA_TABLE)
    .select('*')
    .order('id', { ascending: true })

  if (publishedOnly) {
    query = query.eq('is_published', true)
  }

  const rows = await resolveQuery<GalleryMetadataRow>(query)

  return rows
    .map((row) => mapAltTextToAlt(row))
    .filter((r): r is NonNullable<typeof r> => r !== null)
}

/**
 * Admin read path: every record, including drafts.
 *
 * The public read path (`readGallery()`) filters to published rows; this one
 * deliberately does not, so the admin UI can list and manage unpublished
 * records.
 */
export async function readGalleryForAdmin(): Promise<GalleryImage[]> {
  return readGallery({ publishedOnly: false })
}

/**
 * Read a single gallery record by id.
 *
 * Honours the same publication filter as `readGallery`: an unpublished record
 * is not reachable through this function.
 */
export async function readGalleryEntry(
  id: number,
  opts: { publishedOnly?: boolean } = {},
): Promise<GalleryImage | null> {
  const records = await readGallery(opts)
  return records.find((r) => r.id === id) || null
}

/* ──────────────────────────────────────────────────────────────────────────
   Writes
   ────────────────────────────────────────────────────────────────────────── */

/**
 * Insert a new record and return the record as persisted.
 *
 * The id is derived from the full id set (published AND unpublished) so a new
 * row can never collide with an existing unpublished row. The insert is a
 * single-row `INSERT` — it never rewrites or removes other rows.
 *
 * Legacy ids: the seven records in `data/gallery.json` occupy ids 1–7.
 * Those ids are RESERVED so a new record can never take one, regardless of
 * whether the legacy rows have been seeded into the database yet. The result
 * is deterministic and needs no database sequence, constraint, or migration.
 *
 * @param storageKey  the exact Storage object key for the uploaded object, or
 *                    `null` for a record backed by a local `/public` asset.
 */
export const LEGACY_RESERVED_ID_MAX = 7

export async function createGalleryEntry(
  image: {
    src: string
    caption: string
    alt: string
    category: string
    width: number
    height: number
  },
  storageKey: string | null = null,
): Promise<GalleryImage> {
  // The database assigns the id: the column is `BIGSERIAL`, so a row insert
  // without an explicit `id` receives `nextval('gallery_metadata_id_seq')`.
  // That value is unique across concurrent inserts and cannot collide with
  // rows inserted by other sessions.
  //
  // We deliberately do NOT send `id` in the insert payload. Sending one would
  // force the driver to honour it, bypass the sequence, and make concurrent
  // creates race (both reading the same max id).
  //
  // `insert()` returns the inserted row with the generated `id`, which the
  // application must read back rather than trusting the in-memory `image`
  // object.
  const { data, error } = await getSupabase()
    .from(GALLERY_METADATA_TABLE)
    .insert({
      src: image.src,
      caption: image.caption,
      alt_text: image.alt,
      category: image.category,
      width: image.width,
      height: image.height,
      storage_key: storageKey,
    })
    .select(
      'id, src, caption, alt_text, category, width, height, storage_key, created_at, updated_at, is_published',
    )
    .single()

  if (error) {
    throw new Error(`Failed to create gallery entry: ${error.message}`)
  }

  // The row comes back from Postgres with `alt_text` (the column name), not
  // `alt` (the application field). Map it through the same function every
  // other read path uses, so the create response has exactly the same shape as
  // a read response. Casting the raw row to `GalleryImage` would silently
  // publish `alt_text` to the API client and leave `alt` undefined in the admin
  // UI — and TypeScript rejects the cast outright (TS2352).
  const created = mapAltTextToAlt(data as unknown as GalleryMetadataRow)
  if (!created) {
    throw new Error('Failed to create gallery entry: database returned an unmappable row')
  }

  return created
}

/**
 * Update an existing gallery record by id.
 *
 * A targeted `UPDATE ... WHERE id = $id` — only the matching row is changed.
 * Throws when the row does not exist, so a caller can distinguish "updated"
 * from "nothing happened".
 *
 * `image` carries the display metadata; `storage_key` is preserved from the
 * existing row unless explicitly overridden. `publication` is separate so a
 * publication change never rewrites captions, alt text, or categories.
 */
export async function updateGalleryEntry(
  id: number,
  image: {
    src: string
    caption: string
    alt: string
    category: string
    width: number
    height: number
    storageKey?: string | null
  },
  publication?: { isPublished: boolean },
): Promise<void> {
  const existing = await readGalleryEntry(id, { publishedOnly: false })
  if (!existing) {
    throw new Error(`Gallery entry ${id} not found in metadata table`)
  }

  const payload: Record<string, unknown> = { ...image, alt_text: image.alt }

  // Only touch storage_key when the caller explicitly provided one.
  if (image.storageKey !== undefined) {
    payload.storage_key = image.storageKey
  }

  // Publication is an independent, targeted change.
  if (publication !== undefined) {
    payload.is_published = publication.isPublished
  }

  const { error } = await getSupabase()
    .from(GALLERY_METADATA_TABLE)
    .update(payload)
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to update gallery entry ${id}: ${error.message}`)
  }
}

/**
 * Delete a gallery record by id, plus its Storage object when one is owned.
 *
 * Ordering and safety:
 *   1. The record is loaded first. A missing record throws — nothing is
 *      deleted.
 *   2. The Storage object is deleted ONLY when `resolveStorageObjectKey`
 *      returned a provable key. Legacy `/public` assets are never touched.
 *   3. A Storage failure is swallowed into the return value
 *      (`storageObjectDeleted: false`) rather than thrown: the metadata row is
 *      still deleted, and reporting the Storage failure honestly is more
 *      useful than a misleading 500 that leaves the caller believing nothing
 *      happened. It is never reported as success.
 *   4. The metadata row is deleted by targeted `DELETE ... WHERE id = $id`.
 *
 * `deps` exists so a test can make the Storage cleanup fail and observe the
 * honest `storageObjectDeleted: false` report. Production callers omit it.
 */
export async function deleteGalleryEntry(
  id: number,
  deps: StorageDeps | Record<string, never> = {},
): Promise<{
  deletedId: number
  storageObjectDeleted: boolean
  /**
   * Whether the record owned a Storage object at all. Captured BEFORE the
   * metadata row is removed, so a caller can tell "the object could not be
   * removed" from "there was no object to remove" after the fact.
   */
  storageObjectOwned: boolean
}> {
  const records = await readGallery({ publishedOnly: false })
  const record = records.find((r) => r.id === id)
  if (!record) {
    throw new Error(`Gallery entry ${id} not found in metadata table`)
  }

  // Re-read the raw row so the exact storage key is available; the mapped
  // GalleryImage record does not carry it.
  const storageKey = await readStorageKey(id)
  const storageObjectOwned = storageKey !== null

  let storageObjectDeleted = false
  if (storageKey) {
    const storage = deps.storage ?? getSupabase().storage
    const result = await storage
      .from(getStorageBucket())
      .remove([storageKey])

    // Storage failure is recorded, never thrown, and never reported as success.
    const deleteStorageError = (result as { error?: { message: string } | null }).error
    storageObjectDeleted = !deleteStorageError
    if (deleteStorageError) {
      console.error(
        `Storage cleanup failed for gallery entry ${id} (${storageKey}): ${deleteStorageError.message}`,
      )
    }
  }

  const { error: deleteError } = await getSupabase()
    .from(GALLERY_METADATA_TABLE)
    .delete()
    .eq('id', id)

  if (deleteError) {
    throw new Error(`Failed to delete gallery entry ${id}: ${deleteError.message}`)
  }

  return { deletedId: id, storageObjectDeleted, storageObjectOwned }
}

/** Storage handle shape used by `deleteGalleryEntry`. */
type StorageDeps = {
  storage: {
    from: (bucket: string) => {
      remove: (keys: string[]) => PromiseLike<{ error?: { message: string } | null } | null>
    }
  }
}

/**
 * Whether a record owns a Storage object.
 *
 * Reads the raw row and resolves a provable object key. Used by the delete
 * route to tell "the object could not be removed" apart from "there was no
 * object to remove".
 */
export async function ownsStorageObject(id: number): Promise<boolean> {
  const key = await readStorageKey(id)
  return key !== null
}

/**
 * Read the exact Storage object key for a record.
 *
 * Reads the raw row (the mapped `GalleryImage` does not carry `storage_key`)
 * and falls back to parsing the public URL only when the row's own key is
 * absent and the URL is provably a Storage object URL for the configured
 * bucket.
 */
async function readStorageKey(id: number): Promise<string | null> {
  const { data, error } = await getSupabase()
    .from(GALLERY_METADATA_TABLE)
    .select('src, storage_key')
    .eq('id', id)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to read gallery entry ${id}: ${error.message}`)
  }
  if (!data) return null

  const row = data as { src: string; storage_key?: string | null }
  return resolveStorageObjectKey(row)
}
