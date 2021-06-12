<script lang="ts">
	import { randInt } from "$lib/utils"
	import { onMount } from "svelte"
	import "../global.css"

	function wavy() {
		const svelte = document.getElementById("svelte")
		if (!svelte) return
		svelte.style.backgroundPositionX = randInt(0, 40) + "%"
		svelte.style.backgroundPositionY = randInt(0, 40) + "%"
	}

	onMount(() => {
		const id = setInterval(wavy, 2000)
		wavy()
		return () => clearInterval(id)
	})
</script>

<slot />
