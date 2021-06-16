<script lang="ts">
	import { fadeOut, flyInDown } from "$lib/transition"
	import { fly } from "svelte/transition"
</script>

<svelte:head>
	<title>About - Webcells</title>
</svelte:head>

<main
	class="py-12 text-center flex flex-col items-center"
	in:fly|local={flyInDown}
	out:fly|local={fadeOut}
>
	<h1 class="text-[5rem] lg:text-[9rem] font-thin uppercase mb-auto">About</h1>
	<p>
		This website was made by <a href="https://terry.gonguet.com/" target="_blank">Terry Gonguet</a>,
		inspired by the excellent
		<a href="https://store.steampowered.com/bundle/3331/Logic_Puzzle_Pack/" target="_blank"
			>Hexcells trilogy</a
		>
		by <a href="https://twitter.com/Ma77hew_Brown" target="_blank">Matthew Brown</a>.
	</p>
	<a href="/" class="btn mt-auto">Home</a>
</main>

<style lang="postcss">
	p {
		@apply text-lg my-6;
	}

	a:not(.btn) {
		@apply text-purple-300 font-bold underline transition-colors;
	}
	a:not(.btn):hover {
		@apply text-yellow-400;
	}

	@screen lg {
		/* HACK cause lg:text-[9rem] isn't overriding correctly  */
		h1 {
			font-size: 9rem;
		}

		p {
			@apply text-xl;
		}
	}
</style>
