# TickrStudio (LogiCut Studio)

A browser-first, professional motion-graphics and animation editor inspired by LogiCut. Built with **SvelteKit**, **Svelte 5 Runes**, **TypeScript**, and a pure deterministic Canvas 2D engine.

Designed under the **"Obsidian Studio"** aesthetic: minimal, editorial, precise, dark creative software with tactile controls and warm ivory accents.

---

## Key Features

- **Project Dashboard (`/projects`)**: Local-first composition management with IndexedDB persistence, aspect ratio presets (16:9 Landscape, 9:16 Vertical / Reels, 1:1 Square), framerate selector (24, 30, 60 FPS), and instant search.
- **Canvas 2D Interactive Preview**: Realtime 60 FPS playback with aspect-ratio preservation, high-DPI device pixel ratio scaling, interactive object drag positioning, and selection gizmos.
- **Pure Deterministic Evaluator**: Framework-independent pure evaluation engine where `evaluateTimeline(project, timeMs)` deterministically produces bit-for-bit identical render states across preview and video export.
- **Structured `[RECIPE]` DSL**: Human-readable and AI-friendly text syntax that bidirectionally compiles to timeline JSON. Features line/column syntax error reporting with zero `eval` or unsafe code execution.
- **CodeMirror 6 Recipe Editor**: Production-grade, syntax-highlighted code editor with line numbers, smooth mobile touch interaction, and an accessible textarea fallback for constrained viewports.
- **Timeline Tracks, Clips & Keyframes**: Multi-track visual sequencing with magnetic playhead scrubbing, zoomable time ruler, and diamond keyframe markers with cubic easing (`linear`, `easeIn`, `easeOut`, `easeInOut`).
- **Context-Sensitive Property Inspector**: Precise control over transform coordinates (x, y, scaleX, scaleY, rotation, opacity), typography (fontSize, fill, align), geometry (width, height, radius, stroke, cornerRadius), and animated property keyframing.
- **Browser Video Export (WebCodecs + MP4)**: Hardware-accelerated frame encoding using `VideoEncoder` (AVC/H.264) and direct MP4 file muxing via `mp4-muxer`, with a graceful `MediaRecorder` WebM fallback when WebCodecs is unsupported.
- **AI Scene Assistant**: Generate complete, valid motion graphics compositions from natural language prompts, verified through the recipe parser before applying.
- **Documented XML Subset Interchange**: Safe XML composition import and export for external interchange without script injection risk.
- **InsForge BaaS Integration**: Cloud project sync and asset bucket storage with offline-first IndexedDB priority.

---

## Tech Stack & Architecture

- **Framework**: [SvelteKit](https://svelte.dev) + [Svelte 5](https://svelte.dev/docs/svelte/overview) (Runes: `$state`, `$derived`, `$effect`, `$props`, snippets).
- **Language**: TypeScript (strict mode, 0 errors in `svelte-check`).
- **Styling**: Tailwind CSS with Obsidian Studio custom CSS tokens.
- **Icons**: `@lucide/svelte` (official Lucide Svelte package).
- **Editor**: CodeMirror 6 with custom Obsidian dark theme.
- **Video Export**: WebCodecs API (`VideoEncoder`, `VideoFrame`) + `mp4-muxer`.
- **Local Persistence**: IndexedDB via `idb`.
- **Cloud Backend**: InsForge BaaS (Postgres + Storage).
- **Unit Testing**: Vitest 3.x (20/20 unit tests passing).
- **Design Quality**: Audited with Impeccable CLI (0 anti-patterns).

---

## Strict Design Tokens ("Obsidian Studio")

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
}
```

---

## Getting Started

### Prerequisites
- Node.js 20+ or Bun 1.x
- npm or bun

### Installation
```bash
git clone https://github.com/agentnex/TickrStudio.git
cd TickrStudio
npm install
```

### Development Server
```bash
npm run dev
```

### Type Checking & Unit Tests
```bash
npm run check
npm run test:unit
```

### Production Build
```bash
npm run build
npm run preview
```

---

## Documentation

- [Architecture Guide](docs/ARCHITECTURE.md)
- [Design System & Tokens](docs/DESIGN_SYSTEM.md)
- [Recipe Format Grammar](docs/RECIPE_FORMAT.md)
- [Video Export Capabilities](docs/EXPORT_SUPPORT.md)
- [Architectural Decision Records](docs/DECISIONS.md)
- [Project Status & Checkpoints](PROJECT_STATUS.md)

---

## License
MIT License. Free forever for personal and commercial use.
