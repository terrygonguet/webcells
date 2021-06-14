<script lang="ts">
	import Game from "$lib/components/Game.svelte"
	import { parse } from "$lib/game"
	import { lookLikeHexcells } from "$lib/stores"
	import { fadeOut, flyInDown } from "$lib/transition"
	import { fly } from "svelte/transition"

	const examples = [
		"Webcells level v1:Example 1:T Gonguet::6:3:xxfxxxxxxxEnxxEnxxxxxxenfxfxfxxxxxfx",
		"Webcells level v1:Example 2:T Gonguet::4:3:|nen|n/nfxenenxxenenfxxx",
		"Webcells level v1:Example 3:T Gonguet::7:3:xxFx|pxxxxfx/p|nEpfxxxenEpxxenenfxxxfxxxxx",
		"Webcells level v1:Example 3:T Gonguet::5:5:xxxxfxxxxxfxxxxxxxfxxxxxFnxxxxfxxxxxxxfxxxxxfxxxxx",
	].map(parse)

	$: emptyHexSrc = $lookLikeHexcells ? "/img/emptyhex-alt.png" : "/img/emptyhex.png"
	$: fullHexSrc = $lookLikeHexcells ? "/img/fullhex-alt.png" : "/img/fullhex.png"
	$: coveredHexSrc = $lookLikeHexcells ? "/img/coveredhex-alt.png" : "/img/coveredhex.png"
</script>

<svelte:head>
	<title>Tutorial - Webcells</title>
</svelte:head>

<main class="py-12 text-center" in:fly|local={flyInDown} out:fly|local={fadeOut}>
	<h1 class="text-[9rem] font-thin uppercase">Tutorial</h1>
	<p>
		Hexes can be <em>empty</em>
		<img src={emptyHexSrc} alt="An empty hex" class="inline h-6 m-1 mb-2" />,
		<em>full</em>
		<img src={fullHexSrc} alt="A full hex" class="inline h-6 m-1 mb-2" />
		or <em>covered</em>
		<img src={coveredHexSrc} alt="A covered hex" class="inline h-6 m-1 mb-2" />. Empty hexes
		indicate how many full hexes are next to them. Uncover hexes with left click (if you think it is
		a full hex) or right click (for empty hexes). Try it out here:
	</p>
	<Game level={examples[0]} width={500} height={320} hexRadius={30} class="mx-auto" />
	<p>
		Numbers outside of hexes indicate how many full hexes are in that column. They can be skewed so
		you can click on them to clearly see where they apply.
	</p>
	<Game level={examples[1]} width={300} height={320} hexRadius={30} class="mx-auto" />
	<p>
		A hex's value surrounded by {$lookLikeHexcells ? "curly" : "square"} brackets (like
		<code>{$lookLikeHexcells ? "{3}" : "[3]"}</code>) means that the surrounding full hexes are
		contiguous. Similarly, a value surrounded by dashes (like <code>-2-</code>) means that the full
		hexes are <em class="italic">not</em> contiguous, i.e. separated by at least one empty hex. Columns
		follow this pattern as well.
	</p>
	<Game level={examples[2]} width={550} height={320} hexRadius={30} class="mx-auto" />
	<p class="mb-4">
		Full hexes can have a value as well, indicating how many full hexes are in a <strong
			class="font-bold italic">2 hex radius</strong
		>. Click on them to show their area. They however <em class="italic">cannot</em> have square brackets
		or dashes like empty hexes and column indicators.
	</p>
	<Game level={examples[3]} width={330} height={330} hexRadius={30} class="mx-auto" />
	<div class="flex justify-center my-4">
		<a href="/" class="btn">Back</a>
	</div>
</main>

<style lang="postcss">
	/* ! HACK */
	h1 {
		font-size: 5rem;
	}

	p {
		@apply max-w-prose mx-auto text-lg;
	}

	@screen lg {
		/* ! HACK - text-[9rem] is broken rn */
		h1 {
			font-size: 9rem;
		}

		p {
			@apply text-xl;
		}
	}
</style>
