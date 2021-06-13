<script lang="ts">
	import Game from "$lib/components/Game.svelte"
	import { randomLevel } from "$lib/game"
	import { fadeOut, flyInDown } from "$lib/transition"
	import { fly } from "svelte/transition"

	const level = randomLevel()
</script>

<svelte:head>
	<title>Random Level - Webcells</title>
</svelte:head>

<main class="grid overflow-hidden" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<Game class="w-full h-full col-start-1 row-start-1" {level} />
</main>
