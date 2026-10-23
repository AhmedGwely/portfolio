/// <reference types="@testing-library/jest-dom" />

/**
 * Supabase client module initialisation.
 *
 * This file deliberately mocks NOTHING. A `vi.mock('@/lib/supabase')` anywhere
 * in this file would intercept the very import under test and hide an
 * import-time throw, so the module is loaded for real.
 *
 * The regression these tests guard: the original module ran
 * `throw new Error('Missing Supabase env vars...')` at module scope. Because
 * every gallery route imports the data layer, which imports this module, a
 * missing env var crashed the route at *import* time instead of producing a 500
 * at request time — taking the whole route down rather than failing one request.
 *
 * `tests/vitest.setup.ts` sets these variables for the other suites. They are
 * cleared here and the module registry is reset, so this file tests the real
 * module with the real (absent) environment.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const KEYS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_STORAGE_BUCKET',
] as const

const original: Record<string, string | undefined> = {}

beforeEach(() => {
  for (const key of KEYS) {
    original[key] = process.env[key]
    delete process.env[key]
  }
  vi.resetModules()
})

afterEach(() => {
  for (const key of KEYS) {
    if (original[key] === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = original[key]
    }
  }
  vi.resetModules()
})

describe('supabase module initialisation', () => {
  it('imports successfully when the credentials are absent', async () => {
    // A module-scope throw would reject here instead of resolving.
    await expect(import('@/lib/supabase')).resolves.toBeDefined()
  })

  it('reports isConfigured() === false when the credentials are absent', async () => {
    const mod = await import('@/lib/supabase')
    expect(mod.isConfigured()).toBe(false)
  })

  it('getSupabase() throws at call time, not at import time', async () => {
    const mod = await import('@/lib/supabase')
    expect(() => mod.getSupabase()).toThrow(/not configured/)
  })

  it('does not construct a client for an unset anon key', async () => {
    // `anonSupabase` must be null, not a client built from an empty URL —
    // `createClient('')` throws "supabaseUrl is required".
    const mod = await import('@/lib/supabase')
    expect(mod.anonSupabase).toBeNull()
  })

  it('reports isConfigured() === true when both credentials are present', async () => {
    process.env.SUPABASE_URL = 'http://mock.supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-must-be-long-enough'
    vi.resetModules()

    const mod = await import('@/lib/supabase')
    expect(mod.isConfigured()).toBe(true)
  })

  it('builds the storage bucket name from the environment', async () => {
    process.env.SUPABASE_URL = 'http://mock.supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-must-be-long-enough'
    process.env.SUPABASE_STORAGE_BUCKET = 'custom-bucket'
    vi.resetModules()

    const mod = await import('@/lib/supabase')
    expect(mod.getStorageBucket()).toBe('custom-bucket')
  })

  it('defaults the storage bucket to "gallery"', async () => {
    process.env.SUPABASE_URL = 'http://mock.supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-must-be-long-enough'
    vi.resetModules()

    const mod = await import('@/lib/supabase')
    expect(mod.getStorageBucket()).toBe('gallery')
  })
})
