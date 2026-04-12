---
phase: 02-indexeddb-persistence
reviewed: 2026-04-09T00:00:00Z
depth: standard
files_reviewed: 15
files_reviewed_list:
  - src/lib/model/types.ts
  - src/lib/ports/question-set-repository.ts
  - src/lib/adapters/persistence/dexie/schema.ts
  - src/lib/adapters/persistence/dexie/repositories/question-sets.ts
  - src/lib/adapters/persistence/dexie/schema.test.ts
  - src/lib/application/question-sets/persist-question-set.ts
  - src/lib/application/question-sets/persist-question-set.test.ts
  - src/lib/importer/index.ts
  - src/lib/importer/index.test.ts
  - src/routes/question-sets/import/+page.svelte
  - src/routes/+layout.svelte
  - src/routes/+layout.ts
  - src/routes/layout-upgrade-notice.test.ts
  - README.md
  - CHANGELOG.md
findings:
  critical: 0
  warning: 2
  info: 1
  total: 3
status: issues_found
---

# Phase 02: Code Review Report

**Reviewed:** 2026-04-09T00:00:00Z  
**Depth:** standard  
**Files Reviewed:** 15  
**Status:** issues_found (advisory, non-blocking)

## Summary

Reviewed the files scoped by plans `02-01`, `02-02`, and `02-03`, including implementation, tests, and phase docs. The logical-question persistence refactor is mostly coherent and tests cover key contract shifts. Two warnings remain around upgrade-notice correctness and v3 upgrade data-shape safety; both are fixable with small, targeted changes.

Note: `src/lib/importer/logical-to-parsed-question-set.ts` and `src/lib/importer/parsed-types.ts` are no longer present, which appears consistent with the phase goal to remove legacy bridge usage.

## Warnings

### WR-01: Upgrade notice is shown to fresh installs, not only upgrade users

**File:** `src/routes/+layout.ts:11-24`  
**Issue:** `shouldShowUpgradeNotice()` only checks for absence of `quizzapp-upgrade-notice-v3-seen`. On a first-ever visit (no prior data, no upgrade), this still returns true and surfaces an upgrade-reset warning that is not applicable.  
**Fix:** Gate notice by upgrade detection, not marker absence alone. Example: store last seen schema version (e.g., `quizzapp-schema-version`) and show notice only when previous version exists and is `< 3`.

```ts
const VERSION_KEY = 'quizzapp-schema-version';
const prev = storage?.getItem(VERSION_KEY);
const hasUpgradedToV3 = prev !== null && Number(prev) < 3;
const showUpgradeNotice = hasUpgradedToV3 && storage?.getItem(NOTICE_STORAGE_KEY) === null;
storage?.setItem(VERSION_KEY, String(SCHEMA_MAJOR_VERSION));
if (showUpgradeNotice) storage?.setItem(NOTICE_STORAGE_KEY, '1');
```

### WR-02: v3 schema upgrade does not enforce clean break for legacy rows

**File:** `src/lib/adapters/persistence/dexie/schema.ts:45-51`  
**Issue:** v3 migration comments state old chain-era data is discarded, but the `upgrade` callback does not clear/transform existing `questions` records. Legacy rows without `steps` can survive and later break consumers that assume `Question.steps` exists (e.g., chain assembly logic relying on `rootQ.steps.map(...)`).  
**Fix:** Make the wipe policy explicit in code during v3 upgrade (or migrate rows). Since this phase accepts no migration, clear `questions` in v3 upgrade.

```ts
this.version(3)
  .stores({ questions: 'id, question_set_id' })
  .upgrade(async (tx) => {
    await tx.table('questions').clear();
  });
```

## Info

### IN-01: Schema version constant is not used in notice-key construction

**File:** `src/routes/+layout.ts:6-7`  
**Issue:** `SCHEMA_MAJOR_VERSION` is exported but `NOTICE_STORAGE_KEY` is hardcoded to `...v3...`, creating a drift risk when schema version changes.  
**Fix:** Derive the key from `SCHEMA_MAJOR_VERSION` to keep behavior aligned automatically.

---

_Reviewed: 2026-04-09T00:00:00Z_  
_Reviewer: Claude (gsd-code-reviewer)_  
_Depth: standard_  
