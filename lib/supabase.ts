import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase client.
 *
 * IMPORTANT: this module MUST NOT throw at import time.
 *
 * The previous implementation threw when `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
 * were absent. Because every gallery route imports the data layer, and the data
 * layer imports this module, a missing env var crashed the *import* of the route
 * rather than producing a 500 at request time. The client is therefore created
 * lazily and reports its unavailability through `isConfigured()`.
 */

let cachedClient: SupabaseClient | null = null

function hasCredentials(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY)
}

/**
 * True when both required credentials are present. Callers must check this
 * before issuing a query; `getSupabase()` throws if it is false.
 */
export function isConfigured(): boolean {
  return hasCredentials()
}

/**
 * The server-side (service-role) client.
 *
 * Lazily constructed and cached. Throws a descriptive error when the
 * credentials are missing — the throw happens here, at call time, so a route
 * can translate it into a 500 response instead of crashing at import.
 *
 * This client bypasses RLS and is for server-side use only. It must never be
 * imported into a client component or browser bundle.
 */
export function getSupabase(): SupabaseClient {
  if (!hasCredentials()) {
    throw new Error(
      'Supabase is not configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in the environment.',
    )
  }
  if (!cachedClient) {
    cachedClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }
  return cachedClient
}

/**
 * Public (anon) client for client-side reads.
 *
 * Returns `null` when `NEXT_PUBLIC_SUPABASE_ANON_KEY` is unset — callers must
 * handle the null case. The anon client is NOT used for uploads: the
 * service-role key always handles writes server-side, so no credentials ever
 * reach the browser.
 */
export const anonSupabase: SupabaseClient | null = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClient(process.env.SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  : null

/** Storage bucket name, from the environment or the default. */
export function getStorageBucket(): string {
  return process.env.SUPABASE_STORAGE_BUCKET || 'gallery'
}

/** Schema name for media tables, from the environment or the default. */
export function getStorageSchema(): string {
  return process.env.SUPABASE_SCHEMA || 'public'
}
