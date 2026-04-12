# Phase 6: Design foundation & UI primitives - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in `06-CONTEXT.md`.

**Date:** 2026-04-12
**Phase:** 6 — Design foundation & UI primitives
**Areas discussed:** Color & stage atmosphere, Typography, Buttons, Panels & pilot, Typography follow-up

---

## Gray area selection

User selected **all** proposed areas: color, typography, buttons, panels.

---

## Color & stage atmosphere

| Option | Description | Selected |
|--------|-------------|----------|
| Dark stage | Deep base + elevated surfaces; light text on stage; saturated accents; body on cards at safe contrast | ✓ |
| Light chrome | Light shell + bold accents; dark on light body | |
| Claude discretion | Coherent readable token set | |

**User's choice:** Dark “stage” approach with elevated surfaces and contrast-safe body text on panels.

---

## Typography

| Option | Description | Selected |
|--------|-------------|----------|
| System only | Hierarchy via size/weight only | |
| Display webfont | One webfont for display/title + system body/label | ✓ |
| Claude discretion | Explicit roles; contrast-safe | |

**User's choice:** Webfont for display/title + system for body/label.

---

## Display / title font personality (follow-up)

| Option | Description | Selected |
|--------|-------------|----------|
| Energetic condensed | Game-show / scoreboard | |
| Rounded friendly | Classroom-safe, approachable | ✓ |
| Geometric modern | Clean broadcast | |
| Claude picks | Free webfont + docs | |

**User's choice:** Rounded, friendly display personality.

---

## Button system (CMP-01)

| Option | Description | Selected |
|--------|-------------|----------|
| Rounded heavy | Rounded-rect, heavy primary, documented ~44px targets | |
| Pill primary | Pill primary; secondary/tertiary more rectangular; documented targets | ✓ |
| Claude discretion | Full hierarchy + documented targets | |

**User's choice:** Pill-shaped primaries; rectangular secondary/tertiary; document minimum touch targets.

---

## Panel / surface primitive

| Option | Description | Selected |
|--------|-------------|----------|
| Shadow cards | Radius + shadow, separation from stage | ✓ |
| Flat banded | Borders / color bands, little shadow | |
| Claude discretion | Reusable for funnel + run | |

**User's choice:** Floating cards with shadow and radius.

---

## Pilot surface

| Option | Description | Selected |
|--------|-------------|----------|
| Style lab | Dedicated route outside teacher flow | ✓ |
| Minimal real | Slice on existing in-scope route | |
| Claude discretion | Smallest shippable proof + docs | |

**User's choice:** Dedicated style-lab-style route for proving primitives.

---

## Claude's Discretion

- Exact webfont family (within rounded-friendly brief), token naming, numeric scales, style-lab path, secondary/tertiary visual specifics.

## Deferred Ideas

None recorded.

---

## Amendments (post-discussion)

**2026-04-12** — User additions merged into `06-CONTEXT.md` (not re-interactive): animated CSS stage background (e.g. sliding grid) with reduced-motion fallback; white question cards + dark in-card text; answer buttons outside card with distinct colors per option, centered card when no buttons; `html { font-size: 112.5%; }` for uniform Tailwind rem scale; large custom cursor with touch/focus safeguards.

**2026-04-12 (b)** — Answer feedback: distinct animations on answer (examples: confetti for good, card shake for errors); CSS/Svelte first; **anime.js** optional when needed; `prefers-reduced-motion` degrades to minimal/static feedback.
