<script lang="ts">
	import { fadeIn, flyOutUp } from "$lib/transition"
	import { fade, fly } from "svelte/transition"
</script>

<svelte:head>
	<title>Home - Webcells</title>
</svelte:head>

<main in:fade={fadeIn} out:fly={flyOutUp}>
	<h1 class="text-[7rem] font-thin uppercase">Webcells</h1>

	<nav class="my-auto grid grid-cols-1 md:grid-cols-3 gap-10">
		<a class="btn" href="/custom" sveltekit:prefetch>Play custom level</a>
		<a class="btn" href="/random" sveltekit:prefetch>Play random level</a>
		<a class="btn" href="/editor" sveltekit:prefetch>Level editor</a>
	</nav>
</main>

<style lang="postcss">
	main {
		@apply flex flex-col items-center py-12;
	}

	/* ! HACK - text-[7rem] is broken rn */
	h1 {
		font-size: 7rem;
	}
</style>
