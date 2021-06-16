<script context="module" lang="ts">
	import type { Load } from "@sveltejs/kit"

	const load: Load = async function load({ fetch }) {
		const res = await fetch("/reddit/levels.json"),
			puzzles = await res.json()

		return { props: { puzzles } }
	}

	export { load }
</script>

<script lang="ts">
	import { fadeOut, flyInDown } from "$lib/transition"
	import { fly } from "svelte/transition"
	import type { Puzzle } from "./levels.json"

	export let puzzles: Puzzle[]

	$: entries = puzzles.map(({ title, id, user }) => [id, ...parseTitle(title), user])

	function parseTitle(title: string) {
		const result = /^\[.+?\](.+?)(?:[([](.+?)[\])])?$/.exec(title)
		if (!result) return []
		result.shift()
		return result as string[]
	}
</script>

<main
	class="flex flex-col items-center py-12 text-xl"
	in:fly|local={flyInDown}
	out:fly|local={fadeOut}
>
	<table>
		<thead>
			<tr>
				<th class="px-4 py-2 border-b border-white text-left">Title</th>
				<th class="px-4 py-2 border-b border-white">Difficulty</th>
				<th class="px-4 py-2 border-b border-white">Submitted by</th>
			</tr>
		</thead>
		<tbody>
			{#each entries as [id, title, difficulty, user]}
				<tr class="border-b border-white transition-transform transform hover:scale-110">
					<td>
						<a href="/reddit/{id}" class="w-full px-4 py-2 flex my-1">{title}</a>
					</td>
					<td>
						<a href="/reddit/{id}" class="w-full px-4 py-2 flex justify-center my-1">{difficulty}</a
						>
					</td>
					<td>
						<a href="/reddit/{id}" class="w-full px-4 py-2 flex justify-center my-1">{user}</a>
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="2">No puzzles...</td>
				</tr>
			{/each}
		</tbody>
	</table>
</main>
