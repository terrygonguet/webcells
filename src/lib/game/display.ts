import { clamp } from "$lib/utils"
import { cubicOut } from "svelte/easing"
import type { Hex, Level, Position, ColumnHint } from "./game"
import {
	countDistantNeighbours,
	countImmediateNeighbours,
	countInColumn,
	isInterractable,
	HexType,
	Precision,
} from "./game"

type GradientsDict = { [name: string]: CanvasGradient }

export type State = {
	level: Level
	ctx: CanvasRenderingContext2D
	canvas: HTMLCanvasElement
	width: number
	height: number
	gradients: GradientsDict
	sizeChanged: boolean
	cursor: Position
}

type RenderCache = {
	hexRadius: number
	rowGap: number
	colGap: number
}

export function setup(canvas: HTMLCanvasElement, level: Level): State {
	const ctx = canvas.getContext("2d")
	if (!ctx) throw new Error("Can't get canvas rendering context")

	canvas.width = innerWidth
	canvas.height = innerHeight

	return {
		level,
		ctx,
		canvas,
		gradients: {},
		width: canvas.width,
		height: canvas.height,
		sizeChanged: true,
		cursor: [0, 0],
	}
}

const TAU = 2 * Math.PI,
	h = Math.sqrt(3) / 2, // https://www.editions-petiteelisabeth.fr/images/calculs/1_hauteur_triangle_equilateral.png?1472908488
	cache: RenderCache = {
		hexRadius: 0,
		rowGap: 0,
		colGap: 0,
	}
export function render(delta: number, state: State) {
	const { width, height, ctx, gradients, level, sizeChanged, cursor, canvas } = state

	// recompute constants if size changes
	if (sizeChanged) {
		cache.hexRadius = Math.min(
			clamp((0.93 * height) / (2 * level.height), 20, 70),
			clamp((0.93 * width) / (2 * level.width), 20, 70),
		)
		const gap = 1.06
		cache.rowGap = cache.hexRadius * h * 2 * gap
		cache.colGap = cache.hexRadius * 1.5 * gap

		gradients.yellow = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.hexRadius)
		gradients.yellow.addColorStop(0, "#e7dd7e")
		gradients.yellow.addColorStop(1, "#ead61f")
		gradients.red = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.hexRadius)
		gradients.red.addColorStop(0, "#F472B6")
		gradients.red.addColorStop(1, "#DB2777")
		gradients.gray = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.hexRadius)
		gradients.gray.addColorStop(0, "darkgray")
		gradients.gray.addColorStop(1, "gray")

		state.sizeChanged = false
	}

	const { colGap, rowGap, hexRadius } = cache,
		boardOffsetX = (-level.width / 2 + 0.5) * colGap,
		boardOffsetY = (-level.height / 2 + 0.2) * rowGap,
		boardCursor = [
			cursor[0] - width / 2 - boardOffsetX,
			cursor[1] - height / 2 - boardOffsetY,
		] as Position,
		focusedHex = getFocusedHex(boardCursor, cache, level),
		scaleSpeed = delta * 5 // 200ms animation

	ctx.clearRect(0, 0, width, height)
	ctx.save()
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.translate(width / 2, height / 2)

	ctx.save()
	ctx.translate(boardOffsetX, boardOffsetY)

	const hexes: [number, number, Hex][] = []
	for (let i = 0; i < level.width; i++) {
		for (let j = 0; j < level.height; j++) {
			const hex = level.hexes[i][j]
			if (!hex) continue
			hexes.push([i, j, hex])
			if (focusedHex != hex) hex.scale = clamp(hex.scale - scaleSpeed, 0, 1)
		}
	}
	if (focusedHex) {
		focusedHex.scale = clamp(focusedHex.scale + scaleSpeed, 0, 1)
		canvas.style.cursor = isInterractable(focusedHex) ? "pointer" : "initial"
	} else canvas.style.cursor = "initial"
	hexes.sort((a, b) => {
		if (a[2].type == HexType.ColumnHint) return 1
		else {
			if (b[2].type == HexType.ColumnHint) return -1
			else return a[2].scale - b[2].scale
		}
	})
	for (const [x, y, hex] of hexes) {
		drawHex(x, y, hex)
	}

	ctx.restore()

	ctx.restore()

	function drawBorder(fill: string | CanvasGradient, stroke: string | CanvasGradient) {
		ctx.beginPath()
		ctx.moveTo(hexRadius, 0)
		ctx.lineTo(0.5 * hexRadius, -h * hexRadius)
		ctx.lineTo(-0.5 * hexRadius, -h * hexRadius)
		ctx.lineTo(-hexRadius, 0)
		ctx.lineTo(-0.5 * hexRadius, h * hexRadius)
		ctx.lineTo(0.5 * hexRadius, h * hexRadius)
		ctx.closePath()

		ctx.fillStyle = fill
		ctx.fill()

		ctx.strokeStyle = stroke
		ctx.lineWidth = clamp(0.06 * hexRadius, 1, 10)
		ctx.stroke()

		ctx.strokeStyle = "white"
		ctx.lineWidth = 0.7
		ctx.stroke()
	}

	function drawHexLabel(label: string, color = "white") {
		ctx.font = Math.floor(hexRadius) + "px 'Louis George Cafe'"
		ctx.fillStyle = color
		ctx.fillText(label, 0, 0.05 * hexRadius)
	}

	function drawColLabel(label: string, angle: ColumnHint["angle"], color = "white") {
		ctx.save()
		ctx.fillStyle = color
		ctx.font = `bold ${Math.floor(hexRadius * 0.7)}px 'Louis George Cafe'`
		ctx.rotate((angle * TAU) / 6)
		ctx.fillText(label, 0, 0.5 * hexRadius)
		ctx.restore()
	}

	function drawHex(x: number, y: number, hex: Hex) {
		ctx.save()
		ctx.translate(x * colGap, (y + (x % 2) * 0.5) * rowGap)
		if (isInterractable(hex)) {
			const scale = 1 + cubicOut(hex.scale) * 0.12
			ctx.scale(scale, scale)
		}
		switch (true) {
			case hex.type == HexType.ColumnHint:
				const { angle } = hex as ColumnHint
				drawColLabel(countInColumn(x, y, angle, level).toString(), angle)
				break
			case (hex as any).hidden: // TS doesn't detect that this can't be a ColumnHint
				drawBorder(gradients.yellow, "#FDEE00")
				break
			case hex.type == HexType.Empty:
				drawBorder(gradients.gray, "darkgray")
				switch (hex.precision) {
					case Precision.None:
						drawHexLabel("?")
						break
					case Precision.Number:
						drawHexLabel(countImmediateNeighbours(x, y, level).toString())
						break
					case Precision.Precise:
						drawHexLabel("{" + countImmediateNeighbours(x, y, level) + "}")
						break
				}
				break
			case hex.type == HexType.Full:
				drawBorder(gradients.red, "#EC4899")
				if (hex.precision != Precision.None)
					drawHexLabel(countDistantNeighbours(x, y, level).toString())
				break
		}
		ctx.restore()
	}
}

function getFocusedHex(pos: Position, cache: RenderCache, level: Level): Hex | null {
	const { colGap, rowGap, hexRadius } = cache
	let min = Infinity,
		closest: Hex | null = null,
		cur = min
	for (let x = 0; x < level.width; x++) {
		for (let y = 0; y < level.height; y++) {
			cur = Math.hypot(pos[0] - x * colGap, pos[1] - (y + (x % 2) * 0.5) * rowGap)
			if (cur < min && cur < hexRadius) {
				min = cur
				closest = level.hexes[x][y]
			}
		}
	}
	return closest
}
