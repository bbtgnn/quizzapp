# Phase 1: Domain model & import contract - Research

**Researched:** 2026-04-09  
**Domain:** TypeScript domain types, JSON import validation (Zod), bundled question-set migration  
**Confidence:** HIGH (codebase + CONTEXT verified); MEDIUM (Zod error UX and migration edge cases)

## User Constraints (from CONTEXT.md)

### Phase boundary

Deliver a **single import contract** for the milestone: each **logical question** is one JSON object with **shared presentation** (optional) and an **ordered list of steps**. Runtime validation (Zod, strict) at import; **all bundled** `question-sets/` files migrated to this contract.

**Code-centric authoring shape (explicit):** Authors can think in terms of **one code snippet** plus an **array of `{ range, question }`** (implemented as **`range` + `text`** + **`answer`** per step so scoring and existing answer types stay unified). There is **no** highlight on the shared snippet—only the **code** (and metadata like `language`) lives at shared level; **each step carries its own `range`** for what to emphasize in that snippet.

### Locked decisions

#### JSON envelope & versioning

- **D-01:** Top-level file shape: `{ name: string, schemaVersion: number, questions: LogicalQuestion[] }`. Start **`schemaVersion` at `1`** at file root; bump when the contract breaks.
- **D-02:** Each `questions[]` entry is **one logical unit** with **`shared?: { content: ContentConfig }`** and **`steps: Step[]`** (minimum one step). Remove **`chain`** from the new format; no separate root-level `answer` outside `steps`.

#### Steps, ranges, and the `{ range, question }` mental model

- **D-03:** Each step is **`{ text: string, answer: AnswerConfig, range?: { startLine: number, endLine: number } }`**. The author-facing idea **“question”** maps to **`text`** in JSON and types (Zod may accept a **`question`** alias only if we add a transform to `text`—planner may choose one public field name; default: **`text`**).
- **D-04:** Step **discriminant for answer mechanics** remains **`answer.type`** (`open` | `multiple-choice` | `true-false`), matching existing `AnswerConfig` in `src/lib/model/types.ts`.
- **D-05:** When **`shared.content`** is a **`code-snippet`**, **each step MUST include `range`** (the line window for that prompt). There is **no** `highlight` on the shared `code-snippet`—**only `language` and `code`** (and optional future snippet fields that are not line emphasis). Per-step **`range`** is the **only** place line emphasis is defined.
- **D-06:** When **`shared.content`** is **`markdown`** (or non-code), **`range` is omitted** on steps (not applicable).

#### Zod & import boundary (Area 2 — confirmed)

- **D-07:** Validate imported JSON with **Zod** using **strict** object handling so **unknown keys fail** (no silent stripping).
- **D-08:** On failure, surface a **single clear message** including a **JSON path** (e.g. `questions[0].steps[1].answer`) plus a short reason; optional detailed Zod output in dev logging.
- **D-09:** Keep **TypeScript types aligned** with Zod (e.g. `z.infer` or equivalent) at the import boundary.

#### Migration & bundled sets (Area 4 — confirmed)

- **D-10:** **One** on-disk format under `question-sets/` after migration; **in-place** rewrite via a **maintainer script** with review through git diff.
- **D-11:** Migration inputs: (a) legacy **`snippet` + `questions[]` + string `correctAnswer`**, (b) importer-style **`text` / `content` / `answer` / `chain`**. Map into **`shared` + `steps`**; derive per-step **`range`** from legacy snippet `highlight` or sensible defaults per migrated row (planner to specify rules for rows that had no per-question range).
- **D-12:** For migrated open-style string answers, preserve teacher reference text with **`referenceAnswer?: string`** on **`OpenAnswerConfig`** (or equivalent step-level field) so content is not dropped; **scoring behavior** for `open` unchanged unless a later phase extends it.
- **D-13:** **CI** must verify every **`question-sets/**/*.json`** parses against the new schema.

### Claude's discretion

- Exact Zod schema layout (nested vs flat), whether to allow **`question` as JSON alias** for `text`, and migration defaults for **missing ranges** when converting old `snippet` files—within the constraints above.

#### Folded todos

_None._

### Deferred ideas (out of scope)

_None — discussion stayed within phase scope._

