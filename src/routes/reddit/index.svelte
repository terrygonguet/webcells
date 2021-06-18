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
	import { page } from "$app/stores"
	import { browser } from "$app/env"
	import { lookLikeHexcells } from "$lib/stores"

	type Entry = {
		id: string
		title: string
		difficulty: string
		numPuzzles: number
		author: string
		isStarted: boolean
	}

	export let puzzles: Puzzle[]

	let searchTitle = $page.query.get("title") ?? "",
		searchDifficulty = $page.query.get("difficulty") ?? "*",
		searchType = $page.query.get("type") ?? "*"

	$: entries = puzzles.map<Entry>(({ title, id, user, data }) => {
		const [name, difficulty] = parseTitle(title)
		return {
			id,
			title: name,
			difficulty,
			numPuzzles: data.length,
			author: user,
			isStarted: browser && !!localStorage.getItem("saved-" + id),
		}
	})
	$: difficulties = getUniqueDifficulties(entries)
	$: filteredEntries = entries.filter(
		({ title, difficulty, numPuzzles }) =>
			title.toLocaleLowerCase().includes(searchTitle.toLocaleLowerCase()) &&
			(searchDifficulty == "*" || difficulty == searchDifficulty) &&
			(searchType == "*" || (searchType == "single" ? numPuzzles == 1 : numPuzzles > 1)),
	)
	$: browser && updateQuery(searchTitle, searchDifficulty, searchType)

	function updateQuery(title: string, difficulty: string, type: string) {
		title == "" ? $page.query.delete("title") : $page.query.set("title", title)
		difficulty == "*" ? $page.query.delete("difficulty") : $page.query.set("difficulty", difficulty)
		type == "*" ? $page.query.delete("type") : $page.query.set("type", type)
		let queryString = $page.query.toString()
		history.replaceState(null, "", "/reddit" + (queryString ? "?" + queryString : ""))
	}

	function parseTitle(title: string): [string, string] {
		const result = /^\[.+?\](.+?)(?:[([](.+?)[\])])?$/.exec(title)
		if (!result) return ["Untitled", "?"]
		return [result[1], slugifyDifficulty(result[2] || "?")]
	}

	function getUniqueDifficulties(entries: Entry[]) {
		const set = new Set<string>()
		entries.forEach(({ difficulty }) => set.add(difficulty))
		return Array.from(set).sort()
	}

	function slugifyDifficulty(difficulty: string) {
		return difficulty.toLocaleLowerCase().trim().replace(/-|\//g, " / ").replace("] [", " & ")
	}
</script>

<svelte:head>
	<title>User made levels - Webcells</title>
</svelte:head>

<main class:look-like-hexcells={$lookLikeHexcells} in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<h1 class="text-6xl font-thin col-start-2 text-center">User made levels</h1>
	<form on:submit|preventDefault>
		<img
			class="h-8 self-center mr-1 transform"
			style="--tw-scale-x:-1"
			src="/svg/search.svg"
			alt="Search icon"
		/>
		<input
			bind:value={searchTitle}
			type="text"
			class="text-black text-md input-border px-2 py-1 flex-1"
		/>
		<select bind:value={searchDifficulty} class="text-black text-md input-border p-2 flex-1">
			<option value="*" selected>all difficulties</option>
			{#each difficulties as difficulty}
				<option value={difficulty}>{difficulty}</option>
			{/each}
		</select>
		<select bind:value={searchType} class="text-black text-md input-border p-2 flex-1">
			<option value="*" selected>packs & single levels</option>
			<option value="single" selected>single levels only</option>
			<option value="packs" selected>packs only</option>
		</select>
	</form>
	<div class="overflow-y-auto overflow-x-hidden col-start-2">
		<table class="table-fixed w-full">
			<thead>
				<tr class="w-full">
					<th class="px-2 md:px-4 py-2 border-b border-white text-left">Title</th>
					<th class="px-2 md:px-4 py-2 border-b border-white">Difficulty</th>
					<th class="px-2 md:px-4 py-2 border-b border-white">Type</th>
					<th class="px-2 md:px-4 py-2 border-b border-white">Submitted by</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredEntries as { id, title, difficulty, numPuzzles, author, isStarted }}
					<a href="/reddit/{id}">
						<td class="px-2 md:px-4 py-2">{title}{isStarted ? "💾" : ""}</td>
						<td class="px-2 md:px-4 py-2 text-center align-middle">{difficulty}</td>
						<td class="px-2 md:px-4 py-2 text-center align-middle"
							>{numPuzzles == 1 ? "Single level" : `${numPuzzles} level pack`}</td
						>
						<td class="px-2 md:px-4 py-2 text-center align-middle">
							<a
								href="https://www.reddit.com/r/hexcellslevels/comments/{id}"
								class="px-3 py-1 transition-all transform hover:scale-105 hover:bg-yellow-600 hover:bg-opacity-25 rounded-full"
								target="_blank">{author}</a
							>
						</td>
					</a>
				{:else}
					<tr>
						<td colspan="3">No puzzles...</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<a href="/" class="btn col-start-2">Home</a>
</main>

<style lang="postcss">
	main {
		@apply grid gap-3 text-lg h-screen py-2;
		grid-template-columns: auto 1fr auto;
		grid-template-rows: auto auto 1fr auto;
	}

	form {
		@apply flex flex-col items-stretch col-start-2 w-full gap-2;
	}

	.input-border {
		@apply border-2 border-pink-600;
	}
	.look-like-hexcells .input-border {
		@apply border-blue-500;
	}

	tbody > a {
		transition: background 150ms ease-in-out;
		@apply border-b border-white table-row;
	}
	tbody > a:hover {
		background: rgba(0, 0, 0, 0.2);
	}
	.look-like-hexcells tbody > a:hover {
		background: rgba(255, 255, 255, 0.2);
	}

	@screen md {
		main {
			@apply text-xl;
			grid-template-columns: auto minmax(theme("screens.md"), 70%) auto;
		}

		form {
			@apply flex-row;
		}
	}
</style>
