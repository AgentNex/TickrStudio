<script lang="ts">
	import { onMount } from 'svelte';
	import { parseRecipe, type ParseError } from '$lib/engine/recipe-parser';
	import { serializeToRecipe } from '$lib/engine/recipe-serializer';
	import type { TimelineProject } from '$lib/types/timeline';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { AlertCircle, CheckCircle2, Code2, Sparkles, RefreshCw } from '@lucide/svelte';

	interface Props {
		project: TimelineProject;
		onProjectUpdated: (project: TimelineProject) => void;
	}

	let { project, onProjectUpdated }: Props = $props();

	let editorContainerEl: HTMLDivElement | null = $state(null);
	let recipeText = $state('');
	let parseErrors = $state<ParseError[]>([]);
	let isCodeMirrorActive = $state(false);
	let isFallbackMode = $state(false);
	let cmView: any = null;

	// Populate initial recipe text from project
	$effect(() => {
		if (!recipeText) {
			recipeText = serializeToRecipe(project);
		}
	});

	onMount(() => {
		let isDestroyed = false;

		(async () => {
			try {
				const { EditorView, basicSetup } = await import('codemirror');
				const { EditorState } = await import('@codemirror/state');

				if (editorContainerEl && !isDestroyed) {
					const state = EditorState.create({
						doc: recipeText || serializeToRecipe(project),
						extensions: [
							basicSetup,
							EditorView.theme({
								'&': {
									height: '100%',
									fontSize: '13px',
									fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
									backgroundColor: '#0A0A0B',
									color: '#F5F5F0'
								},
								'.cm-content': {
									caretColor: '#D6D3C9',
									padding: '12px 0'
								},
								'.cm-gutters': {
									backgroundColor: '#111113',
									color: '#71717A',
									borderRight: '1px solid #2A2A2E'
								},
								'.cm-activeLineGutter': {
									backgroundColor: '#19191C',
									color: '#F5F5F0'
								},
								'.cm-activeLine': {
									backgroundColor: '#141416'
								},
								'&.cm-focused .cm-cursor': {
									borderLeftColor: '#D6D3C9'
								}
							}),
							EditorView.updateListener.of((update: any) => {
								if (update.docChanged) {
									const newText = update.state.doc.toString();
									recipeText = newText;
									handleTextChange(newText);
								}
							})
						]
					});

					cmView = new EditorView({
						state,
						parent: editorContainerEl
					});
					isCodeMirrorActive = true;
				}
			} catch (err) {
				console.warn('CodeMirror failed to mount; using accessible textarea fallback:', err);
				isFallbackMode = true;
			}
		})();

		return () => {
			isDestroyed = true;
			if (cmView) cmView.destroy();
		};
	});

	let debounceTimeout: any = null;
	function handleTextChange(text: string) {
		clearTimeout(debounceTimeout);
		debounceTimeout = setTimeout(() => {
			const res = parseRecipe(text);
			if (res.success && res.project) {
				parseErrors = [];
				onProjectUpdated(res.project);
			} else {
				parseErrors = res.errors;
			}
		}, 250);
	}

	function syncFromVisual() {
		const fresh = serializeToRecipe(project);
		recipeText = fresh;
		parseErrors = [];
		if (cmView) {
			cmView.dispatch({
				changes: { from: 0, to: cmView.state.doc.length, insert: fresh }
			});
		}
	}
</script>

<div class="flex flex-col h-full w-full bg-bg select-text overflow-hidden relative font-mono">
	<!-- Editor Toolbar -->
	<div class="h-9 px-4 bg-surface-1 border-b border-border flex items-center justify-between text-xs shrink-0">
		<div class="flex items-center gap-2">
			<Code2 size={14} class="text-accent" />
			<span class="font-sans font-semibold tracking-wide uppercase text-text-secondary text-[11px]">
				Recipe DSL
			</span>
			{#if parseErrors.length === 0}
				<Badge variant="success" class="text-[10px] py-0 px-1.5 gap-1">
					<CheckCircle2 size={10} />
					COMPILED
				</Badge>
			{:else}
				<Badge variant="danger" class="text-[10px] py-0 px-1.5 gap-1">
					<AlertCircle size={10} />
					{parseErrors.length} ERROR{parseErrors.length > 1 ? 'S' : ''}
				</Badge>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" onclick={syncFromVisual} class="h-6 px-2 text-[11px] gap-1">
				<RefreshCw size={11} />
				Sync from Visual
			</Button>
		</div>
	</div>

	<!-- Code Editor Container / Fallback -->
	<div class="flex-1 relative overflow-hidden bg-bg">
		{#if !isFallbackMode}
			<div bind:this={editorContainerEl} class="h-full w-full overflow-auto"></div>
		{:else}
			<textarea
				bind:value={recipeText}
				oninput={(e) => handleTextChange((e.target as HTMLTextAreaElement).value)}
				class="h-full w-full bg-bg text-text p-4 font-mono text-xs resize-none focus:outline-none border-none leading-relaxed"
				placeholder="[RECIPE]..."
				spellcheck="false"
			></textarea>
		{/if}
	</div>

	<!-- Error Diagnostics Footer Bar -->
	{#if parseErrors.length > 0}
		<div class="p-2.5 bg-danger/15 border-t border-danger/30 text-danger text-xs flex flex-col gap-1 font-sans shrink-0 max-h-24 overflow-y-auto">
			{#each parseErrors as err}
				<div class="flex items-center gap-2">
					<AlertCircle size={13} class="shrink-0" />
					<span>Line {err.line}, Col {err.column}: {err.message}</span>
				</div>
			{/each}
		</div>
	{/if}
</div>
