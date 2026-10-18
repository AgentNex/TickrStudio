<script lang="ts">
	import type { HTMLInputAttributes } from 'svelte/elements';

	interface Props extends Omit<HTMLInputAttributes, 'size'> {
		value?: string | number;
		label?: string;
		error?: string;
		size?: 'sm' | 'md' | 'lg';
	}

	let {
		value = $bindable(''),
		label,
		error,
		size = 'md',
		class: className = '',
		id,
		disabled = false,
		...rest
	}: Props = $props();

	const inputId = $derived(id || (label ? `input-${Math.random().toString(36).slice(2, 8)}` : undefined));

	const sizeClasses = {
		sm: 'h-7 px-2 text-xs rounded-sm',
		md: 'h-9 px-3 text-sm rounded-md',
		lg: 'h-11 px-4 text-base rounded-lg'
	};
</script>

<div class="flex flex-col gap-1 w-full">
	{#if label}
		<label for={inputId} class="text-xs font-medium text-text-secondary select-none">
			{label}
		</label>
	{/if}
	<input
		id={inputId}
		bind:value
		{disabled}
		class="w-full bg-surface-1 border border-border text-text placeholder:text-text-muted transition-colors duration-150 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed {error ? 'border-danger focus:border-danger focus:ring-danger' : ''} {sizeClasses[size]} {className}"
		{...rest}
	/>
	{#if error}
		<span class="text-xs text-danger">{error}</span>
	{/if}
</div>
