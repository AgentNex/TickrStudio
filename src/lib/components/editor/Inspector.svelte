<script lang="ts">
	import type { TimelineProject, SceneObject, EasingName } from '$lib/types/timeline';
	import Input from '$lib/components/ui/Input.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import {
		Diamond,
		SlidersHorizontal,
		RotateCw,
		Move,
		Scaling,
		Type,
		Square,
		Circle,
		Palette,
		Layers
	} from '@lucide/svelte';

	interface Props {
		project: TimelineProject;
		selectedObjectId: string | null;
		currentTimeMs: number;
		onUpdateObject: (updated: SceneObject) => void;
		onAddKeyframe: (objectId: string, property: string, timeMs: number, value: any, easing: EasingName) => void;
	}

	let {
		project,
		selectedObjectId,
		currentTimeMs,
		onUpdateObject,
		onAddKeyframe
	}: Props = $props();

	const selectedObj = $derived(
		project.objects.find((o) => o.id === selectedObjectId) || null
	);

	function updateProp(key: string, val: any) {
		if (!selectedObj) return;
		const clone = JSON.parse(JSON.stringify(selectedObj)) as SceneObject;
		if (key in clone.transform) {
			(clone.transform as any)[key] = Number(val);
		} else {
			(clone as any)[key] = val;
		}
		onUpdateObject(clone);
	}

	function handleAddKeyframe(propName: string, defaultValue: any) {
		if (!selectedObj) return;
		onAddKeyframe(selectedObj.id, propName, Math.round(currentTimeMs), defaultValue, 'easeOut');
	}
</script>

