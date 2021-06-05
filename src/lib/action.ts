import { Level, render, setup } from "$lib/game"

type GameActionOptions = {
	level: Level
}

export function game(el: HTMLCanvasElement, { level }: GameActionOptions) {
	const ctx = el.getContext("2d")
	if (!ctx) throw new Error("Can't get Canvas context")

	setup(ctx, level)

	let old = performance.now()
	requestAnimationFrame(function raf(time) {
		const delta = (time - old) / 1000
		old = time
		render(delta, ctx, level)
		requestAnimationFrame(raf)
	})
}
