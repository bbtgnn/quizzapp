# Phase 3: Session engine & aggregate scoring - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves alternatives considered.

**Date:** 2026-04-09
**Phase:** 03-session-engine-aggregate-scoring
**Areas discussed:** Pool semantics & draw lifecycle, Step progression authority & state shape, Aggregate scoring, Attempt recording timing & payload contract, Session end conditions

---

## Pool semantics & draw lifecycle

| Option | Description | Selected |
|--------|-------------|----------|
| Consume at first step shown | Drawn unit is immediately consumed | ✓ |
| Consume at final completion | Unit consumed only when fully finished | |
| Consume at first answer submission | Unit consumed once interaction begins | |
| Other | Custom policy | |

**User's choice:** Consume at first step shown.
**Notes:** User prioritized predictable teacher-facing flow (`drawn = consumed`).

| Option | Description | Selected |
|--------|-------------|----------|
| Resume same unit at same step | Continue interrupted unit exactly where paused | ✓ |
| Restart unit from step 1 | Reset unit progression on resume | |
| Abandon current unit and draw new | Discard interrupted unit | |
| Other | Custom policy | |

**User's choice:** Resume same unit at same step.
**Notes:** Resume continuity preferred.

| Option | Description | Selected |
|--------|-------------|----------|
| No Attempt recorded | Only completed units create attempts | ✓ |
| Record as wrong | Skip treated as wrong outcome | |
| Record as partial | Skip treated as partial outcome | |
| Other | Custom policy | |

**User's choice:** No Attempt recorded for skipped unit.
**Notes:** User requested clarification of "unit"; clarified as one logical question with internal steps.

| Option | Description | Selected |
|--------|-------------|----------|
| No reinsertion | Skipped drawn unit never appears again in session | ✓ |
| Manual requeue only | Teacher can explicitly reinsert | |
| Auto-requeue later | Engine may bring skipped unit back | |
| Other | Custom policy | |

**User's choice:** No reinsertion in same session.
**Notes:** Maintains consistency with consumed-on-draw decision.

---

## Step progression authority & state shape

| Option | Description | Selected |
|--------|-------------|----------|
| SessionEngine only | Engine owns step/progress state | ✓ |
| UI-owned with sync | UI has step index and syncs with engine | |
| Hybrid | Split authority between engine and UI | |
| Other | Custom policy | |

**User's choice:** SessionEngine only.
**Notes:** Aligns with roadmap requirement of no competing source of truth.

| Option | Description | Selected |
|--------|-------------|----------|
| `currentStepIndex` + `totalSteps` + `currentStep` | Minimal explicit progress contract | ✓ |
| Only `currentStep` | UI infers index and totals | |
| Full progress object with history | Rich contract including answered history | |
| Other | Custom policy | |

**User's choice:** Expose index + total + current step.
**Notes:** Clear k-of-n rendering while keeping contract compact.

| Option | Description | Selected |
|--------|-------------|----------|
| No backward navigation | Strict linear progression | ✓ |
| Back before submit only | Allow limited backtracking | |
| Back anytime before completion | Free step navigation | |
| Other | Custom policy | |

**User's choice:** No backward navigation.
**Notes:** Linear progression locked.

---

## Aggregate scoring

| Option | Description | Selected |
|--------|-------------|----------|
| Mixed outcomes -> `partial` | Any correct+wrong mix results in partial | ✓ |
| Mixed outcomes -> `wrong` | Strict pass/fail at unit level | |
| Configurable per session | Teacher/session chooses behavior | |
| Other | Custom policy | |

**User's choice:** Mixed -> `partial`.
**Notes:** Matches milestone requirement.

| Option | Description | Selected |
|--------|-------------|----------|
| Equal step weight | Uniform contribution across steps | ✓ |
| Weighted steps now | Different step influence in v1 | |
| Configurable per question set | Set-specific weighting | |
| Other | Custom policy | |

**User's choice:** Equal weight in v1.
**Notes:** Advanced weighting deferred.

| Option | Description | Selected |
|--------|-------------|----------|
| Single-step uses direct outcome | Aggregate mirrors the single step | ✓ |
| Force binary behavior | Restrict single-step aggregation behavior | |
| Special-case logic | Custom single-step matrix | |
| Other | Custom policy | |

**User's choice:** Single-step aggregate equals step outcome.
**Notes:** Keeps scoring model uniform.

---

## Attempt recording timing & payload contract

| Option | Description | Selected |
|--------|-------------|----------|
| Persist on completion only | Write one final attempt at unit completion | ✓ |
| Persist every step then merge | Intermediate attempt writes | |
| Persist early and update | Draft-style attempt lifecycle | |
| Other | Custom policy | |

**User's choice:** Persist only on completion.
**Notes:** Keeps one-attempt-per-unit invariant.

| Option | Description | Selected |
|--------|-------------|----------|
| Keep current attempt payload | Logical `question_id` + aggregate outcome + existing fields | ✓ |
| Add per-step outcomes now | Extend payload in Phase 3 | |
| Aggregate + optional step trace blob | Mixed payload expansion | |
| Other | Custom policy | |

**User's choice:** Keep current payload contract.
**Notes:** Per-step payload details deferred.

| Option | Description | Selected |
|--------|-------------|----------|
| Persist engine/session progress only | No attempt until completion | ✓ |
| Draft attempts | Save incomplete attempts mid-unit | |
| Persist nothing mid-unit | No mid-unit persistence at all | |
| Other | Custom policy | |

**User's choice:** Persist session/engine progress only.
**Notes:** Supports resume continuity without violating one-attempt rule.

---

## Session end conditions

| Option | Description | Selected |
|--------|-------------|----------|
| Pool exhaustion completion | Complete when no drawable units remain | |
| Student assignment coverage completion | Complete when every student answered assigned questions | ✓ |
| Manual-only completion | Teacher explicitly ends session | |
| Other | Custom policy | |

**User's choice:** Student assignment coverage completion.
**Notes:** User corrected default framing and emphasized teacher-controlled session flow.

| Option | Description | Selected |
|--------|-------------|----------|
| Teacher manually selects next student | Full manual transition | |
| Engine auto-selects next student | Strategy-driven automatic selection | ✓ |
| Engine suggests, teacher confirms | Mixed control flow | |
| Other | Custom policy | |

**User's choice:** Engine auto-selects next student.
**Notes:** Clarified that teacher is still in control of session progression actions.

| Option | Description | Selected |
|--------|-------------|----------|
| Engine auto-draws next logical unit | Strategy-driven automatic draw | ✓ |
| Teacher manually picks next unit | Manual question selection | |
| Engine suggests then teacher confirms | Mixed policy | |
| Other | Custom policy | |

**User's choice:** Engine auto-draws next logical unit.
**Notes:** User explicitly deferred exact policy details ("We'll decide policies later").

---

## Claude's Discretion

- Internal strategy policy details and tie-break specifics can be finalized during planning.

## Deferred Ideas

- Detailed policy tuning for student/order and question/draw strategies.
