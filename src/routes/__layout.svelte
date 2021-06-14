<script lang="ts">
	import { browser } from "$app/env"
	import { lookLikeHexcells } from "$lib/stores"
	import "../global.css"

	lookLikeHexcells.subscribe(value => {
		if (!browser) return
		document.body.classList[value ? "add" : "remove"]("look-like-hexcells")
	})
</script>

<slot />
