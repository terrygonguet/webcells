<script context="module" lang="ts">
	import type { Load } from "@sveltejs/kit"

	const load: Load = async function load({ fetch, page }) {
		const { id } = page.params,
			res = await fetch(`/reddit/${id}.json`),
			puzzle = await res.json()

		return { props: { puzzle } }
	}

	export { load }
</script>

<script lang="ts">
	import { parse } from "$lib/game"
	import type { Puzzle } from "./index.svelte"
	import { fly } from "svelte/transition"
	import { fadeOut, flyInDown } from "$lib/transition"
	import Game from "$lib/components/Game.svelte"
	import { browser } from "$app/env"

	export let puzzle: Puzzle

	$: level = browser ? parse(puzzle.data) : null
</script>

<main class="grid overflow-hidden" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	{#if level}
		<Game class="w-full h-full col-start-1 row-start-1" {level} />
	{/if}
</main>
