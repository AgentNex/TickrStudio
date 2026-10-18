<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import type { TimelineProject, SceneObject, EasingName } from '$lib/types/timeline';
	import { localProjectRepo, createDefaultProject } from '$lib/services/local-project-repository';
	import { toast } from '$lib/state/toast.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import CanvasPreview from '$lib/components/editor/CanvasPreview.svelte';
	import LayersList from '$lib/components/editor/LayersList.svelte';
	import Inspector from '$lib/components/editor/Inspector.svelte';
	import Timeline from '$lib/components/editor/Timeline.svelte';
	import RecipeEditor from '$lib/components/editor/RecipeEditor.svelte';
	import ExportModal from '$lib/components/editor/ExportModal.svelte';

	import {
		ArrowLeft,
		Save,
		Undo2,
		Redo2,
		Download,
		Code2,
		PanelsTopLeft,
		SlidersHorizontal,
		Layers,
		Film,
		CheckCircle2,
		LoaderCircle,
		Sparkles
	} from '@lucide/svelte';

	let projectId = $derived(page.params.projectId);
	let project = $state<TimelineProject | null>(null);
	let loading = $state(true);
	let isSaving = $state(false);
	let isDirty = $state(false);

	let currentTimeMs = $state(0);
	let selectedObjectId = $state<string | null>(null);
	let selectedKeyframeId = $state<string | null>(null);
	let isPlaying = $state(false);

	let isExportModalOpen = $state(false);

	// Desktop view mode: 'visual' (Canvas + Timeline) vs 'recipe' (CodeMirror DSL)
	let activeViewTab = $state<'visual' | 'recipe'>('visual');

	// Mobile section tab: 'preview' | 'timeline' | 'layers' | 'inspector' | 'recipe'
	let mobileSection = $state<'preview' | 'timeline' | 'layers' | 'inspector' | 'recipe'>('preview');

	// Undo / Redo history stack
	let historyStack = $state<TimelineProject[]>([]);
	let historyIndex = $state(-1);
	const MAX_HISTORY = 40;

	onMount(async () => {
		const targetId = projectId || 'default_proj';
		try {
			const loaded = await localProjectRepo.getProject(targetId);
			if (loaded) {
				project = loaded;
			} else {
				// Create default if not found
				const created = createDefaultProject('New Composition', 1920, 1080);
				created.id = targetId;
				await localProjectRepo.saveProject(created);
				project = created;
			}
			pushHistory(project);
		} catch (err: any) {
			toast.error('Failed to load project', err?.message);
		} finally {
			loading = false;
		}
	});

	function pushHistory(proj: TimelineProject) {
		const clone = JSON.parse(JSON.stringify(proj)) as TimelineProject;
		if (historyIndex < historyStack.length - 1) {
			historyStack = historyStack.slice(0, historyIndex + 1);
		}
		historyStack.push(clone);
		if (historyStack.length > MAX_HISTORY) {
			historyStack.shift();
		} else {
			historyIndex++;
		}
	}

	function handleUndo() {
		if (historyIndex > 0) {
			historyIndex--;
			project = JSON.parse(JSON.stringify(historyStack[historyIndex]));
			triggerAutoSave();
		}
	}

	function handleRedo() {
		if (historyIndex < historyStack.length - 1) {
			historyIndex++;
			project = JSON.parse(JSON.stringify(historyStack[historyIndex]));
			triggerAutoSave();
		}
	}

	let saveTimeout: any = null;
	function triggerAutoSave() {
		isDirty = true;
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(async () => {
			if (!project) return;
			isSaving = true;
			try {
				await localProjectRepo.saveProject(project);
				isDirty = false;
			} catch (err) {
				console.error('Auto-save error:', err);
			} finally {
				isSaving = false;
			}
		}, 400);
	}

	function updateProject(newProj: TimelineProject, recordHistory = true) {
		project = newProj;
		if (recordHistory) {
			pushHistory(newProj);
		}
		triggerAutoSave();
	}

	function handleAddObject(type: 'text' | 'rect' | 'ellipse') {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		const count = clone.objects.filter((o) => o.type === type).length + 1;
		const objId = 'obj_' + Math.random().toString(36).slice(2, 9);
		const baseTransform = {
			x: clone.settings.width / 2,
			y: clone.settings.height / 2,
			scaleX: 1,
			scaleY: 1,
			rotationDeg: 0,
			opacity: 1
		};

		let newObj: SceneObject;
		if (type === 'text') {
			newObj = {
				id: objId,
				name: `Text ${count}`,
				type: 'text',
				visible: true,
				locked: false,
				transform: baseTransform,
				keyframes: {},
				content: `Title ${count}`,
				fontSize: 64,
				fontFamily: 'Inter, sans-serif',
				fontWeight: '600',
				fill: '#F5F5F0',
				align: 'center'
			};
		} else if (type === 'rect') {
			newObj = {
				id: objId,
				name: `Rectangle ${count}`,
				type: 'rect',
				visible: true,
				locked: false,
				transform: baseTransform,
				keyframes: {},
				width: 320,
				height: 180,
				fill: '#19191C',
				stroke: '#D6D3C9',
				strokeWidth: 2,
				cornerRadius: 8
			};
		} else {
			newObj = {
				id: objId,
				name: `Ellipse ${count}`,
				type: 'ellipse',
				visible: true,
				locked: false,
				transform: baseTransform,
				keyframes: {},
				radiusX: 100,
				radiusY: 100,
				fill: '#19191C',
				stroke: '#D6D3C9',
				strokeWidth: 2
			};
		}

		clone.objects.push(newObj);
		clone.tracks.push({
			id: 'track_' + Math.random().toString(36).slice(2, 9),
			name: `${newObj.name} Track`,
			kind: 'visual',
			muted: false,
			locked: false,
			clips: [
				{
					id: 'clip_' + Math.random().toString(36).slice(2, 9),
					objectId: objId,
					startMs: 0,
					durationMs: clone.settings.durationMs
				}
			]
		});

		selectedObjectId = objId;
		updateProject(clone);
		toast.info(`Added ${type} layer`);
	}

	function handleDeleteObject(id: string) {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		clone.objects = clone.objects.filter((o) => o.id !== id);
		clone.tracks = clone.tracks.filter((t) => !t.clips.some((c) => c.objectId === id));
		if (selectedObjectId === id) selectedObjectId = null;
		updateProject(clone);
	}

	function handleToggleVisibility(id: string) {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		const target = clone.objects.find((o) => o.id === id);
		if (target) {
			target.visible = !target.visible;
			updateProject(clone, false);
		}
	}

	function handleToggleLock(id: string) {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		const target = clone.objects.find((o) => o.id === id);
		if (target) {
			target.locked = !target.locked;
			updateProject(clone, false);
		}
	}

	function handleUpdateObject(updatedObj: SceneObject) {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		const idx = clone.objects.findIndex((o) => o.id === updatedObj.id);
		if (idx !== -1) {
			clone.objects[idx] = updatedObj;
			updateProject(clone);
		}
	}

	function handleObjectMove(id: string, x: number, y: number) {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		const target = clone.objects.find((o) => o.id === id);
		if (target && !target.locked) {
			target.transform.x = x;
			target.transform.y = y;
			updateProject(clone, false);
		}
	}

	function handleAddKeyframe(
		objectId: string,
		prop: string,
		timeMs: number,
		value: any,
		easing: EasingName
	) {
		if (!project) return;
		const clone = JSON.parse(JSON.stringify(project)) as TimelineProject;
		const target = clone.objects.find((o) => o.id === objectId);
		if (target) {
			if (!target.keyframes) target.keyframes = {};
			if (!target.keyframes[prop]) target.keyframes[prop] = [];

			// Check if keyframe already exists at this timestamp
			const existingIdx = target.keyframes[prop]!.findIndex((k) => k.timeMs === timeMs);
			if (existingIdx !== -1) {
				target.keyframes[prop]![existingIdx].value = value;
				target.keyframes[prop]![existingIdx].easing = easing;
			} else {
				target.keyframes[prop]!.push({
					id: 'kf_' + Math.random().toString(36).slice(2, 9),
					timeMs,
					value,
					easing
				});
			}
			updateProject(clone);
			toast.success('Keyframe set', `${target.name}.${prop} at ${timeMs}ms`);
		}
	}

	// Keyboard shortcuts
	function handleKeydown(e: KeyboardEvent) {
		// Prevent firing in input or textarea
		const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
		if (tag === 'input' || tag === 'textarea') return;

		if (e.code === 'Space') {
			e.preventDefault();
			isPlaying = !isPlaying;
		} else if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
			e.preventDefault();
			if (e.shiftKey) {
				handleRedo();
			} else {
				handleUndo();
			}
		} else if (e.key === 'Delete' || e.key === 'Backspace') {
			if (selectedObjectId) {
				handleDeleteObject(selectedObjectId);
			}
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<svelte:head>
	<title>{project ? `${project.name} — LogiCut Studio` : 'Editor'}</title>
</svelte:head>

<div class="h-screen w-screen flex flex-col bg-bg text-text select-none overflow-hidden">
	<!-- Workspace Top Bar -->
	<header class="h-12 border-b border-border bg-surface-1 px-3 sm:px-4 flex items-center justify-between gap-3 shrink-0 z-30">
		<!-- Left: Back & Project Title -->
		<div class="flex items-center gap-2 sm:gap-3">
			<a href="/projects">
				<Button variant="ghost" size="icon" ariaLabel="Back to projects" class="h-8 w-8 text-text-muted hover:text-text">
					<ArrowLeft size={16} />
				</Button>
			</a>

			<div class="flex items-center gap-2">
				{#if project}
					<input
						type="text"
						value={project.name}
						oninput={(e) => {
							if (project) {
								project.name = (e.target as HTMLInputElement).value;
								triggerAutoSave();
							}
						}}
						class="text-xs sm:text-sm font-semibold text-text bg-transparent border border-transparent hover:border-border focus:border-accent focus:bg-surface-2 rounded-xs px-1.5 py-0.5 truncate max-w-[140px] sm:max-w-xs focus:outline-none transition-colors"
					/>
				{/if}

				<!-- Save Status -->
				{#if isSaving}
					<span class="flex items-center gap-1 text-[10px] text-warning font-mono">
						<LoaderCircle size={10} class="animate-spin" />
						Saving...
					</span>
				{:else if isDirty}
					<span class="text-[10px] text-warning font-mono">Unsaved</span>
				{:else}
					<span class="flex items-center gap-1 text-[10px] text-success font-mono opacity-80">
						<CheckCircle2 size={10} />
						Saved
					</span>
				{/if}
			</div>
		</div>

		<!-- Center: Mode Switcher (Visual vs Recipe) -->
		<div class="hidden md:flex items-center gap-1 p-0.5 bg-surface-2 border border-border rounded-md">
			<button
				type="button"
				class="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors {activeViewTab === 'visual' ? 'bg-surface-3 text-text shadow-xs' : 'text-text-muted hover:text-text'}"
				onclick={() => (activeViewTab = 'visual')}
			>
				<PanelsTopLeft size={13} />
				Visual Studio
			</button>
			<button
				type="button"
				class="flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors {activeViewTab === 'recipe' ? 'bg-surface-3 text-text shadow-xs' : 'text-text-muted hover:text-text'}"
				onclick={() => (activeViewTab = 'recipe')}
			>
				<Code2 size={13} />
				Recipe Code
			</button>
		</div>

		<!-- Right: History, Export & Add Actions -->
		<div class="flex items-center gap-1 sm:gap-2">
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Undo"
				disabled={historyIndex <= 0}
				onclick={handleUndo}
				class="h-8 w-8 text-text-muted hover:text-text"
				title="Undo (Ctrl+Z)"
			>
				<Undo2 size={15} />
			</Button>

			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Redo"
				disabled={historyIndex >= historyStack.length - 1}
				onclick={handleRedo}
				class="h-8 w-8 text-text-muted hover:text-text"
				title="Redo (Ctrl+Shift+Z)"
			>
				<Redo2 size={15} />
			</Button>

			<Button
				variant="primary"
				size="sm"
				class="h-8 gap-1.5 shadow-sm text-xs ml-1"
				onclick={() => (isExportModalOpen = true)}
			>
				<Download size={14} />
				<span class="hidden sm:inline">Export</span>
			</Button>
		</div>
	</header>

	<!-- Main Workspace Area -->
	{#if loading || !project}
		<div class="flex-1 flex items-center justify-center bg-bg text-text-muted text-xs">
			<LoaderCircle size={20} class="animate-spin text-accent" />
		</div>
	{:else}
		<!-- Desktop View: Visual Workspace -->
		{#if activeViewTab === 'visual'}
			<div class="flex-1 hidden md:flex flex-col min-h-0 overflow-hidden">
				<!-- Top Split: Layers | Canvas | Inspector -->
				<div class="flex-1 flex min-h-0 overflow-hidden">
					<!-- Left Panel: Layers -->
					<div class="w-64 h-full shrink-0">
						<LayersList
							{project}
							{selectedObjectId}
							onSelectObject={(id) => (selectedObjectId = id)}
							onAddObject={handleAddObject}
							onDeleteObject={handleDeleteObject}
							onToggleVisibility={handleToggleVisibility}
							onToggleLock={handleToggleLock}
						/>
					</div>

					<!-- Center Panel: Canvas Preview & Transport -->
					<div class="flex-1 h-full min-w-0">
						<CanvasPreview
							{project}
							bind:currentTimeMs
							bind:selectedObjectId
							bind:isPlaying
							onTimeChange={(t) => (currentTimeMs = t)}
							onSelectObject={(id) => (selectedObjectId = id)}
							onObjectMove={handleObjectMove}
						/>
					</div>

					<!-- Right Panel: Inspector -->
					<div class="w-72 h-full shrink-0">
						<Inspector
							{project}
							{selectedObjectId}
							{currentTimeMs}
							onUpdateObject={handleUpdateObject}
							onAddKeyframe={handleAddKeyframe}
						/>
					</div>
				</div>

				<!-- Bottom Split: Timeline -->
				<div class="h-56 shrink-0">
					<Timeline
						{project}
						{currentTimeMs}
						{selectedObjectId}
						bind:selectedKeyframeId
						onTimeChange={(t) => (currentTimeMs = t)}
						onSelectObject={(id) => (selectedObjectId = id)}
					/>
				</div>
			</div>
		<!-- Desktop View: Recipe Code DSL -->
		{:else}
			<div class="flex-1 hidden md:flex min-h-0 overflow-hidden">
				<div class="w-1/2 h-full border-r border-border">
					<RecipeEditor
						{project}
						onProjectUpdated={(p) => updateProject(p)}
					/>
				</div>
				<div class="w-1/2 h-full">
					<CanvasPreview
						{project}
						bind:currentTimeMs
						bind:selectedObjectId
						bind:isPlaying
						onTimeChange={(t) => (currentTimeMs = t)}
						onSelectObject={(id) => (selectedObjectId = id)}
						onObjectMove={handleObjectMove}
					/>
				</div>
			</div>
		{/if}

		<!-- Mobile Adapted View (Screens < 768px) -->
		<div class="flex-1 flex md:hidden flex-col min-h-0 overflow-hidden">
			<!-- Active Mobile Pane -->
			<div class="flex-1 min-h-0 overflow-hidden">
				{#if mobileSection === 'preview'}
					<CanvasPreview
						{project}
						bind:currentTimeMs
						bind:selectedObjectId
						bind:isPlaying
						onTimeChange={(t) => (currentTimeMs = t)}
						onSelectObject={(id) => (selectedObjectId = id)}
						onObjectMove={handleObjectMove}
					/>
				{:else if mobileSection === 'timeline'}
					<Timeline
						{project}
						{currentTimeMs}
						{selectedObjectId}
						bind:selectedKeyframeId
						onTimeChange={(t) => (currentTimeMs = t)}
						onSelectObject={(id) => (selectedObjectId = id)}
					/>
				{:else if mobileSection === 'layers'}
					<LayersList
						{project}
						{selectedObjectId}
						onSelectObject={(id) => {
							selectedObjectId = id;
							mobileSection = 'inspector';
						}}
						onAddObject={handleAddObject}
						onDeleteObject={handleDeleteObject}
						onToggleVisibility={handleToggleVisibility}
						onToggleLock={handleToggleLock}
					/>
				{:else if mobileSection === 'inspector'}
					<Inspector
						{project}
						{selectedObjectId}
						{currentTimeMs}
						onUpdateObject={handleUpdateObject}
						onAddKeyframe={handleAddKeyframe}
					/>
				{:else if mobileSection === 'recipe'}
					<RecipeEditor
						{project}
						onProjectUpdated={(p) => updateProject(p)}
					/>
				{/if}
			</div>

			<!-- Mobile Bottom Section Switcher Bar -->
			<nav class="h-14 border-t border-border bg-surface-1 flex items-center justify-around px-2 shrink-0 z-30 pb-[env(safe-area-inset-bottom)]">
				<button
					type="button"
					class="flex flex-col items-center justify-center gap-1 w-14 h-full cursor-pointer {mobileSection === 'preview' ? 'text-accent font-semibold' : 'text-text-muted'}"
					onclick={() => (mobileSection = 'preview')}
				>
					<PanelsTopLeft size={16} />
					<span class="text-[10px]">Canvas</span>
				</button>

				<button
					type="button"
					class="flex flex-col items-center justify-center gap-1 w-14 h-full cursor-pointer {mobileSection === 'timeline' ? 'text-accent font-semibold' : 'text-text-muted'}"
					onclick={() => (mobileSection = 'timeline')}
				>
					<Film size={16} />
					<span class="text-[10px]">Timeline</span>
				</button>

				<button
					type="button"
					class="flex flex-col items-center justify-center gap-1 w-14 h-full cursor-pointer {mobileSection === 'layers' ? 'text-accent font-semibold' : 'text-text-muted'}"
					onclick={() => (mobileSection = 'layers')}
				>
					<Layers size={16} />
					<span class="text-[10px]">Layers</span>
				</button>

				<button
					type="button"
					class="flex flex-col items-center justify-center gap-1 w-14 h-full cursor-pointer {mobileSection === 'inspector' ? 'text-accent font-semibold' : 'text-text-muted'}"
					onclick={() => (mobileSection = 'inspector')}
				>
					<SlidersHorizontal size={16} />
					<span class="text-[10px]">Props</span>
				</button>

				<button
					type="button"
					class="flex flex-col items-center justify-center gap-1 w-14 h-full cursor-pointer {mobileSection === 'recipe' ? 'text-accent font-semibold' : 'text-text-muted'}"
					onclick={() => (mobileSection = 'recipe')}
				>
					<Code2 size={16} />
					<span class="text-[10px]">Recipe</span>
				</button>
			</nav>
		</div>

		{#if project}
			<ExportModal
				{project}
				bind:open={isExportModalOpen}
				onClose={() => (isExportModalOpen = false)}
			/>
		{/if}
	{/if}
</div>
