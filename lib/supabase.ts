import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    'Missing Supabase env vars. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.',
  )
}

/**
 * Server-side Supabase client (service-role key).
 *
 * This client bypasses RLS — it is for server-side use only and must never
 * be imported into client components or browser bundles.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey)

/**
 * Public (anon) client for client-side reads.
 *
 * ⚠️ Only created when NEXT_PUBLIC_SUPABASE_ANON_KEY is set.
 * The anon client is NOT used for uploads — the service-role key always
 * handles writes server-side, so no credentials ever reach the browser.
 */
export const anonSupabase = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      global: { headers: { 'x-supabase-anon': 'true' } },
    })
  : null

/**
 * Build the Supabase storage bucket name from environment or use default.
 */
export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'gallery'
}

/**
 * Build the Supabase schema name for media tables.
 */
export function getStorageSchema(): string {
  return process.env.SUPABASE_SCHEMA || 'public'
}
