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
- **D-02:** **Light text on the stage** (chrome, labels outside cards) where appropriate; **saturated accent colors** for quiz-show energy.
- **D-03:** **Question / content cards:** **white (or near-white) surface** with **dark text** for primary reading — high legibility on the card interior.
- **D-13:** **Animated CSS stage background** — e.g. a **sliding grid** or similar looping motion on the dark stage (pure CSS preferred). When **`prefers-reduced-motion: reduce`**, use a **static or minimally animated** fallback (no busy grid motion).

### Typography
- **D-04:** **One webfont** for **display and title** roles; **system UI stack** for **body** and **label**.
- **D-05:** Display/title personality: **rounded, friendly, classroom-safe** — approachable quiz energy, still readable at large sizes.
- **D-06:** Exact font family/files and loading strategy: **Claude’s discretion** within the above personality; must be documented in the token/application docs.
- **D-14:** **Global scale:** set **`html { font-size: 112.5%; }`** (18px root from default 16px) so **Tailwind `rem`-based spacing and type utilities** scale up **uniformly**; document in token docs and sanity-check small viewports / overflow.

### Button system (CMP-01)
- **D-07:** **Pill-shaped primary** CTAs; **secondary and tertiary** controls **more rectangular** (clear visual hierarchy vs primary).
- **D-08:** Include **destructive** variant where needed for shared primitives.
- **D-09:** **Minimum ~44px touch targets** (or equivalent documented minimum) for primary actions — **documented in theme/token docs** alongside utility usage.
- **D-15 (run / step layout):** **Answer actions live outside** the question card (not inside the white card). **Each answer option uses a distinct color** (multicolor answers) so choices read as separate “buzzers.” **When a step has no answer buttons**, layout is **card-centered** as the focal element (no empty button rail).

### Panels & surfaces
- **D-10:** **Floating card / panel** primitive: **noticeable radius + shadow**, clear separation from the stage background (depth over flat banding). Default **question card** treatment per **D-03** (white surface, dark type inside).

### Pilot & proof
- **D-11:** Prove button + panel + tokens on a **dedicated route** (style / design preview), **outside the main teacher funnel** — easy to iterate without blocking real flows.
- **D-12:** Exact route path and nav discoverability: **Claude’s discretion** (may be dev-only or lightly linked; must be stated in docs).

### Pointer & chrome
- **D-16:** **Large custom cursor** on quiz-show **in-scope** surfaces where it fits the aesthetic; **must not break usability** — omit or fall back to default on **`pointer: coarse`** (touch) and preserve **visible focus** styles for keyboard users. Cursor graphic and hotspot: **Claude’s discretion**.

### Claude's Discretion
- Specific **token names**, **palette values** (including **per-answer accent colors**), **shadow/radius scales**, **secondary/tertiary** exact styles, **webfont choice** (within rounded-friendly brief), **style-lab route path**, **sliding-grid** implementation details, **cursor** asset, and **non-stage** motion (Phase 10 micro-interactions — stage background animation covered by **D-13**).

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
- **Animated CSS stage** — e.g. **sliding grid** behind content; calm down for **reduced motion**.
- **White question card, dark type inside**; **colorful answer pills outside** the card (or **centered card only** when no choices).
- **Root `font-size: 112.5%`** for a globally **bigger** UI via Tailwind rem tokens.
- **Oversized custom cursor** on pointer devices for extra “show” feel.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within Phase 6 scope.

</deferred>

---

*Phase: 06-design-foundation-ui-primitives*
*Context gathered: 2026-04-12*
