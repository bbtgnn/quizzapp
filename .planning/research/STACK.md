# Stack Research

**Domain:** Brownfield client-only quiz app — question model refactor (one logical question, multi-step internals)  
**Researched:** 2026-04-09  
**Confidence:** **HIGH** for Dexie/SvelteKit/TS alignment and IndexedDB evolution patterns; **MEDIUM–HIGH** for Zod 4 discriminated-union ergonomics (stable release; a few reported edge cases in complex spreads — mitigate with explicit object schemas per step kind).

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **SvelteKit** | ^2.50.2 (keep) | Routing, build, client-only SPA | Already matches static adapter + `ssr: false`; no change needed for the refactor. |
| **Svelte** | ^5.54.0 (keep) | UI + runes | Existing component model; step UIs are plain components + data. |
| **TypeScript** | ^5.9.3 (keep) | Types for question/steps/session | **Discriminated unions** with a string literal `type` (already used for `ContentConfig` / `AnswerConfig`) should extend to **per-step kinds** and optional **question-level kinds** if multiple topologies are needed. Prefer `satisfies` / narrow unions over `any` for step arrays. |
| **Dexie** | ^4.4.2 (keep) | IndexedDB access | Dexie 4 fits this repo’s `version(n).stores().upgrade()` pattern; supports **schema diffing** so opening still works if version handling is sloppy, but **incrementing `version` on intentional store/index changes remains best practice** and makes upgrades auditable. |
| **bun** | (keep) | Install / scripts | Project convention; use `bun add` for new deps. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **zod** | **^4.3.6** (npm `latest` as of 2026-04-09) | Runtime parse/validate for **imported JSON** and any future export/backup payloads | **Add** as a **runtime** dependency: one schema layer at the boundary (file import → parsed `Question` / step tree) catches malformed bundles early and documents allowed shapes. Model **step variants** with `z.discriminatedUnion('type', [...])` (and nest unions where needed). Use `.safeParse()` in adapters; surface structured errors to teachers/tests. |
| **zod → JSON Schema** | *none by default* | Interop / tooling | Only add **if** you need JSON Schema for **external** tools (e.g. generic editors). Prefer **`zod-to-json-schema`** as a **devDependency** to generate schemas from Zod, not a parallel hand-written JSON Schema + **ajv** stack. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| **Vitest** (existing) | Unit tests for parsers + pure session logic | Add focused tests: valid/invalid JSON fixtures per step kind, migration helpers if you later stop wiping DB. |
| **svelte-check** (existing) | TS + Svelte correctness | Ensures discriminated unions flow into components. |

## Installation

```bash
# Runtime validation (recommended addition)
bun add zod@^4.3.6
```

Optional, only if JSON Schema export is required:

```bash
bun add -D zod-to-json-schema
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| **Zod 4** at import boundary | **JSON Schema + ajv** | You must consume schemas produced **outside** the repo (e.g. only JSON Schema exists, no TS). Otherwise two sources of truth drift from TS. |
| **Zod 4** | **Zod 3** | Avoid for new work: Zod 4 is current on npm; TS 5.9 is compatible. Only stay on 3 if blocked by a dependency (not the case in this repo today). |
| **Zod full** | **Zod Mini** (`zod/mini`) | If bundle-size audits show Zod as a meaningful fraction of the vendor chunk; teacher SPA is unlikely to need this in v1. |
| **Discriminant `type: string`** on each step | Single mega-object with optional fields | Rejected for this milestone: **does not scale** as step kinds multiply; unions + Zod discriminated unions stay aligned. |
| **Bump Dexie `version` + explicit `.stores()`** | Rely only on Dexie 4 implicit schema diff | Use implicit diff as a **safety net**, not the plan: **still bump version** when you change indexes or tables so `upgrade()` runs predictably and code reviews stay clear. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| **Dexie Cloud** | Out of scope (no sync/accounts); adds operational and security surface. | Plain Dexie + static hosting. |
| **Parallel JSON Schema + ajv** (runtime) | Duplicates Zod; larger bundle; two maintenance paths for the same question JSON. | Zod only; generate JSON Schema from Zod if needed. |
| **io-ts / Effect-Schema / TypeBox** (new) | Second ecosystem; team already on idiomatic TS + no validation lib today — pick **one** story. | **Zod** only if adding runtime validation. |
| **Normalizing every step into separate IndexedDB tables** (v1) | Explodes migrations and queries for little benefit while **Dexie wipe** is acceptable and steps are authored as a **unit**. | One `questions` row per logical question with **versioned embedded `steps` JSON** (or typed blob) + indexes only on fields SessionEngine needs (`question_set_id`, etc.). |
| **Heavy migration frameworks** | IndexedDB + “wipe OK” milestone doesn’t justify infrastructure. | `version(n).stores(...).upgrade(tx => { ... })` when you eventually need in-browser migration. |

## Stack Patterns by Variant

**If steps are only validated at import (bundled JSON + file upload):**

- Define **Zod schemas** next to `$lib/model` (or a `schemas/` module); parse once when loading files; persist **already validated** objects into Dexie.
- Keep **TypeScript types** as `z.infer<typeof QuestionSchema>` **or** manually mirror — **prefer `z.infer`** for the imported payload types to avoid drift.

**If you add author-edited JSON in the UI later:**

- Reuse the **same Zod schema** in the editor save path; optionally show Zod issue paths in UI.

**If IndexedDB wipe stops being acceptable:**

- Add **Dexie `version` + `upgrade()`** that reads old rows and writes new shape (or bulk-delete + re-import from bundled assets).
- Keep a **`schemaVersion` (or `contentVersion`) inside the persisted question JSON** for **logical** evolution *inside* a single store version (e.g. new optional fields), distinct from Dexie’s **physical** version (tables/indexes).

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `zod@^4.3.6` | `typescript@^5.9` | Zod 4 targets modern TS; keep `strict` on. |
| `dexie@^4.4.2` | Current schema API | Already on v4; v4 **can** reconcile schema without a bumped version, but **still bump** on deliberate changes (per Dexie guidance). |
| `zod@4` | SvelteKit/Vite 7 | Standard ESM; no special Vite config expected. |

## Sources

- **Project:** `.planning/PROJECT.md` — milestone scope (wipe OK, chain removal, flexible steps).  
- **Repo stack:** `.planning/codebase/STACK.md` — pinned versions (Dexie 4.4.2, SvelteKit 2.50.x, TS 5.9.x).  
- **Repo schema pattern:** `src/lib/adapters/persistence/dexie/schema.ts` — `version(1)` / `version(2)` with `.upgrade()`.  
- **Dexie:** [Dexie.js documentation](https://dexie.org/docs) — `db.version(n).stores()`, versioning notes for Dexie 3+ / 4+ (schema declaration, upgrades). *Confidence: HIGH.*  
- **Zod:** [zod.dev / v4](https://zod.dev) — v4 release line; discriminated unions. **npm `zod@latest` → 4.3.6** (registry, 2026-04-09). *Confidence: HIGH for version; MEDIUM–HIGH for advanced union composition edge cases — test affected shapes.*  

---
*Stack research for: Quizzapp — multi-step question model (IndexedDB + import validation)*  
*Researched: 2026-04-09*
