<script lang="ts">
	import { onMount } from 'svelte';
	import type { TimelineProject } from '$lib/types/timeline';
	import { checkExportCapabilities, type ExportCapabilities } from '$lib/engine/export-capabilities';
	import { exportProjectVideo, type ExportProgress, type ExportResult } from '$lib/engine/video-exporter';
	import Dialog from '$lib/components/ui/Dialog.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import { toast } from '$lib/state/toast.svelte';
	import {
		Download,
		Film,
		CheckCircle2,
		AlertCircle,
		LoaderCircle,
		Sparkles,
		X
	} from '@lucide/svelte';

	interface Props {
		project: TimelineProject;
		open: boolean;
		onClose: () => void;
	}

	let { project, open = $bindable(false), onClose }: Props = $props();

	let capabilities = $state<ExportCapabilities | null>(null);
	let isExporting = $state(false);
	let isCancelled = $state(false);
	let progress = $state<ExportProgress | null>(null);
	let exportResult = $state<ExportResult | null>(null);
	let errorMessage = $state<string | null>(null);

	let exportWidth = $state(1920);
	let exportHeight = $state(1080);
	let exportFps = $state(30);

	$effect(() => {
		if (open && project) {
			exportWidth = project.settings.width || 1920;
			exportHeight = project.settings.height || 1080;
			exportFps = project.settings.fps || 30;

			checkExportCapabilities(exportWidth, exportHeight, exportFps).then((res) => {
				capabilities = res;
			});
		}
	});

	async function startExport() {
		isExporting = true;
		isCancelled = false;
		progress = { currentFrame: 0, totalFrames: 1, percent: 0 };
		exportResult = null;
		errorMessage = null;

		try {
			const res = await exportProjectVideo(project, {
				width: exportWidth,
				height: exportHeight,
				fps: exportFps,
				onProgress: (p) => {
					progress = p;
				},
				checkCancelled: () => isCancelled
			});

			exportResult = res;
			toast.success('Export Complete', `Generated ${res.filename} (${(res.blob.size / (1024 * 1024)).toFixed(2)} MB)`);
		} catch (err: any) {
			if (isCancelled) {
				toast.info('Export Cancelled');
			} else {
				errorMessage = err?.message || 'Export failed';
				toast.error('Export Error', errorMessage ?? undefined);
			}
		} finally {
			isExporting = false;
		}
	}

	function cancelExport() {
		isCancelled = true;
	}

	function downloadFile() {
		if (!exportResult) return;
		const url = URL.createObjectURL(exportResult.blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = exportResult.filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}
</script>

<Dialog
	bind:open
	title="Export Composition"
	description="Render keyframe animation into high-quality video directly in your browser."
	{onClose}
>
	<div class="flex flex-col gap-4 py-2">
		<!-- Capabilities Badge -->
		<div class="flex items-center justify-between p-2.5 rounded-md bg-surface-2 border border-border">
			<div class="flex items-center gap-2">
				<Film size={15} class="text-accent" />
				<span class="text-xs font-medium text-text">Encoding Pipeline</span>
			</div>
			{#if !capabilities}
				<span class="text-[10px] text-text-muted font-mono">Probing hardware...</span>
			{:else if capabilities.method === 'webcodecs-mp4'}
				<Badge variant="success" class="text-[10px] gap-1">
					<CheckCircle2 size={10} />
					WEBCODECS MP4 (H.264)
				</Badge>
			{:else if capabilities.method === 'mediarecorder-webm'}
				<Badge variant="info" class="text-[10px] gap-1">
					WEBM (MEDIARECORDER)
				</Badge>
			{:else}
				<Badge variant="danger" class="text-[10px] gap-1">
					<AlertCircle size={10} />
					UNSUPPORTED BROWSER
				</Badge>
			{/if}
		</div>

		<!-- Resolution Selector -->
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-medium text-text-secondary">Resolution</span>
			<div class="grid grid-cols-3 gap-2">
				<button
					type="button"
					class="p-2 rounded-md border text-xs cursor-pointer transition-colors {exportWidth === 1920 && exportHeight === 1080 ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text'}"
					onclick={() => {
						exportWidth = 1920;
						exportHeight = 1080;
					}}
				>
					1080p Full HD
				</button>
				<button
					type="button"
					class="p-2 rounded-md border text-xs cursor-pointer transition-colors {exportWidth === 1280 && exportHeight === 720 ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text'}"
					onclick={() => {
						exportWidth = 1280;
						exportHeight = 720;
					}}
				>
					720p HD
				</button>
				<button
					type="button"
					class="p-2 rounded-md border text-xs cursor-pointer transition-colors {exportWidth === project.settings.width && exportHeight === project.settings.height && !(exportWidth === 1920 && exportHeight === 1080) ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text'}"
					onclick={() => {
						exportWidth = project.settings.width;
						exportHeight = project.settings.height;
					}}
				>
					Match Scene
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
						class="py-1.5 rounded-md border text-xs font-mono cursor-pointer transition-colors {exportFps === fpsOption ? 'border-accent bg-surface-2 text-text font-semibold' : 'border-border bg-surface-1 text-text-muted hover:text-text'}"
						onclick={() => (exportFps = fpsOption)}
					>
						{fpsOption} FPS
					</button>
				{/each}
			</div>
		</div>

		<!-- Progress Indicator -->
		{#if isExporting && progress}
			<div class="flex flex-col gap-2 p-3 rounded-md bg-surface-2 border border-border">
				<div class="flex items-center justify-between text-xs">
					<span class="flex items-center gap-1.5 text-text font-medium">
						<LoaderCircle size={13} class="animate-spin text-accent" />
						Encoding frames...
					</span>
					<span class="font-mono text-accent">{progress.percent}%</span>
				</div>
				<div class="h-1.5 w-full bg-surface-3 rounded-xs overflow-hidden">
					<div
						class="h-full bg-accent transition-all duration-150 rounded-xs"
						style="width: {progress.percent}%;"
					></div>
				</div>
				<span class="text-[10px] font-mono text-text-muted">
					Frame {progress.currentFrame} of {progress.totalFrames}
				</span>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="p-3 rounded-md bg-danger/15 border border-danger/30 text-danger text-xs flex items-center gap-2">
				<AlertCircle size={14} class="shrink-0" />
				<span>{errorMessage}</span>
			</div>
		{/if}

		<!-- Success State -->
		{#if exportResult}
			<div class="p-3.5 rounded-md bg-success/15 border border-success/30 text-success text-xs flex items-center justify-between gap-3">
				<div class="flex items-center gap-2">
					<CheckCircle2 size={16} class="shrink-0" />
					<div class="flex flex-col">
						<span class="font-semibold text-text">{exportResult.filename}</span>
						<span class="text-[11px] text-text-muted">
							{(exportResult.blob.size / (1024 * 1024)).toFixed(2)} MB · Ready for download
						</span>
					</div>
				</div>
				<Button variant="primary" size="sm" onclick={downloadFile} class="gap-1 shadow-sm shrink-0">
					<Download size={13} />
					Download
				</Button>
			</div>
		{/if}
	</div>

	{#snippet footer()}
		{#if isExporting}
			<Button variant="danger" size="sm" onclick={cancelExport}>Cancel</Button>
		{:else if exportResult}
			<Button variant="ghost" size="sm" onclick={onClose}>Close</Button>
			<Button variant="primary" size="sm" onclick={downloadFile} class="gap-1">
				<Download size={13} />
				Download File
			</Button>
		{:else}
			<Button variant="ghost" size="sm" onclick={onClose}>Cancel</Button>
			<Button
				variant="primary"
				size="sm"
				onclick={startExport}
				disabled={capabilities ? !capabilities.supported : false}
				class="gap-1.5 shadow-sm"
			>
				<Download size={14} />
				Start Render
			</Button>
		{/if}
	{/snippet}
</Dialog>
