import { clamp } from "$lib/utils"
import { cubicOut } from "svelte/easing"

export type Level = {
	title: string
	author: string
	flavor?: string
	width: number
	height: number
	hexes: (Hex | null)[][]
}

export type Hex = EmptyHex | FullHex | ColumnHint

type EmptyHex = {
	type: HexType.Empty
	hidden: boolean
	precision: Precision
	scale: number
}

type FullHex = {
	type: HexType.Full
	hidden: boolean
	precision: Precision.None | Precision.Number
	scale: number
}

type ColumnHint = {
	type: HexType.ColumnHint
	precision: Precision.Number | Precision.Precise
	// number of 60° increments to rotate counter-clockwise
	angle: 0 | 1 | 2 | 3 | 4 | 5
	scale: number
}

export enum Precision {
	None,
	Number,
	Precise,
}

export enum HexType {
	Empty = "empty",
	Full = "full",
	ColumnHint = "hint",
}

type GradientsDict = { [name: string]: CanvasGradient }

type Position = [number, number]

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

export function parse(text: string): Level {
	if (text == "test")
		return {
			title: "Test",
			author: "DrFill",
			flavor: "This is a test\nover two lines",
			width: 5,
			height: 5,
			hexes: [
				[
					{ type: HexType.ColumnHint, precision: Precision.Number, angle: 0, scale: 0 },
					{ type: HexType.Empty, hidden: false, precision: Precision.None, scale: 0 },
					{ type: HexType.Empty, hidden: true, precision: Precision.Number, scale: 0 },
					{ type: HexType.Empty, hidden: true, precision: Precision.Precise, scale: 0 },
					{ type: HexType.ColumnHint, precision: Precision.Number, angle: 1, scale: 0 },
				],
				[
					{ type: HexType.Full, hidden: true, precision: Precision.None, scale: 0 },
					{ type: HexType.Empty, hidden: false, precision: Precision.None, scale: 0 },
					{ type: HexType.Empty, hidden: false, precision: Precision.Number, scale: 0 },
					{ type: HexType.Empty, hidden: false, precision: Precision.Precise, scale: 0 },
					null,
				],
				[
					{ type: HexType.ColumnHint, precision: Precision.Number, angle: 2, scale: 0 },
					{ type: HexType.Full, hidden: true, precision: Precision.Number, scale: 0 },
					{ type: HexType.Full, hidden: false, precision: Precision.None, scale: 0 },
					{ type: HexType.Full, hidden: false, precision: Precision.Number, scale: 0 },
					{ type: HexType.ColumnHint, precision: Precision.Number, angle: 3, scale: 0 },
				],
				[
					{ type: HexType.Full, hidden: false, precision: Precision.None, scale: 0 },
					{ type: HexType.Empty, hidden: true, precision: Precision.None, scale: 0 },
					{ type: HexType.Empty, hidden: true, precision: Precision.Number, scale: 0 },
					{ type: HexType.Empty, hidden: false, precision: Precision.Precise, scale: 0 },
					null,
				],
				[
					{ type: HexType.ColumnHint, precision: Precision.Number, angle: 4, scale: 0 },
					{ type: HexType.Empty, hidden: true, precision: Precision.None, scale: 0 },
					{ type: HexType.Empty, hidden: false, precision: Precision.Number, scale: 0 },
					{ type: HexType.Empty, hidden: true, precision: Precision.Precise, scale: 0 },
					{ type: HexType.ColumnHint, precision: Precision.Number, angle: 5, scale: 0 },
				],
			],
		}
	else throw new Error("Invalid level string")
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
			clamp((0.8 * height) / (2 * level.height), 20, 70),
			clamp((0.8 * width) / (2 * level.width), 20, 70),
		)
		const gap = 1.06
		cache.rowGap = cache.hexRadius * h * 2 * gap
		cache.colGap = cache.hexRadius * 1.5 * gap

		gradients.yellow = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.hexRadius)
		gradients.yellow.addColorStop(0, "#e7dd7e")
		gradients.yellow.addColorStop(1, "#ead61f")
		gradients.red = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.hexRadius)
		gradients.red.addColorStop(0, "#e36868")
		gradients.red.addColorStop(1, "#c32222")
		gradients.gray = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.hexRadius)
		gradients.gray.addColorStop(0, "darkgray")
		gradients.gray.addColorStop(1, "gray")

		state.sizeChanged = false
	}

	const { colGap, rowGap } = cache,
		drawHex = makeDrawHex(state, cache),
		boardOffsetX = (-level.width / 2 + 0.5) * colGap,
		boardOffsetY = (-level.height / 2 + 0.2) * rowGap,
		boardCursor = [
			cursor[0] - width / 2 - boardOffsetX,
			cursor[1] - height / 2 - boardOffsetY,
		] as Position,
		focusedHex = getFocusedHex(boardCursor, cache, level),
		scaleSpeed = delta * (1000 / 300) // 300ms animation

	ctx.clearRect(0, 0, width, height)
	ctx.save()
	ctx.font = colGap + "px 'Louis George Cafe'"
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
		canvas.style.cursor = focusedHex.type != HexType.ColumnHint ? "pointer" : "initial"
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
}

