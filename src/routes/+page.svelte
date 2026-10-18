<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { Plus, ArrowRight, Play, Code2, SlidersHorizontal, PanelsTopLeft, Sparkles } from '@lucide/svelte';
</script>

<svelte:head>
	<title>LogiCut Studio — Motion Graphics Editor</title>
</svelte:head>

<div class="flex-1 flex flex-col justify-between max-w-6xl mx-auto w-full px-6 py-8 md:py-16">
	<!-- Navigation -->
	<header class="flex items-center justify-between border-b border-border pb-6">
		<div class="flex items-center gap-3">
			<div class="h-8 w-8 rounded-sm bg-accent text-accent-foreground flex items-center justify-center font-mono font-bold text-sm select-none">
				LC
			</div>
			<div class="flex flex-col">
				<span class="text-sm font-semibold tracking-tight text-text">LogiCut Studio</span>
				<span class="text-[11px] font-mono text-text-muted">v0.1.0 · browser-first</span>
			</div>
		</div>

		<nav class="flex items-center gap-3">
			<a href="/dev/gallery">
				<Button variant="ghost" size="sm">Design Gallery</Button>
			</a>
			<a href="/projects">
				<Button variant="primary" size="sm">
					Open Dashboard
					<ArrowRight size={14} />
				</Button>
			</a>
		</nav>
	</header>

	<!-- Hero -->
	<main class="my-auto py-12 md:py-20 flex flex-col items-start gap-6 max-w-3xl">
		<div class="flex items-center gap-2">
			<Badge variant="accent">MOTION GRAPHICS</Badge>
			<Badge variant="default">DETERMINISTIC ENGINE</Badge>
		</div>

		<h1 class="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-text leading-[1.1]">
			Precision animation, <br />
			<span class="text-text-secondary">crafted for the modern web.</span>
		</h1>

		<p class="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl font-normal">
			A browser-first creative studio combining a visual keyframe timeline, Canvas 2D preview, and structured Recipe DSL. Built with Svelte 5 runes, local-first storage, and zero-compromise deterministic evaluation.
		</p>

		<div class="flex flex-wrap items-center gap-4 pt-2">
			<a href="/projects">
				<Button variant="primary" size="lg" class="shadow-lg">
					<Plus size={18} />
					Start New Project
				</Button>
			</a>
			<a href="/dev/gallery">
				<Button variant="secondary" size="lg">
					Explore Components
				</Button>
			</a>
		</div>

		<!-- Feature Highlights Grid -->
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 w-full border-t border-border mt-8">
			<div class="p-4 rounded-md border border-border bg-surface-1 flex flex-col gap-2">
				<div class="flex items-center gap-2 text-text font-medium text-sm">
					<PanelsTopLeft size={16} class="text-accent" />
					Canvas 2D Preview
				</div>
				<p class="text-xs text-text-muted leading-relaxed">
					Realtime 60 FPS playback with transform gizmos, bounds inspection, and zero layout shift.
				</p>
			</div>

			<div class="p-4 rounded-md border border-border bg-surface-1 flex flex-col gap-2">
				<div class="flex items-center gap-2 text-text font-medium text-sm">
					<Code2 size={16} class="text-accent" />
					Recipe DSL
				</div>
				<p class="text-xs text-text-muted leading-relaxed">
					Human-readable and AI-friendly text syntax that bidirectionally compiles to timeline JSON.
				</p>
			</div>

			<div class="p-4 rounded-md border border-border bg-surface-1 flex flex-col gap-2">
				<div class="flex items-center gap-2 text-text font-medium text-sm">
					<SlidersHorizontal size={16} class="text-accent" />
					Local-First Persistence
				</div>
				<p class="text-xs text-text-muted leading-relaxed">
					Structured IndexedDB storage with seamless InsForge BaaS cloud synchronization.
				</p>
			</div>
		</div>
	</main>

	<!-- Footer -->
	<footer class="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-muted">
		<span>LogiCut Studio &copy; 2026. Built with SvelteKit &amp; Svelte 5.</span>
		<div class="flex items-center gap-4">
			<a href="/projects" class="hover:text-text transition-colors">Projects</a>
			<a href="/dev/gallery" class="hover:text-text transition-colors">Design System</a>
		</div>
	</footer>
</div>
