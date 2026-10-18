<script lang="ts">
	import { onMount } from 'svelte';
	import { projectsStore } from '$lib/state/projects.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import {
		Plus,
		Search,
		FolderOpen,
		Copy,
		Trash2,
		Pencil,
		Clock,
		Film,
		SlidersHorizontal,
		ExternalLink,
		PanelsTopLeft
	} from '@lucide/svelte';

	let isCreateOpen = $state(false);
	let isRenameOpen = $state(false);
	let isDeleteOpen = $state(false);

	let activeProjectId = $state<string | null>(null);
	let renameTitle = $state('');

	// Create modal fields
	let newProjectName = $state('New Animation');
	let selectedPreset = $state<'16:9' | '9:16' | '1:1'>('16:9');
	let selectedFps = $state<number>(30);
	let durationSeconds = $state<number>(4);

	onMount(() => {
		projectsStore.load();
	});

	function openCreate() {
		newProjectName = `Project ${projectsStore.list.length + 1}`;
		selectedPreset = '16:9';
		selectedFps = 30;
		durationSeconds = 4;
		isCreateOpen = true;
	}

	async function handleCreate() {
		let w = 1920;
		let h = 1080;
		if (selectedPreset === '9:16') {
			w = 1080;
			h = 1920;
		} else if (selectedPreset === '1:1') {
			w = 1080;
			h = 1080;
		}
		const proj = await projectsStore.create(newProjectName.trim() || 'Untitled Project', w, h);
		isCreateOpen = false;
		if (proj) {
			window.location.href = `/editor/${proj.id}`;
		}
	}

	function openRename(id: string, currentName: string) {
		activeProjectId = id;
		renameTitle = currentName;
		isRenameOpen = true;
	}

	async function handleRename() {
		if (activeProjectId && renameTitle.trim()) {
			await projectsStore.rename(activeProjectId, renameTitle.trim());
			isRenameOpen = false;
		}
	}

	function openDelete(id: string) {
		activeProjectId = id;
		isDeleteOpen = true;
	}

	async function handleDelete() {
		if (activeProjectId) {
			await projectsStore.delete(activeProjectId);
			isDeleteOpen = false;
		}
	}

	function formatTimeAgo(isoString: string): string {
		try {
			const diffMs = Date.now() - new Date(isoString).getTime();
			const mins = Math.floor(diffMs / 60000);
			if (mins < 1) return 'Just now';
			if (mins < 60) return `${mins}m ago`;
			const hours = Math.floor(mins / 60);
			if (hours < 24) return `${hours}h ago`;
			const days = Math.floor(hours / 24);
			return `${days}d ago`;
		} catch {
			return 'Recently';
		}
	}
</script>

<svelte:head>
	<title>Projects — LogiCut Studio</title>
</svelte:head>

