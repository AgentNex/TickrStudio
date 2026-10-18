<script lang="ts">
	import type { Snippet } from 'svelte';
	import { X } from '@lucide/svelte';
	import Button from './Button.svelte';

	interface Props {
		open?: boolean;
		title?: string;
		description?: string;
		children?: Snippet;
		footer?: Snippet;
		onClose?: () => void;
	}

	let {
		open = $bindable(false),
		title,
		description,
		children,
		footer,
		onClose
	}: Props = $props();

	function close() {
		open = false;
		onClose?.();
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			close();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
		role="dialog"
		aria-modal="true"
		aria-labelledby={title ? 'dialog-title' : undefined}
	>
		<!-- Backdrop click to close -->
		<button
			type="button"
			class="absolute inset-0 w-full h-full cursor-default focus:outline-none"
			onclick={close}
			tabindex="-1"
			aria-hidden="true"
		></button>

		<div
			class="relative z-10 w-full max-w-lg bg-surface-1 border border-border-strong rounded-lg shadow-2xl p-6 flex flex-col gap-4 text-text overflow-hidden"
		>
			<div class="flex items-start justify-between gap-4">
				<div>
					{#if title}
						<h2 id="dialog-title" class="text-base font-semibold text-text tracking-tight">
							{title}
						</h2>
					{/if}
					{#if description}
						<p class="text-xs text-text-secondary mt-1">
							{description}
						</p>
					{/if}
				</div>
				<Button variant="ghost" size="icon" ariaLabel="Close dialog" onclick={close} class="text-text-muted hover:text-text -mr-2 -mt-2">
					<X size={16} />
				</Button>
			</div>

			<div class="py-1">
				{#if children}
					{@render children()}
				{/if}
			</div>

			{#if footer}
				<div class="flex items-center justify-end gap-2 pt-2 border-t border-border mt-2">
					{@render footer()}
				</div>
			{/if}
		</div>
	</div>
{/if}
