<script lang="ts">
	import { game } from "$lib/action"
	import { countRemainingFullHexes, randomLevel } from "$lib/game"
	import { fadeIn, fadeOut } from "$lib/transition"
	import { onMount } from "svelte"
	import { fade } from "svelte/transition"

	let classes = "",
		remaining = 0,
		canvasEl: HTMLCanvasElement

	export let level = randomLevel()
	export let width: number | undefined = undefined
	export let height: number | undefined = undefined
	export let hexRadius: number | undefined = undefined
	export { classes as class }
	export let showUI = !width || !height

	$: widthStyle = width ? `--width:${width}px;` : ""
	$: heightStyle = height ? `--height:${height}px;` : ""
	$: style = widthStyle + heightStyle
	$: title = level.title
	$: flavor = level.flavor

	function updateCount() {
		remaining = countRemainingFullHexes(level)
	}

	onMount(() => {
		updateCount()
		canvasEl.addEventListener("correct", updateCount)
		return () => {
			canvasEl.removeEventListener("correct", updateCount)
		}
	})
</script>

<div id="wrapper" {style}>
	{#if showUI}
		<h1 class="absolute top-6 w-full text-center text-5xl font-thin z-10">{title}</h1>
		<p
			class="absolute top-1/2 right-6 transform -translate-y-1/2 p-4 bg-black bg-opacity-50 text-3xl font-thin z-10"
		>
			Remaining: {remaining}
		</p>
		{#if flavor}
			<p id="flavor">{flavor}</p>
		{/if}
	{/if}
	<canvas
		in:fade={fadeIn}
		out:fade={fadeOut}
		class="{classes} absolute top-0 left-0"
		use:game={{ level, width, height, hexRadius }}
		bind:this={canvasEl}
	>
		Your browser is not supported, please use <a
			href="https://www.mozilla.org/en-US/firefox/new/"
			target="_blank">Firefox</a
		> or another evergreen browser.
	</canvas>
</div>

<style lang="postcss">
	#wrapper {
		width: var(--width, auto);
		height: var(--height, auto);
		@apply relative inline-block;
	}

	#flavor {
		box-shadow: 0px -10px 20px 20px rgba(0, 0, 0, 0.6);
		@apply absolute bottom-0 pb-6 w-full text-center whitespace-pre-wrap text-2xl bg-black bg-opacity-60 z-10;
	}
</style>
