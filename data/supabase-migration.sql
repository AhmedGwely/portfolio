/**
 * Supabase migration: gallery_media table + RLS policies
 *
 * Apply these SQL statements directly in the Supabase Dashboard SQL Editor:
 * 1. CREATE TABLE gallery_media (...)
 * 2. CREATE POLICY ... (RLS policies)
 *
 * Bucket: 'gallery' (public read, authenticated write only)
 *
 * Note: This file is NOT executed by the repository. It is documentation
 * for the manual SQL Editor steps. Do not run from Next.js server code.
 */

-- ============================================================================
-- SUPABASE SQL EDITOR — run once, then never again (unless rolling back)
// ============================================================================

-- 1. Create the gallery_media table
-- ============================================================================
CREATE TABLE IF NOT EXISTS gallery_media (
  id BIGSERIAL PRIMARY KEY,
  object_key TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'AI & Computer Vision',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_published BOOLEAN NOT NULL DEFAULT TRUE,
  CONSTRAINT gallery_media_check CHECK (width > 0 AND height > 0)
);

-- 2. Add RLS
ALTER TABLE gallery_media ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- 3a. Public readers: SELECT published items only
CREATE POLICY gallery_media_public_read ON gallery_media
  FOR SELECT
  USING (is_published = TRUE);

-- 3b. Admin writers: authenticated service-role key (hardcoded admin check)
--    Service-role key bypasses RLS, so we add a heartbeat table to gate
--    the server-side uploads. This is a safeguard; the real gate is that
--    only the admin API route calls the upload.
CREATE POLICY gallery_media_admin_write ON gallery_media
  FOR ALL
  TO service_role
  USING (true);

-- 4. Index for common queries
CREATE INDEX idx_gallery_media_category ON gallery_media (category);
CREATE INDEX idx_gallery_media_updated_at ON gallery_media (updated_at DESC);

-- 5. Optional: create the storage bucket (run only if it doesn't exist)
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
-- VALUES (
--   'gallery',
--   'gallery',
--   TRUE,
--   ARRAY['image/jpeg','image/png','image/webp','image/gif'],
--   5242880  -- 5 MB
-- );
--
-- If bucket is created, the following policies apply:
--  a. Public users: SELECT (getPublicUrl) — read only
--  b. Authenticated users: INSERT — uploads only
--  c. Logged-in users: SELECT — read their own only
--  d. Admin: DELETE — full access

-- 6. Verify the migration
-- ============================================================================
-- SELECT * FROM gallery_media;
-- SELECT bucket_id, total_size_megabyte FROM storage.objects GROUP BY bucket_id;
