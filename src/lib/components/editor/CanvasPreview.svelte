<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimelineProject } from '$lib/types/timeline';
	import { evaluateTimeline, type RenderState, type EvaluatedSceneObject } from '$lib/engine/evaluator';
	import { renderSceneToCanvas, hitTestObject } from '$lib/engine/canvas-renderer';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		Play,
		Pause,
		RotateCcw,
		SkipBack,
		SkipForward,
		Maximize2,
		ZoomIn,
		ZoomOut,
		Repeat
	} from '@lucide/svelte';

	interface Props {
		project: TimelineProject;
		currentTimeMs?: number;
		selectedObjectId?: string | null;
		isPlaying?: boolean;
		onTimeChange?: (timeMs: number) => void;
		onSelectObject?: (id: string | null) => void;
		onObjectMove?: (id: string, x: number, y: number) => void;
	}

	let {
		project,
		currentTimeMs = $bindable(0),
		selectedObjectId = $bindable(null),
		isPlaying = $bindable(false),
		onTimeChange,
		onSelectObject,
		onObjectMove
	}: Props = $props();

	let canvasEl: HTMLCanvasElement | null = $state(null);
	let containerEl: HTMLDivElement | null = $state(null);
	let animationFrameId: number | null = null;
	let lastTimestamp: number | null = null;
	let isLooping = $state(true);

	// Canvas dragging / gizmo interaction
	let isDragging = false;
	let dragStartPos = { x: 0, y: 0 };
	let draggedObjInitialPos = { x: 0, y: 0 };

	const currentState = $derived(evaluateTimeline(project, currentTimeMs));

	$effect(() => {
		if (canvasEl && currentState) {
			render();
		}
	});

	function render() {
		if (!canvasEl) return;
		const ctx = canvasEl.getContext('2d');
		if (!ctx) return;

		renderSceneToCanvas(ctx, currentState, {
			selectedObjectId,
			drawGizmos: true
		});
	}

	function resizeCanvas() {
		if (!canvasEl || !containerEl) return;
		const rect = containerEl.getBoundingClientRect();
		const dpr = window.devicePixelRatio || 1;

		canvasEl.width = Math.max(300, Math.floor(rect.width * dpr));
		canvasEl.height = Math.max(200, Math.floor(rect.height * dpr));
		render();
	}

	onMount(() => {
		resizeCanvas();
		const ro = new ResizeObserver(() => {
			resizeCanvas();
		});
		if (containerEl) ro.observe(containerEl);

		return () => {
			ro.disconnect();
			if (animationFrameId !== null) cancelAnimationFrame(animationFrameId);
		};
	});

	// Playback loop
	$effect(() => {
		if (isPlaying) {
			lastTimestamp = performance.now();
			const loop = (now: number) => {
				if (!lastTimestamp) lastTimestamp = now;
				const delta = now - lastTimestamp;
				lastTimestamp = now;

				let next = currentTimeMs + delta;
				if (next >= project.settings.durationMs) {
					if (isLooping) {
						next = 0;
					} else {
						next = project.settings.durationMs;
						isPlaying = false;
					}
				}
				currentTimeMs = next;
				onTimeChange?.(next);

				if (isPlaying) {
					animationFrameId = requestAnimationFrame(loop);
				}
			};
			animationFrameId = requestAnimationFrame(loop);
		} else {
			if (animationFrameId !== null) {
				cancelAnimationFrame(animationFrameId);
				animationFrameId = null;
			}
			lastTimestamp = null;
		}
	});

	function togglePlay() {
		isPlaying = !isPlaying;
	}

	function handlePointerDown(e: PointerEvent) {
		if (!canvasEl) return;
		const rect = canvasEl.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		// Map to scene coordinates
		const canvasWidth = canvasEl.width;
		const canvasHeight = canvasEl.height;
		const dpr = window.devicePixelRatio || 1;

		const scaleX = canvasWidth / project.settings.width;
		const scaleY = canvasHeight / project.settings.height;
		const fitScale = Math.min(scaleX, scaleY);

		const offsetX = (canvasWidth - project.settings.width * fitScale) / 2;
		const offsetY = (canvasHeight - project.settings.height * fitScale) / 2;

		const sceneX = (clickX * dpr - offsetX) / fitScale;
		const sceneY = (clickY * dpr - offsetY) / fitScale;

		const hit = hitTestObject(currentState, sceneX, sceneY);
		if (hit) {
			selectedObjectId = hit.id;
			onSelectObject?.(hit.id);

			isDragging = true;
			dragStartPos = { x: sceneX, y: sceneY };
			draggedObjInitialPos = { x: hit.transform.x, y: hit.transform.y };
			(e.target as HTMLElement).setPointerCapture(e.pointerId);
		} else {
			selectedObjectId = null;
			onSelectObject?.(null);
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!isDragging || !selectedObjectId || !canvasEl) return;
		const rect = canvasEl.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const clickY = e.clientY - rect.top;

		const canvasWidth = canvasEl.width;
		const canvasHeight = canvasEl.height;
		const dpr = window.devicePixelRatio || 1;

		const scaleX = canvasWidth / project.settings.width;
		const scaleY = canvasHeight / project.settings.height;
		const fitScale = Math.min(scaleX, scaleY);

		const offsetX = (canvasWidth - project.settings.width * fitScale) / 2;
		const offsetY = (canvasHeight - project.settings.height * fitScale) / 2;

		const sceneX = (clickX * dpr - offsetX) / fitScale;
		const sceneY = (clickY * dpr - offsetY) / fitScale;

		const deltaX = sceneX - dragStartPos.x;
		const deltaY = sceneY - dragStartPos.y;

		const newX = Math.round(draggedObjInitialPos.x + deltaX);
		const newY = Math.round(draggedObjInitialPos.y + deltaY);

		onObjectMove?.(selectedObjectId, newX, newY);
	}

	function handlePointerUp(e: PointerEvent) {
		if (isDragging) {
			isDragging = false;
			try {
				(e.target as HTMLElement).releasePointerCapture(e.pointerId);
			} catch {}
		}
	}

	function formatTimecode(ms: number, fps: number): string {
		const totalSeconds = ms / 1000;
		const minutes = Math.floor(totalSeconds / 60);
		const seconds = Math.floor(totalSeconds % 60);
		const frames = Math.floor((totalSeconds % 1) * fps);
		return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
	}
