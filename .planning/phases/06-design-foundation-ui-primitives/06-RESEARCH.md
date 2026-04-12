# Phase 6: Design foundation & UI primitives - Research

**Researched:** 2026-04-12  
**Domain:** Tailwind CSS v4 design tokens, Svelte 5 UI primitives, Vitest browser component tests  
**Confidence:** HIGH (tokens/patterns verified against Tailwind v4.2 docs + repo config); MEDIUM (font delivery and motion specifics — executor discretion per CONTEXT)

## Summary

Phase 6 should treat **`src/routes/layout.css` as the single source of theme truth**: use Tailwind v4’s **`@theme`** so every token (colors, radii, shadows, spacing extensions, font families, text steps) generates **first-class utilities** and **`var(--token)`** for arbitrary CSS [CITED: https://tailwindcss.com/docs/theme]. Typography **roles** (display / title / body / label) should compose **theme variables**; the most maintainable approach is **`@utility`** (or tightly scoped `@layer base` rules) that bind **font family, size, weight, and line-height** per `06-UI-SPEC.md`, keeping markup as `class="text-role-display"`-style APIs instead of repeating six utilities on every heading [CITED: https://tailwindcss.com/docs/adding-custom-styles].

**Buttons and panels** should be **Svelte components** under `src/lib/components/` (PascalCase) that apply **token-backed Tailwind classes** — native `<button>` elements, **`focus-visible` rings**, and **minimum 44×44px** touch targets for primary/destructive-as-primary per **CMP-01** and **D-09**. Prove everything on a **dedicated style-lab route** (path per **D-12**) without touching SessionEngine or production funnel flows.

**Primary recommendation:** Extend `layout.css` with `@theme` + a small set of **`@utility` typographic roles**, add **`Button.svelte`** and **`Panel.svelte`** (or `Card.svelte`) using those tokens, ship **`/style-lab` (or chosen path)** with preview + docs link, and cover primitives with **Vitest browser tests** (`vitest-browser-svelte` + `page.getByRole`).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

Content from **`## Implementation Decisions`** in `.planning/phases/06-design-foundation-ui-primitives/06-CONTEXT.md` (verbatim structure and rules):

#### Color & stage atmosphere

- **D-01:** **Dark “stage”** base (deep background) with **elevated surfaces** (cards/panels) for structured content.
- **D-02:** **Light text on the stage** (chrome, labels outside cards) where appropriate; **saturated accent colors** for quiz-show energy.
- **D-03:** **Question / content cards:** **white (or near-white) surface** with **dark text** for primary reading — high legibility on the card interior.
- **D-13:** **Animated CSS stage background** — e.g. a **sliding grid** or similar looping motion on the dark stage (pure CSS preferred). When **`prefers-reduced-motion: reduce`**, use a **static or minimally animated** fallback (no busy grid motion).

#### Typography

- **D-04:** **One webfont** for **display and title** roles; **system UI stack** for **body** and **label**.
- **D-05:** Display/title personality: **rounded, friendly, classroom-safe** — approachable quiz energy, still readable at large sizes.
- **D-06:** Exact font family/files and loading strategy: **Claude’s discretion** within the above personality; must be documented in the token/application docs.
- **D-14:** **Global scale:** set **`html { font-size: 112.5%; }`** (18px root from default 16px) so **Tailwind `rem`-based spacing and type utilities** scale up **uniformly**; document in token docs and sanity-check small viewports / overflow.

#### Button system (CMP-01)

- **D-07:** **Pill-shaped primary** CTAs; **secondary and tertiary** controls **more rectangular** (clear visual hierarchy vs primary).
- **D-08:** Include **destructive** variant where needed for shared primitives.
- **D-09:** **Minimum ~44px touch targets** (or equivalent documented minimum) for primary actions — **documented in theme/token docs** alongside utility usage.
- **D-15 (run / step layout):** **Answer actions live outside** the question card (not inside the white card). **Each answer option uses a distinct color** (multicolor answers) so choices read as separate “buzzers.” **When a step has no answer buttons**, layout is **card-centered** as the focal element (no empty button rail).

#### Panels & surfaces

- **D-10:** **Floating card / panel** primitive: **noticeable radius + shadow**, clear separation from the stage background (depth over flat banding). Default **question card** treatment per **D-03** (white surface, dark type inside).

#### Pilot & proof

- **D-11:** Prove button + panel + tokens on a **dedicated route** (style / design preview), **outside the main teacher funnel** — easy to iterate without blocking real flows.
- **D-12:** Exact route path and nav discoverability: **Claude’s discretion** (may be dev-only or lightly linked; must be stated in docs).

#### Pointer & chrome

- **D-16:** **Large custom cursor** on quiz-show **in-scope** surfaces where it fits the aesthetic; **must not break usability** — omit or fall back to default on **`pointer: coarse`** (touch) and preserve **visible focus** styles for keyboard users. Cursor graphic and hotspot: **Claude’s discretion**.

#### Answer feedback motion (run / style-lab)

- **D-17:** **Different treatment after answering** — **positive** outcomes get **celebratory feedback** (e.g. **confetti** or equivalent burst); **negative** outcomes get **clear “wrong” affordance** (e.g. **question card shake** or similar). These are **examples**, not an exhaustive list — same *class* of juice (success vs error) must read instantly.
- **D-18:** **Implementation stack:** prefer **CSS / Svelte transitions / Web Animations** first. Use **[anime.js](https://animejs.com/)** (or similar small animation lib) **only when needed** for sequencing or effects that are impractical in CSS — **justify in the plan** (bundle size, where it loads). **`prefers-reduced-motion: reduce`:** replace confetti/shake with **minimal or no motion** (e.g. brief color flash, static icon, or instant state change only).

### Claude's Discretion

From **### Claude's Discretion** in the same CONTEXT file:

- Specific **token names**, **palette values** (including **per-answer accent colors**), **shadow/radius scales**, **secondary/tertiary** exact styles, **webfont choice** (within rounded-friendly brief), **style-lab route path**, **sliding-grid** implementation details, **cursor** asset, **confetti/shake** (or alt FX) specifics, **whether anime.js** ships vs CSS-only, and **other** motion polish (Phase 10 — e.g. page transitions; stage background remains **D-13**).

### Deferred Ideas (OUT OF SCOPE)

From **`## Deferred Ideas`** in `.planning/phases/06-design-foundation-ui-primitives/06-CONTEXT.md`:

- None — discussion stayed within Phase 6 scope.

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| **TOK-01** | Cohesive quiz-show theme as **design tokens** (color roles, radii, shadows, spacing) applied via **Tailwind theme extension** / equivalent | Use **`@theme`** in `layout.css` so tokens map to utilities and `var(--color-*)` [CITED: https://tailwindcss.com/docs/theme]; document usage in short project doc |
| **CMP-01** | **Large, high-visibility** primary actions; min touch target + typographic weight **documented**; secondary/tertiary **distinguishable** | Implement **`Button`** variants per **06-UI-SPEC** (pill primary, rectangular secondary/tertiary, destructive); use **`min-h` / `min-w`** ≥ 44px where spec requires; test focus + roles in Vitest browser |

</phase_requirements>

## Project Constraints (from .cursor/rules/)

From `.cursor/rules/gsd.mdc` (actionable for this phase):

- **Stack:** Stay on **SvelteKit + TypeScript**; keep **SessionEngine** and domain **testable** — Phase 6 must not change engine behavior or persistence contracts.
- **Styling entry:** Global Tailwind pipeline is **`src/routes/layout.css`** (already imported from root layout); **Prettier** sorts classes with **`prettier-plugin-tailwindcss`** referencing that file — keep token and component classes compatible with that workflow [VERIFIED: `.planning/codebase/CONVENTIONS.md`, `package.json`].
- **Workflow:** Prefer driving multi-step implementation through **GSD execute/plan** flows when changing the repo (orchestrator already engaged for this milestone).
- **Components:** **PascalCase** Svelte components under **`src/lib/components/`** [VERIFIED: CONVENTIONS.md].

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **tailwindcss** | **^4.1.18** (repo); **4.2.2** latest on registry [VERIFIED: `package.json`; VERIFIED: npm registry] | Token namespaces → utilities (`bg-*`, `text-*`, `rounded-*`, `shadow-*`, etc.) | Official v4 model is **`@theme` variables**, not JS `tailwind.config` [CITED: https://tailwindcss.com/docs/theme] |
| **@tailwindcss/vite** | **^4.1.18** [VERIFIED: `package.json`] | Vite integration for Tailwind v4 | Already wired in `vite.config.ts` [VERIFIED: `vite.config.ts`] |
| **Svelte** | **^5.54.0** [VERIFIED: `package.json`] | Runes, components | Project standard [VERIFIED: STACK.md] |
| **SvelteKit** | **^2.50.2** [VERIFIED: `package.json`] | Routes, style-lab page | Project standard |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **@tailwindcss/forms** | **^0.5.11** [VERIFIED: `package.json`] | Sensible default form control styling | Keep enabled in `layout.css`; ensures future funnel forms match tokens |
| **@tailwindcss/typography** | **^0.5.19** [VERIFIED: `package.json`] | `prose` for markdown-heavy content | Use inside **card surfaces** only where markdown blocks need it (e.g. existing content components) — do not replace the four **UI-SPEC** roles |
| **vitest** + **@vitest/browser-playwright** | **^4.1.0** [VERIFIED: `package.json`] | Browser-mode tests for `.svelte` specs | Required for **Button/Panel** interaction and a11y assertions |
| **vitest-browser-svelte** | **^2.0.2** [VERIFIED: `package.json`] | `render()` for Svelte in browser tests | Same pattern as `Welcome.svelte.spec.ts` [VERIFIED: `src/lib/vitest-examples/Welcome.svelte.spec.ts`] |
| **anime.js** | — | Sequenced motion | **Do not add by default** — only if plan justifies per **D-18** |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| **`@theme` utilities** | Raw `:root` CSS variables only | Loses automatic utility generation; contradicts TOK-01 “utilities” requirement [CITED: https://tailwindcss.com/docs/theme] |
| **shadcn / external UI kit** | Custom primitives | **Explicitly out** per **06-UI-SPEC** (`shadcn_initialized: false`) |
| **`@layer components` only** | **`@utility` roles** | Both valid in v4; **`@utility`** keeps role APIs variant-friendly and consistent with utility-first idiom [CITED: https://tailwindcss.com/docs/adding-custom-styles] |

**Installation:** No new packages required for baseline tokens + primitives; optional **`anime.js`** only after CSS/Svelte path ruled out.

**Version note:** `npm view tailwindcss version` reports **4.2.2** [VERIFIED: npm registry]. Stay on the repo’s **lockfile** for Phase 6 unless a separate chore bumps Tailwind; document any bump in the plan if undertaken.

## Architecture Patterns

### Recommended project structure

```
src/
├── routes/
│   ├── layout.css              # @import tailwind; @plugin …; @theme { … }; @utility …; base html font-size
│   └── {style-lab}/            # Pilot route (exact path: D-12)
│       └── +page.svelte
├── lib/
│   └── components/
│       ├── Button.svelte       # variants: primary | secondary | tertiary | destructive
│       ├── Panel.svelte        # generic elevated surface
│       └── QuestionCard.svelte # optional: white interior + dark type (D-03) — or variant prop on Panel
└── …
```

### Pattern 1: Theme tokens via `@theme`

**What:** Define semantic colors (`--color-stage`, `--color-primary`, `--color-answer-a`, …), radii (`--radius-*`), shadows (`--shadow-*`), spacing overrides if needed (`--spacing-*`), and font families (`--font-display`, body uses default `--font-sans` overridden to system stack).

**When to use:** Always for values that must appear as **Tailwind utilities** across funnel/run later phases.

**Example:**

```css
/* Source: https://tailwindcss.com/docs/theme */
@import 'tailwindcss';

@theme {
	--color-stage: oklch(0.2 0.02 270);
	--color-primary: oklch(0.55 0.22 15);
	--font-display: 'Nunito', ui-sans-serif, system-ui, sans-serif;
	/* …remaining tokens per 06-UI-SPEC… */
}
```

### Pattern 2: Typography roles

**What:** One **`@utility`** per role (or equivalent `@layer base` selectors) that sets **family + size + weight + line-height** to match **06-UI-SPEC** table (display clamp, title `1.5rem`, body `1rem`, label `0.875rem`; weights **400** and **600** only).

**When to use:** Every screen that needs consistent quiz-show hierarchy without copy-pasting four utilities.

**Example:**

```css
/* Source: https://tailwindcss.com/docs/adding-custom-styles */
@utility text-role-display {
	font-family: var(--font-display);
	font-weight: 600;
	line-height: 1.2;
	font-size: clamp(2rem, 4vw, 2.75rem);
}
```

(Adjust utility names to match final token naming; keep **body/label** on **system** stack per **D-04**.)

### Pattern 3: Primitives as thin Svelte wrappers

**What:** **`Button.svelte`** accepts `variant`, `class`, native button props; applies **token classes** (`bg-primary`, `rounded-full` for primary, etc.). **`Panel.svelte`** applies **`bg-card`**, **`shadow-*`**, **`rounded-*`**.

**When to use:** CMP-01 consistency and a single place for **focus-visible** and **disabled** styling.

### Pattern 4: Style-lab pilot

**What:** A route that composes **stage shell** (dark bg + CSS motion behind **`prefers-reduced-motion`**), **question card**, **multicolor answer row**, and **variant matrix** for buttons — copy seeded per **06-UI-SPEC** copywriting contract.

**When to use:** Proof for success criteria #3 without risking teacher flows (**D-11**).

### Anti-patterns to avoid

- **Nesting `@theme` inside selectors:** Not allowed — theme variables must be **top-level** [CITED: https://tailwindcss.com/docs/theme].
- **Hardcoding hex in components** instead of **`bg-*` / `text-*`** from tokens: breaks TOK-01 traceability.
- **Custom cursor without `pointer: coarse` fallback or without `:focus-visible`:** Violates **D-16** and WCAG keyboard expectations [ASSUMED: WCAG 2.x focus visibility practice; aligned with **06-UI-SPEC**].

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token → utility mapping | Ad-hoc CSS classes per page | **`@theme`** | Tailwind generates **`bg-stage`**, **`text-primary`**, etc., and **`var(--color-*)`** for raw CSS [CITED: https://tailwindcss.com/docs/theme] |
| Accessible buttons | `<div onclick>` | **`<button type="button">`** + variants | Free keyboard + form semantics |
| Focus styling | Removing outline without replacement | **`focus-visible:ring-*`** using **accent** token | **D-16** / CMP visibility |
| Stage animation | JS-driven layout thrash for grid | **CSS `@keyframes` + `transform`** on a pseudo-element layer | Matches **D-13**; easier **`prefers-reduced-motion`** branch |
| Component tests in Node | `jsdom` Svelte tests for layout | **Vitest browser project** + **`vitest-browser-svelte`** | Matches existing config [VERIFIED: `vite.config.ts`] |

**Key insight:** Tailwind v4’s **`@theme`** is the sanctioned “design system API”; duplicating variables outside it creates two sources of truth and undermines TOK-01.

## Common Pitfalls

### Pitfall 1: `html { font-size: 112.5%; }` surprises

**What goes wrong:** All **`rem`**-based spacing and type grow ~12.5%; layouts may wrap earlier on narrow viewports.

**Why it happens:** **D-14** intentionally scales the whole Tailwind **rem** grid.

**How to avoid:** Document in token docs; smoke-test style-lab at **320px** width; use **`clamp`** for display role (already in UI-SPEC).

**Warning signs:** Unexpected horizontal scroll on the pilot page.

### Pitfall 2: Reduced motion ignored

**What goes wrong:** Animated stage grid remains busy; confetti/shake runs for vestibular-sensitive users.

**Why it happens:** Missing **`@media (prefers-reduced-motion: reduce)`** branches.

**How to avoid:** One CSS block that disables animation / substitutes static background per **D-13** and **D-18** [ASSUMED: `prefers-reduced-motion` behavior per CSS/media queries standard; requirement locked in CONTEXT].

**Warning signs:** OS “reduce motion” has no effect in devtools emulation.

### Pitfall 3: Answer colors vs contrast

**What goes wrong:** Multicolor buzzers fail **text/ icon contrast** on hover/disabled states.

**Why it happens:** Saturated hues without paired **foreground** tokens.

**How to avoid:** Define **per-slot** foreground or use **white/near-white** label text only where contrast passes; document pairs in token docs [ASSUMED: WCAG contrast targets; verify with automated contrast check in manual QA].

### Pitfall 4: Icon-only controls in the lab

**What goes wrong:** Demo buttons with icons only and no accessible name.

**Why it happens:** Pilot page shortcuts.

**How to avoid:** **06-UI-SPEC** requires **`aria-label`** or visually hidden text for icon-only controls.

## Code Examples

### Tailwind `@theme` + utility consumption

```css
/* Source: https://tailwindcss.com/docs/theme */
@import 'tailwindcss';

@theme {
	--color-mint-500: oklch(0.72 0.11 178);
}
```

```html
<!-- Source: https://tailwindcss.com/docs/theme -->
<div class="bg-mint-500 text-white rounded-lg shadow-md"></div>
```

### Vitest browser component test (project pattern)

```typescript
// Source: src/lib/vitest-examples/Welcome.svelte.spec.ts (pattern)
import { page } from 'vitest/browser';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Button from './Button.svelte';

describe('Button.svelte', () => {
	it('exposes accessible name for primary', async () => {
		render(Button, { variant: 'primary', children: 'Start' });
		await expect.element(page.getByRole('button', { name: 'Start' })).toBeInTheDocument();
	});
});
```

### Svelte 5 primitive sketch (implementation detail — use runes)

```svelte
<!-- Source: [ASSUMED: Svelte 5 $props — verify at https://svelte.dev/docs/svelte/$props] -->
<script lang="ts">
	type Variant = 'primary' | 'secondary' | 'tertiary' | 'destructive';

	let {
		variant = 'primary',
		class: className = '',
		children,
		...rest
	}: { variant?: Variant; class?: string; children?: import('svelte').Snippet } & Record<string, unknown> = $props();
</script>

<button
	type="button"
	class="font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 {className}"
	data-variant={variant}
	{...rest}
>
	{@render children?.()}
</button>
```

*(Final class strings must come from token-backed utilities per variant — this is structural only.)*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tailwind v3 **`tailwind.config.js` theme extension** | v4 **`@theme` in CSS** | Tailwind v4 [CITED: https://tailwindcss.com/docs/theme] | Plan must edit **`layout.css`**, not add legacy config unless project already has one (it does not) [VERIFIED: repo] |
| Global `.btn` classes only | **Utility-first + thin components** | Project + UI-SPEC | Keeps **Prettier Tailwind** sorting effective |

**Deprecated/outdated:** Maintaining parallel **non-`@theme`** CSS variables for the same semantic colors — use **`@theme`** so utilities stay generated [CITED: https://tailwindcss.com/docs/theme].

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | **`@utility` typographic roles** are acceptable to the team vs only atomic utilities | Architecture Patterns | Mild refactor if reviewers want pure utility composition |
| A2 | **WCAG-style contrast** checking is done manually or in a later automated pass | Pitfalls | Palette may need adjustment for answer slots |
| A3 | **`prefers-reduced-motion`** is sufficient for **D-13/D-18** without `data-` attributes | Common Pitfalls | May need extra hooks for future per-user toggles |

## Open Questions

1. **Exact webfont files vs Google Fonts link?**
   - What we know: **D-06** is executor discretion; must document.
   - What's unclear: Self-host under `static/` vs CDN.
   - Recommendation: Prefer **self-hosted `woff2` + `font-display: swap`** in `layout.css` for static hosting predictability [ASSUMED: performance best practice; confirm with product constraints].

2. **Should Tailwind be bumped from 4.1.x to 4.2.x during this phase?**
   - What we know: Registry shows **4.2.2** [VERIFIED: npm registry].
   - What's unclear: Changelog impact on `@theme` / Vite plugin.
   - Recommendation: **Stay on lockfile** unless a security or bugfix forces bump; treat bump as separate chore with **`bun run check` + full test run**.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|-------------|-----------|---------|----------|
| **Bun or Node** | dev + scripts | ✓ [ASSUMED: author machine] | — | Use `npm run` per `package.json` |
| **Chromium** | Vitest browser / Playwright | ✓ [ASSUMED] | Bundled with Playwright | Install Playwright browsers if missing |
| **Network** | Optional font CDN | ✓/✗ | — | Self-host fonts in `static/` |

**Missing dependencies with no fallback:**

- None for code-only delivery if dev environment already runs the app.

**Missing dependencies with fallback:**

- If Playwright browsers missing: `bunx playwright install chromium` [ASSUMED: standard Playwright setup].

**Step 2.6 note:** External services **not** required for Phase 6 (no API keys).

## Validation Architecture

> `workflow.nyquist_validation` is **true** in `.planning/config.json` [VERIFIED].

### Test framework

| Property | Value |
|----------|-------|
| Framework | **Vitest 4.1.x** + **@vitest/browser-playwright** [VERIFIED: `package.json`, `vite.config.ts`] |
| Config file | **`vite.config.ts`** (`test.projects`) |
| Quick run command | `bun run test:unit -- --run --project client` (filter paths as needed) |
| Full suite command | `bun run test:unit -- --run` then `bun run check` |

### Phase requirements → test map

| Req ID | Behavior | Test type | Automated command | File exists? |
|--------|----------|-----------|-------------------|--------------|
| **TOK-01** | Tokens compile; utilities resolve (smoke via component classes) | Browser / build | `bun run build` + client tests touching primitives | Build script ✅ [VERIFIED: `package.json`]; new `Button.svelte.spec.ts` ❌ Wave 0 |
| **CMP-01** | Primary button large enough; roles/labels; focusable | Browser | `bun run test:unit -- --run --project client src/lib/components/Button.svelte.spec.ts` | ❌ Wave 0 |

### Sampling rate

- **Per task commit:** `bun run test:unit -- --run --project client` scoped to touched `*.svelte.spec.ts` + `bun run check` when Svelte/types change.
- **Per wave merge:** `bun run test:unit -- --run` (both projects) + `bun run check`.
- **Phase gate:** Full unit run green; **`bun run build`** green before `/gsd-verify-work`.

### Manual / visual / a11y checks (required for design phase)

- Open **style-lab** route: verify **stage**, **card**, **answer colors**, **button variants**, **typography roles**.
- **Keyboard:** **Tab** through buttons — **visible focus ring** (never rely on cursor alone).
- **Touch:** Use devtools device emulation or real device — **`pointer: coarse`** must **not** show broken custom cursor (**D-16**).
- **Reduced motion:** Enable **prefers-reduced-motion** in OS or devtools — stage animation **calms**; success/error demos **no** confetti/shake (**D-18**).
- **Contrast spot-check:** White card text vs background; answer label on each hue.

### Wave 0 gaps

- [ ] `src/lib/components/Button.svelte.spec.ts` — covers **CMP-01** (role, label, optional min box assertions).
- [ ] `src/lib/components/Panel.svelte.spec.ts` (or combined lab smoke) — covers rendered structure for **TOK-01** composition.
- [ ] Document in-repo **`docs/` or `.planning/...`** short token guide per roadmap — **not** a test file but a verification artifact for planners/executors (exact location: executor discretion; roadmap asks for “short docs”).

## Security Domain

### Applicable ASVS categories (presentation-heavy phase)

| ASVS Category | Applies | Standard Control |
|---------------|---------|------------------|
| V2 Authentication | no | — |
| V3 Session Management | no | — |
| V4 Access Control | no | — |
| V5 Validation | partial | No user-generated HTML in primitives; keep **Markdown** paths using existing sanitization patterns elsewhere [ASSUMED: unchanged this phase] |
| V13 API / generic | partial | **Keyboard focus** and **motion** preferences respected (**D-16**, **D-18**) |

### Known threat patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| **Clickjacking / misleading UI** (destructive looks like primary) | Spoofing | **Destructive variant** visually distinct; **D-08** |
| **Keyboard traps** in lab demos | Denial of service | Simple tab order; no `pointer-events: none` on focusable controls without alternative |

## Sources

### Primary (HIGH confidence)

- [Tailwind CSS — Theme variables](https://tailwindcss.com/docs/theme) — `@theme`, namespaces, extending vs overriding, top-level rule
- [Tailwind CSS — Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles) — `@utility`, `@layer`, customizing theme
- [VERIFIED: `package.json`] — dependency versions and scripts
- [VERIFIED: `vite.config.ts`] — Vitest browser + server projects
- [VERIFIED: `src/lib/vitest-examples/Welcome.svelte.spec.ts`] — browser Svelte test pattern
- [VERIFIED: `.planning/phases/06-design-foundation-ui-primitives/06-UI-SPEC.md`] — numeric specs, roles, copy, a11y notes
- [VERIFIED: `.planning/phases/06-design-foundation-ui-primitives/06-CONTEXT.md`] — locked decisions

### Secondary (MEDIUM confidence)

- [VERIFIED: npm registry] — `npm view tailwindcss version` → **4.2.2** (upgrade optional)

### Tertiary (LOW confidence)

- [ASSUMED] WCAG focus visibility and contrast expectations — validate with checklist during verification

## Metadata

**Confidence breakdown:**

- Standard stack: **HIGH** — pinned in repo + Tailwind official docs
- Architecture: **HIGH** — aligns with v4 docs and UI-SPEC
- Pitfalls: **MEDIUM** — includes assumed a11y/contrast validation

**Research date:** 2026-04-12  
**Valid until:** ~2026-05-12 (Tailwind minor releases); re-check if bumping to 4.2.x
