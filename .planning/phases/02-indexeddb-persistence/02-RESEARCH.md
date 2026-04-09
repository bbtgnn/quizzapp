# Phase 2: IndexedDB & persistence - Research

**Researched:** 2026-04-09  
**Domain:** Dexie/IndexedDB schema and persistence refactor for logical-question rows  
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** One Dexie row = **one logical question**. Persist **`shared?: { content: ContentConfig }`** and **`steps`** as an **ordered array** matching import semantics (`text`, `answer`, optional `range` per step for code-snippet shared content per Phase 1 D-05/D-06). [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-02:** Remove **`chain_parent_id`** and **`chain_order`** from the persisted question model (no chain rows in storage). Replace with the nested **`steps[]`** representation only. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-03:** **`Attempt.question_id`** (and any future session references to “the question”) refers to the **single id** of that **logical** row — one id per multi-step unit. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-04:** Add a **new Dexie version** (e.g. **v3**) that changes the **`questions`** table so indexes **do not** include **`chain_parent_id`**. Prefer minimal indexes: **`id`**, **`question_set_id`** (add others only if a concrete query needs them). [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-05:** **No migration** of prior `questions` rows: upgrade may **clear** or recreate affected stores consistent with Dexie behavior; same **clean-break** policy as existing v2 upgrade commentary in `schema.ts`. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-06:** Optional **upgrade hook** for **diagnostic logging** in dev only — Claude’s discretion; not required for product behavior. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-07:** **`persistQuestionSet`** performs **one write per logical question** (one add/put per unit). **No** inner loop that creates **child rows** for additional steps. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-08:** **Stop depending on the chain-shaped `ParsedQuestion` + fan-out bridge** for persistence: planner should route **logical** data (equivalent to validated **`QuestionSetFile`** / `LogicalQuestionSchema` shape) into the new persist path. Whether **`ParsedQuestionSet` is retired, extended, or bypassed** in favor of a logical DTO is **Claude’s discretion**, as long as the stored row matches D-01 and DATA-02. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-09:** **Re-import** for a set: keep the existing pattern **`deleteQuestionsByQuestionSet(questionSetId)`** then insert new logical rows unless a later task proves id-stable upsert is needed. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-10:** **User-facing:** After a schema bump that wipes data, show a **short, plain-language notice** (e.g. **banner or toast** on first relevant visit — home, question sets, or import) that **local question sets may have been reset** and may need **re-import**. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-11:** **Developer-facing:** Document in **project README** (or dedicated **docs** file if the repo already uses one) that **Dexie upgrades can wipe local IndexedDB** and that **no migration** from chain-era rows is supported for this milestone. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **D-12:** **Release note:** Add a **CHANGELOG** (or release notes) line when this ships so upgrades are traceable. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]

### Claude's Discretion
- Exact **TypeScript** naming (`Question` vs `LogicalQuestion` vs interface split), **repository method names**, and **whether** to keep a thin adapter type between Zod-inferred types and Dexie entities. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **Ordering** of questions within a set when listing (insertion order vs explicit field) if not already guaranteed by Dexie. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **Exact copy** and placement of the user-facing wipe notice (which route(s), dismissible behavior, i18n if any later). [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]

### Deferred Ideas (OUT OF SCOPE)
- **Backup/export** format alignment with the new row shape — **Phase 5** (**VER-02**). [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **Session pool / SessionEngine** treating each unit as one slot — **Phase 3** (**SESS-***). [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
- **Per-step highlight fidelity** if anything still relied on chain root `content.highlight` for follow-up steps — engine/UI phases should use **per-step `range`** from stored `steps[]`. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DATA-01 | Dexie schema version bump; one logical question row with nested steps; indexes independent of chain fields | Standard stack + architecture patterns define v3 schema and index strategy without `chain_parent_id` |
| DATA-02 | `persistQuestionSet` stores one row per logical question, no fan-out child rows | Architecture patterns + code examples prescribe logical DTO -> single write path |
| DATA-03 | IndexedDB wipe on upgrade acceptable and documented for dev/users | Common pitfalls + documentation strategy + Dexie upgrade/wipe references cover rollout expectations |
</phase_requirements>

## Summary

Phase 2 should be implemented as a **shape cutover**: keep Dexie, but replace the persisted `Question` record contract from chain-row form (`chain_parent_id`, `chain_order`) to a logical-row form with nested `steps[]` and optional shared content. This aligns persistence with the already-validated import boundary (`LogicalQuestionSchema`) and removes the bridge-induced fan-out in `persistQuestionSet`. [VERIFIED: src/lib/application/question-sets/persist-question-set.ts] [VERIFIED: src/lib/importer/question-set.schema.ts] [VERIFIED: src/lib/importer/logical-to-parsed-question-set.ts]

Dexie schema evolution should stay explicit and local-first: add a new version declaration for `questions`, drop chain-oriented indexes, and keep the clean-break policy (no old-row migration). Existing code already documents this pattern in v2 and project requirements explicitly allow local DB reset on upgrade. [VERIFIED: src/lib/adapters/persistence/dexie/schema.ts] [VERIFIED: .planning/REQUIREMENTS.md]

Planner focus should be on three concrete deltas: (1) type/repository contract update, (2) write-path update to one record per logical question, (3) user/dev-facing wipe communication. These three directly satisfy DATA-01/02/03 with minimal blast radius into Phase 3+ concerns. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]

**Primary recommendation:** Introduce a new persisted logical-question entity now, route `persistQuestionSet` to it directly from logical import shape, and treat v3 as a documented clean reset with no chain-row migration. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md] [CITED: https://dexie.org/docs/Version/Version.stores()]

## Project Constraints (from .cursor/rules/)

- Stay on existing stack boundaries (SvelteKit + TypeScript + Dexie + ports/adapters); avoid architectural detours in this phase. [VERIFIED: .cursor/rules/gsd.mdc]
- IndexedDB wipe is accepted for this milestone; backward compatibility for old chain JSON/database is not required beyond migrated in-repo assets. [VERIFIED: .cursor/rules/gsd.mdc]
- Keep SessionEngine and session runtime changes out of scope for this phase. [VERIFIED: .cursor/rules/gsd.mdc]
- Follow project formatting/lint/test conventions (Prettier + ESLint + Vitest). [VERIFIED: .cursor/rules/gsd.mdc] [VERIFIED: package.json]

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Dexie | 4.4.2 | IndexedDB schema/table abstraction and upgrades | Already the project persistence adapter and supports versioned schema evolution cleanly. [VERIFIED: npm registry] [VERIFIED: src/lib/adapters/persistence/dexie/schema.ts] |
| zod | 4.3.6 | Runtime validation at import boundary | Existing logical schema is strict and already defines `shared` + `steps[]`; reuse this as persistence input contract. [VERIFIED: npm registry] [VERIFIED: src/lib/importer/question-set.schema.ts] |
| TypeScript | 5.9.3 (project-pinned) | Shared model and repository contracts | Current architecture is type-first with ports; persistence change should be expressed through interfaces/types first. [VERIFIED: package.json] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Vitest | 4.1.0 (project) / 4.1.4 (latest) | Unit/integration safety net for persistence refactor | Use for `persistQuestionSet` behavior and schema/repository tests in this phase. [VERIFIED: package.json] [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Keep Dexie | Raw IndexedDB API | More boilerplate + weaker consistency with existing adapters; no phase value. [ASSUMED] |
| Clean wipe policy | Row migration in upgrade hook | Higher complexity and explicitly out of scope per requirements/context. [VERIFIED: .planning/REQUIREMENTS.md] |

**Installation:**
```bash
bun add dexie zod
bun add -d vitest
```

**Version verification:**  
- Dexie `4.4.2` published `2026-03-31T11:46:08.335Z`. [VERIFIED: npm registry]  
- Zod `4.3.6` published `2026-01-22T19:14:35.382Z`. [VERIFIED: npm registry]  
- Vitest `4.1.4` published `2026-04-09T07:36:52.741Z` (project currently on `^4.1.0`). [VERIFIED: npm registry] [VERIFIED: package.json]

## Architecture Patterns

### Recommended Project Structure
```text
src/lib/
├── model/types.ts                                  # persisted entities and unions
├── ports/question-set-repository.ts                # persistence contract
├── application/question-sets/persist-question-set.ts # write orchestration
└── adapters/persistence/dexie/
   ├── schema.ts                                    # db version + index definitions
   └── repositories/question-sets.ts                # concrete Dexie writes/queries
```

### Pattern 1: Logical DTO to Single Row Persistence
**What:** Persist one `Question` record per logical question with nested `steps[]` instead of root+children fan-out. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]  
**When to use:** Every import/re-import flow in this phase. [VERIFIED: .planning/REQUIREMENTS.md]  
**Example:**
```typescript
// Source: src/lib/importer/question-set.schema.ts + phase decision D-01/D-07
type PersistedLogicalQuestion = {
	question_set_id: string;
	shared?: { content: ContentConfig };
	steps: Array<{
		text: string;
		answer: AnswerConfig;
		range?: { startLine: number; endLine: number };
	}>;
	difficulty?: string;
};
```

### Pattern 2: Versioned Schema Cutover Without Legacy Migration
**What:** Add Dexie version for schema/index changes and accept reset behavior (no old chain-row transformation). [VERIFIED: src/lib/adapters/persistence/dexie/schema.ts] [CITED: https://dexie.org/docs/Version/Version.upgrade()]  
**When to use:** This phase’s `questions` store redesign. [VERIFIED: .planning/REQUIREMENTS.md]  
**Example:**
```typescript
// Source: project schema pattern + Dexie version stores model
db.version(3)
	.stores({
		questions: 'id, question_set_id' // no chain_parent_id index
	})
	.upgrade((_tx) => {
		// Keep as clean-break policy (optional dev-only diagnostics).
	});
```

### Anti-Patterns to Avoid
- **Chain fan-out writes in application layer:** `persistQuestionSet` currently loops root + `chain[]`, which violates DATA-02; remove this path. [VERIFIED: src/lib/application/question-sets/persist-question-set.ts]
- **Indexing by deprecated chain fields:** keeping `chain_parent_id` indexed encourages old query semantics and conflicts with DATA-01. [VERIFIED: src/lib/adapters/persistence/dexie/schema.ts]
- **Hidden wipe behavior:** schema reset without user/dev comms creates confusing “missing data” bug reports; must be explicit in UI docs/release notes. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| IndexedDB upgrade plumbing | Custom raw `onupgradeneeded` orchestration | Dexie `version().stores().upgrade()` | Project already standardized on Dexie; fewer edge-case paths. [VERIFIED: src/lib/adapters/persistence/dexie/schema.ts] [CITED: https://dexie.org/docs/Version/Version.stores()] |
| Runtime import validation | Manual nested-object guards | Existing Zod logical schemas | Contract already encoded and tested; reuse avoids drift. [VERIFIED: src/lib/importer/question-set.schema.ts] |
| DB wipe mechanics | Ad hoc store-clearing utility layers | Dexie schema/version reset policy + documented behavior | Requirements explicitly accept wipe/no migration. [VERIFIED: .planning/REQUIREMENTS.md] [CITED: https://dexie.org/docs/Dexie/Dexie.delete()] |

**Key insight:** this phase is mostly **contract alignment**, not invention; the cheapest safe path is to remove bridge complexity and let one authoritative logical shape flow from validation to persistence. [VERIFIED: src/lib/importer/logical-to-parsed-question-set.ts] [VERIFIED: src/lib/application/question-sets/persist-question-set.ts]

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | Existing client IndexedDB rows still use chain-era fields in `questions` for prior installs. [VERIFIED: src/lib/adapters/persistence/dexie/schema.ts] | Code edit + accepted reset on v3; no row migration. [VERIFIED: .planning/REQUIREMENTS.md] |
| Live service config | None found (browser-local app, no external persistence service for this phase). [VERIFIED: .planning/codebase/ARCHITECTURE.md] | None |
| OS-registered state | None found relevant to IndexedDB schema shape. [ASSUMED] | None |
| Secrets/env vars | No env-driven persistence toggles found for Dexie path. [VERIFIED: .cursor/rules/gsd.mdc] | None |
| Build artifacts | No durable artifact expected to preserve old client IndexedDB rows after code deploy; state lives in browser storage. [VERIFIED: .planning/codebase/ARCHITECTURE.md] | Communicate wipe/reset |

## Common Pitfalls

### Pitfall 1: Partial Contract Migration
**What goes wrong:** Model updates happen in `types.ts` but repository or adapter signatures still accept old chain-shaped payloads. [VERIFIED: src/lib/model/types.ts] [VERIFIED: src/lib/ports/question-set-repository.ts]  
**Why it happens:** Current code spreads concern across model, port, adapter, and app layer. [VERIFIED: .planning/codebase/ARCHITECTURE.md]  
**How to avoid:** Sequence tasks as type -> port -> adapter -> application -> tests. [ASSUMED]  
**Warning signs:** Type casts, temporary `any`, or compatibility wrappers surviving after phase merge. [ASSUMED]

### Pitfall 2: Reintroducing Fan-Out in a Different Layer
**What goes wrong:** Even after refactor, a bridge maps `steps[]` back into root/child writes. [VERIFIED: src/lib/importer/logical-to-parsed-question-set.ts]  
**Why it happens:** Existing bridge utility was intentionally temporary and easy to keep accidentally. [VERIFIED: src/lib/importer/logical-to-parsed-question-set.ts]  
**How to avoid:** Make `persistQuestionSet` accept logical DTO directly and deprecate chain parse dependency in persistence path. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]  
**Warning signs:** Any loop creating extra rows per step. [VERIFIED: src/lib/application/question-sets/persist-question-set.ts]

### Pitfall 3: “Data Loss” Appears as Bug Instead of Planned Upgrade
**What goes wrong:** Users/devs interpret expected wipe as regression. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]  
**Why it happens:** No visible notice or changelog entry. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]  
**How to avoid:** Add one-time UX notice + README/docs + release note in same phase. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]  
**Warning signs:** Support/test reports saying imported sets “disappeared after update.” [ASSUMED]

## Code Examples

Verified patterns from current code + official references:

### One-write-per-logical-question shape
```typescript
// Source: src/lib/importer/question-set.schema.ts (logical contract)
for (const logicalQ of questionSet.questions) {
	await questionSets.createQuestion(questionSetId, {
		shared: logicalQ.shared,
		steps: logicalQ.steps,
		...(logicalQ.difficulty ? { difficulty: logicalQ.difficulty } : {})
	});
}
```

### Dexie versioned schema update
```typescript
// Source: src/lib/adapters/persistence/dexie/schema.ts pattern + dexie docs
db.version(3)
	.stores({
		questions: 'id, question_set_id'
	})
	.upgrade(() => {
		// clean break: accepted for this milestone
	});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Chain rows (`chain_parent_id`, `chain_order`) | Logical unit with nested steps in one record | This phase (planned) | Simpler query model and aligns import/persistence semantics. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md] |
| Bridge from logical file -> chain persistence | Direct logical persistence DTO | This phase (planned) | Removes fan-out write and per-step linkage complexity. [VERIFIED: src/lib/importer/logical-to-parsed-question-set.ts] [VERIFIED: src/lib/application/question-sets/persist-question-set.ts] |

**Deprecated/outdated:**
- Chain-based persistence for new content in v1 milestone. [VERIFIED: .planning/REQUIREMENTS.md]

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Raw IndexedDB would increase maintenance complexity versus Dexie for this project | Standard Stack / Alternatives | Low |
| A2 | No OS-registered state is relevant for this browser-only persistence change | Runtime State Inventory | Low |
| A3 | Type-first task sequencing is the least-risk execution order | Common Pitfalls | Low |
| A4 | “Data disappeared” reports are likely without explicit wipe messaging | Common Pitfalls | Medium |

## Open Questions (RESOLVED)

1. **RESOLVED: list ordering remains deferred in Phase 2 (no new `position` field).**
   - What we know: Context leaves ordering as discretion; current table query is by `question_set_id` and returns `toArray()`. [VERIFIED: src/lib/adapters/persistence/dexie/repositories/question-sets.ts]
   - Decision: Preserve existing insertion order behavior for this phase and defer explicit ordering semantics to Phase 3 where selection logic is introduced.
   - Rationale: Phase 2 scope is schema cutover + one-row persistence; adding ordering now introduces non-required migration complexity.

2. **RESOLVED: wipe notice is one-time per schema version, dismissible, and reset on next schema bump.**
   - What we know: User-facing notice is required. [VERIFIED: .planning/phases/02-indexeddb-persistence/02-CONTEXT.md]
   - Decision: Persist a lightweight local marker keyed by schema version (for example `db_wipe_notice_seen_v3`) in `localStorage`.
   - Rationale: Keeps UX explicit without repeated noise and guarantees notice reappears on future version upgrades.

## Environment Availability

Step 2.6: SKIPPED (no external services or CLIs beyond existing project toolchain are required for this phase).  
Toolchain check: `bun 1.2.2`, `node v24.14.1`, `npm 11.11.0`. [VERIFIED: local shell]

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (project `^4.1.0`, latest `4.1.4`) |
| Config file | `vite.config.ts` |
| Quick run command | `bun run test:unit -- src/lib/application/question-sets/persist-question-set.test.ts --run` |
| Full suite command | `bun run test:unit -- --run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | Questions table schema/indexes no longer chain-based | integration/unit (Dexie adapter/schema tests) | `bun run test:unit -- --run` | ❌ Wave 0 |
| DATA-02 | `persistQuestionSet` writes one logical row per question | unit | `bun run test:unit -- src/lib/application/question-sets/persist-question-set.test.ts --run` | ✅ |
| DATA-03 | Wipe behavior documented for developers/users | docs + lightweight UI test/manual assertion | `bun run test:unit -- --run` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `bun run test:unit -- src/lib/application/question-sets/persist-question-set.test.ts --run`
- **Per wave merge:** `bun run test:unit -- --run`
- **Phase gate:** Full unit suite green + docs/notice verification before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] Add schema-focused test file (e.g. `src/lib/adapters/persistence/dexie/schema.test.ts`) for DATA-01.
- [ ] Add/adjust persistence tests to assert one write per logical question for multi-step payloads (DATA-02, replacing chain expectations).
- [ ] Add verification check (test or scripted assertion) that wipe messaging/docs/changelog entries exist for DATA-03.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | N/A (local browser app for this phase scope) |
| V3 Session Management | no | N/A |
| V4 Access Control | no | N/A |
| V5 Input Validation | yes | Zod strict schemas at import boundary (`QuestionSetFileSchema`, `LogicalQuestionSchema`) |
| V6 Cryptography | no | N/A for local persistence shape change |

