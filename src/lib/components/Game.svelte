<script lang="ts">
	import { game } from "$lib/action"
	import { countRemainingFullHexes, randomLevel } from "$lib/game"
	import { lookLikeHexcells } from "$lib/stores"
	import { fadeIn, fadeOut } from "$lib/transition"
	import { onMount } from "svelte"
	import { fade } from "svelte/transition"

	let classes = "",
		remaining = 0,
		mistakes = 0,
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

	function updateLabels() {
		remaining = countRemainingFullHexes(level)
		mistakes = level.mistakes
	}

	onMount(() => {
		updateLabels()
		canvasEl.addEventListener("correct", updateLabels)
		canvasEl.addEventListener("incorrect", updateLabels)
		return () => {
			canvasEl.removeEventListener("correct", updateLabels)
			canvasEl.removeEventListener("incorrect", updateLabels)
		}
	})
</script>

<div id="wrapper" {style} class:look-like-hexcells={$lookLikeHexcells}>
	{#if showUI}
		<h1 class="absolute top-6 w-full text-center text-5xl font-thin z-10">{title}</h1>
		<div id="indicators">
			<p class="indicator">
				<span class="indicator-label">Remaining</span>
				<span class="indicator-value">{remaining}</span>
			</p>
			<p class="indicator flex-row-reverse">
				<span class="indicator-label">Mistakes</span>
				<span class="indicator-value">{mistakes}</span>
			</p>
		</div>
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

	#indicators {
		@apply absolute top-0 right-0 w-full p-6 flex flex-row-reverse justify-between z-10;
	}
	.look-like-hexcells #indicators {
		@apply grid gap-6 w-auto text-right;
	}
	.indicator {
		@apply px-6 py-3 bg-black bg-opacity-50 flex items-center gap-6;
	}
	.look-like-hexcells .indicator {
		background: #06a4eb;
		box-shadow: -7px 7px 5px 0px rgba(0, 0, 0, 0.6);
		@apply pr-3 pl-10 py-1 flex flex-col justify-end items-stretch gap-0;
	}
	.indicator-label {
		@apply leading-none text-2xl;
	}
	.indicator-value {
		@apply leading-none text-5xl font-bold;
	}

	#flavor {
		box-shadow: 0px -10px 20px 20px rgba(0, 0, 0, 0.6);
		@apply absolute bottom-0 pb-6 w-full text-center whitespace-pre-wrap text-2xl bg-black bg-opacity-60 z-10;
	}
	.look-like-hexcells #flavor {
		box-shadow: none;
		@apply bg-transparent;
	}
</style>
