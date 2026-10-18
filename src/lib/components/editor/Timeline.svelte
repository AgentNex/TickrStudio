<script lang="ts">
	import type { TimelineProject, TimelineTrack, Keyframe, EasingName } from '$lib/types/timeline';
	import { Diamond, ZoomIn, ZoomOut, Film, Trash2, Clock } from '@lucide/svelte';
	import Button from '$lib/components/ui/Button.svelte';

	interface Props {
		project: TimelineProject;
		currentTimeMs: number;
		selectedObjectId: string | null;
		selectedKeyframeId?: string | null;
		onTimeChange: (timeMs: number) => void;
		onSelectObject: (id: string | null) => void;
		onSelectKeyframe?: (keyframeId: string | null) => void;
		onDeleteKeyframe?: (objectId: string, prop: string, keyframeId: string) => void;
	}

	let {
		project,
		currentTimeMs,
		selectedObjectId,
		selectedKeyframeId = $bindable(null),
		onTimeChange,
		onSelectObject,
		onSelectKeyframe,
		onDeleteKeyframe
	}: Props = $props();

	let timelineTrackEl: HTMLDivElement | null = $state(null);
	let isScrubbing = false;

	const durationMs = $derived(project.settings.durationMs || 4000);
	const playheadPercent = $derived(
		Math.max(0, Math.min(100, (currentTimeMs / durationMs) * 100))
	);

	// Generate ticks every 500ms
	const ticks = $derived.by(() => {
		const list: { timeMs: number; label: string; isMajor: boolean }[] = [];
		const step = durationMs > 10000 ? 1000 : 500;
		for (let t = 0; t <= durationMs; t += step) {
			list.push({
				timeMs: t,
				label: `${(t / 1000).toFixed(1)}s`,
				isMajor: t % 1000 === 0
			});
		}
		return list;
	});

	function scrubFromPointer(e: PointerEvent) {
		if (!timelineTrackEl) return;
		const rect = timelineTrackEl.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const ratio = Math.max(0, Math.min(1, clickX / rect.width));
		const newTime = Math.round(ratio * durationMs);
		onTimeChange(newTime);
	}

	function handlePointerDown(e: PointerEvent) {
		isScrubbing = true;
		scrubFromPointer(e);
		(e.target as HTMLElement).setPointerCapture(e.pointerId);
	}

	function handlePointerMove(e: PointerEvent) {
		if (isScrubbing) {
			scrubFromPointer(e);
		}
	}

	function handlePointerUp(e: PointerEvent) {
		if (isScrubbing) {
			isScrubbing = false;
			try {
				(e.target as HTMLElement).releasePointerCapture(e.pointerId);
			} catch {}
		}
	}
</script>

<div class="flex flex-col h-full bg-surface-1 select-none overflow-hidden border-t border-border">
	<!-- Timeline Toolbar -->
	<div class="h-8 px-4 bg-surface-2/60 border-b border-border flex items-center justify-between text-xs text-text-muted shrink-0">
		<div class="flex items-center gap-2">
			<Film size={13} class="text-accent" />
			<span class="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Timeline</span>
		</div>
		<div class="flex items-center gap-2 text-[11px] font-mono">
			<span>{project.settings.fps} FPS</span>
			<span>·</span>
			<span>{(durationMs / 1000).toFixed(1)}s total</span>
		</div>
	</div>

	<!-- Ruler & Tracks Container (Scrollable horizontally) -->
	<div class="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
		<!-- Time Ruler Header -->
		<div
			bind:this={timelineTrackEl}
			role="slider"
			aria-label="Timeline playhead scrubber"
			aria-valuemin={0}
			aria-valuemax={durationMs}
			aria-valuenow={currentTimeMs}
			tabindex={0}
			onpointerdown={handlePointerDown}
			onpointermove={handlePointerMove}
			onpointerup={handlePointerUp}
			class="h-7 bg-surface-2 border-b border-border relative cursor-ew-resize select-none shrink-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent"
		>
			{#each ticks as tick}
				{@const leftPct = (tick.timeMs / durationMs) * 100}
				<div
					class="absolute top-0 flex flex-col items-center pointer-events-none -translate-x-1/2"
					style="left: {leftPct}%;"
				>
					<div class="w-px {tick.isMajor ? 'h-3.5 bg-border-strong' : 'h-2 bg-border'}"></div>
					{#if tick.isMajor}
						<span class="text-[9px] font-mono text-text-muted mt-0.5">{tick.label}</span>
					{/if}
				</div>
			{/each}

			<!-- Scrubber Needle Handle -->
			<div
				class="absolute top-0 bottom-0 pointer-events-none z-30 flex flex-col items-center -translate-x-1/2"
				style="left: {playheadPercent}%;"
			>
				<div class="w-2.5 h-3 bg-danger rounded-b-xs shadow-sm"></div>
			</div>
		</div>

		<!-- Track Lanes Area -->
		<div class="flex-1 relative flex flex-col min-h-[140px] bg-bg/50">
			<!-- Vertical Red Playhead Line across all tracks -->
			<div
				class="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center -translate-x-1/2"
				style="left: {playheadPercent}%;"
			>
				<div class="w-0.5 h-full bg-danger opacity-90"></div>
			</div>

			<!-- Track Rows -->
			{#if project.objects.length === 0}
				<div class="p-6 text-center text-xs text-text-muted my-auto">
					No tracks to display.
				</div>
			{:else}
				{#each project.objects as obj (obj.id)}
					{@const isSelected = selectedObjectId === obj.id}
					<div
						role="button"
						tabindex="0"
						onclick={() => onSelectObject(obj.id)}
						onkeydown={(e) => {
							if (e.key === 'Enter') onSelectObject(obj.id);
						}}
						class="h-10 border-b border-border/60 relative flex items-center px-3 text-xs cursor-pointer transition-colors {isSelected ? 'bg-surface-3/80 border-border-strong' : 'hover:bg-surface-2/40'}"
					>
						<!-- Left Track Header Label -->
						<div class="w-32 shrink-0 flex items-center gap-2 pr-2 border-r border-border/40 z-10 bg-inherit">
							<span class="truncate font-medium {isSelected ? 'text-text' : 'text-text-secondary'}">
								{obj.name}
							</span>
						</div>

						<!-- Clip Bar -->
						<div class="flex-1 h-full relative flex items-center px-1">
							<div
								class="h-6 rounded-xs border flex items-center px-2 shadow-xs transition-all {isSelected ? 'bg-surface-2 border-accent/60' : 'bg-surface-2/60 border-border'}"
								style="width: 100%;"
							>
								<!-- Render Keyframe Diamonds within Clip -->
								{#if obj.keyframes}
									{#each Object.entries(obj.keyframes) as [prop, kfs]}
										{#if kfs}
											{#each kfs as kf (kf.id)}
												{@const kfLeft = (kf.timeMs / durationMs) * 100}
												<button
													type="button"
													onclick={(e) => {
														e.stopPropagation();
														selectedKeyframeId = kf.id;
														onSelectKeyframe?.(kf.id);
													}}
													class="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 p-1 hover:scale-125 transition-transform cursor-pointer z-10 {selectedKeyframeId === kf.id ? 'text-accent scale-125' : 'text-text-muted hover:text-text'}"
													style="left: {kfLeft}%;"
													title={`${obj.name}.${prop} at ${kf.timeMs}ms (${kf.easing || 'linear'})`}
												>
													<Diamond size={11} fill="currentColor" />
												</button>
											{/each}
										{/if}
									{/each}
								{/if}
							</div>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
