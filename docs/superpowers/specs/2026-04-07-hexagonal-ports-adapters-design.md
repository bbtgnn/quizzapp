# Hexagonal architecture (ports & adapters) — design

## Goal

Organize **business logic** in **domain** and **application** layers behind explicit **ports** (interfaces), with **Dexie** confined to **adapter** implementations. Improve **testability** by swapping persistence (and other outgoing dependencies) via **central composition** in `$lib/app/`, without changing product behavior.

This complements the existing **SvelteKit `load` + Dexie** direction ([`2026-04-07-sveltekit-load-dexie-design.md`](./2026-04-07-sveltekit-load-dexie-design.md)): loaders should call **application services** or **documented read ports** rather than importing Dexie or concrete adapters by default.

## Decisions (agreed)

| Topic | Choice |
|--------|--------|
| Migration style | **Greenfield target layout first**, then move code in **staged** slices (no single mandatory big-bang). |
| Route / loader boundary | **Hybrid (default strict):** Prefer **`$lib/app`** (pre-wired services). **Documented exceptions** allow trivial **read-only** list/detail loaders to call **read ports** directly when a service adds no orchestration. |
| Types | **Pragmatic:** Reuse current entity shapes as default port/service types; add **mappers** or separate domain types **only** where persistence shape and core needs diverge. |
| Wiring | **Central composition:** `$lib/app/` exports production-ready services (and optional test-oriented factory overloads); not scattered `new` in every route. |

## Target layout (`src/lib/`)

| Area | Responsibility | Allowed dependencies |
|------|----------------|----------------------|
| **`domain/`** | Pure behavior: `SessionEngine`, question-selector, student-orderer, small helpers. | Other `domain/` code, **port types only** (interfaces from `ports/`), shared primitives. **No** Dexie, **no** Svelte. |
| **`ports/`** | Outgoing **interfaces**: e.g. `SessionRepository`, `AttemptRepository`, `ClassroomRepository`, `QuestionSetRepository`. Async methods aligned with current repository operations unless a slimmer port is justified. | Entity / DTO types (shared model). **No** implementations. |
| **`application/`** | **Use cases:** orchestrate domain + ports (create session, import question set, complete session, etc.). | `domain/`, `ports/`, shared types. **No** Dexie, **no** Svelte. |
| **`adapters/persistence/dexie/`** | `QuizAppDB` / schema, IndexedDB access, repository **implementations** of `ports/`. | Dexie, `ports/`, shared types. **Only** place for Dexie table APIs for app data. |
| **`app/`** | **Composition root:** construct default adapter instances, wire **application services**, export what routes and tests should use. | `application/`, `adapters/`, `ports/` as needed for typing. **No** Svelte. |

**Importer:** Becomes **application** orchestration (and/or domain parsing) using **ports**; no direct Dexie outside `adapters/persistence/dexie/`.

**Cross-cutting modules** (e.g. `backup`, loaders under `data/loaders/`): Either consume **`$lib/app`** services / ports, or move logic into **application** and keep files as thin wrappers—same dependency rules as routes.

## Data flow

1. **Default:** `+page.ts` / `+page.svelte` → **`$lib/app`** service → **port** → **Dexie adapter** → IndexedDB.
2. **Documented exception:** Simple read-only **list/detail** `load` may call a **read method on a port** (obtained via `app` factory or a small exported “read facade”) if no application rule applies; the **list of allowed routes** lives in this spec’s **Route import policy** section and should stay short and reviewed when changed.
3. **Session run:** Loaders supply DTOs; **`SessionEngine`** continues to receive **injectable persistence**; align option callbacks with the **port** surface over time so tests use the same contracts as production.

## Route import policy (hybrid default)

**Default:** Routes and universal loaders **must not** import from `adapters/persistence/dexie/**` or open `QuizAppDB` directly. They import from **`$lib/app`** (or types-only from `ports/` / shared types if needed).

**Exceptions (reads only):** Routes may call **read port** operations **without** an application service **only** when all hold:

- The operation is a **straight query** (no branching business rules, no multi-aggregate orchestration).
- The team adds the route path to the **exception list** below in the same PR as the exception.

**Exception list (initially empty):** Populate during implementation when a route is granted an exception.

**Writes and non-trivial flows:** Always go through **`application/`** services exposed from **`$lib/app`**.

## Error handling

- **Adapters:** Surface persistence failures as **rejected promises / thrown errors**, matching how repository functions behave today unless a slice explicitly introduces a different contract; adapters stay unaware of Svelte.
- **Application services:** Map failures to outcomes the UI can handle (typed errors, domain-specific messages) where the product requires it; avoid leaking Dexie-specific types past adapters.

## Testing

- **Application services:** Unit tests with **in-memory or stub** port implementations (no IndexedDB).
- **Domain (`SessionEngine`, strategies):** Rely on **injection**; no Dexie in domain tests.
- **Dexie adapters:** Optional **browser Vitest** integration tests for index/query-heavy behavior; not mandatory for every thin CRUD wrapper.

## Staged migration

1. Introduce **`ports/`**, **`application/`**, **`adapters/persistence/dexie/`**, **`app/`**; **move** existing schema and repository implementations into **`adapters/persistence/dexie/`** with **behavior-preserving** re-exports from legacy paths if needed to keep diffs reviewable.
2. Add **port interfaces**; adapters **implement** them (explicit `implements` or structural typing per project convention).
3. Implement **`$lib/app`** wiring and **one vertical slice** (recommended first slice: **sessions** — list/create/run touch engine + repositories).
4. Repeat by bounded context: **classrooms**, **question-sets**, **history**, **importer**, **settings**, **backup** as needed.
5. Remove **barrel exports** that expose **`db`** or encourage skipping ports; narrow route imports toward **`$lib/app`** and the documented read exceptions.

## Relationship to `.planning` and conventions

- Update **`.planning/codebase/ARCHITECTURE.md`** and **`CONVENTIONS.md`** after implementation so they describe **ports**, **adapters**, and **`app/`** instead of only “repositories under `db/`”.
- **Schema migrations** remain the responsibility of the Dexie adapter layer; versioning rules in existing planning docs still apply.

## Non-goals

- Moving persistence to the server or introducing **`+page.server.ts`** for Dexie.
- A full **domain-driven** redesign of entity names or aggregates unless a slice explicitly needs it (pragmatic types remain default).
- Mandatory **ESLint import boundaries** in the first iteration (optional follow-up).

## Open items (none for v1 spec)

All sections above are explicit enough to derive an implementation plan; the **exception list** is intentionally empty until the first exception is granted in code review.
