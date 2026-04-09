# Phase 3: Session engine & aggregate scoring - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver live-session engine behavior where each logical question is one draw/completion unit, step progression is owned by `SessionEngine`, aggregate scoring resolves to `correct`/`partial`/`wrong`, and exactly one `Attempt` is recorded per completed logical unit.

</domain>

<decisions>
## Implementation Decisions

### Pool semantics & draw lifecycle
- **D-01:** A logical unit is consumed when its first step is shown (`drawn = consumed`).
- **D-02:** If paused/reloaded mid-unit, resume the same logical unit at the same step.
- **D-03:** If a teacher skips a unit mid-way, record no `Attempt` because only completed units produce attempts.
- **D-04:** Skipped units are not reinserted in the same session.

### Step progression authority & engine state
- **D-05:** `SessionEngine` is the only source of truth for current step/progress; UI must render engine state only.
- **D-06:** Engine exposes `currentStepIndex`, `totalSteps`, and derived `currentStep` for UI progression.
- **D-07:** Step progression is strictly linear; no backward navigation across steps.

### Aggregate scoring
- **D-08:** Mixed step outcomes map to aggregate `partial`.
- **D-09:** v1 uses equal weight per step (no weighted aggregation).
- **D-10:** Single-step units use the step outcome directly as the aggregate result.

### Attempt recording contract
- **D-11:** Persist one `Attempt` only when a logical unit is completed.
- **D-12:** Keep the current attempt payload contract in Phase 3: logical `question_id`, aggregate `outcome`, and existing attempt fields (no per-step payload extension yet).
- **D-13:** During paused mid-unit state, persist session/engine progress only; do not persist draft attempts.

### Session flow & completion
- **D-14:** Session completion condition: every student has answered their assigned questions.
- **D-15:** Runtime model is single-lane: one active student and one active logical question at a time.
- **D-16:** When active student completes assigned workload, engine auto-selects next student by strategy; teacher remains in control of proceeding.
- **D-17:** Next logical unit is auto-drawn by engine strategy; exact policy tuning can be decided during planning/implementation.

### Claude's Discretion
- Exact strategy policies and tie-break rules for student rotation and question draw (while honoring locked teacher-control and single-active-lane constraints).
- Internal state representation details and helper abstractions that expose the locked engine contract cleanly.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements and phase contract
- `.planning/REQUIREMENTS.md` — SESS-01, SESS-02, SESS-03, SESS-04 constraints for Phase 3
- `.planning/ROADMAP.md` — Phase 3 goal and success criteria
- `.planning/PROJECT.md` — milestone decisions and non-goals relevant to runtime/session behavior

### Prior phase decisions
- `.planning/phases/01-domain-model-import-contract/01-CONTEXT.md` — logical question + steps contract
- `.planning/phases/02-indexeddb-persistence/02-CONTEXT.md` — one row per logical question and `Attempt.question_id` semantics

### Session engine and persistence integration code
- `src/lib/domain/session-engine/index.ts` — authoritative runtime flow and progression logic
- `src/lib/ports/session-engine-persistence.ts` — persistence boundary for engine state transitions
- `src/lib/app/session-engine-persistence.ts` — adapter wiring for persisted session/attempt effects
- `src/lib/ports/attempt-repository.ts` — persisted attempt contract
- `src/lib/ports/session-repository.ts` — session state lifecycle contract
- `src/lib/domain/question-selector/registry.ts` — question draw strategy registry
- `src/lib/domain/student-orderer/registry.ts` — student ordering strategy registry
- `src/routes/sessions/[id]/run/+page.svelte` — current run UI integration point with engine state

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `SessionEngine` class and strategy registries already centralize session progression decisions.
- `SessionEnginePersistence` port cleanly supports persisting session/attempt side effects without UI authority.
- Run route (`src/routes/sessions/[id]/run/+page.svelte`) already binds to engine output and can remain a rendering layer.

### Established Patterns
- Domain-owned runtime logic with injected persistence port is the standard pattern for mutable session behavior.
- Repositories/ports separate domain logic from Dexie adapter specifics.
- Existing outcome enum (`correct` | `partial` | `wrong`) already matches aggregate scoring target.

### Integration Points
- Engine progression changes in `src/lib/domain/session-engine/index.ts`.
- Attempt creation timing in engine persistence flow (`src/lib/app/session-engine-persistence.ts` and attempt repository usage).
- UI progression display from engine-exposed state in `src/routes/sessions/[id]/run/+page.svelte`.

</code_context>

<specifics>
## Specific Ideas

- Teacher is in control of session flow and advancement decisions.
- Runtime must maintain one active student and one active logical question at a time.
- Session completion should reflect student assignment coverage, not only pool exhaustion.

</specifics>

<deferred>
## Deferred Ideas

- Exact strategy policy definitions (e.g. fairness heuristics, tie-break ordering) can be finalized during planning.

### Reviewed Todos (not folded)

_None._

</deferred>

---

*Phase: 03-session-engine-aggregate-scoring*
*Context gathered: 2026-04-09*
