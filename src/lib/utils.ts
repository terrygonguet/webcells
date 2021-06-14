import { onMount } from "svelte"

export function clamp(n: number, min: number, max: number) {
	return Math.max(Math.min(n, max), min)
}

export function randInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min)) + min
}

export function pickEl<T>(arr: T[]) {
	return arr[randInt(0, arr.length)]
}

export function last<T>(arr: T[]) {
	return arr[arr.length - 1]
}

export function modWrap(a: number, b: number) {
	return (a + Math.ceil(-a / b) * b) % b
}

export function noopProxy() {
	const noop = () => proxy,
		no = () => false,
		proxy: any = new Proxy(() => {}, {
			get: noop,
			set: noop,
			apply: noop,
			construct: noop,
			deleteProperty: no,
			has: no,
			preventExtensions: no,
		})
	return proxy
}

export function onUnmount(cb: () => void) {
	onMount(() => cb)
}
