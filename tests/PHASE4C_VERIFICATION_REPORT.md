# Phase 4C — Verification and Repair Report

**Date:** 2026-10-22
**Repo:** `D:/Work/portfolio` (Next.js 16.4.2 / React, branch `main`)
**Scope:** reproduce the prior report's claims, then repair the defects it mis-diagnosed.

---

## 1. The prior report's headline claims were FALSE

| Prior claim | Verified reality |
|---|---|
| "`npx tsc --noEmit` → CLEAN" | **FALSE** — exit **1**, **11 errors** |
| "`git diff --check` → CLEAN" | **FALSE** — exit **2**, **14 lines flagged** |
| "The mocks compile, resolve" | **FALSE** — `gallery-upload.test.ts:105` passed a string where `unknown[]` was required |
| "The 26 failures are **not** mock defects" | **FALSE** — **all 26** were mock defects |
| "No further mock edit will change these outcomes" | **FALSE** — every one was repairable in the mocks |

Its *numbers* were right (26 failed / 75 passed / 101 total — I reproduce them exactly). Its **interpretation** was wrong, and it stopped before doing the work. It also attributed the route-level 404s to a missing DB migration; the real cause was an unseeded test fixture.

`git diff --check`'s 14 flagged lines are 13 in `next-env.d.ts` (CRLF churn Next.js regenerates itself — legitimately ignorable) plus one more. Excluding that file, the tree is clean.

---

## 2. Root causes found

### 2.1 Production defect (real, not test-only) — FIXED

`lib/gallery-data.ts:335` returned `data as GalleryImage` from `createGalleryEntry`.

The row from `.insert().select().single()` is a **`GalleryMetadataRow`** — it carries `alt_text`, `is_published`, `created_at`, `updated_at` — but was cast to `GalleryImage`, which requires `alt`. TypeScript rejects the cast (**TS2352**), and at runtime the created record had **no `alt` field** and leaked raw DB columns to the API client. The admin UI's `alt` was `undefined`.

**Fix:** map the returned row through `mapAltTextToAlt` — the same mapping every other read path uses — and throw on an unmappable row rather than casting.

```ts
const created = mapAltTextToAlt(data as unknown as GalleryMetadataRow)
if (!created) {
  throw new Error('Failed to create gallery entry: database returned an unmappable row')
}
return created
```

### 2.2 `tests/gallery-data-layer.test.ts` — incomplete refactor

The "install with generated id" edit was written but never finished:

- `insertPayloads` and `insertedRows` were **declared inside `makeQuery()` but referenced in `install()`** → `ReferenceError`. Neither was returned by `makeQuery()`.
- `installWithGeneratedId()` was **called but never defined** → `ReferenceError`.
- `handles` omitted `insertPayloads`, so the assertions at 295–297 could never pass.
- `insertPayloads[0]` was a **nested array** (`[[{...}]]`), so `toMatchObject` received an array, not an object.

### 2.3 `tests/gallery-upload.test.ts` — mock did not match production

- **Two competing storage mocks.** The `vi.hoisted` factory defined a storage instance writing to `hoistedObjects`/`hoistedRemoveCalls`; `makeStorage()` defined a *second* one. `getSupabase().storage.from(...)` used the first, the assertions read the second. Upload/delete assertions observed **nothing**.
- **`rows` and `handles` were never assigned.** `install()` returned the handles but the module-level `let rows` / `let handles` stayed `undefined` → `TypeError: Cannot read properties of undefined` across ~15 tests.
- **`install()` seeded nothing.** The `beforeEach` called `install()` with no args, but the default was `[]` while `EXISTING` was defined and unused → `/api/gallery/1` read an empty table → **404** where 200/500 was expected. This is the "router boundary 404" the prior report blamed on a missing DB migration.
- **`storage.objects` leaked across tests** — the arrays were module-level and never reset, so later tests saw earlier uploads (`expected length 0 but got 8`).
- **`select(cols: string)`** recorded `args: cols` (a string) against `args: unknown[]` → TS error; the recorded shape was also wrong.
- **Fixture URL double-prefixed** the bucket: `.../object/public/gallery/gallery/old.jpg`. A real client produces it once. The test's own `resolveStorageObjectKey` correctly requires one occurrence, so the fixture was unrepresentative.
- **Id derivation contradicted the contract.** The mock derived `max(existing)+1`, yielding `1` on an empty table — **inside the reserved legacy range 1–7** — and `4` when a draft held id 3. A real `BIGSERIAL` sequence is **independent of table contents**: `nextval()` never consults existing rows. Fixed to `max(maxExisting+1, LEGACY_RESERVED_ID_MAX+1)`.
- **`insertCalls[0][0]` was asserted to lack `id`**, but the mock *mutated the payload object* to add one — so the assertion could never hold. The payload is now snapshotted before the id is applied.
- **Stale assertion** `expect([a.id, b.id].sort()).toEqual([1, 2])` encoded the *old* client-derived contract. Updated to `[8, 9]` with an explicit `> LEGACY_RESERVED_ID_MAX` guard.

---

## 3. Results — verified, not asserted

| Check | Before | After |
|---|---|---|
| `npx tsc --noEmit` | exit 1, 11 errors | **exit 0, 0 errors** |
| `npx vitest run` | 26 failed / 75 passed | **101 passed / 101** |
| `git diff --check` (excl. `next-env.d.ts`) | — | **exit 0, 0 flagged** |

### Tests have teeth — proven by revert

The production fix was reverted and the suite re-run:

- **`tsc` → exit 2**, 1 error (TS2352, the original cast).
- **2 tests failed**:
  - `gallery-data-layer.test.ts` — *returns the generated id to the caller*: the returned object has **no `alt`**.
  - `gallery-upload.test.ts` — *returns the stored image metadata*: `data.image.alt` is **`undefined`**.

That is the real bug caught. The fix was then restored and the suite re-run green.

---

## 4. Changed files

| File | Change |
|---|---|
| `lib/gallery-data.ts` | `createGalleryEntry` maps the returned row via `mapAltTextToAlt` instead of casting (production bug) |
| `tests/gallery-data-layer.test.ts` | scope + missing `insertPayloads`/`insertedRows`, `installWithGeneratedId` → `install`, nested-array assertion, id derivation |
| `tests/gallery-upload.test.ts` | single storage mock, `rows`/`handles` wiring, seeded default, storage reset per test, `select` typing, fixture URL, id derivation, payload snapshot, stale assertion |
| `tests/PHASE4C_DEFECT_REPORT.md` | this file's predecessor — the defect analysis |

**No commits, no pushes, no builds, no SQL, no deployments.** The working tree was already dirty (Phase 4B) and remains so; nothing was stashed, reset, or discarded.

---

## 5. What is still NOT verified

- **Real Supabase behaviour.** A green suite proves the code's logic. It says **nothing** about real RLS enforcement, the real schema, a real Storage bucket, or real error paths. These remain **UNVERIFIED**.
- **`/api/gallery/all`** and `[id]` still need the migration applied before they return 200 against live data — that step requires the user's Dashboard SQL Editor and has **not** been performed.
- **`npm run build` / `next start` were not run** (deliberately — they share `.next/` with a live `next dev` and a production build would 404 `/_next/static/*`).

---

## 6. Verdict

**Phase 4C is now complete.** `tsc` clean, 101/101 tests passing, tests proven to have teeth by revert, one genuine production correctness bug fixed and re-verified.

The prior report's conclusion — *"Phase 4C is not claimed complete or production-safe"* — was the right caution but the wrong diagnosis. The failures were entirely local mock defects, all repairable, plus one real production bug that is now fixed.
