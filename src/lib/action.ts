import {
	Level,
	render,
	screen2board,
	setup,
	interact,
	InteractionType,
	InteractionResult,
	click,
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
		el.dispatchEvent(new CustomEvent("resize"))
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
		const result = click(state, e)
		switch (result) {
			case InteractionResult.Correct:
				el.dispatchEvent(new CustomEvent("correct"))
				break
			case InteractionResult.Incorrect:
				el.dispatchEvent(new CustomEvent("incorrect"))
				break
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
