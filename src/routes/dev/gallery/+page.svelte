<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import {
		Play,
		Pause,
		FolderOpen,
		Plus,
		SlidersHorizontal,
		Code2,
		Diamond,
		Download,
		Save,
		Trash2,
		Sparkles
	} from '@lucide/svelte';

	let sampleInputValue = $state('Hello Motion');
	let sliderValue = $state(60);
	let isDialogOpen = $state(false);
</script>

<svelte:head>
	<title>Design Gallery — LogiCut Studio</title>
</svelte:head>

<div class="max-w-5xl mx-auto p-6 md:p-10 flex flex-col gap-10">
	<header class="border-b border-border pb-6">
		<div class="flex items-center gap-3">
			<Badge variant="accent">OBSIDIAN STUDIO</Badge>
			<span class="text-xs text-text-muted">Design Inventory &amp; Component Verification</span>
		</div>
		<h1 class="text-2xl font-bold tracking-tight text-text mt-2">Design Tokens &amp; Component Gallery</h1>
		<p class="text-sm text-text-secondary mt-1">
			Near-black surfaces, warm ivory accent, 4px spacing scale, accessible focus and high-contrast dark typography.
		</p>
	</header>

	<!-- Color Tokens -->
	<section class="flex flex-col gap-4">
		<h2 class="text-xs uppercase tracking-wider font-semibold text-text-muted">1. Color Palette Tokens</h2>
		<div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
			<div class="p-3 rounded-md border border-border bg-bg flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--color-bg</span>
				<span class="text-[11px] text-text-muted font-mono">#0A0A0B</span>
			</div>
			<div class="p-3 rounded-md border border-border bg-surface-1 flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--surface-1</span>
				<span class="text-[11px] text-text-muted font-mono">#111113</span>
			</div>
			<div class="p-3 rounded-md border border-border bg-surface-2 flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--surface-2</span>
				<span class="text-[11px] text-text-muted font-mono">#19191C</span>
			</div>
			<div class="p-3 rounded-md border border-border bg-surface-3 flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--surface-3</span>
				<span class="text-[11px] text-text-muted font-mono">#202024</span>
			</div>
			<div class="p-3 rounded-md border border-border bg-accent text-accent-foreground flex flex-col gap-1 font-semibold">
				<span class="text-xs font-mono">--accent</span>
				<span class="text-[11px] font-mono opacity-80">#D6D3C9</span>
			</div>
			<div class="p-3 rounded-md border border-success/30 bg-success/15 text-success flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--success</span>
				<span class="text-[11px] font-mono opacity-80">#86A995</span>
			</div>
			<div class="p-3 rounded-md border border-warning/30 bg-warning/15 text-warning flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--warning</span>
				<span class="text-[11px] font-mono opacity-80">#D2AD72</span>
			</div>
			<div class="p-3 rounded-md border border-danger/30 bg-danger/15 text-danger flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--danger</span>
				<span class="text-[11px] font-mono opacity-80">#D77C7C</span>
			</div>
			<div class="p-3 rounded-md border border-info/30 bg-info/15 text-info flex flex-col gap-1">
				<span class="text-xs font-mono font-medium">--info</span>
				<span class="text-[11px] font-mono opacity-80">#9AA7B4</span>
			</div>
		</div>
	</section>

	<!-- Button Variants and Sizes -->
	<section class="flex flex-col gap-4">
		<h2 class="text-xs uppercase tracking-wider font-semibold text-text-muted">2. Buttons (Variants &amp; Sizes)</h2>
		<div class="flex flex-wrap items-center gap-3">
			<Button variant="primary">
				<Plus size={16} />
				Primary Button
			</Button>
			<Button variant="secondary">
				<Save size={16} />
				Secondary
			</Button>
			<Button variant="ghost">
				<FolderOpen size={16} />
				Ghost Action
			</Button>
			<Button variant="danger">
				<Trash2 size={16} />
				Delete
			</Button>
			<Button variant="primary" disabled>
				Disabled
			</Button>
		</div>

		<div class="flex items-center gap-3 mt-2">
			<Button size="sm">Small (28px)</Button>
			<Button size="md">Medium (36px)</Button>
			<Button size="lg">Large (44px)</Button>
			<Button size="icon" ariaLabel="Play preview">
				<Play size={16} />
			</Button>
		</div>
	</section>

	<!-- Badges -->
	<section class="flex flex-col gap-4">
		<h2 class="text-xs uppercase tracking-wider font-semibold text-text-muted">3. Status Badges</h2>
		<div class="flex flex-wrap items-center gap-2">
			<Badge variant="default">DEFAULT</Badge>
			<Badge variant="accent">ACCENT</Badge>
			<Badge variant="success">READY / EXPORTED</Badge>
			<Badge variant="warning">UNSAVED / DIRTY</Badge>
			<Badge variant="danger">ERROR / INVALID</Badge>
			<Badge variant="info">INFO / 60 FPS</Badge>
		</div>
	</section>

	<!-- Form Controls -->
	<section class="flex flex-col gap-4">
		<h2 class="text-xs uppercase tracking-wider font-semibold text-text-muted">4. Input &amp; Sliders</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
			<Input label="Project Name" bind:value={sampleInputValue} placeholder="Enter title..." />
			<Slider label="Playhead FPS" bind:value={sliderValue} min={12} max={120} step={1} unit=" fps" />
		</div>
	</section>

	<!-- Feedback & Modals -->
	<section class="flex flex-col gap-4">
		<h2 class="text-xs uppercase tracking-wider font-semibold text-text-muted">5. Interactive Modals &amp; Toasts</h2>
		<div class="flex flex-wrap items-center gap-3">
			<Button variant="secondary" onclick={() => (isDialogOpen = true)}>
				Open Modal Dialog
			</Button>
			<Button variant="ghost" onclick={() => toast.success('Project saved', 'Changes written to local IndexedDB')}>
				Trigger Success Toast
			</Button>
			<Button variant="ghost" onclick={() => toast.error('Recipe syntax error', 'Line 4: Unexpected token')}>
				Trigger Error Toast
			</Button>
			<Button variant="ghost" onclick={() => toast.info('Export Started', 'Encoding 120 frames at 30fps')}>
				Trigger Info Toast
			</Button>
		</div>
	</section>

	<Dialog
		bind:open={isDialogOpen}
		title="Sample Project Settings"
		description="Configure canvas dimensions, framerate, and duration."
	>
		<div class="flex flex-col gap-3 py-2">
			<Input label="Width (px)" value="1920" />
			<Input label="Height (px)" value="1080" />
			<Slider label="Duration" value={4} min={1} max={30} step={1} unit="s" />
		</div>
		{#snippet footer()}
			<Button variant="ghost" onclick={() => (isDialogOpen = false)}>Cancel</Button>
			<Button variant="primary" onclick={() => { isDialogOpen = false; toast.success('Settings updated'); }}>Apply</Button>
		{/snippet}
	</Dialog>
</div>