function makeDrawHex(state: State, cache: RenderCache) {
	const { ctx, gradients, level } = state,
		{ hexRadius: radius, colGap, rowGap } = cache

	function drawBorder(fill: string | CanvasGradient, stroke: string | CanvasGradient) {
		ctx.beginPath()
		ctx.moveTo(radius, 0)
		ctx.lineTo(0.5 * radius, -h * radius)
		ctx.lineTo(-0.5 * radius, -h * radius)
		ctx.lineTo(-radius, 0)
		ctx.lineTo(-0.5 * radius, h * radius)
		ctx.lineTo(0.5 * radius, h * radius)
		ctx.closePath()

		ctx.fillStyle = fill
		ctx.fill()

		ctx.strokeStyle = stroke
		ctx.lineWidth = clamp(0.06 * radius, 1, 10)
		ctx.stroke()

		ctx.strokeStyle = "white"
		ctx.lineWidth = 0.7
		ctx.stroke()
	}

	function drawHexLabel(n: string, color = "white") {
		ctx.fillStyle = color
		ctx.fillText(n, 0, 0.1 * radius)
	}

	return function drawHex(x: number, y: number, hex: Hex) {
		if (hex.type == HexType.ColumnHint) return

		ctx.save()
		ctx.translate(x * colGap, (y + (x % 2) * 0.5) * rowGap)
		const scale = 1 + cubicOut(hex.scale) * 0.12
		ctx.scale(scale, scale)
		if (hex.hidden) drawBorder(gradients.yellow, "yellow")
		else {
			switch (hex.type) {
				case HexType.Empty:
					drawBorder(gradients.gray, "darkgray")
					drawHexLabel(
						hex.precision == Precision.None
							? "?"
							: countImmediateNeighbours(x, y, level).toString(),
					)
					break
				case HexType.Full:
					drawBorder(gradients.red, "red")
					if (hex.precision != Precision.None)
						drawHexLabel(countDistantNeighbours(x, y, level).toString())
					break
			}
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

function countImmediateNeighbours(x: number, y: number, level: Level) {
	return [
		level.hexes[x + 1]?.[y],
		level.hexes[x + 1]?.[y + 1],
		level.hexes[x - 1]?.[y],
		level.hexes[x - 1]?.[y - 1],
		level.hexes[x]?.[y + 1],
		level.hexes[x]?.[y - 1],
	].filter(hex => hex && hex.type == HexType.Full).length
}

function countDistantNeighbours(x: number, y: number, level: Level) {
	return [
		level.hexes[x + 1]?.[y],
		level.hexes[x + 1]?.[y + 1],
		level.hexes[x - 1]?.[y],
		level.hexes[x - 1]?.[y - 1],
		level.hexes[x]?.[y + 1],
		level.hexes[x]?.[y - 1],

		level.hexes[x - 2]?.[y],
		level.hexes[x - 2]?.[y + 1],
		level.hexes[x - 2]?.[y + 2],

		level.hexes[x - 1]?.[y - 1],
		level.hexes[x - 1]?.[y + 2],

		level.hexes[x]?.[y - 2],
		level.hexes[x]?.[y + 2],

		level.hexes[x + 1]?.[y - 1],
		level.hexes[x + 1]?.[y + 2],

		level.hexes[x + 2]?.[y],
		level.hexes[x + 2]?.[y + 1],
		level.hexes[x + 2]?.[y + 2],
	].filter(hex => hex && hex.type == HexType.Full).length
}
