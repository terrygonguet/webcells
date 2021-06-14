import {
	Level,
	render,
	screen2board,
	setup,
	interact,
	InteractionType,
	InteractionResult,
} from "$lib/game"

type GameActionOptions = {
	level: Level
	width?: number
	height?: number
	hexRadius?: number
}

export function game(
	el: HTMLCanvasElement,
	{ level, width, height, hexRadius }: GameActionOptions,
) {
	const state = setup({ canvas: el, level, width, height, hexRadius })

	function onResize(this: Window, e: UIEvent) {
		el.width = this.innerWidth
		el.height = this.innerHeight
		state.width = this.innerWidth
		state.height = this.innerHeight
		state.sizeChanged = true
		const ce = new CustomEvent("resize")
		el.dispatchEvent(ce)
	}

	function onPointerMove(e: PointerEvent) {
		e.preventDefault()
		state.cursor[0] = Math.round(e.offsetX)
		state.cursor[1] = Math.round(e.offsetY)
	}

	function onClick(e: MouseEvent) {
		e.preventDefault()
		state.cursor[0] = Math.round(e.offsetX)
		state.cursor[1] = Math.round(e.offsetY)
		const boardPos = screen2board(state.cursor, state)
		if (boardPos) {
			const result = interact(
				boardPos[0],
				boardPos[1],
				e.button == 2 ? InteractionType.Two : InteractionType.One,
				level,
			)
			if (result != InteractionResult.Nothing) {
				const ce = new CustomEvent(result == InteractionResult.Correct ? "correct" : "incorrect")
				el.dispatchEvent(ce)
			}
		}
	}

	let old = performance.now()
	let rafID = requestAnimationFrame(function raf(time) {
		const delta = (time - old) / 1000
		old = time
		render(delta, state)
		rafID = requestAnimationFrame(raf)
	})
	if (!width && !height) window.addEventListener("resize", onResize)
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
