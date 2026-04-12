# Phase 1: Domain model & import contract - Context

**Gathered:** 2026-04-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a **single import contract** for the milestone: each **logical question** is one JSON object with **shared presentation** (optional) and an **ordered list of steps**. Runtime validation (Zod, strict) at import; **all bundled** `question-sets/` files migrated to this contract.

**Code-centric authoring shape (explicit):** Authors can think in terms of **one code snippet** plus an **array of `{ range, question }`** (implemented as **`range` + `text`** + **`answer`** per step so scoring and existing answer types stay unified). There is **no** highlight on the shared snippet—only the **code** (and metadata like `language`) lives at shared level; **each step carries its own `range`** for what to emphasize in that snippet.

</domain>

<decisions>
## Implementation Decisions

### JSON envelope & versioning

- **D-01:** Top-level file shape: `{ name: string, schemaVersion: number, questions: LogicalQuestion[] }`. Start **`schemaVersion` at `1`** at file root; bump when the contract breaks.
- **D-02:** Each `questions[]` entry is **one logical unit** with **`shared?: { content: ContentConfig }`** and **`steps: Step[]`** (minimum one step). Remove **`chain`** from the new format; no separate root-level `answer` outside `steps`.

### Steps, ranges, and the `{ range, question }` mental model

- **D-03:** Each step is **`{ text: string, answer: AnswerConfig, range?: { startLine: number, endLine: number } }`**. The author-facing idea **“question”** maps to **`text`** in JSON and types (Zod may accept a **`question`** alias only if we add a transform to `text`—planner may choose one public field name; default: **`text`**).
- **D-04:** Step **discriminant for answer mechanics** remains **`answer.type`** (`open` | `multiple-choice` | `true-false`), matching existing `AnswerConfig` in `src/lib/model/types.ts`.
- **D-05:** When **`shared.content`** is a **`code-snippet`**, **each step MUST include `range`** (the line window for that prompt). There is **no** `highlight` on the shared `code-snippet`—**only `language` and `code`** (and optional future snippet fields that are not line emphasis). Per-step **`range`** is the **only** place line emphasis is defined.
- **D-06:** When **`shared.content`** is **`markdown`** (or non-code), **`range` is omitted** on steps (not applicable).

### Zod & import boundary (Area 2 — confirmed)

- **D-07:** Validate imported JSON with **Zod** using **strict** object handling so **unknown keys fail** (no silent stripping).
- **D-08:** On failure, surface a **single clear message** including a **JSON path** (e.g. `questions[0].steps[1].answer`) plus a short reason; optional detailed Zod output in dev logging.
- **D-09:** Keep **TypeScript types aligned** with Zod (e.g. `z.infer` or equivalent) at the import boundary.

### Migration & bundled sets (Area 4 — confirmed)

- **D-10:** **One** on-disk format under `question-sets/` after migration; **in-place** rewrite via a **maintainer script** with review through git diff.
- **D-11:** Migration inputs: (a) legacy **`snippet` + `questions[]` + string `correctAnswer`**, (b) importer-style **`text` / `content` / `answer` / `chain`**. Map into **`shared` + `steps`**; derive per-step **`range`** from legacy snippet `highlight` or sensible defaults per migrated row (planner to specify rules for rows that had no per-question range).
- **D-12:** For migrated open-style string answers, preserve teacher reference text with **`referenceAnswer?: string`** on **`OpenAnswerConfig`** (or equivalent step-level field) so content is not dropped; **scoring behavior** for `open` unchanged unless a later phase extends it.
- **D-13:** **CI** must verify every **`question-sets/**/*.json`** parses against the new schema.

### Claude's Discretion

- Exact Zod schema layout (nested vs flat), whether to allow **`question` as JSON alias** for `text`, and migration defaults for **missing ranges** when converting old `snippet` files—within the constraints above.

### Folded Todos

_None._

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & product

- `.planning/REQUIREMENTS.md` — MODL-01, MODL-02, IMPT-01, IMPT-02
- `.planning/PROJECT.md` — vision, constraints, key decisions for this milestone
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria

### Current implementation (to replace/extend)

- `src/lib/importer/index.ts` — current hand-rolled JSON parse, `ParsedQuestion` / `chain`
- `src/lib/model/types.ts` — `ContentConfig`, `AnswerConfig`, `Question`
- `src/lib/application/question-sets/persist-question-set.ts` — fan-out into chain rows today

### Examples

- `question-sets/js-fundamentals/*.json` — legacy **`snippet` + `questions`** shape
- `src/lib/importer/index.test.ts` — importer-style fixtures

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable assets

- **`ContentConfig` / `AnswerConfig`** — reuse discriminant shapes; extend `OpenAnswerConfig` for **`referenceAnswer`** as decided.
- **`parseContentConfig` / `parseAnswerConfig`** logic — reference for Zod parity, not necessarily to keep as hand-rolled parsers.

### Established patterns

- Import → **`parseQuestionSetFile`** → **`persistQuestionSet`**; Phase 1 owns the parse output type and validation, persistence refactors in later phases.

### Integration points

- **`src/lib/importer/index.ts`**, **`src/lib/model/types.ts`**, tests under **`src/lib/importer/`**; bundled assets under **`question-sets/`**.

</code_context>

<specifics>
## Specific Ideas

- Author mental model: **one code snippet + array of `{ range, question }`** → implemented as **shared code-snippet (no highlight) + steps with `range` + `text` + `answer`**.
- **Never** a shared-level highlight: **only code** (plus language) at shared; **ranges live on each step**.

</specifics>

<deferred>
## Deferred Ideas

_None — discussion stayed within phase scope._

</deferred>

---

*Phase: 01-domain-model-import-contract*
*Context gathered: 2026-04-09*
