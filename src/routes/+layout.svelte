<script lang="ts">
	import '../app.css';
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();
</script>

<div class="min-h-screen bg-bg text-text flex flex-col font-sans selection:bg-accent selection:text-accent-foreground">
	{@render children()}
	<ToastContainer />
</div>
