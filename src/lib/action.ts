import { HexType, Level, render, screen2board, setup, uncoverHex } from "$lib/game"

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

	function onClick(e: MouseEvent) {
		e.preventDefault()
		state.cursor[0] = Math.round(e.clientX)
		state.cursor[1] = Math.round(e.clientY)
		const boardPos = screen2board(state.cursor, state),
			result = uncoverHex(
				boardPos[0],
				boardPos[1],
				e.button == 2 ? HexType.Empty : HexType.Full,
				level,
			)
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
	el.addEventListener("click", onClick)
	el.addEventListener("contextmenu", onClick)

	return {
		destroy() {
			cancelAnimationFrame(rafID)
			window.removeEventListener("resize", onResize)
			el.removeEventListener("pointermove", onPointerMove)
			el.removeEventListener("click", onClick)
			el.removeEventListener("contextmenu", onClick)
		},
	}
}
