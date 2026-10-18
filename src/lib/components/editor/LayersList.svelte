<script lang="ts">
	import type { TimelineProject, SceneObject } from '$lib/types/timeline';
	import Button from '$lib/components/ui/Button.svelte';
	import {
		Eye,
		EyeOff,
		Lock,
		Unlock,
		Trash2,
		Type,
		Square,
		Circle,
		Plus
	} from '@lucide/svelte';

	interface Props {
		project: TimelineProject;
		selectedObjectId: string | null;
		onSelectObject: (id: string | null) => void;
		onAddObject: (type: 'text' | 'rect' | 'ellipse') => void;
		onDeleteObject: (id: string) => void;
		onToggleVisibility: (id: string) => void;
		onToggleLock: (id: string) => void;
	}

	let {
		project,
		selectedObjectId,
		onSelectObject,
		onAddObject,
		onDeleteObject,
		onToggleVisibility,
		onToggleLock
	}: Props = $props();

	function getIcon(type: 'text' | 'rect' | 'ellipse') {
		switch (type) {
			case 'text':
				return Type;
			case 'rect':
				return Square;
			case 'ellipse':
				return Circle;
		}
	}
</script>

<aside class="flex flex-col h-full bg-surface-1 border-r border-border select-none overflow-hidden">
	<!-- Panel Header -->
	<div class="h-10 px-3 border-b border-border flex items-center justify-between gap-2 shrink-0">
		<span class="text-xs font-semibold tracking-wider uppercase text-text-muted">Layers</span>
		<div class="flex items-center gap-1">
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Add Text layer"
				onclick={() => onAddObject('text')}
				class="h-7 w-7 text-text-secondary hover:text-text"
				title="Add Text"
			>
				<Type size={14} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Add Rectangle layer"
				onclick={() => onAddObject('rect')}
				class="h-7 w-7 text-text-secondary hover:text-text"
				title="Add Rectangle"
			>
				<Square size={14} />
			</Button>
			<Button
				variant="ghost"
				size="icon"
				ariaLabel="Add Ellipse layer"
				onclick={() => onAddObject('ellipse')}
				class="h-7 w-7 text-text-secondary hover:text-text"
				title="Add Ellipse"
			>
				<Circle size={14} />
			</Button>
		</div>
	</div>

	<!-- Layer Items List -->
	<div class="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
		{#if project.objects.length === 0}
			<div class="p-6 text-center text-xs text-text-muted">
				No layers in composition. Add a text or shape layer above.
			</div>
		{:else}
			{#each [...project.objects].reverse() as obj (obj.id)}
				{@const Icon = getIcon(obj.type)}
				{@const isSelected = selectedObjectId === obj.id}
				<div
					role="button"
					tabindex="0"
					onclick={() => onSelectObject(obj.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') onSelectObject(obj.id);
					}}
					class="group flex items-center justify-between px-2.5 py-2 rounded-md text-xs cursor-pointer transition-colors duration-100 {isSelected ? 'bg-surface-3 text-text font-medium border border-border-strong' : 'text-text-secondary hover:bg-surface-2 hover:text-text border border-transparent'}"
				>
					<div class="flex items-center gap-2 min-w-0">
						<Icon size={14} class="shrink-0 {isSelected ? 'text-accent' : 'text-text-muted'}" />
						<span class="truncate">{obj.name}</span>
					</div>

					<div class="flex items-center gap-1 opacity-80 group-hover:opacity-100">
						<button
							type="button"
							class="p-1 text-text-muted hover:text-text transition-colors cursor-pointer"
							title={obj.visible ? 'Hide layer' : 'Show layer'}
							onclick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id); }}
						>
							{#if obj.visible}
								<Eye size={13} />
							{:else}
								<EyeOff size={13} class="text-danger" />
							{/if}
						</button>

						<button
							type="button"
							class="p-1 text-text-muted hover:text-text transition-colors cursor-pointer"
							title={obj.locked ? 'Unlock layer' : 'Lock layer'}
							onclick={(e) => { e.stopPropagation(); onToggleLock(obj.id); }}
						>
							{#if obj.locked}
								<Lock size={13} class="text-warning" />
							{:else}
								<Unlock size={13} />
							{/if}
						</button>

						<button
							type="button"
							class="p-1 text-text-muted hover:text-danger transition-colors cursor-pointer"
							title="Delete layer"
							onclick={(e) => { e.stopPropagation(); onDeleteObject(obj.id); }}
						>
							<Trash2 size={13} />
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>
</aside>