</script>

<div class="flex flex-col h-full w-full bg-bg select-none overflow-hidden relative">
	<!-- Canvas Viewport -->
	<div
		bind:this={containerEl}
		class="flex-1 w-full relative flex items-center justify-center p-3 overflow-hidden bg-surface-1/40"
	>
		<canvas
			bind:this={canvasEl}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			onpointercancel={handlePointerUp}
			class="max-w-full max-h-full rounded-xs shadow-2xl touch-none cursor-crosshair border border-border"
			style="aspect-ratio: {project.settings.width} / {project.settings.height};"
		></canvas>

		<!-- Dimension Overlay Badge -->
		<div class="absolute top-4 left-4 pointer-events-none">
			<span class="text-[10px] font-mono bg-surface-1/80 border border-border px-2 py-0.5 rounded-xs text-text-muted">
				{project.settings.width}×{project.settings.height} ({project.settings.fps}fps)
			</span>
		</div>
	</div>

	<!-- Transport Controls Bar -->
	<div class="h-12 border-t border-border bg-surface-1 px-4 flex items-center justify-between gap-3 shrink-0">
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Skip to start"
				onclick={() => {
					currentTimeMs = 0;
					onTimeChange?.(0);
				}}
				class="h-8 w-8 text-text-secondary hover:text-text"
			>
				<SkipBack size={15} />
			</Button>

			<Button
				variant="primary"
				size="icon"
				ariaLabel={isPlaying ? 'Pause animation' : 'Play animation'}
				onclick={togglePlay}
				class="h-8 w-8 shadow-sm"
			>
				{#if isPlaying}
					<Pause size={15} />
				{:else}
					<Play size={15} />
				{/if}
			</Button>

			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Toggle loop"
				onclick={() => (isLooping = !isLooping)}
				class="h-8 w-8 {isLooping ? 'text-accent' : 'text-text-muted hover:text-text'}"
			>
				<Repeat size={14} />
			</Button>
		</div>

		<!-- Timecode & Duration -->
		<div class="flex items-center gap-2 font-mono text-xs">
			<span class="text-text font-medium">{formatTimecode(currentTimeMs, project.settings.fps)}</span>
			<span class="text-text-muted">/</span>
			<span class="text-text-muted">{formatTimecode(project.settings.durationMs, project.settings.fps)}</span>
		</div>

		<!-- Viewport Actions -->
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Reset view"
				onclick={resizeCanvas}
				class="h-8 w-8 text-text-muted hover:text-text"
			>
				<Maximize2 size={14} />
			</Button>
		</div>
	</div>
</div>
