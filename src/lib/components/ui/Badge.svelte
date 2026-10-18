<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
		children?: Snippet;
		class?: string;
	}

	let {
		variant = 'default',
		children,
		class: className = ''
	}: Props = $props();

	const variantClasses = {
		default: 'bg-surface-2 text-text-secondary border-border',
		success: 'bg-success/15 text-success border-success/30',
		warning: 'bg-warning/15 text-warning border-warning/30',
		danger: 'bg-danger/15 text-danger border-danger/30',
		info: 'bg-info/15 text-info border-info/30',
		accent: 'bg-accent/15 text-accent border-accent/30'
	};
</script>

<span class="inline-flex items-center px-2 py-0.5 text-xs font-mono font-medium rounded-xs border {variantClasses[variant]} {className}">
	{#if children}
		{@render children()}
	{/if}
</span>
