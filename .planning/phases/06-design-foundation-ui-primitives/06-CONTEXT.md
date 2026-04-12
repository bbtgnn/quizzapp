# Phase 6: Design foundation & UI primitives - Context

**Gathered:** 2026-04-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver a **shared visual system** for upcoming funnel and run restyles: **theme tokens** (Tailwind v4 / `layout.css`), **typography roles** (display / title / body / label), **button** primitives (including CMP-01 large high-visibility patterns), and **panel/card** primitives—**proven on a small pilot surface** plus **short docs** on applying tokens. Does **not** restyle full flows yet (later phases); does **not** change SessionEngine or behavior.

</domain>

<decisions>
## Implementation Decisions

### Color & stage atmosphere
- **D-01:** **Dark “stage”** base (deep background) with **elevated surfaces** (cards/panels) for structured content.
- **D-02:** **Light text on the stage** where appropriate; **saturated accent colors** for quiz-show energy.
- **D-03:** **Body copy and long-form text** live primarily on **elevated surfaces** so contrast stays **WCAG-minded** (avoid low-contrast text directly on saturated accent fields).

### Typography
- **D-04:** **One webfont** for **display and title** roles; **system UI stack** for **body** and **label**.
- **D-05:** Display/title personality: **rounded, friendly, classroom-safe** — approachable quiz energy, still readable at large sizes.
- **D-06:** Exact font family/files and loading strategy: **Claude’s discretion** within the above personality; must be documented in the token/application docs.

### Button system (CMP-01)
- **D-07:** **Pill-shaped primary** CTAs; **secondary and tertiary** controls **more rectangular** (clear visual hierarchy vs primary).
- **D-08:** Include **destructive** variant where needed for shared primitives.
- **D-09:** **Minimum ~44px touch targets** (or equivalent documented minimum) for primary actions — **documented in theme/token docs** alongside utility usage.

### Panels & surfaces
- **D-10:** **Floating card / panel** primitive: **noticeable radius + shadow**, clear separation from the stage background (depth over flat banding).

### Pilot & proof
- **D-11:** Prove button + panel + tokens on a **dedicated route** (style / design preview), **outside the main teacher funnel** — easy to iterate without blocking real flows.
- **D-12:** Exact route path and nav discoverability: **Claude’s discretion** (may be dev-only or lightly linked; must be stated in docs).

### Claude's Discretion
- Specific **token names**, **palette values**, **shadow/radius scales**, **secondary/tertiary** exact styles, **webfont choice** (within rounded-friendly brief), **style-lab route path**, and **motion** (reserved for Phase 10; only document hooks if needed).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requirements & scope
- `.planning/REQUIREMENTS.md` — **TOK-01** (tokens + Tailwind theme), **CMP-01** (large primary actions, touch targets, distinguishable secondary/tertiary).
- `.planning/PROJECT.md` — v1.1 funnel-only quiz-show scope; management routes stay baseline; accessibility and reduced-motion expectations.
- `.planning/ROADMAP.md` — Phase 6 goal, success criteria (tokens, typography roles, button + panel proof, docs).

### Codebase & stack
- `.planning/codebase/STACK.md` — SvelteKit, Tailwind v4, Vite, `layout.css` entry.
- `.planning/codebase/CONVENTIONS.md` — Svelte/Tailwind/Prettier conventions, `src/routes/layout.css` reference.
- `src/routes/layout.css` — Current Tailwind v4 import and plugins (`forms`, `typography`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/components/CodeBlock.svelte`, `MarkdownContent.svelte` — content rendering only; **no shared design-system components** yet for chrome/buttons/panels.

### Established Patterns
- **Tailwind v4** via `@import 'tailwindcss'` and `@tailwindcss/vite`; global stylesheet is **`src/routes/layout.css`** (minimal today — theme extension is greenfield).
- **Svelte 5** runes; **PascalCase** Svelte components under `src/lib/components/`.

### Integration Points
- Theme tokens and `@theme` / Tailwind extensions should wire through **`layout.css`** (and any future shared UI modules under `$lib`) so **funnel and run phases** consume the same utilities.
- **Pilot style-lab route** under `src/routes/` for isolated composition of primitives.

</code_context>

<specifics>
## Specific Ideas

- **Dark stage + floating cards** for game-show depth without sacrificing readable body text on surfaces.
- **Rounded friendly** display type + **pill primaries** for approachable, tactile CTAs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 6 scope.

</deferred>

---

*Phase: 06-design-foundation-ui-primitives*
*Context gathered: 2026-04-12*
