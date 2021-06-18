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
	$: flavor = level.flavor

	function updateLabels() {
		remaining = countRemainingFullHexes(level)
		mistakes = level.mistakes
	}

	onMount(() => {
		updateLabels()
	})
</script>

<div id="wrapper" {style} class:look-like-hexcells={$lookLikeHexcells}>
	{#if showUI}
		<!-- <h1 class="absolute top-6 w-full text-center text-5xl font-thin z-10">{title}</h1> -->
		<div id="indicators">
			<p class="indicator">
				<span class="indicator-label">Remaining</span>
				<span class="indicator-value">{remaining}</span>
			</p>
			<p class="indicator">
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
		on:correct={updateLabels}
		on:incorrect={updateLabels}
		on:correct
		on:incorrect
		on:gameover
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
		@apply absolute top-0 right-0 p-6 grid gap-6 z-10 pointer-events-none;
	}
	.look-like-hexcells #indicators {
		@apply text-right;
	}
	.indicator {
		@apply px-6 py-3 bg-black bg-opacity-50 flex flex-row-reverse justify-end items-center;
	}
	.look-like-hexcells .indicator {
		background: #06a4eb;
		box-shadow: -7px 7px 5px 0px rgba(0, 0, 0, 0.6);
		@apply pr-3 pl-10 py-1 flex flex-col items-end;
	}
	.indicator-label {
		@apply leading-none text-2xl;
	}
	.indicator-value {
		width: 5rem;
		@apply leading-none text-5xl font-bold text-center;
	}
	.look-like-hexcells .indicator-value {
		@apply text-right;
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
