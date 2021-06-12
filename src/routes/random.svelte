<script lang="ts">
	import { game } from "$lib/action"
	import { parse } from "$lib/game"
	import { fadeIn, fadeOut, flyInDown } from "$lib/transition"
	import { fade, fly } from "svelte/transition"

	const level = parse("")
</script>

<svelte:head>
	<title>Random Level - Webcells</title>
</svelte:head>

<main class="grid overflow-hidden" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<canvas
		in:fade={fadeIn}
		out:fade={fadeOut}
		class="w-full h-full col-start-1 row-start-1"
		use:game={{ level }}
	>
		Your browser is not supported, please use <a
			href="https://www.mozilla.org/en-US/firefox/new/"
			target="_blank">Firefox</a
		> or another evergreen browser.
	</canvas>
</main>