<aside class="flex flex-col h-full bg-surface-1 border-l border-border select-none overflow-y-auto">
	<!-- Header -->
	<div class="h-10 px-3 border-b border-border flex items-center justify-between shrink-0">
		<div class="flex items-center gap-2">
			<SlidersHorizontal size={14} class="text-accent" />
			<span class="text-xs font-semibold tracking-wider uppercase text-text-muted">Inspector</span>
		</div>
		{#if selectedObj}
			<Badge variant="accent" class="text-[10px] uppercase">{selectedObj.type}</Badge>
		{/if}
	</div>

	<!-- Content -->
	{#if !selectedObj}
		<div class="p-8 text-center flex flex-col items-center justify-center gap-2 text-text-muted my-auto">
			<Layers size={24} class="opacity-40" />
			<p class="text-xs">No layer selected</p>
			<p class="text-[11px] text-text-muted/70">Click a canvas object or timeline track to inspect properties.</p>
		</div>
	{:else}
		<div class="p-3.5 flex flex-col gap-5">
			<!-- Layer Name -->
			<div class="flex flex-col gap-1">
				<Input
					label="Layer Name"
					value={selectedObj.name}
					size="sm"
					oninput={(e) => updateProp('name', (e.target as HTMLInputElement).value)}
				/>
			</div>

			<!-- Transform Section -->
			<div class="flex flex-col gap-3 pt-2 border-t border-border">
				<div class="flex items-center justify-between">
					<span class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
						<Move size={12} class="text-text-muted" />
						Position &amp; Transform
					</span>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between text-[11px] text-text-muted">
							<span>X Position</span>
							<button
								type="button"
								class="text-accent hover:text-accent-hover p-0.5 cursor-pointer"
								title="Add X Keyframe at playhead"
								onclick={() => handleAddKeyframe('x', selectedObj.transform.x)}
							>
								<Diamond size={11} />
							</button>
						</div>
						<input
							type="number"
							value={Math.round(selectedObj.transform.x)}
							oninput={(e) => updateProp('x', (e.target as HTMLInputElement).value)}
							class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between text-[11px] text-text-muted">
							<span>Y Position</span>
							<button
								type="button"
								class="text-accent hover:text-accent-hover p-0.5 cursor-pointer"
								title="Add Y Keyframe at playhead"
								onclick={() => handleAddKeyframe('y', selectedObj.transform.y)}
							>
								<Diamond size={11} />
							</button>
						</div>
						<input
							type="number"
							value={Math.round(selectedObj.transform.y)}
							oninput={(e) => updateProp('y', (e.target as HTMLInputElement).value)}
							class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-2">
					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between text-[11px] text-text-muted">
							<span>Scale X</span>
							<button
								type="button"
								class="text-accent hover:text-accent-hover p-0.5 cursor-pointer"
								title="Add Scale X Keyframe at playhead"
								onclick={() => handleAddKeyframe('scaleX', selectedObj.transform.scaleX)}
							>
								<Diamond size={11} />
							</button>
						</div>
						<input
							type="number"
							step="0.1"
							value={selectedObj.transform.scaleX}
							oninput={(e) => updateProp('scaleX', (e.target as HTMLInputElement).value)}
							class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
						/>
					</div>

					<div class="flex flex-col gap-1">
						<div class="flex items-center justify-between text-[11px] text-text-muted">
							<span>Scale Y</span>
							<button
								type="button"
								class="text-accent hover:text-accent-hover p-0.5 cursor-pointer"
								title="Add Scale Y Keyframe at playhead"
								onclick={() => handleAddKeyframe('scaleY', selectedObj.transform.scaleY)}
							>
								<Diamond size={11} />
							</button>
						</div>
						<input
							type="number"
							step="0.1"
							value={selectedObj.transform.scaleY}
							oninput={(e) => updateProp('scaleY', (e.target as HTMLInputElement).value)}
							class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
						/>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<div class="flex items-center justify-between text-[11px] text-text-muted">
						<span>Opacity</span>
						<button
							type="button"
							class="text-accent hover:text-accent-hover p-0.5 cursor-pointer"
							title="Add Opacity Keyframe at playhead"
							onclick={() => handleAddKeyframe('opacity', selectedObj.transform.opacity)}
						>
							<Diamond size={11} />
						</button>
					</div>
					<Slider
						value={Math.round(selectedObj.transform.opacity * 100)}
						min={0}
						max={100}
						step={1}
						unit="%"
						onChange={(val) => updateProp('opacity', val / 100)}
					/>
				</div>

				<div class="flex flex-col gap-1">
					<div class="flex items-center justify-between text-[11px] text-text-muted">
						<span>Rotation</span>
						<button
							type="button"
							class="text-accent hover:text-accent-hover p-0.5 cursor-pointer"
							title="Add Rotation Keyframe at playhead"
							onclick={() => handleAddKeyframe('rotationDeg', selectedObj.transform.rotationDeg)}
						>
							<Diamond size={11} />
						</button>
					</div>
					<Slider
						value={selectedObj.transform.rotationDeg}
						min={-180}
						max={180}
						step={1}
						unit="°"
						onChange={(val) => updateProp('rotationDeg', val)}
					/>
				</div>
			</div>

			<!-- Type Specific Parameters -->
			{#if selectedObj.type === 'text'}
				<div class="flex flex-col gap-3 pt-3 border-t border-border">
					<span class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
						<Type size={12} class="text-text-muted" />
						Typography
					</span>

					<div class="flex flex-col gap-1">
						<label for="text-content-input" class="text-[11px] text-text-muted">Text Content</label>
						<textarea
							id="text-content-input"
							rows="2"
							value={selectedObj.content}
							oninput={(e) => updateProp('content', (e.target as HTMLTextAreaElement).value)}
							class="w-full bg-surface-2 border border-border rounded-xs p-2 text-xs text-text focus:outline-none focus:border-accent resize-none"
						></textarea>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Font Size</span>
							<input
								type="number"
								value={selectedObj.fontSize}
								oninput={(e) => updateProp('fontSize', Number((e.target as HTMLInputElement).value))}
								class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
							/>
						</div>

						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Text Color</span>
							<div class="flex items-center gap-1.5">
								<input
									type="color"
									value={selectedObj.fill}
									oninput={(e) => updateProp('fill', (e.target as HTMLInputElement).value)}
									class="h-7 w-7 rounded-xs bg-transparent border border-border cursor-pointer p-0"
								/>
								<input
									type="text"
									value={selectedObj.fill}
									oninput={(e) => updateProp('fill', (e.target as HTMLInputElement).value)}
									class="h-7 px-1.5 text-[11px] font-mono bg-surface-2 border border-border rounded-xs text-text w-full uppercase focus:outline-none focus:border-accent"
								/>
							</div>
						</div>
					</div>
				</div>
			{:else if selectedObj.type === 'rect'}
				<div class="flex flex-col gap-3 pt-3 border-t border-border">
					<span class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
						<Square size={12} class="text-text-muted" />
						Rectangle Geometry
					</span>

					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Width</span>
							<input
								type="number"
								value={selectedObj.width}
								oninput={(e) => updateProp('width', Number((e.target as HTMLInputElement).value))}
								class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Height</span>
							<input
								type="number"
								value={selectedObj.height}
								oninput={(e) => updateProp('height', Number((e.target as HTMLInputElement).value))}
								class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
							/>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<span class="text-[11px] text-text-muted">Corner Radius</span>
						<Slider
							value={selectedObj.cornerRadius || 0}
							min={0}
							max={100}
							step={1}
							unit="px"
							onChange={(val) => updateProp('cornerRadius', val)}
						/>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Fill Color</span>
							<div class="flex items-center gap-1.5">
								<input
									type="color"
									value={selectedObj.fill}
									oninput={(e) => updateProp('fill', (e.target as HTMLInputElement).value)}
									class="h-7 w-7 rounded-xs bg-transparent border border-border cursor-pointer p-0"
								/>
								<input
									type="text"
									value={selectedObj.fill}
									oninput={(e) => updateProp('fill', (e.target as HTMLInputElement).value)}
									class="h-7 px-1.5 text-[11px] font-mono bg-surface-2 border border-border rounded-xs text-text w-full uppercase focus:outline-none focus:border-accent"
								/>
							</div>
						</div>

						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Stroke Color</span>
							<div class="flex items-center gap-1.5">
								<input
									type="color"
									value={selectedObj.stroke || '#D6D3C9'}
									oninput={(e) => updateProp('stroke', (e.target as HTMLInputElement).value)}
									class="h-7 w-7 rounded-xs bg-transparent border border-border cursor-pointer p-0"
								/>
								<input
									type="text"
									value={selectedObj.stroke || '#D6D3C9'}
									oninput={(e) => updateProp('stroke', (e.target as HTMLInputElement).value)}
									class="h-7 px-1.5 text-[11px] font-mono bg-surface-2 border border-border rounded-xs text-text w-full uppercase focus:outline-none focus:border-accent"
								/>
							</div>
						</div>
					</div>
				</div>
			{:else if selectedObj.type === 'ellipse'}
				<div class="flex flex-col gap-3 pt-3 border-t border-border">
					<span class="text-[11px] font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
						<Circle size={12} class="text-text-muted" />
						Ellipse Radii
					</span>

					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Radius X</span>
							<input
								type="number"
								value={selectedObj.radiusX}
								oninput={(e) => updateProp('radiusX', Number((e.target as HTMLInputElement).value))}
								class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
							/>
						</div>
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Radius Y</span>
							<input
								type="number"
								value={selectedObj.radiusY}
								oninput={(e) => updateProp('radiusY', Number((e.target as HTMLInputElement).value))}
								class="h-7 px-2 text-xs font-mono bg-surface-2 border border-border rounded-xs text-text focus:outline-none focus:border-accent"
							/>
						</div>
					</div>

					<div class="grid grid-cols-2 gap-2">
						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Fill Color</span>
							<div class="flex items-center gap-1.5">
								<input
									type="color"
									value={selectedObj.fill}
									oninput={(e) => updateProp('fill', (e.target as HTMLInputElement).value)}
									class="h-7 w-7 rounded-xs bg-transparent border border-border cursor-pointer p-0"
								/>
								<input
									type="text"
									value={selectedObj.fill}
									oninput={(e) => updateProp('fill', (e.target as HTMLInputElement).value)}
									class="h-7 px-1.5 text-[11px] font-mono bg-surface-2 border border-border rounded-xs text-text w-full uppercase focus:outline-none focus:border-accent"
								/>
							</div>
						</div>

						<div class="flex flex-col gap-1">
							<span class="text-[11px] text-text-muted">Stroke Color</span>
							<div class="flex items-center gap-1.5">
								<input
									type="color"
									value={selectedObj.stroke || '#D6D3C9'}
									oninput={(e) => updateProp('stroke', (e.target as HTMLInputElement).value)}
									class="h-7 w-7 rounded-xs bg-transparent border border-border cursor-pointer p-0"
								/>
								<input
									type="text"
									value={selectedObj.stroke || '#D6D3C9'}
									oninput={(e) => updateProp('stroke', (e.target as HTMLInputElement).value)}
									class="h-7 px-1.5 text-[11px] font-mono bg-surface-2 border border-border rounded-xs text-text w-full uppercase focus:outline-none focus:border-accent"
								/>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</aside>
