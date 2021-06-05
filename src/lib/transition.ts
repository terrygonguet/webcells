import { browser } from "$app/env"
import { cubicOut } from "svelte/easing"

export const fadeIn = {
	delay: 200,
	duration: 400,
	easing: cubicOut,
}

export const fadeOut = {
	duration: 400,
	easing: cubicOut,
}

export const flyInUp = {
	duration: 400,
	y: browser ? -innerHeight / 2 : 0,
	easing: cubicOut,
}

export const flyOutUp = {
	duration: 400,
	y: browser ? -innerHeight / 2 : 0,
	easing: cubicOut,
}

export const flyInDown = {
	duration: 400,
	y: browser ? innerHeight / 2 : 0,
	easing: cubicOut,
}

export const flyOutDown = {
	duration: 400,
	y: browser ? innerHeight / 2 : 0,
	easing: cubicOut,
}
