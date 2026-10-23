# Phase 4C — Defect report

## The prior report's headline claims are FALSE

| Prior claim | Verified reality |
|---|---|
| "`npx tsc --noEmit` → CLEAN" | **FALSE.** Exit code 1, **11 errors**. |
| "`git diff --check` → CLEAN" | **FALSE.** Exit 2, 14 lines flagged. (13 are `next-env.d.ts` CRLF churn — that part is legitimately ignorable; the bare command does not pass.) |
| "The mocks compile, resolve" | **FALSE.** `tests/gallery-upload.test.ts:105` passes `cols` (a string) where `args: unknown[]` is required; the fake builder's own type is broken. |
| "The 26 failures are NOT mock defects" | **FALSE.** Every one is a mock defect. See below. |
| "No further mock edit will change these outcomes" | **FALSE.** All 26 are fixable in the mocks. |

The report's numbers (`26 failed / 75 passed`, `101 total`) are correct — I reproduce them exactly. Its *interpretation* is wrong, and it stopped before doing the work.

## Root causes

### A. `tests/gallery-data-layer.test.ts` — incomplete refactor

The "install with generated id" edit was written but not finished. Three defects:

1. `insertPayloads` is referenced at line 134 inside `install()` but declared at line 30 inside `makeQuery()` — **out of scope**. → `ReferenceError: insertPayloads is not defined`
2. `insertedRows` same problem: used at line 142, declared inside `makeQuery()`, never returned by it.
3. `installWithGeneratedId()` (line 424) **does not exist**. Should be `install()`.
4. `handles` (line 121) omits `insertPayloads`, so line 295–297 fail even after #1 is fixed.
5. Line 119 destructures `rows` twice (`rows: dbRows, rows: queryRows`) — legal JS, both alias the same array, but it is confusing and hides that the `insert` override pushes into both.

### B. `tests/gallery-upload.test.ts` — mock does not match production

1. **Line 105**: `calls.push({ method: 'select', args: cols })` — `cols` is `string`, `args` is `unknown[]`. Production passes `'id, src, caption, ...'` (a comma string). Type error + the recorded shape is wrong.
2. **`handles` / `rows` never assigned.** `install()` returns the handles but the module-level `rows` (line 198) and `handles` (line 200) are only ever set to `undefined`. Tests read `handles.insertCalls` → `TypeError: Cannot read properties of undefined`.
   → This alone breaks tests at lines 312, 327, 373, 385, 399, 428, 430, 547, 557, 593, 615, 636, 686, 687, 699, 724, 729…
3. **`install()` does not seed the default row.** Line 205 default is `[]`, and the beforeEach calls `install()` with no args — but `EXISTING` (line 184) is defined and never used. So `/api/gallery/1` reads an empty table → `404` where `200`/`500` is expected. This is the "router boundary returns 404" the report blamed on a missing DB migration.
4. **`single()` returns the raw insert payload** (`insertedRows[...]`, line 103), which has `alt_text`, not `alt`. Production's `createGalleryEntry` returns that raw row as `GalleryImage`. Real Postgres `RETURNING` yields `alt_text`, so production's contract is genuinely wrong — but the immediate test failure ("Value is not JSON serializable") is the *raw row being fed to `NextResponse.json`* because `createGalleryEntry` returns it un-mapped.
5. **`storage.instance` type** — `remove: vi.fn(async (keys: string[]) => ...)` vs the injected `failingStorage` shape at line 602 (`{ error: {...} }`); `storage.instance.remove = ... as never` is a cast that papers over the mismatch.

## Production defect found (real, not test-only)

`lib/gallery-data.ts:335` — `return data as GalleryImage`.

`data` from `.insert().select().single()` is a **`GalleryMetadataRow`** (`alt_text`, `is_published`, `created_at`, `updated_at`), cast to `GalleryImage` which requires `alt`. TypeScript flags it (TS2352). At runtime the created record has **no `alt` field** and carries raw DB columns — so the API returns `alt_text` to the client and the admin UI's `alt` is `undefined`.

Fix: map the returned row through `mapAltTextToAlt` (the single mapping function the module already owns), and fail loudly rather than cast.

This is the one production change in scope. It is a genuine correctness bug, not test scaffolding.

## What I will do

1. Fix `lib/gallery-data.ts` to map the returned row (production bug).
2. Repair `tests/gallery-data-layer.test.ts` (scope + missing helper).
3. Repair `tests/gallery-upload.test.ts` (typing, `handles`/`rows` wiring, default seed, storage typing).
4. Re-run `tsc` + `vitest`; prove tests have teeth by reverting each production fix and confirming failure.
