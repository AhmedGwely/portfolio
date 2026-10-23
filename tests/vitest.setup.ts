/// <reference types="@testing-library/jest-dom" />

// ============================================================================
// tests/vitest.setup.ts — environment bootstrap ONLY.
//
// This file deliberately contains NO `vi.mock` calls.
//
// Reason: a `vi.mock` registered from a setup file applies to every test file,
// and a per-file `vi.doMock` cannot override a `vi.mock` that is already
// registered. The previous version mocked `@/lib/supabase` and
// `@/lib/gallery-data` here, which silently overrode each test file's own
// mocks and made 14 of 18 tests fail: the real data layer never ran, and
// auth-helper re-mocks leaked between tests.
//
// Mocking is now declared per test file, so each suite owns its fixtures.
// ============================================================================

import { vi } from 'vitest'

// ---------------------------------------------------------------------------
// Environment variables
//
// Set BEFORE any module that reads them is imported. These are throwaway
// values for the local test process only; they are never sent anywhere.
// ---------------------------------------------------------------------------
process.env.SUPABASE_URL = 'http://mock.supabase.test'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-must-be-long-enough'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
process.env.SUPABASE_STORAGE_BUCKET = 'gallery'

// ---------------------------------------------------------------------------
// Network
//
// Mock `fetch` so a test can never reach a real network. Tests that need to
// observe fetch (the legacy JSON fallback) install their own mock.
// ---------------------------------------------------------------------------
beforeEach(() => {
  global.fetch = vi.fn() as unknown as typeof fetch
})

afterEach(() => {
  vi.restoreAllMocks()
})
