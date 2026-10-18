<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLButtonAttributes } from 'svelte/elements';

	interface Props extends HTMLButtonAttributes {
		variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
		size?: 'sm' | 'md' | 'lg' | 'icon';
		children?: Snippet;
		ariaLabel?: string;
	}

	let {
		variant = 'secondary',
		size = 'md',
		children,
		class: className = '',
		type = 'button',
		disabled = false,
		ariaLabel,
		...rest
	}: Props = $props();

	const variantClasses = {
		primary: 'bg-accent text-accent-foreground hover:bg-accent-hover active:opacity-90 font-medium shadow-sm',
		secondary: 'bg-surface-2 text-text border border-border hover:bg-surface-3 hover:border-border-strong active:bg-surface-1',
		ghost: 'text-text-secondary hover:text-text hover:bg-surface-2 active:bg-surface-3',
		danger: 'bg-surface-2 text-danger border border-danger/30 hover:bg-danger/15 active:bg-danger/25'
	};

	const sizeClasses = {
		sm: 'h-7 px-2.5 text-xs rounded-sm gap-1.5',
		md: 'h-9 px-3.5 text-sm rounded-md gap-2',
		lg: 'h-11 px-5 text-base rounded-lg gap-2.5',
		icon: 'h-9 w-9 p-0 rounded-md justify-center'
	};
</script>

<button
	{type}
	{disabled}
	aria-label={ariaLabel}
	class="inline-flex items-center justify-center font-sans transition-colors duration-150 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-1 focus-visible:ring-offset-bg disabled:opacity-40 disabled:pointer-events-none disabled:cursor-not-allowed cursor-pointer {variantClasses[variant]} {sizeClasses[size]} {className}"
	{...rest}
>
	{#if children}
		{@render children()}
	{/if}
</button>
