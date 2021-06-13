<script lang="ts">
	import { showColumnHints } from "$lib/stores"
	import { fadeOut, flyInDown } from "$lib/transition"
	import { fly } from "svelte/transition"

	const onChange: svelte.JSX.FormEventHandler<HTMLInputElement> = function (e) {
		showColumnHints.set(!!e.currentTarget?.checked)
	}
</script>

<main class="py-12 flex flex-col items-center" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<h1 class="text-[9rem] font-thin uppercase">Settings</h1>
	<form on:submit|preventDefault class="my-auto max-w-prose">
		<label class="my-4 text-xl cursor-pointer">
			Automatically show column hint
			<input
				type="checkbox"
				class="ml-2 cursor-pointer"
				checked={$showColumnHints}
				on:change={onChange}
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
