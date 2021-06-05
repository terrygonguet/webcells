<script lang="ts">
	import { game } from "$lib/action"
	import { fadeIn, fadeOut, flyInDown } from "$lib/transition"
	import { fade, fly, slide } from "svelte/transition"
	import { page } from "$app/stores"
	import { goto } from "$app/navigation"
	import { isLeft, Left, map, reduce, Right } from "$lib/result"
	import type { Level } from "$lib/game"
	import { parse } from "$lib/game"

	let width = 0,
		height = 0,
		tmpData = $page.query.get("data") ?? ""

	$: data = $page.query.get("data")
	$: b64 = data ? Right(data) : Left<string>(new Error("No level string"))
	$: text = map(b64, a => atob(a))
	$: level = map<string, Level>(text, parse)
	$: isValidLevel = reduce(level, l => l == "bite", false)

	function onSubmit() {
		goto(`/custom?data=${tmpData}`)
	}
</script>

<svelte:window bind:innerWidth={width} bind:innerHeight={height} />

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
				/>
			</label>
			<nav class="grid grid-cols-2 gap-10">
				<input type="submit" value="Load" class="btn" />
				<a class="btn" href="/" sveltekit:prefetch>Back</a>
			</nav>
		</form>
	{:else}
		<canvas
			in:fade={fadeIn}
			out:fade={fadeOut}
			class="w-full h-full col-start-1 row-start-1"
			{height}
			{width}
			use:game={{ level: level.item }}
		>
			Your browser is not supported, please use <a
				href="https://www.mozilla.org/en-US/firefox/new/"
				target="_blank">Firefox</a
			> or another evergreen browser.
		</canvas>
	{/if}
</main>
