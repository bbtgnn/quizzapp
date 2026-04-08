# Architecture Research

**Domain:** Browser-only teacher quiz app — logical questions with internal multi-step playout  
**Researched:** 2026-04-09  
**Confidence:** HIGH for boundaries and data flow (grounded in `.planning/codebase/ARCHITECTURE.md` and current `SessionEngine` / importer code); MEDIUM for exact step-schema shapes (product still evolving per question *kind*).

## Standard Architecture

### System Overview

Brownfield **SvelteKit + Dexie** app keeps **hexagonal persistence** and a **pure SessionEngine**. The milestone replaces **many physical rows per logical unit** (`chain_parent_id` / `chain_order`) with **one persisted logical question** whose **steps** are structured data inside that unit. Selection, slot consumption, and **Attempt** rows stay keyed by **logical question id** — not by step.

```
┌────────────────────────────────────────────────────────────────────────────┐
│ Presentation (routes + components)                                          │
│  Import UI ──► Run UI (binds to engine.currentLogicalQuestion + step index) │
└───────────────────────────────────┬──────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────────┐
│ Application                                                                  │
│  persistQuestionSet(parsed) ──► QuestionSetRepository (1 row / logical Q)   │
│  loaders: merge Question[] from sets ──► unchanged pattern, new shape        │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────────┐
│ Domain                                                                       │
│  SessionEngine: pick LOGICAL question → advance INTERNAL steps → aggregate  │
│       │                     │                         │                      │
│       └─────────────────────┴─────────────────────────┴──► SessionEnginePersistence
│                              (createAttempt uses logical question_id only)    │
└───────────────────────────────────┬────────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────────┐
│ Ports ◄──────────────────────── Adapters (Dexie)                             │
│  QuestionSetRepository / AttemptRepository / SessionEnginePersistence       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical implementation |
|-----------|----------------|------------------------|
| **Importer** (`src/lib/importer/`) | Validate file JSON; produce **one parsed object per logical question** with embedded `steps` (or kind-specific payload). No flattening to child rows. | Pure functions → `ParsedQuestionSet` (evolve types). |
| **Application — persist** (`persist-question-set.ts`) | Map parsed logical questions to repository **create** calls; **one persistence operation per logical unit** (or one `put` of nested structure). | Thin orchestration; no chain expansion. |
| **QuestionSetRepository + Dexie adapter** | Store and load **logical questions**; index by `question_set_id` (and `id`). Drop index dependency on `chain_parent_id` in favor of flat `questions` per set. | `EntityTable<LogicalQuestion,'id'>` with `steps` serialized (array / JSON column). |
| **SessionEngine** | **Pool = logical questions only.** In-memory **step cursor** + **per-step outcomes** for the active unit; on last step, **aggregate** → single `createAttempt`; then **consume slot** as today. | Replace `_chainQuestions` with a **step runner** over `currentLogicalQuestion.steps`. |
| **Run UI** | Render **current step** (text, content slice, answer controls) from engine-exposed **logical question + step index**; keyboard shortcuts unchanged in spirit (grade **current step**). | `$derived` from engine getters; small presenters per `answer.type`. |
| **SessionEnginePersistence** | Unchanged **surface**: still `createAttempt({ question_id, outcome, ... })` where `question_id` is the **logical** id. | No new port methods required for v1 table-stakes aggregation. |

## Recommended Project Structure

No wholesale folder move is required. Evolve types and responsibilities **in place**:

```
src/lib/
├── model/types.ts              # LogicalQuestion, Step union, remove chain_* from Question
├── importer/index.ts           # Parse nested steps / kinds; output matches model
├── application/question-sets/
│   └── persist-question-set.ts # One create per logical question
├── ports/question-set-repository.ts
├── adapters/persistence/dexie/
│   ├── schema.ts               # questions index: id, question_set_id (drop chain_parent_id)
│   └── *-repository.adapter.ts
└── domain/session-engine/
    └── index.ts                # Step iteration + aggregation (extract helper if >1 kind)
