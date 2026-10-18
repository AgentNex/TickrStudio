# Architectural Decision Records (ADRs) — TickrStudio

## ADR 1: Zero React & Svelte 5 Runes Architecture
- **Context**: Motion graphics editors require fine-grained reactivity and minimal overhead during 60 FPS playhead scrubbing and canvas redraw loops.
- **Decision**: Use SvelteKit 2 and Svelte 5 with native Runes (`$state`, `$derived`, `$effect`, `$props`). Exclude React, React DOM, and React-oriented state libraries (e.g. Zustand) completely.
- **Consequences**: Zero virtual DOM diffing overhead during animation scrubbing; sub-millisecond reactive state updates; clean, lightweight bundle footprint.

---

## ADR 2: CodeMirror 6 over Monaco Editor
- **Context**: The master prompt suggested Monaco Editor but noted mobile constraints and bundle size overhead. Monaco requires heavy background web workers and exhibits keyboard positioning bugs on Android/iOS touchscreens.
- **Decision**: Adopt CodeMirror 6 with a customized Obsidian Studio dark theme, complemented by an accessible textarea fallback for constrained mobile viewports.
- **Consequences**: Lightweight bundle (~60KB vs ~4MB for Monaco); flawless mobile touch and cursor handling; full syntax highlighting for the Recipe DSL.

---

## ADR 3: Pure Framework-Independent Evaluation Engine
- **Context**: The timeline evaluation logic must execute identically in browser viewports, export workers, and automated test environments.
- **Decision**: Implement `evaluateTimeline` as a pure mathematical function taking `(project, timeMs)` and returning a serializable `RenderState`.
- **Consequences**: 100% testable via unit tests; eliminates DOM dependencies in the core animation pipeline; guarantees bit-for-bit frame consistency between interactive canvas preview and video export.

---

## ADR 4: Local-First IndexedDB Persistence with InsForge Cloud Sync
- **Context**: Creative users need instant saving without network latency or offline failures, with optional cloud backup and collaboration.
- **Decision**: Build an abstract `ProjectRepository` interface implemented by `LocalProjectRepository` (IndexedDB via `idb`) as primary storage, with `InsForgeService` as an asynchronous cloud sync layer.
- **Consequences**: Compositions load instantly offline; zero data loss on disconnection; cloud synchronization when authenticated.

---

## ADR 5: Vercel Initial Hosting Target
- **Context**: The application is client-rendered and browser-first, with static asset hosting and server routes for metadata and BaaS proxying.
- **Decision**: Configure `@sveltejs/adapter-auto` and `@sveltejs/adapter-vercel` for Vercel deployment. Exclude Cloudflare Pages/Workers.
- **Consequences**: Fast edge CDN asset distribution, instant git-driven preview deployments, zero server rendering maintenance.
