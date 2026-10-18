# Design System Specification — "Obsidian Studio"

## Design Philosophy

**Obsidian Studio** is a minimal, editorial, precise, tactile, and calm dark design direction engineered for professional creative software. 

### Non-Negotiable Prohibitions
- **Forbidden**: Neon purple, electric-blue gradients, rainbow gradients, cyberpunk glows, gradient-filled primary buttons, excessive glassmorphism, gratuitous blur, and decorative animations that distract from editing.
- Hierarchy is established through typography scale, spacing, border contrast, and elevation rather than saturated colors.
- Semantic colors (`--color-success`, `--color-warning`, `--color-danger`, `--color-info`) are reserved exclusively for real application state.

---

## Strict CSS Custom Properties

```css
:root {
  color-scheme: dark;
  --color-bg: #0A0A0B;
  --color-surface-1: #111113;
  --color-surface-2: #19191C;
  --color-surface-3: #202024;
  --color-border: #2A2A2E;
  --color-border-strong: #3A3A40;
  --color-text: #F5F5F0;
  --color-text-secondary: #A1A1AA;
  --color-text-muted: #71717A;
  --color-accent: #D6D3C9;
  --color-accent-hover: #E7E4DA;
  --color-accent-foreground: #171715;
  --color-success: #86A995;
  --color-warning: #D2AD72;
  --color-danger: #D77C7C;
  --color-info: #9AA7B4;
  --focus-ring: #D6D3C9;
  --radius-xs: 4px;
  --radius-sm: 6px;
  --radius-md: 9px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 20px;
}
```

---

## Spacing Scale (4px Base)
All layout dimensions, margins, paddings, and gap tokens follow the strict 4px grid:
- `4px` (0.25rem) — micro spacing, icon-to-label gaps
- `8px` (0.5rem) — standard control padding, badge padding
- `12px` (0.75rem) — compact card padding
- `16px` (1rem) — default container padding
- `20px` (1.25rem) — card gap
- `24px` (1.5rem) — section separation
- `32px` (2rem) — desktop grid gap
- `40px` / `48px` — page headers and hero spacing

---

## Icon Family Rules
- Single icon family: `@lucide/svelte`.
- Stroke width: 1.75 to 2.
- Sizes:
  - `14px` — dense inline badges and input indicators
  - `16px` — standard toolbar buttons and inspector toggles
  - `18px` — primary transport and card actions
  - `24px` — empty state illustrations
- Icon-only buttons MUST declare `ariaLabel` attributes for assistive technology.