```

### Structure Rationale

- **Model first:** Importer, Dexie, engine, and UI all consume the same **logical-question** shape; avoids translation layers between “parsed” and “stored.”
- **SessionEngine stays UI-free:** Step navigation and aggregation remain domain rules; UI only reflects `currentStep` and calls `recordOutcome`.
- **Ports stable:** Keeps existing test doubles and minimizes ripple through `session-engine-persistence.ts`.

## Architectural Patterns

### Pattern 1: Logical question as session aggregate

**What:** The **identity** that question-selection strategies and `_askedThisSession` operate on is the **logical question id**. Steps have **no stable id** in the session/attempt model for v1 (optional later for analytics).

**When to use:** Always for this milestone — matches “one unit in the pool and in the author’s mental model.”

**Trade-offs:** Pros: simpler repository queries, import matches runtime. Cons: schema for `steps` must be versioned carefully; large blobs in one row (acceptable for teacher-scale sets in IndexedDB).

**Example:**

```typescript
// Conceptual — not prescriptive naming
interface LogicalQuestion {
	id: string;
	question_set_id: string;
	kind: 'simple' | 'code-highlights' | /* … */;
	// shared stem, optional shared content
	content: ContentConfig;
	steps: Array<{
		prompt: string;
		contentOverlay?: /* kind-specific, e.g. highlight range */;
		answer: AnswerConfig;
	}>;
}
```

### Pattern 2: Step playout state inside SessionEngine (ephemeral)

**What:** Mirror today’s `_chainIndex` / `_chainOutcomes` with **`_activeLogicalQuestion`**, **`_stepIndex`**, **`_stepOutcomes`**. On `_pickQuestion`, if the picked question has `steps.length > 1` (or always normalize single-step as length 1), initialize runner state.

**When to use:** Live run loop; same as current chain behavior.

**Trade-offs:** **Pause mid-unit** is still fragile: engine is reconstructed from server `load` data (`+page.svelte` `$effect`), and **step index is not persisted** — returning to a paused session may restart the unit from step 1 (same class of issue as today’s mid-chain pause). Mitigation is a **future** phase (persist progress on `SessionStudent` or session state), not required by current PROJECT.md.

### Pattern 3: Importer as the single JSON → domain gate

**What:** All new JSON shapes are validated only in the importer; persistence trusts validated types. Bundled `question-sets/` are updated to the new format.

**When to use:** Import pipeline only — avoids duplicate validation in adapters.

**Trade-offs:** Clear boundary; importer tests become the contract for file format.

## Data Flow

### End-to-end: Importer → persistence → SessionEngine → run UI

```
[JSON file]
    ↓ parse + validate
ParsedQuestionSet { questions: LogicalQuestionDraft[] }   // one entry per author "question"
    ↓ persistQuestionSet
QuestionSetRepository.createQuestion(setId, logicalQuestion)   // one IndexedDB row per entry
    ↓ run page load
allQuestions: LogicalQuestion[]   // merged from selected sets (same as today, new shape)
    ↓ new SessionEngine(...)
_pickQuestion() → selector picks one logical id → init step runner (0..steps.length-1)
    ↓ user grades step
recordOutcome(outcome) → append to _stepOutcomes
    ↓ if more steps
advance _stepIndex, expose current step to UI
    ↓ if last step
aggregate _stepOutcomes → createAttempt({ question_id: logicalId, outcome })
    ↓
