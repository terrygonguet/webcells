<script context="module" lang="ts">
	import type { Load } from "@sveltejs/kit"

	const load: Load = async function load({ fetch, page }) {
		const { id } = page.params,
			res = await fetch(`/reddit/${id}.json`),
			data = await res.json()

		if (data.error)
			return {
				status: res.status,
				error: data.message,
			}

		return { props: { puzzle: data } }
	}

	export { load }
</script>

<script lang="ts">
	import { parse, serialize } from "$lib/game"
	import { fly } from "svelte/transition"
	import { fadeOut, flyInDown } from "$lib/transition"
	import Game from "$lib/components/Game.svelte"
	import { browser } from "$app/env"
	import type { Puzzle } from "./levels.json"

	export let puzzle: Puzzle

	$: level = load()
	$: title = level?.title ?? "Untitled"

	function save() {
		if (level) localStorage.setItem("saved-" + puzzle.id, serialize(level))
	}

	function load() {
		if (browser) return parse(localStorage.getItem("saved-" + puzzle.id) ?? puzzle.data)
		else return null
	}
</script>

<svelte:head>
	<title>{title} - User made level - Webcells</title>
</svelte:head>

<svelte:window on:sveltekit:navigation-start={save} on:beforeunload={save} />

<main class="grid overflow-hidden" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	{#if level}
		<Game class="w-full h-full col-start-1 row-start-1" {level} />
	{/if}
	<a href="/reddit" class="btn absolute top-0 left-0 m-6">Level list</a>
</main>
