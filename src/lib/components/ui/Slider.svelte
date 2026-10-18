<script lang="ts">
	interface Props {
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		label?: string;
		unit?: string;
		disabled?: boolean;
		class?: string;
		onChange?: (val: number) => void;
	}

	let {
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		label,
		unit = '',
		disabled = false,
		class: className = '',
		onChange
	}: Props = $props();

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		const num = parseFloat(target.value);
		value = isNaN(num) ? min : num;
		onChange?.(value);
	}
</script>

<div class="flex flex-col gap-1.5 w-full select-none {className}">
	{#if label}
		<div class="flex items-center justify-between text-xs">
			<span class="text-text-secondary font-medium">{label}</span>
			<span class="font-mono text-text-muted">{value}{unit}</span>
		</div>
	{/if}
	<div class="relative flex items-center h-6">
		<input
			type="range"
			{min}
			{max}
			{step}
			{value}
			{disabled}
			oninput={handleInput}
			class="w-full h-1.5 bg-surface-3 rounded-xs appearance-none cursor-pointer accent-accent focus:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-40 disabled:cursor-not-allowed"
		/>
	</div>
</div>
