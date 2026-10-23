/// <reference types="@testing-library/jest-dom" />

/**
 * Storage object-key handling and legacy-fallback behaviour.
 *
 * The production function under test (`resolveStorageObjectKey`) is imported
 * directly — this file does not mock the data layer, so the real parsing
 * logic is what runs.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  resolveStorageObjectKey,
  readGalleryLegacyJson,
  mapAltTextToAlt,
  GALLERY_METADATA_TABLE,
} from '@/lib/gallery-data'

const PUBLIC_URL =
  'https://xyz.supabase.co/storage/v1/object/public/gallery/gallery/1760000000-abc.jpg'
const AUTH_URL =
  'https://xyz.supabase.co/storage/v1/object/authenticated/gallery/gallery/1760000000-abc.jpg'

describe('resolveStorageObjectKey', () => {
  it('prefers an explicit storage_key over any URL parsing', () => {
    expect(resolveStorageObjectKey({ src: PUBLIC_URL, storage_key: 'gallery/known-key.jpg' })).toBe(
      'gallery/known-key.jpg',
    )
  })

  it('derives the exact object key from a public object URL', () => {
    // Regression: the old implementation sliced after 'storage/v1/object' and
    // produced 'public/gallery/gallery/<file>' instead of 'gallery/<file>'.
    expect(resolveStorageObjectKey({ src: PUBLIC_URL, storage_key: null })).toBe(
      'gallery/1760000000-abc.jpg',
    )
  })

  it('derives the exact object key from an authenticated object URL', () => {
    expect(resolveStorageObjectKey({ src: AUTH_URL, storage_key: null })).toBe(
      'gallery/1760000000-abc.jpg',
    )
  })

  it('never treats a local /public asset path as a Storage object', () => {
    for (const src of [
      '/gallery/samsung-mentorship-office.jpg',
      '/certificates/cert_1%20(1).jpeg',
      '/certificates/cert_1%20(4).JPG',
    ]) {
      expect(resolveStorageObjectKey({ src, storage_key: null })).toBeNull()
    }
  })

  it('returns null for a non-Supabase URL', () => {
    expect(resolveStorageObjectKey({ src: 'https://cdn.example.com/img.jpg', storage_key: null })).toBeNull()
  })

  it('returns null when the bucket does not match the configured bucket', () => {
    expect(resolveStorageObjectKey({ src: PUBLIC_URL, storage_key: null }, 'other-bucket')).toBeNull()
  })

  it('returns null for an unparseable value', () => {
    expect(resolveStorageObjectKey({ src: 'not a url', storage_key: null })).toBeNull()
  })

  it('returns null when the URL has no object key after the bucket', () => {
    expect(
      resolveStorageObjectKey({
        src: 'https://xyz.supabase.co/storage/v1/object/public/gallery',
        storage_key: null,
      }),
    ).toBeNull()
  })

  it('preserves nested prefixes inside the object key', () => {
    expect(
      resolveStorageObjectKey({
        src: 'https://xyz.supabase.co/storage/v1/object/public/gallery/2026/10/img.jpg',
        storage_key: null,
      }),
    ).toBe('2026/10/img.jpg')
  })
})

describe('mapAltTextToAlt', () => {
  it('maps alt_text onto the application-facing alt field', () => {
    const mapped = mapAltTextToAlt({
      id: 42,
      src: 'https://cdn.example.com/x.jpg',
      caption: 'Caption',
      alt_text: 'Alt from DB',
      category: 'AI & Computer Vision',
      width: 100,
      height: 50,
      is_published: true,
    })
    expect(mapped).not.toBeNull()
    expect(mapped!.alt).toBe('Alt from DB')
    // The public contract must not leak the database column name.
    expect('alt_text' in mapped!).toBe(false)
  })

  it('returns null for a row without a numeric id', () => {
    expect(mapAltTextToAlt(null as never)).toBeNull()
  })
})

describe('readGalleryLegacyJson', () => {
  it('returns all seven legacy records', async () => {
    const legacy = await readGalleryLegacyJson()
    expect(legacy).toHaveLength(7)
  })

  it('preserves the legacy local /public URLs and their ids', async () => {
    const legacy = await readGalleryLegacyJson()
    expect(legacy.map((r) => r.id)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(legacy.map((r) => r.src)).toEqual([
      '/certificates/cert_1%20(1).jpeg',
      '/certificates/cert_1%20(4).JPG',
      '/certificates/cert_1%20(5).JPG',
      '/gallery/samsung-mentorship-office.jpg',
      '/gallery/samsung-innovation-campus-group.jpg',
      '/gallery/samsung-building-visit.jpg',
      '/gallery/ai-deeplearning-leaderboard.jpg',
    ])
  })

  it('does not expose the database column name on legacy records', async () => {
    const legacy = await readGalleryLegacyJson()
    expect(legacy.every((r) => 'alt_text' in r)).toBe(false)
  })
})

describe('GALLERY_METADATA_TABLE', () => {
  it('targets the gallery_metadata table', () => {
    expect(GALLERY_METADATA_TABLE).toBe('gallery_metadata')
  })
})