<phase_requirements>

## Phase requirements

| ID | Description | Research support |
|----|-------------|------------------|
| MODL-01 | Logical question one unit with **ordered steps**; no new-content reliance on `chain_parent_id` / `chain_order` at **import contract** | `shared` + `steps[]` envelope (D-01–D-02); Dexie chain fields remain until Phase 2 [VERIFIED: codebase `persist-question-set.ts`] |
| MODL-02 | **Discriminated** per-step content/answer configs; shared stem + per-step highlights | `answer.type` union (D-04); `ContentConfig` union for `shared.content`; per-step `range` for code (D-05–D-06) |
| IMPT-01 | **Zod** at import boundary, aligned with TS; invalid JSON never persisted | `parseQuestionSetFile` returns `ParseResult` before `persistQuestionSet` [VERIFIED: `import/+page.svelte`]; add `z.strictObject` / `safeParse` [CITED: https://zod.dev/api] |
| IMPT-02 | **All** `question-sets/**/*.json` new format + **import successfully** | Bundled files today are **legacy** `snippet`+`questions` (no `name`) — not parseable by current importer [VERIFIED: `question-sets/js-fundamentals/001-string-literal.json`]; migration + envelope `name`/`schemaVersion` required |

</phase_requirements>

## Summary

Phase 1 replaces hand-rolled parsing in `src/lib/importer/index.ts` with a **versioned, Zod-validated** contract: files are `{ name, schemaVersion, questions }` where each question has optional **`shared.content`** and a non-empty **`steps`** array. Steps carry **`text`**, **`answer`** (discriminated by `answer.type`), and optional **`range`** only when semantics require (mandatory for shared `code-snippet` per D-05). This satisfies MODL-01/02 and IMPT-01 while keeping answer mechanics aligned with existing `AnswerConfig` in `src/lib/model/types.ts`.

**Bundled assets are a distinct gap:** all fourteen `question-sets/js-fundamentals/*.json` files use the **legacy** shape (`snippet`, `questions` with `correctAnswer`, optional nested `chain`), and **do not** include top-level `name` or the importer’s current `{ name, questions: [{ text, content, answer }] }` shape [VERIFIED: repo]. IMPT-02 requires a **maintainer migration script** (D-10–D-11) plus tests/CI that every file validates (D-13). There is **no** `.github` workflow today [VERIFIED: glob `.github/**`], so CI is a **Wave 0** deliverable.

**Persistence:** CONTEXT defers Dexie shape to Phase 2, but the import UI calls `persistQuestionSet` immediately after parse [VERIFIED: `src/routes/question-sets/import/+page.svelte`]. The planner should explicitly decide whether Phase 1 **adapts** new logical questions to the **existing** `ParsedQuestionSet` + chain fan-out in `persist-question-set.ts`, or introduces new parse output types and updates `persistQuestionSet` to map `steps[]` → chain rows until DATA-02 removes fan-out.

**Primary recommendation:** Add **`zod@4.3.6`** [VERIFIED: `npm view zod version`], model the file with **`z.strictObject`** at each object level (Zod 4 strips unknown keys by default on `z.object`; use **`z.strictObject`** for D-07) [CITED: https://zod.dev/api], use **`z.discriminatedUnion('type', …)`** for `ContentConfig` and `AnswerConfig`, and implement **`.superRefine`** on each logical question to enforce D-05/D-06 cross-field rules.

## Project constraints (from `.cursor/rules/`)

From `.cursor/rules/gsd.mdc` (actionable for this phase):

- **Stack:** SvelteKit + Dexie + TypeScript; keep **SessionEngine** and ports testable; **IndexedDB wipe** acceptable later—bundled JSON must stay valid after migration.
- **Compatibility:** Old chain-based JSON **does not** need to load after cutover if bundled sets are migrated in-repo.
- **Error handling:** Pure parse/validation should return a **result object** with `ok` discriminant (`ParseResult` pattern) [VERIFIED: `src/lib/importer/index.ts`]; tests assert `result.ok === false` and `toMatch` on `error` [VERIFIED: `index.test.ts`].
- **Naming:** kebab-case modules under `application/`, camelCase functions (e.g. `parseQuestionSetFile`).
- **GSD:** Prefer routing implementation through GSD execute workflow (orchestration note—not blocking research).

## Standard stack

### Core

| Library | Version | Purpose | Why standard |
|---------|---------|---------|----------------|
| **zod** | **4.3.6** | Runtime JSON schema + `z.infer` types | Locked by CONTEXT D-07–D-09; ecosystem default for TS-aligned validation [VERIFIED: npm registry; CONTEXT] |

### Supporting

| Library | Version | Purpose | When to use |
|---------|---------|---------|-------------|
| **vitest** | ^4.1.0 (dev) | Unit tests for importer/schema | Already in repo [VERIFIED: `package.json`] |
| **typescript** | ^5.9.3 | Shared types with Zod inference | Already in repo [VERIFIED: `package.json`] |

### Alternatives considered

| Instead of | Could use | Tradeoff |
|------------|-----------|----------|
| Zod | ArkType, Valibot | CONTEXT **locks** Zod; switching would violate D-07 |
| `z.strictObject` everywhere | `.strict()` (Zod 3 style) | Zod **4** documents `z.strictObject` for unknown-key errors [CITED: https://zod.dev/api] |

**Installation:**

```bash
bun add zod
```

**Version verification:** `npm view zod version` → **4.3.6** (as of 2026-01-25 publish time per registry metadata) [VERIFIED: npm registry].

## Architecture patterns

### Recommended module layout

```
src/lib/importer/
├── index.ts              # parseQuestionSetFile, ParseResult, re-exports
├── question-set.schema.ts # Zod schemas + inferred types (new)
├── errors.ts             # map Zod issues → single path + message (D-08) (optional split)
```

Keep **`$lib/model/types.ts`** as the **persistence-facing** model until Phase 2; either **re-export** `z.infer` types from the importer or define parallel **`LogicalQuestion` / `QuestionStep`** types that are the **only** output of parse (planner choice per discretion).

### Pattern 1: Strict envelope + discriminated unions

**What:** Root `z.strictObject({ name, schemaVersion, questions: z.array(LogicalQuestionSchema) })`; nested objects also strict; `ContentConfig` and `AnswerConfig` as `z.discriminatedUnion('type', …)` [CITED: https://zod.dev/api].

**When to use:** All imported files at the boundary (D-07, D-09).

**Example:**

```typescript
// Source: https://zod.dev/api — strictObject + discriminatedUnion (paraphrased)
import { z } from 'zod';

const markdownContent = z.strictObject({
	type: z.literal('markdown'),
	body: z.string().min(1)
});

const codeSnippetContent = z.strictObject({
	type: z.literal('code-snippet'),
	language: z.string().min(1),
	code: z.string()
	// no highlight — D-05
});

const contentConfig = z.discriminatedUnion('type', [markdownContent, codeSnippetContent]);
```

### Pattern 2: Cross-field refinements (shared code ⇒ step ranges)

**What:** After parsing each logical question object, **`.superRefine`** (or equivalent) enforces: if `shared?.content.type === 'code-snippet'`, every step has `range`; if `markdown`, no `range` on steps (D-05, D-06).

**When to use:** Logical question schema; cannot be expressed by independent field schemas alone.

### Pattern 3: `safeParse` + stable `ParseResult`

**What:** Use `schema.safeParse(JSON.parse(…))` to avoid throws; on failure, build **one** user-facing string from `error.issues` (first issue or merged), prefixing with a path like `questions[0].steps[1].answer` (D-08). Zod issues expose `path` arrays [CITED: https://zod.dev/api].

**When to use:** Preserve existing `ParseResult` contract consumed by UI and tests.

### Pattern 4: Temporary persistence bridge (if Phase 2 not in this phase)

**What:** Map each **logical question** with `steps[]` to the **current** `persistQuestionSet` expectation: e.g. first step → root `text`/`answer`, further steps → `chain[]`, with **shared content** duplicated per persisted row as today [VERIFIED: `persist-question-set.ts` copies parent `content` to chain items].

**When to use:** Until DATA-02 removes chain fan-out—**only if** planner keeps Dexie row model unchanged in Phase 1.

### Anti-patterns to avoid

- **`z.object` without strictness for D-07:** Default `z.object` **strips** unknown keys in Zod 4 [CITED: https://zod.dev/api] — violates “no silent stripping” intent; use **`z.strictObject`** at validated boundaries.
- **Letting invalid data reach `persistQuestionSet`:** Import page must keep **parse-then-persist** ordering [VERIFIED: `import/+page.svelte`].
- **Migrating bundled JSON without `name`:** Importer requires non-empty `name` today [VERIFIED: `index.ts`]; new contract also requires it (D-01)—derive from filename or folder in migration script.

## Don't hand-roll

| Problem | Don't build | Use instead | Why |
|---------|-------------|-------------|-----|
| Unknown-key detection | Ad-hoc `Object.keys` checks | `z.strictObject` [CITED: zod.dev] | Consistent with nested objects and arrays |
| Tagged union validation | Manual `switch` on `type` only | `z.discriminatedUnion('type', …)` [CITED: zod.dev] | Exhaustiveness + clearer errors |
| JSON path error messages | String concat only | Zod `issues[].path` + formatter (D-08) [CITED: zod.dev] | Stable paths for authors |
| Migrating 14+ files by hand | Manual edit | Node/bun **maintainer script** + git diff (D-10) | Repeatable, reviewable |

**Key insight:** The current importer already duplicates union logic for content/answers [VERIFIED: `index.ts`]; Zod replaces that with a **single** schema artifact aligned to TS (D-09).

## Runtime state inventory (migration / format change)

| Category | Items found | Action required |
|----------|-------------|-----------------|
| Stored data (repo) | **14** JSON files under `question-sets/js-fundamentals/*.json` in **legacy** shape (`snippet`, `questions`, `correctAnswer`, optional `chain`) [VERIFIED: repo] | Maintainer script: rewrite to D-01 envelope + logical questions; add `name` + `schemaVersion` [CONTEXT D-10, D-11] |
| Stored data (runtime DB) | IndexedDB `questions` rows use `chain_parent_id` / `chain_order` [VERIFIED: `types.ts`, `persist-question-set.ts`] | **Phase 2** (DATA-*); Phase 1 may still **write** chain rows via bridge |
| Live service config | None identified | None |
| OS-registered state | None | None |
| Secrets / env | None for import | None |
| Build artifacts | None tied to old JSON shape | None — JSON is source |

## Common pitfalls

### Pitfall 1: Assuming bundled files already match the importer

**What goes wrong:** CI or manual checks pass the wrong validator; migrated app still cannot load bundled sets.

**Why it happens:** Today’s `parseQuestionSetFile` expects `name` + `questions[].text|content|answer` [VERIFIED: `index.ts`]; bundled files are **snippet-first** and lack `name` [VERIFIED: `001-string-literal.json`].

**How to avoid:** Treat IMPT-02 as **migration + validation** of every file; add an automated check (D-13).

**Warning signs:** Tests only cover importer fixtures, not `question-sets/**/*.json`.

### Pitfall 2: Silent stripping of extra JSON keys

**What goes wrong:** Authors think invalid fields were accepted; debugging is harder.

**Why it happens:** Zod 4 `z.object` **strips** unknown keys by default [CITED: https://zod.dev/api].

**How to avoid:** Use **`z.strictObject`** for objects that must reject unknown keys (D-07).

**Warning signs:** Parsed output omits a typo’d field with no error.

### Pitfall 3: Nested `chain` inside legacy snippet `questions`

**What goes wrong:** Flattening **root** questions vs **nested** chain items incorrectly loses order or drops reference answers.

**Why it happens:** Example `011-mixed-types.json` has `chain` under the first question only [VERIFIED: file contents].

**How to avoid:** Migration spec: explicit ordering — e.g. root prompt → step 0, nested chain items → steps 1..n, sibling questions → separate logical questions (planner must document).

**Warning signs:** Step count mismatch vs teacher-facing prompts.

### Pitfall 4: Phase 1 parse types vs `persistQuestionSet` signature drift

**What goes wrong:** Typecheck fails or runtime writes wrong rows.

**Why it happens:** `persistQuestionSet` is typed to `ParsedQuestionSet` with `ParsedQuestion` / `chain` [VERIFIED: `persist-question-set.ts`].

**How to avoid:** Single exported parse output type; explicit adapter to current persistence if Dexie unchanged.

**Warning signs:** `createQuestion` call shape changes without updating tests in `persist-question-set.test.ts`.

## Code examples

### Strict parse with `safeParse`

```typescript
// Source: https://zod.dev/api — safeParse + strictObject
const FileSchema = z.strictObject({
	name: z.string().min(1),
	schemaVersion: z.literal(1),
	questions: z.array(LogicalQuestionSchema).min(1)
});

const json = JSON.parse(jsonString) as unknown;
const result = FileSchema.safeParse(json);
if (!result.success) {
	const issue = result.error.issues[0];
	const path = issue.path.length ? issue.path.join('.') : '(root)';
	return { ok: false, error: `${path}: ${issue.message}` };
}
return { ok: true, data: result.data };
```

### Discriminated answer config (existing tags)

```typescript
// Source: aligned with src/lib/model/types.ts [VERIFIED: codebase]
const answerConfig = z.discriminatedUnion('type', [
	z.strictObject({ type: z.literal('open'), referenceAnswer: z.string().optional() }),
	z.strictObject({
		type: z.literal('multiple-choice'),
		options: z.array(z.string().min(1)).min(2),
		correctIndex: z.number().int().nonnegative()
	}),
	z.strictObject({
		type: z.literal('true-false'),
		correctAnswer: z.boolean()
	})
]);
```

*(Planner: wire `referenceAnswer` per D-12 and refine `correctIndex` upper bound vs `options.length`.)*

## State of the art

| Old approach | Current approach | When changed | Impact |
|--------------|------------------|--------------|--------|
| Zod 3 `.strict()` on `z.object` | Zod 4 **`z.strictObject`** / `z.looseObject` | Zod 4 release stream | Use current API in docs [CITED: https://zod.dev/api] |
| Hand-rolled importer branches | Zod schemas + `z.infer` | Phase 1 (planned) | Single source of truth for MODL/IMPT |

**Deprecated/outdated:**

- Relying on **shared** `highlight` for new content — disallowed for new contract (D-05); only per-step `range`.

## Assumptions log

| # | Claim | Section | Risk if wrong |
|---|-------|---------|---------------|
| A1 | Zod **4.x** `z.strictObject` is the intended reading of CONTEXT “strict object handling” | Standard stack | Low—CONTEXT says Zod strict; if planner pins Zod 3, API differs (`strict()` method) |
| A2 | No separate loader path imports `question-sets/*.json` at runtime in built app | Pitfall 1 | If a route loads bundled JSON directly, it also needs migration [ASSUMED: grep showed importer path primary for user JSON] |

**If A2 is wrong:** Search for static imports of `question-sets/` and include them in IMPT-02 scope.

## Open questions (RESOLVED — planning 2026-04-09)

1. **Top-level `name` for migrated bundled files** — **RESOLVED:** Plan `01-03` (`scripts/migrate-question-sets.ts`) derives `name` from folder + file stem per D-01; documented in script/README in that plan.

2. **Phase 1 persistence strategy** — **RESOLVED:** Plan `01-02` implements `logical-to-parsed-question-set.ts` bridge: `steps[]` → root + `chain[]` for unchanged `persistQuestionSet` until Phase 2.

3. **Optional `question` alias for `text`** — **RESOLVED:** Plan `01-01` Task 3 chooses canonical **`text`** only for v1 JSON (no `question` alias); discretion closed to reduce schema surface.

## Environment availability

| Dependency | Required by | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| Node / bun | Vite, Vitest, migration script | ✓ (dev machine) | [project LTS] | — |
| `zod` package | D-07–D-09 | ✗ in repo today | — | **Add dependency** [VERIFIED: `package.json` has no `zod`] |
| CI runner | D-13 | ✗ (no `.github` workflows found) | — | Add workflow or document manual gate until CI exists |

**Missing dependencies with no fallback:**

- **`zod`** must be added before implementation.

**Missing dependencies with fallback:**

- **CI:** local `bun run test:unit -- --run` plus a script can gate until GitHub Actions exists.

## Validation architecture

> `workflow.nyquist_validation` is **enabled** in `.planning/config.json` [VERIFIED].

### Test framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^4.1.0 [VERIFIED: `package.json`] |
| Config file | `vite.config.ts` → `test.projects` (`server` = Node, `client` = browser) [VERIFIED] |
| Importer tests environment | **server** project includes `src/**/*.{test,spec}.{js,ts}` [VERIFIED: `vite.config.ts`] |
| Quick run command | `bun run test:unit -- --run src/lib/importer/index.test.ts` |
| Full unit command | `bun run test:unit -- --run` |
| Full repo test (unit + e2e) | `bun run test` (runs `test:unit -- --run` then `test:e2e`) [VERIFIED: `package.json`] |

*Note: `package.json` `test` script uses `npm run` internally; `bun run test` works as long as npm is on PATH, or use `bun run test:unit` + `bun run test:e2e` explicitly.*

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|--------------|
| MODL-01 | Parsed output has ordered `steps[]` per logical question | unit | `bun run test:unit -- --run src/lib/importer/index.test.ts` | ❌ Wave 0 — extend tests for new shape |
| MODL-02 | Per-step `answer.type` discriminates config; shared + range rules | unit | same | ❌ Wave 0 |
| IMPT-01 | Unknown keys / invalid types → `ok: false`, no persist | unit | same + optional `persist-question-set.test.ts` | Partial — pattern exists [VERIFIED: `index.test.ts`] |
| IMPT-02 | Each bundled JSON parses | integration/script | `bun run test:unit -- --run src/lib/importer/question-sets.validation.test.ts` (to add) or `bun run scripts/validate-question-sets.ts` | ❌ Wave 0 |

### Sampling rate

- **Per task commit:** `bun run test:unit -- --run src/lib/importer/`
- **Per wave merge:** `bun run test:unit -- --run`
- **Phase gate:** `bun run test` before `/gsd-verify-work` if e2e is project standard

### Wave 0 gaps

- [ ] Add **`zod`** dependency [VERIFIED: absent from `package.json`]
- [ ] Extend or replace `src/lib/importer/index.test.ts` for **new envelope** + **strict** key rejection
- [ ] Add **bundled file** validation test or script covering `question-sets/**/*.json` (D-13)
- [ ] **CI workflow** (if shipping D-13 as CI) — currently missing [VERIFIED]

## Security domain

### Applicable ASVS categories

| ASVS category | Applies | Standard control |
|---------------|---------|------------------|
| V2 Authentication | no | — |
| V3 Session management | no | — |
| V4 Access control | no | — |
| V5 Input validation | **yes** | Zod at import boundary; reject malformed/large payloads before persistence [CONTEXT D-07–D-08] |
| V6 Cryptography | no | — |

### Known threat patterns (imported JSON)

| Pattern | STRIDE | Standard mitigation |
|---------|--------|---------------------|
| Schema abuse / oversized payloads | DoS | `JSON.parse` on full string today [VERIFIED]; consider size limits in planner if needed [ASSUMED: not specified in CONTEXT] |
| Type confusion / unexpected fields | Tampering | `z.strictObject` + discriminated unions [CITED: zod.dev] |

## Sources

### Primary (HIGH confidence)

- Repository files: `src/lib/importer/index.ts`, `src/lib/model/types.ts`, `src/lib/application/question-sets/persist-question-set.ts`, `src/routes/question-sets/import/+page.svelte`, `question-sets/js-fundamentals/*.json`, `package.json`, `vite.config.ts`, `.planning/config.json`, `.planning/phases/01-domain-model-import-contract/01-CONTEXT.md`
- npm registry: `npm view zod version` → 4.3.6
- [Zod API documentation](https://zod.dev/api) — `z.strictObject`, default `z.object` stripping, `z.discriminatedUnion`, issue paths

### Secondary (MEDIUM confidence)

- `.cursor/rules/gsd.mdc` — stack and conventions

### Tertiary (LOW confidence)

- None cited as sole support for critical claims

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — CONTEXT locks Zod; version verified on npm
- Architecture: **HIGH** — codebase paths verified; persistence bridge is **planner decision** (documented as open question)
- Pitfalls: **MEDIUM** — migration edge cases need planner-specified rules for nested `chain` and `referenceAnswer` mapping

**Research date:** 2026-04-09  
**Valid until:** ~2026-05-09 (re-check Zod minors/patches monthly)
