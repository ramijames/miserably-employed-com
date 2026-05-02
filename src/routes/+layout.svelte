<script lang="ts">
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<title>Miserably Employed, LLC</title>
</svelte:head>

{@render children()}
