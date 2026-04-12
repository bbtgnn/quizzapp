---
phase: 03-session-engine-aggregate-scoring
plan: 01
subsystem: session-engine
tags: [session-engine, aggregate-scoring, resumable-state, dexie]

requires:
  - phase: 02-indexeddb-persistence
    provides: one-row logical question persistence and session repository contracts
provides:
  - SessionEngine-owned logical-unit progression with authoritative step getters
  - Aggregate one-attempt scoring for completed logical units
  - Resumable in-progress active logical-unit state persistence
affects: [phase-03-plan-02, run-ui, session-repository]

tech-stack:
  added: []
  patterns: [engine-owned progression state, normalized step outcomes, aggregate-at-completion]

key-files:
  created: []
  modified:
    - src/lib/model/types.ts
    - src/lib/ports/session-engine-persistence.ts
    - src/lib/app/session-engine-persistence.ts
    - src/lib/domain/session-engine/index.ts
    - src/lib/domain/session-engine/session-engine.test.ts
    - src/lib/ports/session-repository.ts
    - src/lib/adapters/persistence/dexie/repositories/sessions.ts
    - src/lib/application/sessions/sessions.service.test.ts

key-decisions:
  - "SessionEngine normalizes per-step outcomes to correct/wrong and computes aggregate only at unit completion."
  - "active_unit_progress is required on Session records and initialized to null at session creation."

patterns-established:
  - "Logical-unit progression: current root + currentStepIndex + stepOutcomes"
  - "Exactly one Attempt persisted per completed logical question root id"

requirements-completed: [SESS-01, SESS-02, SESS-03, SESS-04]
duration: 39 min
completed: 2026-04-09
---

# Phase 03 Plan 01: Session engine aggregate scoring summary

**SessionEngine now owns linear logical-unit progression with resumable active state and emits one aggregate Attempt per completed unit.**

## Performance

- **Duration:** 39 min
- **Started:** 2026-04-09T12:27:00Z
- **Completed:** 2026-04-09T13:06:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Added `Session.active_unit_progress` plus engine persistence contract methods to store/clear resumable unit state.
- Reworked `SessionEngine` to expose authoritative `currentStep`, `currentStepIndex`, and `totalSteps`, with forward-only step progression.
- Implemented aggregate mapping (`all correct -> correct`, `all wrong -> wrong`, mixed -> `partial`) and one-attempt-at-completion semantics.
- Replaced chain-era tests with logical-unit coverage: aggregate matrix, resume behavior, skip semantics, and D-14 completion behavior.

## Task Commits

1. **Task 1: Define resumable logical-unit engine contracts** - `424b447` (feat)
2. **Task 2: Rewrite SessionEngine progression and aggregate outcome semantics** - `260d18e` (feat)
3. **Task 3: Replace chain-era tests with logical-unit aggregate/resume coverage** - `c01527b` (test)

## Files Created/Modified

- `src/lib/model/types.ts` - Added required `active_unit_progress` state on `Session`.
- `src/lib/ports/session-engine-persistence.ts` - Added persist/clear active unit contract.
- `src/lib/app/session-engine-persistence.ts` - Wired active unit state persistence calls to session repository updates.
- `src/lib/domain/session-engine/index.ts` - Implemented logical-unit authority, aggregate scoring, resume/skip handling.
- `src/lib/domain/session-engine/session-engine.test.ts` - Replaced with logical-unit regression scenarios.
- `src/lib/ports/session-repository.ts` - Updated create-session contract for required `active_unit_progress`.
- `src/lib/adapters/persistence/dexie/repositories/sessions.ts` - Initialize `active_unit_progress` to `null` on session creation.
- `src/lib/application/sessions/sessions.service.test.ts` - Updated Session fixtures for required field.

## Decisions Made

- Step-level `partial` is not used in v1 aggregation input; engine normalizes non-`correct` inputs to `wrong` for per-step progression.
- Unit skip consumes the active logical unit without creating an `Attempt`, and state is cleared immediately.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Session creation contracts broke after making `active_unit_progress` required**
- **Found during:** Task 3 verification (`bun run check`)
- **Issue:** Existing `SessionRepository.createSession` and tests did not supply new required state field.
- **Fix:** Updated repository port + Dexie session creation defaults and adjusted test fixtures.
- **Files modified:** `src/lib/ports/session-repository.ts`, `src/lib/adapters/persistence/dexie/repositories/sessions.ts`, `src/lib/application/sessions/sessions.service.test.ts`
- **Verification:** `bun run check` passed after updates.
- **Committed in:** `c01527b`

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** No scope creep; fix was required to keep the new contract type-safe and compilable.

## Issues Encountered

- Initial verification failed because chain-era tests expected old behavior; resolved by replacing tests with logical-unit expectations from this phase plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Ready for `03-02-PLAN.md` UI wiring against engine-owned step progression.
- Engine now exposes stable progression state needed by run-route integration.

## Self-Check: PASSED

- Confirmed task commits exist in git history: `424b447`, `260d18e`, `c01527b`.
- Confirmed verification commands passed:
  - `bun run test:unit -- --run src/lib/domain/session-engine/session-engine.test.ts`
  - `bun run check`
