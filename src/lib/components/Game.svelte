<script lang="ts">
	import { game } from "$lib/action"
	import { parse } from "$lib/game"
	import { fadeIn, fadeOut } from "$lib/transition"
	import { fade } from "svelte/transition"

	let classes = ""

	export let level = parse("")
	export let width: number | undefined = undefined
	export let height: number | undefined = undefined
	export let hexRadius: number | undefined = undefined
	export { classes as class }
</script>

<canvas
	in:fade={fadeIn}
	out:fade={fadeOut}
	class={classes}
	use:game={{ level, width, height, hexRadius }}
>
	Your browser is not supported, please use <a
		href="https://www.mozilla.org/en-US/firefox/new/"
		target="_blank">Firefox</a
	> or another evergreen browser.
</canvas>
