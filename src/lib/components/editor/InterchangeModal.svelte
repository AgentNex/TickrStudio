<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import { serializeToXml, parseXmlSubset } from '$lib/engine/interchange';
	import { validateTimelineProject } from '$lib/engine/timeline-schema';
	import type { TimelineProject } from '$lib/types/timeline';
	import { FileJson, FileCode, Upload, Download, Copy, Check } from '@lucide/svelte';

	interface Props {
		open?: boolean;
		project: TimelineProject;
		onImport?: (imported: TimelineProject) => void;
	}

	let { open = $bindable(false), project, onImport }: Props = $props();

	let activeTab = $state<'export' | 'import'>('export');
	let format = $state<'json' | 'xml'>('json');
	let importContent = $state('');
	let copied = $state(false);

	let exportedText = $derived.by(() => {
		if (format === 'xml') {
			return serializeToXml(project);
		}
		return JSON.stringify(project, null, 2);
	});

	function handleCopy() {
		navigator.clipboard.writeText(exportedText);
		copied = true;
		toast.success('Copied to clipboard', `${format.toUpperCase()} scene code copied`);
		setTimeout(() => (copied = false), 2000);
	}

	function handleDownload() {
		const ext = format === 'xml' ? 'xml' : 'json';
		const mime = format === 'xml' ? 'application/xml' : 'application/json';
		const blob = new Blob([exportedText], { type: mime });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}_interchange.${ext}`;
		a.click();
		URL.revokeObjectURL(url);
		toast.success('Downloaded', `Saved as .${ext}`);
	}

	function handleFileUpload(e: Event) {
		const file = (e.target as HTMLInputElement).files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			if (text) {
				importContent = text;
				applyImport();
			}
		};
		reader.readAsText(file);
	}

	function applyImport() {
		const raw = importContent.trim();
		if (!raw) {
			toast.error('Import Error', 'Please paste scene content or upload a file.');
			return;
		}

		if (raw.startsWith('<') || raw.includes('<composition')) {
			const res = parseXmlSubset(raw);
			if (res.success && res.project) {
				onImport?.(res.project);
				toast.success('Scene Imported', `Loaded ${res.project.objects.length} objects from XML`);
				open = false;
				importContent = '';
			} else {
				toast.error('XML Import Failed', res.error || 'Invalid composition XML');
			}
		} else {
			try {
				const json = JSON.parse(raw);
				const val = validateTimelineProject(json);
				if (val.valid) {
					const imported = json as TimelineProject;
					onImport?.(imported);
					toast.success('Scene Imported', `Loaded "${imported.name}" from JSON`);
					open = false;
					importContent = '';
				} else {
					toast.error('JSON Schema Error', val.errors?.[0] || 'Invalid timeline JSON');
				}
			} catch (err: any) {
				toast.error('Invalid JSON', err?.message || 'Could not parse JSON syntax');
			}
		}
	}
</script>

<Dialog
	bind:open
	title="Scene Interchange"
	description="Import and export compositions using canonical JSON or safe XML schema interchange."
>
	<div class="flex flex-col gap-4 py-2">
		<!-- Mode selection tabs -->
		<div class="flex items-center gap-1 p-0.5 bg-surface-2 border border-border rounded-md">
			<button
				type="button"
				class="flex-1 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors {activeTab === 'export' ? 'bg-surface-3 text-text shadow-xs' : 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'export')}
			>
				Export Scene
			</button>
			<button
				type="button"
				class="flex-1 py-1 rounded-sm text-xs font-medium cursor-pointer transition-colors {activeTab === 'import' ? 'bg-surface-3 text-text shadow-xs' : 'text-text-muted hover:text-text'}"
				onclick={() => (activeTab = 'import')}
			>
				Import Scene
			</button>
		</div>

		{#if activeTab === 'export'}
			<div class="flex flex-col gap-2.5">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<button
							type="button"
							class="flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-xs cursor-pointer transition-colors {format === 'json' ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border text-text-muted hover:text-text'}"
							onclick={() => (format = 'json')}
						>
							<FileJson size={13} />
							JSON
						</button>
						<button
							type="button"
							class="flex items-center gap-1.5 px-2.5 py-1 rounded-xs border text-xs cursor-pointer transition-colors {format === 'xml' ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border text-text-muted hover:text-text'}"
							onclick={() => (format = 'xml')}
						>
							<FileCode size={13} />
							XML
						</button>
					</div>

					<div class="flex items-center gap-1.5">
						<Button variant="ghost" size="sm" onclick={handleCopy} class="h-7 text-xs gap-1">
							{#if copied}
								<Check size={12} class="text-success" />
								Copied
							{:else}
								<Copy size={12} />
								Copy
							{/if}
						</Button>
						<Button variant="secondary" size="sm" onclick={handleDownload} class="h-7 text-xs gap-1">
							<Download size={12} />
							Download .{format}
						</Button>
					</div>
				</div>

				<textarea
					readonly
					rows={10}
					value={exportedText}
					class="w-full bg-surface-1 border border-border rounded-md p-3 text-[11px] font-mono text-text-secondary select-all focus:outline-none"
				></textarea>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between">
					<span class="text-xs text-text-secondary">Paste JSON or XML, or upload a file:</span>
					<label class="cursor-pointer">
						<span class="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-xs bg-surface-2 hover:bg-surface-3 border border-border text-text transition-colors">
							<Upload size={12} />
							Choose File
						</span>
						<input type="file" accept=".json,.xml,application/json,application/xml,text/xml" class="hidden" onchange={handleFileUpload} />
					</label>
				</div>

				<textarea
					bind:value={importContent}
					rows={8}
					placeholder="Paste composition JSON or XML here..."
					class="w-full bg-surface-1 border border-border rounded-md p-3 text-xs font-mono text-text placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
				></textarea>

				<div class="p-2.5 bg-surface-2/60 border border-border/80 rounded-md text-[11px] text-text-muted">
					<span class="font-semibold text-text-secondary">Note:</span>
					Importing a scene will replace current objects and keyframes with the imported composition. Make sure your current changes are saved.
				</div>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="ghost" onclick={() => (open = false)}>Close</Button>
		{#if activeTab === 'import'}
			<Button variant="primary" onclick={applyImport} disabled={!importContent.trim()}>
				Import Scene
			</Button>
		{/if}
	{/snippet}
</Dialog>
