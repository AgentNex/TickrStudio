<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Slider from '$lib/components/ui/Slider.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import { generateAiRecipe } from '$lib/engine/ai-recipe';
	import type { TimelineProject } from '$lib/types/timeline';
	import { Sparkles, Wand2, LoaderCircle } from '@lucide/svelte';

	interface Props {
		open?: boolean;
		onApply?: (project: TimelineProject, recipeText: string) => void;
	}

	let { open = $bindable(false), onApply }: Props = $props();

	let promptText = $state('Product launch intro for TickrStudio with sleek title animation');
	let aspectRatio = $state<'16:9' | '9:16' | '1:1'>('16:9');
	let durationSeconds = $state(4);
	let isGenerating = $state(false);

	const examplePrompts = [
		'Tech podcast intro titled "Future Sync"',
		'Minimal typography reveal with dark background',
		'Special event flash sale announcement',
		'Product launch reveal for Nova'
	];

	function handleGenerate() {
		if (!promptText.trim()) return;
		isGenerating = true;

		setTimeout(() => {
			try {
				const result = generateAiRecipe({
					prompt: promptText.trim(),
					aspectRatio,
					durationSeconds
				});
				toast.success('AI Composition Generated', `Created "${result.project.name}" recipe`);
				onApply?.(result.project, result.recipeText);
				open = false;
			} catch (err: any) {
				toast.error('AI Generation Failed', err?.message);
			} finally {
				isGenerating = false;
			}
		}, 600);
	}
</script>

<Dialog
	bind:open
	title="AI Scene Assistant"
	description="Generate a complete structured motion graphics scene and recipe from a brief."
>
	<div class="flex flex-col gap-4 py-2">
		<div class="flex flex-col gap-1.5">
			<label for="ai-prompt-input" class="text-xs font-medium text-text-secondary">Scene Description Brief</label>
			<textarea
				id="ai-prompt-input"
				bind:value={promptText}
				rows={3}
				placeholder="Describe the composition, title, feeling, and colors..."
				class="w-full bg-surface-1 border border-border rounded-md p-3 text-xs text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-colors"
			></textarea>
		</div>

		<!-- Quick presets -->
		<div class="flex flex-col gap-1.5">
			<span class="text-[11px] text-text-muted font-medium">Quick Ideas</span>
			<div class="flex flex-wrap gap-1.5">
				{#each examplePrompts as ex}
					<button
						type="button"
						class="text-[10px] px-2 py-1 rounded-xs bg-surface-2 hover:bg-surface-3 text-text-secondary hover:text-text border border-border cursor-pointer transition-colors text-left"
						onclick={() => (promptText = ex)}
					>
						{ex}
					</button>
				{/each}
			</div>
		</div>

		<!-- Format and Duration -->
		<div class="grid grid-cols-3 gap-2">
			{#each (['16:9', '9:16', '1:1'] as const) as ar}
				<button
					type="button"
					class="py-1.5 rounded-md border text-xs font-mono cursor-pointer transition-colors {aspectRatio === ar ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text'}"
					onclick={() => (aspectRatio = ar)}
				>
					{ar}
				</button>
			{/each}
		</div>

		<Slider label="Scene Duration" bind:value={durationSeconds} min={2} max={15} step={1} unit="s" />
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (open = false)}>Cancel</Button>
		<Button variant="primary" onclick={handleGenerate} disabled={isGenerating || !promptText.trim()}>
			{#if isGenerating}
				<LoaderCircle size={14} class="animate-spin" />
				Generating...
			{:else}
				<Sparkles size={14} />
				Generate Scene
			{/if}
		</Button>
	{/snippet}
</Dialog>
