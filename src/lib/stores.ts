import { browser } from "$app/env"
import { writable } from "svelte/store"

const defaultShowColumnHints = browser
	? JSON.parse(localStorage.getItem("showColumnHints") ?? "false")
	: false
export const showColumnHints = writable<boolean>(defaultShowColumnHints)
showColumnHints.subscribe(value => {
	if (!browser) return
	localStorage.setItem("showColumnHints", JSON.stringify(value))
})

const defaultLookLikeHexcells = browser
	? JSON.parse(localStorage.getItem("lookLikeHexcells") ?? "false")
	: false
export const lookLikeHexcells = writable<boolean>(defaultLookLikeHexcells)
lookLikeHexcells.subscribe(value => {
	if (!browser) return
	localStorage.setItem("lookLikeHexcells", JSON.stringify(value))
})
