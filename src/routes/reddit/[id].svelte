<script context="module" lang="ts">
	import type { Load } from "@sveltejs/kit"

	const load: Load = async function load({ fetch, page }) {
		const { id } = page.params,
			res = await fetch(`/reddit/${id}.json`),
			data = await res.json()

		return { props: { data } }
	}

	export { load }
</script>

<script lang="ts">
	import type { Puzzle } from "./index.svelte"

	export let data: Puzzle
</script>

<pre class="overflow-y-auto whitespace-pre-wrap">
	{JSON.stringify(data, null, 2)}
</pre>
