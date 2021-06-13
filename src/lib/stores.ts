import { browser } from "$app/env"
import { writable } from "svelte/store"

const defaultShowColumnHints = browser
	? JSON.parse(localStorage.getItem("showColumnHints") ?? "false")
	: false
export const showColumnHints = writable<boolean>(defaultShowColumnHints)
showColumnHints.subscribe(value => {
	if (!browser) return
	localStorage.setItem("showColumnHints", value + "")
})