<div class="flex-1 flex flex-col min-h-screen bg-bg text-text">
	<!-- Top Bar -->
	<header class="h-14 border-b border-border bg-surface-1 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
		<div class="flex items-center gap-3">
			<a href="/" class="flex items-center gap-2 text-text hover:text-accent transition-colors">
				<div class="h-7 w-7 rounded-xs bg-accent text-accent-foreground flex items-center justify-center font-mono font-bold text-xs select-none">
					LC
				</div>
				<span class="font-semibold text-sm tracking-tight hidden sm:inline">LogiCut Studio</span>
			</a>
			<span class="text-text-muted text-xs hidden md:inline">/</span>
			<span class="text-xs text-text-secondary font-medium hidden md:inline">Projects</span>
		</div>

		<div class="flex items-center gap-2 sm:gap-3 flex-1 max-w-md justify-end">
			<div class="relative w-full max-w-xs">
				<Search size={14} class="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
				<input
					type="text"
					bind:value={projectsStore.searchQuery}
					placeholder="Search projects..."
					class="w-full bg-surface-2 border border-border rounded-md pl-8 pr-3 py-1.5 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
				/>
			</div>

			<Button variant="primary" size="sm" onclick={openCreate} class="shrink-0">
				<Plus size={14} />
				<span class="hidden sm:inline">New Project</span>
				<span class="sm:hidden">New</span>
			</Button>
		</div>
	</header>

	<!-- Main Workspace Area -->
	<main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col gap-6">
		<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4">
			<div>
				<h1 class="text-xl font-bold tracking-tight text-text">Projects Dashboard</h1>
				<p class="text-xs text-text-muted mt-0.5">
					Local-first motion graphics workspace · {projectsStore.list.length} {projectsStore.list.length === 1 ? 'project' : 'projects'} saved
				</p>
			</div>
		</div>

		<!-- Loading State -->
		{#if projectsStore.loading}
			<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
				{#each Array(4) as _}
					<div class="h-64 rounded-lg bg-surface-1 border border-border p-4 flex flex-col justify-between">
						<div class="h-32 bg-surface-2 rounded-md"></div>
						<div class="h-4 bg-surface-2 rounded-xs w-3/4"></div>
						<div class="h-3 bg-surface-2 rounded-xs w-1/2"></div>
					</div>
				{/each}
			</div>
		<!-- Empty State -->
		{:else if projectsStore.filteredList.length === 0}
			<div class="flex flex-col items-center justify-center p-12 text-center rounded-lg border border-border border-dashed bg-surface-1/50 my-12">
				<div class="h-12 w-12 rounded-full bg-surface-2 flex items-center justify-center text-text-muted mb-4">
					<PanelsTopLeft size={24} />
				</div>
				<h2 class="text-base font-semibold text-text">No projects found</h2>
				<p class="text-xs text-text-muted max-w-sm mt-1 mb-6">
					{#if projectsStore.searchQuery}
						No project matches "{projectsStore.searchQuery}". Try clearing your search.
					{:else}
						Create your first motion graphics composition with deterministic Canvas 2D preview and keyframe animation.
					{/if}
				</p>
				<Button variant="primary" size="md" onclick={openCreate}>
					<Plus size={16} />
					Create Project
				</Button>
			</div>
		<!-- Projects Grid -->
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{#each projectsStore.filteredList as project (project.id)}
					<div class="group bg-surface-1 border border-border hover:border-border-strong rounded-lg overflow-hidden flex flex-col transition-all duration-150 hover:shadow-md">
						<!-- Card Preview Area -->
						<a
							href="/editor/{project.id}"
							class="relative h-40 bg-surface-2 flex items-center justify-center p-4 border-b border-border overflow-hidden select-none cursor-pointer"
						>
							<!-- Aspect Ratio Visual Mockup -->
							<div
								class="border border-border-strong/80 bg-bg rounded-xs flex items-center justify-center shadow-inner transition-transform duration-200 group-hover:scale-[1.02]"
								style="
									width: {project.settings.width >= project.settings.height ? '100%' : '56%'};
									height: {project.settings.width >= project.settings.height ? '78%' : '100%'};
									max-width: 180px;
									max-height: 120px;
								"
							>
								<div class="flex flex-col items-center gap-1 opacity-70">
									<Film size={18} class="text-accent" />
									<span class="text-[10px] font-mono text-text-muted">
										{project.settings.width}×{project.settings.height}
									</span>
								</div>
							</div>

							<div class="absolute top-2 right-2 flex items-center gap-1">
								<Badge variant="default" class="text-[10px] py-0 px-1.5 opacity-90">
									{project.settings.fps} FPS
								</Badge>
							</div>
						</a>

						<!-- Card Body -->
						<div class="p-4 flex flex-col justify-between flex-1 gap-3">
							<div class="flex flex-col gap-1">
								<a
									href="/editor/{project.id}"
									class="text-sm font-semibold text-text hover:text-accent transition-colors truncate"
									title={project.name}
								>
									{project.name}
								</a>
								<div class="flex items-center gap-3 text-[11px] text-text-muted font-mono">
									<span>{(project.settings.durationMs / 1000).toFixed(1)}s</span>
									<span>·</span>
									<span class="flex items-center gap-1">
										<Clock size={11} />
										{formatTimeAgo(project.updatedAt)}
									</span>
								</div>
							</div>

							<!-- Actions Row -->
							<div class="flex items-center justify-between pt-2 border-t border-border/60">
								<a href="/editor/{project.id}" class="text-xs text-text-secondary hover:text-text font-medium flex items-center gap-1">
									Open
									<ExternalLink size={12} />
								</a>

								<div class="flex items-center gap-1">
									<button
										type="button"
										class="p-1.5 text-text-muted hover:text-text rounded-xs hover:bg-surface-2 transition-colors cursor-pointer"
										title="Rename project"
										onclick={() => openRename(project.id, project.name)}
										aria-label="Rename project"
									>
										<Pencil size={13} />
									</button>
									<button
										type="button"
										class="p-1.5 text-text-muted hover:text-text rounded-xs hover:bg-surface-2 transition-colors cursor-pointer"
										title="Duplicate project"
										onclick={() => projectsStore.duplicate(project.id)}
										aria-label="Duplicate project"
									>
										<Copy size={13} />
									</button>
									<button
										type="button"
										class="p-1.5 text-text-muted hover:text-danger rounded-xs hover:bg-danger/10 transition-colors cursor-pointer"
										title="Delete project"
										onclick={() => openDelete(project.id)}
										aria-label="Delete project"
									>
										<Trash2 size={13} />
									</button>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</main>

	<!-- Create Project Modal Dialog -->
	<Dialog
		bind:open={isCreateOpen}
		title="Create New Project"
		description="Configure composition canvas, aspect ratio, and framerate."
	>
		<div class="flex flex-col gap-4 py-2">
			<Input
				label="Project Title"
				bind:value={newProjectName}
				placeholder="My Motion Graphic"
			/>

			<!-- Aspect Ratio Presets -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-text-secondary">Aspect Ratio Preset</span>
				<div class="grid grid-cols-3 gap-2">
					<button
						type="button"
						class="flex flex-col items-center gap-1 p-2.5 rounded-md border text-xs cursor-pointer transition-colors {selectedPreset === '16:9' ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text hover:bg-surface-2'}"
						onclick={() => (selectedPreset = '16:9')}
					>
						<span class="text-sm font-mono">16:9</span>
						<span class="text-[10px] text-text-muted">1920×1080</span>
					</button>

					<button
						type="button"
						class="flex flex-col items-center gap-1 p-2.5 rounded-md border text-xs cursor-pointer transition-colors {selectedPreset === '9:16' ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text hover:bg-surface-2'}"
						onclick={() => (selectedPreset = '9:16')}
					>
						<span class="text-sm font-mono">9:16</span>
						<span class="text-[10px] text-text-muted">1080×1920 (Reels)</span>
					</button>

					<button
						type="button"
						class="flex flex-col items-center gap-1 p-2.5 rounded-md border text-xs cursor-pointer transition-colors {selectedPreset === '1:1' ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text hover:bg-surface-2'}"
						onclick={() => (selectedPreset = '1:1')}
					>
						<span class="text-sm font-mono">1:1</span>
						<span class="text-[10px] text-text-muted">1080×1080 (Square)</span>
					</button>
				</div>
			</div>

			<!-- Framerate Selector -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-medium text-text-secondary">Framerate</span>
				<div class="grid grid-cols-3 gap-2">
					{#each [24, 30, 60] as fpsOption}
						<button
							type="button"
							class="py-1.5 rounded-md border text-xs font-mono cursor-pointer transition-colors {selectedFps === fpsOption ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text'}"
							onclick={() => (selectedFps = fpsOption)}
						>
							{fpsOption} FPS
						</button>
					{/each}
				</div>
			</div>

			<!-- Duration Slider -->
			<Slider
				label="Duration"
				bind:value={durationSeconds}
				min={1}
				max={30}
				step={1}
				unit="s"
			/>
		</div>

		{#snippet footer()}
			<Button variant="ghost" onclick={() => (isCreateOpen = false)}>Cancel</Button>
			<Button variant="primary" onclick={handleCreate}>
				<Plus size={16} />
				Create Composition
			</Button>
		{/snippet}
	</Dialog>

	<!-- Rename Dialog -->
	<Dialog
		bind:open={isRenameOpen}
		title="Rename Project"
		description="Enter a new title for this composition."
	>
		<div class="py-2">
			<Input label="New Title" bind:value={renameTitle} placeholder="Enter name..." />
		</div>
		{#snippet footer()}
			<Button variant="ghost" onclick={() => (isRenameOpen = false)}>Cancel</Button>
			<Button variant="primary" onclick={handleRename}>Save Changes</Button>
		{/snippet}
	</Dialog>

	<!-- Delete Confirmation Dialog -->
	<Dialog
		bind:open={isDeleteOpen}
		title="Delete Project?"
		description="This action permanently deletes the composition from your local IndexedDB storage."
	>
		<p class="text-xs text-text-muted py-2">
			Are you sure you want to delete this project? This cannot be undone.
		</p>
		{#snippet footer()}
			<Button variant="ghost" onclick={() => (isDeleteOpen = false)}>Cancel</Button>
			<Button variant="danger" onclick={handleDelete}>Delete Project</Button>
		{/snippet}
	</Dialog>
</div>
