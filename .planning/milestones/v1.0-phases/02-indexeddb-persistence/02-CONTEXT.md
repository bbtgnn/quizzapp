# Phase 2: IndexedDB & persistence - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

**IndexedDB** (Dexie) stores **one record per logical question** with **nested steps** (same mental model as the import contract). **`persistQuestionSet`** must **not** fan out into multiple linked rows per unit. **Schema version bump** with **local wipe** is **accepted** and **documented** for developers and end users (DATA-01–DATA-03). Session engine and run UI behavior stay in later phases; this phase only makes persistence and repository shape match the logical unit.

</domain>

<decisions>
## Implementation Decisions

### Area 1 — Stored shape & TypeScript model

- **D-01:** One Dexie row = **one logical question**. Persist **`shared?: { content: ContentConfig }`** and **`steps`** as an **ordered array** matching import semantics (`text`, `answer`, optional `range` per step for code-snippet shared content per Phase 1 D-05/D-06).
- **D-02:** Remove **`chain_parent_id`** and **`chain_order`** from the persisted question model (no chain rows in storage). Replace with the nested **`steps[]`** representation only.
- **D-03:** **`Attempt.question_id`** (and any future session references to “the question”) refers to the **single id** of that **logical** row — one id per multi-step unit.

### Area 2 — Dexie version bump & indexes

- **D-04:** Add a **new Dexie version** (e.g. **v3**) that changes the **`questions`** table so indexes **do not** include **`chain_parent_id`**. Prefer minimal indexes: **`id`**, **`question_set_id`** (add others only if a concrete query needs them).
- **D-05:** **No migration** of prior `questions` rows: upgrade may **clear** or recreate affected stores consistent with Dexie behavior; same **clean-break** policy as existing v2 upgrade commentary in `schema.ts`.
- **D-06:** Optional **upgrade hook** for **diagnostic logging** in dev only — Claude’s discretion; not required for product behavior.

### Area 3 — `QuestionSetRepository` & `persistQuestionSet`

- **D-07:** **`persistQuestionSet`** performs **one write per logical question** (one add/put per unit). **No** inner loop that creates **child rows** for additional steps.
- **D-08:** **Stop depending on the chain-shaped `ParsedQuestion` + fan-out bridge** for persistence: planner should route **logical** data (equivalent to validated **`QuestionSetFile`** / `LogicalQuestionSchema` shape) into the new persist path. Whether **`ParsedQuestionSet` is retired, extended, or bypassed** in favor of a logical DTO is **Claude’s discretion**, as long as the stored row matches D-01 and DATA-02.
- **D-09:** **Re-import** for a set: keep the existing pattern **`deleteQuestionsByQuestionSet(questionSetId)`** then insert new logical rows unless a later task proves id-stable upsert is needed.

### Area 4 — Wipe documentation & surfacing (DATA-03)

- **D-10:** **User-facing:** After a schema bump that wipes data, show a **short, plain-language notice** (e.g. **banner or toast** on first relevant visit — home, question sets, or import) that **local question sets may have been reset** and may need **re-import**.
- **D-11:** **Developer-facing:** Document in **project README** (or dedicated **docs** file if the repo already uses one) that **Dexie upgrades can wipe local IndexedDB** and that **no migration** from chain-era rows is supported for this milestone.
- **D-12:** **Release note:** Add a **CHANGELOG** (or release notes) line when this ships so upgrades are traceable.

### Claude's Discretion

- Exact **TypeScript** naming (`Question` vs `LogicalQuestion` vs interface split), **repository method names**, and **whether** to keep a thin adapter type between Zod-inferred types and Dexie entities.
- **Ordering** of questions within a set when listing (insertion order vs explicit field) if not already guaranteed by Dexie.
- **Exact copy** and placement of the user-facing wipe notice (which route(s), dismissible behavior, i18n if any later).

### Folded Todos

_None._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & roadmap

- `.planning/REQUIREMENTS.md` — **DATA-01**, **DATA-02**, **DATA-03**
- `.planning/ROADMAP.md` — Phase 2 goal and success criteria
- `.planning/PROJECT.md` — Dexie wipe acceptable; local-first constraints

### Prior phase (import contract)

- `.planning/phases/01-domain-model-import-contract/01-CONTEXT.md` — logical unit, `shared` + `steps`, Zod strict import, D-05/D-06 range rules

### Code (persistence & import)

- `src/lib/adapters/persistence/dexie/schema.ts` — `QuizAppDB`, versions, `questions` indexes
- `src/lib/adapters/persistence/dexie/repositories/question-sets.ts` — create/list/delete questions
- `src/lib/adapters/persistence/dexie/question-set-repository.adapter.ts` — port wiring
- `src/lib/application/question-sets/persist-question-set.ts` — current fan-out (to be replaced)
- `src/lib/ports/question-set-repository.ts` — repository contract
- `src/lib/model/types.ts` — current `Question` / content / answer types
- `src/lib/importer/question-set.schema.ts` — `LogicalQuestionSchema`, `StepSchema`
- `src/lib/importer/logical-to-parsed-question-set.ts` — temporary bridge to chain-shaped parse (Phase 2 should obsolete for persist)
- `src/lib/importer/parsed-types.ts` — `ParsedQuestionSet` (may evolve)

### Architecture

- `.planning/codebase/ARCHITECTURE.md` — Dexie adapters, application layer, data flow for import

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **`QuestionSetFileSchema` / `LogicalQuestionSchema`** — source of truth for **logical** shape at import; persistence should align with the same fields at rest.
- **`deleteQuestionsByQuestionSet`**, **`createQuestionSet`** — keep for import flow; **`createQuestion`** will need to accept **one logical payload** or be replaced by an equivalent single-row API.

### Established patterns

- **Dexie `version(n).stores(...).upgrade(...)`** with **clean break** comment already present for v2 — extend consistently for v3.
- **Import** → parse → **`persistQuestionSet`** → repository — same pipeline; only **payload shape and write pattern** change.

### Integration points

- **`src/lib/app/repositories.ts`** (composition root), **`src/routes/question-sets/import/+page.svelte`**, any loader that **lists questions** by set (ordering may assume chain fields until Phase 3).

</code_context>

<specifics>
## Specific Ideas

- User selected **all four** gray areas (stored model, Dexie bump/indexes, repository/persist contract, documentation) in discuss-phase; decisions follow **roadmap + Phase 1 context +** the recommended defaults from that briefing.

</specifics>

<deferred>
## Deferred Ideas

- **Backup/export** format alignment with the new row shape — **Phase 5** (**VER-02**).
- **Session pool / SessionEngine** treating each unit as one slot — **Phase 3** (**SESS-***).
- **Per-step highlight fidelity** if anything still relied on chain root `content.highlight` for follow-up steps — engine/UI phases should use **per-step `range`** from stored `steps[]`.

### Reviewed Todos (not folded)

_None._

</deferred>

---

*Phase: 02-indexeddb-persistence*
*Context gathered: 2026-04-09*
