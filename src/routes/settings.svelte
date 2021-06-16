<script lang="ts">
	import { showColumnHints, lookLikeHexcells, invertButtons } from "$lib/stores"
	import { fadeOut, flyInDown } from "$lib/transition"
	import type { Writable } from "svelte/store"
	import { fly } from "svelte/transition"

	function onChange(store: Writable<boolean>) {
		return function (e: Event & { currentTarget: HTMLInputElement }) {
			store.set(!!e.currentTarget?.checked)
		}
	}
</script>

<svelte:head>
	<title>Settings - Webcells</title>
</svelte:head>

<main class="py-12 flex flex-col items-center" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<h1 class="text-[9rem] font-thin uppercase">Settings</h1>
	<form on:submit|preventDefault class="my-auto max-w-prose grid gap-4 text-center">
		<label class="text-xl cursor-pointer">
			Automatically show column hint
			<input
				type="checkbox"
				class="ml-2 cursor-pointer"
				checked={$showColumnHints}
				on:change={onChange(showColumnHints)}
			/>
		</label>
		<label class="text-xl cursor-pointer">
			Look like Hexcells
			<input
				type="checkbox"
				class="ml-2 cursor-pointer"
				checked={$lookLikeHexcells}
				on:change={onChange(lookLikeHexcells)}
			/>
		</label>
		<label class="text-xl cursor-pointer">
			Invert mouse buttons
			<input
				type="checkbox"
				class="ml-2 cursor-pointer"
				checked={$invertButtons}
				on:change={onChange(invertButtons)}
			/>
		</label>
	</form>
	<div class="flex justify-center my-4">
		<a href="/" class="btn">Back</a>
	</div>
</main>

<style lang="postcss">
	/* ! HACK */
	h1 {
		font-size: 5rem;
	}

	@screen lg {
		/* ! HACK - text-[9rem] is broken rn */
		h1 {
			font-size: 9rem;
		}
	}
</style>
