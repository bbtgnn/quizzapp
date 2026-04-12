# Design tokens (quiz show UI)

## Source of truth

Tokens live in **`src/routes/layout.css`** using **Tailwind CSS v4** `@theme`, `@layer base`, and `@utility`. Import this file from the root SvelteKit layout so utilities resolve everywhere (including Vitest browser harnesses).

## Requirement traceability

- **TOK-01** — Semantic colors, spacing, radii, shadows, and typography roles are defined once and exposed as Tailwind utilities (`bg-stage`, `text-role-body`, `shadow-panel`, etc.). Answer slots use `bg-answer-a` … `bg-answer-d`.
- **CMP-01** — `Button.svelte` implements primary (pill, **≥44×44px** hit area), secondary, tertiary, and destructive variants with visible **`focus-visible`** rings. See component source under `src/lib/components/Button.svelte`.

## Token inventory (colors)

| CSS variable | Typical utility | Role |
|--------------|-----------------|------|
| `--color-stage` | `bg-stage` | Dark stage / backdrop |
| `--color-stage-foreground` | `text-stage-foreground` | Light chrome on stage |
| `--color-surface-elevated` | `bg-surface-elevated` | Floating strips / elevated panels |
| `--color-card` | `bg-card` | White question card surface |
| `--color-card-foreground` | `text-card-foreground` | Dark type inside cards |
| `--color-primary` | `bg-primary`, `text-primary`, rings | Accent CTA, focus emphasis |
| `--color-destructive` | `bg-destructive`, `text-destructive` | Destructive actions |
| `--color-answer-a` … `--color-answer-d` | `bg-answer-a` … | Distinct buzzer hues |

Spacing uses `--spacing-xs` … `--spacing-3xl` (e.g. `p-lg`, `gap-xl`). Elevation: `--radius-panel`, `--radius-control`, `--shadow-panel`.

## Typography roles

| Utility | Font | Use |
|---------|------|-----|
| `text-role-display` | **Nunito** 600 | Hero / show titles |
| `text-role-title` | **Nunito** 600 | Card / section headings |
| `text-role-body` | **System UI** 400 | Paragraphs in cards |
| `text-role-label` | **System UI** 600 | Labels on stage or forms |

**D-04 / D-05:** Display and title use the rounded webfont stack; body and label use `ui-sans-serif, system-ui, sans-serif`.

## Root scale (**D-14**)

`html { font-size: 112.5%; }` scales **rem**-based spacing and typography together. Prefer theme spacing utilities so layouts stay coherent when the root size changes.

## Style lab (**D-11**)

Browse **`/style-lab`** to preview tokens, `Button` / `Panel`, motion demos, and copy strings without touching teacher flows. Safe to iterate during UI milestones.

## Cursor, stage motion, reduced motion

- **D-16** — Custom cursor only under `@media (pointer: fine)`; coarse pointers keep the OS cursor. Focus rings are unchanged.
- **D-13** — `.stage-quiz-show` provides a CSS-only animated grid motif with a static fallback when `prefers-reduced-motion: reduce`.
- **D-18** — Lab feedback hides confetti motion and replaces shake with a minimal ring cue under reduced motion.

---

*Last updated: 2026-04-12*