### Known Threat Patterns for Dexie/IndexedDB stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malformed imported question-set payload | Tampering | Strict runtime validation with Zod before persistence |
| Oversized/unexpected nested payload causing runtime instability | DoS | Input size/shape checks + fail-fast parsing path [ASSUMED] |
| Inconsistent local state after schema change | Tampering/Repudiation | Explicit versioned schema + documented wipe expectations |

## Sources

### Primary (HIGH confidence)
- `.planning/phases/02-indexeddb-persistence/02-CONTEXT.md` - locked decisions, constraints, scope
- `.planning/REQUIREMENTS.md` - DATA-01/02/03 and out-of-scope boundaries
- `src/lib/adapters/persistence/dexie/schema.ts` - current Dexie version/index and clean-break precedent
- `src/lib/application/question-sets/persist-question-set.ts` - current fan-out behavior
- `src/lib/importer/question-set.schema.ts` - logical import contract (`shared`, `steps`)
- `package.json` and local `npm view` output - project and latest package versions

### Secondary (MEDIUM confidence)
- [Dexie docs: Version.stores](https://dexie.org/docs/Version/Version.stores()) - schema/version declarations
- [Dexie docs: Version.upgrade](https://dexie.org/docs/Version/Version.upgrade()) - upgrade hook behavior
- [Dexie docs: Dexie.delete](https://dexie.org/docs/Dexie/Dexie.delete()) - full DB deletion semantics
- [MDN structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) - nested object persistence compatibility in IndexedDB

### Tertiary (LOW confidence)
- None

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - strongly anchored in current repo + npm registry checks
- Architecture: HIGH - directly derived from current adapters/ports/application code
- Pitfalls: MEDIUM - mostly code-grounded, with some operational assumptions about rollout messaging

**Research date:** 2026-04-09  
**Valid until:** 2026-05-09