_consumeSlot → next student or next question
```

### Key Data Flows

1. **Import:** File → importer DTO → **no fan-out rows** → Dexie stores nested `steps` inside the question record.
2. **Selection:** `SessionEngine` filters **all** loaded questions (no `chain_parent_id === null`); optional: exclude by difficulty later — same hooks as today.
3. **Grading:** Each keypress/button applies to **current step**; persistence writes **one Attempt per logical question per student turn**, not per step.
4. **UI binding:** Components read **logical** `content` + **current** `step.prompt` / `step.answer` / overlays — engine exposes `stepProgress: { current, total } | null` (rename from `chainProgress`).

### State Management

- **Load data:** Unchanged — SvelteKit `load` supplies session, students, **logical** questions, attempts.
- **Ephemeral run state:** Step index and partial outcomes live on `SessionEngine` only until the unit completes or the component remounts.

## Scaling Considerations

| Scale | Architecture adjustments |
|-------|---------------------------|
| Typical (single class, &lt;1k questions local) | Single Dexie row per logical question with embedded `steps` is sufficient. |
| Larger sets / analytics later | Optional normalization table `attempt_steps` or `step_id` on attempts — **out of scope** for this milestone. |

### Scaling Priorities

1. **First bottleneck:** JSON importer and in-memory question list size — mitigate with lazy parsing or chunked import only if measured.
2. **Second bottleneck:** Dexie index design — ensure `questions` query by `question_set_id` stays indexed after removing `chain_parent_id`.

## Anti-Patterns

### Anti-Pattern 1: Reintroducing “child question rows” for steps

**What people do:** Store each step as its own `Question` row linked by FK to match old chain pattern.

**Why it's wrong:** Recreates the authoring and session complexity this milestone removes; selection logic must again filter “roots.”

**Do this instead:** One row (or one aggregate document) per logical question; steps as structured array or kind-specific object.

### Anti-Pattern 2: UI reads step state from IndexedDB during the run

**What people do:** Run page queries Dexie for “current step” or mutates questions.

**Why it's wrong:** Breaks hexagonal boundaries and duplicates SessionEngine as source of truth for turn order.

**Do this instead:** Engine exposes getters; UI calls `recordOutcome` only through engine.

### Anti-Pattern 3: Splitting aggregation rules between UI and engine

**What people do:** UI decides “partial” and passes it on last step only.

**Why it's wrong:** Race conditions and inconsistent behavior vs keyboard path; harder to test.

**Do this instead:** Engine owns aggregation from `_stepOutcomes` using the **product rule** (see implications below).

## Integration Points

### External Services

| Service | Integration pattern | Notes |
|---------|---------------------|-------|
| None (local-first) | N/A | Backup/export may need to serialize new `LogicalQuestion` shape consistently with importer. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Importer ↔ Model | Typed DTOs matching persisted shape | Single source of truth for bundled JSON. |
| Repository ↔ Dexie | `Question` type includes nested `steps` | Dexie `EntityTable` supports nested objects. |
| SessionEngine ↔ SessionEnginePersistence | `createAttempt` unchanged | `question_id` = logical id; outcome = **aggregate** over steps. |
| SessionEngine ↔ Run UI | Methods/getters only | Replace `chainProgress` naming with step-oriented API. |

## Implications for SessionEngine and Attempt Recording

| Topic | Current behavior (chain model) | Target behavior (logical + steps) |
|-------|--------------------------------|-------------------------------------|
| **Selection pool** | Roots where `chain_parent_id === null` | All persisted questions are logical units; no parent filter. |
| **In-session expansion** | Load `[root, ...children]` sorted by `chain_order` | Load `logicalQuestion.steps` in order (or kind-defined order). |
| **Attempt granularity** | One `Attempt` per chain, `question_id` = root id | Unchanged: **one `Attempt` per logical question** per student turn. |
| **Aggregate outcome** | `_computeChainOutcome`: any `wrong` → `wrong` (note: differs from PROJECT.md target) | Implement **explicit product rule**: all `correct` → `correct`; all `wrong` → `wrong`; **mixed** → `partial`. Align engine with `PROJECT.md` during implementation. |
| **Ports** | `SessionEnginePersistence` unchanged | No change required for v1. |
| **Reporting / lists** | Attempts join to root `Question` | Attempts join to **logical** `Question`; history still “one line per asked unit.” |

**Optional extension (not v1):** Extend `Attempt` or add a child table for **per-step outcomes** if teachers need drill-down; not required for aggregate scoring in this milestone.

## Suggested Build Order and Dependencies

1. **`src/lib/model/types.ts`** — Define `LogicalQuestion` / `Step` unions; deprecate `chain_parent_id` / `chain_order`.
2. **Importer + fixtures** — New JSON shape; tests lock the contract.
3. **Dexie `schema.ts` + question repository** — New store layout; wipe acceptable (`PROJECT.md`).
4. **`persistQuestionSet`** — Write one logical record per parsed question.
5. **`SessionEngine`** — Step runner + updated `_pickQuestion` + aggregation aligned with requirements.
6. **Run UI + any shared render components** — Bind to step-aware engine API.
7. **Backup/export** (if present) — Serialize/deserialize new shape consistently.

**Dependency graph (high level):** `Model` → `Importer` → `Persistence` → `SessionEngine` → `Run UI`. SessionEngine can be unit-tested with in-memory persistence before UI lands.

## Sources

- `.planning/PROJECT.md` — milestone requirements and constraints (2026-04-09).
- `.planning/codebase/ARCHITECTURE.md` — existing layers and data flow (2026-04-09).
- `src/lib/domain/session-engine/index.ts` — chain expansion, `_computeChainOutcome`, attempt creation.
- `src/lib/application/question-sets/persist-question-set.ts` — chain flattening today.
- `src/lib/model/types.ts` — `Question`, `Attempt`, `SessionEnginePersistence` contracts.

---
*Architecture research for: Quizzapp — multi-step logical question milestone*  
*Researched: 2026-04-09*
