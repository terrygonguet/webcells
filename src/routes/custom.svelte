<script lang="ts">
	import { game } from "$lib/action"
	import { fadeIn, fadeOut, flyInDown } from "$lib/transition"
	import { fade, fly, slide } from "svelte/transition"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { isLeft, isRight, Left, map, reduce, Right } from "$lib/result"
	import type { Level } from "$lib/game"
	import { parse } from "$lib/game"
	import { browser } from "$app/env"
	import { onMount } from "svelte"
	import Game from "$lib/components/Game.svelte"

	let tmpData = $page.query.get("data") ?? ""

	$: data = $page.query.get("data")
	$: b64 = data ? Right(data) : Left<string>("No level string")
	$: text = map(b64, a => (browser ? atob(a) : Buffer.from(a, "base64").toString("utf-8")))
	$: level = map<string, Level>(text, parse)
	$: isValidLevel = reduce(level, l => true, false)
	$: levelName = isRight(level) ? level.item.title : "Paste a level!"
	$: pageTitle = `Custom Puzzle - ${levelName} - WebCells`

	function onSubmit() {
		goto(`/custom?data=${tmpData}`)
	}

	function onKeyup(e: KeyboardEvent) {
		if (e.key == "Enter") {
			e.preventDefault()
			onSubmit()
		}
	}

	onMount(() => {
		setTimeout(() => {
			const txtArea = document.querySelector("textarea[name=data]") as HTMLAreaElement
			txtArea?.focus()
		}, 1000)
	})
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

<main class="grid overflow-hidden" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	{#if !isValidLevel}
		<form
			on:submit|preventDefault={onSubmit}
			in:fade={fadeIn}
			out:fade={fadeOut}
			class="flex flex-col items-center justify-center col-start-1 row-start-1"
		>
			<label class="grid text-center my-6">
				{#if isLeft(b64)}
					<p class="mb-6 font-bold text-2xl" transition:slide>Paste level data here</p>
				{:else if isLeft(text)}
					<p class="mb-6 text-red-300 font-bold text-2xl" transition:slide>
						Invalid character in level string
					</p>
				{:else if isLeft(level)}
					<p class="mb-6 text-red-300 font-bold text-2xl" transition:slide>Invalid level</p>
				{/if}
				<!-- TODO: replace with a valid level -->
				<textarea
					name="data"
					cols="30"
					rows="5"
					class="textarea"
					placeholder="It's a long piece of text that looks like: bG9yZW0gaXBzdW0gZG9sb3Igc2l0IGFtZXQ="
					required
					bind:value={tmpData}
					on:keyup={onKeyup}
				/>
			</label>
			<nav class="grid grid-cols-2 gap-10">
				<input type="submit" value="Load" class="btn" />
				<a class="btn" href="/" sveltekit:prefetch>Home</a>
			</nav>
		</form>
	{:else}
		<Game class="w-full h-full col-start-1 row-start-1" level={level.item} />
	{/if}
</main>
