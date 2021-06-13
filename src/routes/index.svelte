<script lang="ts">
	import { fadeIn, flyOutUp } from "$lib/transition"
	import { fade, fly } from "svelte/transition"
</script>

<svelte:head>
	<title>Home - Webcells</title>
</svelte:head>

<main in:fade={fadeIn} out:fly={flyOutUp}>
	<h1 class="text-[9rem] font-thin uppercase">Webcells</h1>

	<nav class="contents">
		<div class="my-auto nav">
			<a class="btn" href="/tutorial" sveltekit:prefetch>Tutorial</a>
			<a class="btn" href="/custom" sveltekit:prefetch>Play custom level</a>
			<button class="btn flex-col" href="/random" disabled
				>Play random level<span class="text-sm">Coming soon</span></button
			>
		</div>

		<div class="nav" style="--n-cols: 2">
			<a class="btn" href="/editor" sveltekit:prefetch>Level editor</a>
			<a class="btn" href="/settings" sveltekit:prefetch>Settings</a>
		</div>
	</nav>
</main>

<style lang="postcss">
	main {
		@apply flex flex-col items-center py-12;
	}

	/* ! HACK */
	h1 {
		font-size: 5rem;
	}

	.nav {
		display: grid;
		grid-template-columns: 1fr;
		gap: 2.5rem;
	}

	@screen lg {
		/* ! HACK - text-[9rem] is broken rn */
		h1 {
			font-size: 9rem;
		}

		.nav {
			grid-template-columns: repeat(var(--n-cols, 3), 1fr);
		}
	}
</style>
