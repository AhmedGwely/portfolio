/**
 * Supabase migration: gallery_metadata table + RLS policies
 *
 * Apply these SQL statements directly in the Supabase Dashboard SQL Editor.
 * This is the authoritative, reviewed migration for the durable gallery
 * metadata store (PostgreSQL) and the Supabase Storage bucket for media.
 *
 * Table: gallery_metadata
 *   - id: stable primary key (BIGSERIAL), matches existing JSON record ids
 *   - src: public image URL or storage object URL
 *   - caption, alt_text, category, width, height: preserve the original JSON contract
 *   - storage_key: the exact Storage object key for the row's own object
 *     (nullable — legacy rows seeded from local /public assets have none).
 *     Deletion uses this key; it is never reconstructed from a public URL.
 *   - created_at / updated_at: server timestamps
 *   - is_published: publication flag (default TRUE = visible to all)
 *
 * RLS: the service-role key bypasses RLS, so the API handlers remain the
 * authorization gate. Anonymous visitors read only is_published = TRUE.
 *
 * Do NOT run this file from Next.js server code.
 */

-- ============================================================================
-- SUPABASE SQL EDITOR — run once, then never again (unless rolling back)
-- ============================================================================

-- 1. Create the gallery_metadata table (idempotent)
-- ============================================================================
CREATE TABLE IF NOT EXISTS gallery_metadata (
  id BIGSERIAL PRIMARY KEY,
  src TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'AI & Computer Vision',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  storage_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT gallery_metadata_check CHECK (width > 0 AND height > 0),
  CONSTRAINT gallery_metadata_check_type CHECK (char_length(src) > 0)
);

-- 2. Add RLS
ALTER TABLE gallery_metadata ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- 3a. Public readers: SELECT published items only
CREATE POLICY gallery_metadata_public_read ON gallery_metadata
  FOR SELECT
  USING (is_published = TRUE);

-- 3b. Admin writers: server-side writes by the service role are unrestricted,
--     but the API handlers still enforce requireAuth + validateOrigin before
--     any mutation. This is a defence-in-depth safeguard only.
CREATE POLICY gallery_metadata_admin_write ON gallery_metadata
  FOR ALL
  TO service_role
  USING (true);

-- 4. Indexes for common queries
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_gallery_metadata_category ON gallery_metadata (category);
CREATE INDEX IF NOT EXISTS idx_gallery_metadata_published ON gallery_metadata (is_published) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_gallery_metadata_updated_at ON gallery_metadata (updated_at DESC);

-- 5. Storage bucket (optional — only if this is the first deployment)
-- ============================================================================
-- INSERT INTO storage.buckets (name, public, allowed_mime_types, file_size_limit)
-- VALUES (
--   'gallery',
--   TRUE,
--   ARRAY['image/jpeg','image/png','image/webp','image/gif'],
--   5242880  -- 5 MB
-- );

-- 6. Verify the migration
-- ============================================================================
-- SELECT * FROM gallery_metadata ORDER BY id;
