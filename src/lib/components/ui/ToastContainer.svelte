<script lang="ts">
	import { toast } from '$lib/state/toast.svelte';
	import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from '@lucide/svelte';

	const iconMap = {
		success: CheckCircle2,
		warning: AlertTriangle,
		error: AlertCircle,
		info: Info
	};

	const borderMap = {
		success: 'border-success/40 bg-surface-1',
		warning: 'border-warning/40 bg-surface-1',
		error: 'border-danger/40 bg-surface-1',
		info: 'border-border bg-surface-1'
	};

	const iconColorMap = {
		success: 'text-success',
		warning: 'text-warning',
		error: 'text-danger',
		info: 'text-accent'
	};
</script>

<div
	class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0"
	aria-live="polite"
>
	{#each toast.toasts as item (item.id)}
		{@const Icon = iconMap[item.type || 'info']}
		<div
			class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-md border shadow-lg text-text {borderMap[item.type || 'info']} animate-in slide-in-from-bottom-2 duration-150"
			role="alert"
		>
			<Icon size={18} class="shrink-0 mt-0.5 {iconColorMap[item.type || 'info']}" />
			<div class="flex-1 min-w-0">
				<div class="text-xs font-semibold text-text">{item.title}</div>
				{#if item.message}
					<div class="text-xs text-text-secondary mt-0.5 break-words">{item.message}</div>
				{/if}
			</div>
			<button
				type="button"
				class="text-text-muted hover:text-text p-1 -mr-1 -mt-1 cursor-pointer transition-colors"
				onclick={() => toast.dismiss(item.id)}
				aria-label="Dismiss notification"
			>
				<X size={14} />
			</button>
		</div>
	{/each}
</div>
