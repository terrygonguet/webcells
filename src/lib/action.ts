import { Level, render, setup } from "$lib/game"

type GameActionOptions = {
	level: Level
}

export function game(el: HTMLCanvasElement, { level }: GameActionOptions) {
	const state = setup(el, level)

	function onResize(this: Window, e: UIEvent) {
		el.width = this.innerWidth
		el.height = this.innerHeight
		state.width = this.innerWidth
		state.height = this.innerHeight
		state.sizeChanged = true
	}

	function onPointerMove(e: PointerEvent) {
		e.preventDefault()
		state.cursor[0] = Math.round(e.clientX)
		state.cursor[1] = Math.round(e.clientY)
	}

	let old = performance.now()
	let rafID = requestAnimationFrame(function raf(time) {
		const delta = (time - old) / 1000
		old = time
		render(delta, state)
		rafID = requestAnimationFrame(raf)
	})
	window.addEventListener("resize", onResize)
	el.addEventListener("pointermove", onPointerMove)

	return {
		destroy() {
			cancelAnimationFrame(rafID)
			window.removeEventListener("resize", onResize)
			el.removeEventListener("pointermove", onPointerMove)
		},
	}
}
