<script lang="ts">
	import { showColumnHints, lookLikeHexcells, invertButtons } from "$lib/stores"
	import { fadeOut, flyInDown } from "$lib/transition"
	import { fly } from "svelte/transition"
	import Toggle from "svelte-toggle"
</script>

<svelte:head>
	<title>Settings - Webcells</title>
</svelte:head>

<main class="py-12 flex flex-col items-center" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<h1 class="text-[5rem] lg:text-[9rem] font-thin uppercase">Settings</h1>
	<form on:submit|preventDefault class="my-auto max-w-prose grid gap-6 text-center">
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			<span>Automatically show column hint</span>
			<Toggle bind:toggled={$showColumnHints} hideLabel={true} />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			<span>Look like Hexcells</span>
			<Toggle bind:toggled={$lookLikeHexcells} hideLabel={true} />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			<span>Invert mouse buttons</span>
			<Toggle bind:toggled={$invertButtons} hideLabel={true} />
		</label>
	</form>
	<div class="flex justify-center my-4">
		<a href="/" class="btn">Home</a>
	</div>
</main>

<style lang="postcss">
	label {
		@apply text-xl cursor-pointer flex items-center justify-between font-thin gap-6;
	}

	@screen lg {
		label {
			@apply text-3xl;
		}

		/* ! HACK - text-[9rem] is broken rn */
		h1 {
			font-size: 9rem;
		}
	}
</style>
