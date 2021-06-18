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
	import type { Level } from "$lib/game"
	import { fly } from "svelte/transition"
	import { fadeOut, flyInDown } from "$lib/transition"
	import Game from "$lib/components/Game.svelte"
	import { browser } from "$app/env"
	import type { Puzzle } from "./levels.json"
	import { onMount, tick } from "svelte"

	type SavedData = {
		stage: number
		level: string
	}

	export let puzzle: Puzzle

	const storageId = "saved-" + puzzle.id,
		savedData = load(),
		fadeDuration = 300
	let stage = savedData?.stage ?? 0,
		level = parse(savedData?.level ?? puzzle.data[stage]),
		fading = true

	$: title = level?.title ?? "Untitled"

	async function next() {
		if (++stage >= puzzle.data.length) console.log("done")
		else {
			fading = true
			setTimeout(() => {
				level = parse(puzzle.data[stage])
				fading = false
			}, fadeDuration)
		}
	}

	async function reset() {
		if (!confirm("Are you sure?\nYour progress will be lost!")) return
		localStorage.removeItem(storageId)
		stage = 0
		fading = true
		setTimeout(() => {
			level = parse(puzzle.data[0])
			fading = false
		}, fadeDuration)
	}

	function save() {
		if (!level) return
		localStorage.setItem(storageId, JSON.stringify({ stage, level: serialize(level) }))
	}

	function load(): SavedData | null {
		if (browser) return JSON.parse(localStorage.getItem(storageId) as any)
		else return null
	}

	onMount(() => (fading = false))
</script>

<svelte:head>
	<title>{title} - User made level - Webcells</title>
</svelte:head>

<svelte:window on:sveltekit:navigation-start={save} on:beforeunload={save} />

<main class="grid overflow-hidden" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<Game
		class="transition-opacity duration-300 {fading
			? 'opacity-0'
			: ''} w-full h-full col-start-1 row-start-1"
		{level}
		on:gameover={next}
	/>
	<nav class="absolute top-0 left-0 m-6">
		<a href="/reddit" class="btn mb-6">Level list</a>
		{#if puzzle.data.length > 1}
			<button class="btn" on:click={reset}>Reset pack</button>
		{/if}
	</nav>
</main>
