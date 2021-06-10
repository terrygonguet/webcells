import { clamp } from "$lib/utils"
import { cubicOut } from "svelte/easing"
import type { Hex, Level, Position, ColumnHint, FullHex, EmptyHex } from "./game"
import {
	distantNeighbours,
	immediateNeighbours,
	inColumn,
	isInterractable,
	HexType,
	Precision,
	HintLevel,
} from "./game"

export type State = {
	level: Level
	ctx: CanvasRenderingContext2D
	canvas: HTMLCanvasElement
	width: number
	height: number
	sizeChanged: boolean
	cursor: Position
}

type RenderCache = {
	hexRadius: number
	rowGap: number
	colGap: number
	boardOffsetX: number
	boardOffsetY: number
	displayProps: (DisplayProps | null)[][]
	hexes: [Hex, DisplayProps | null][]
}

type DisplayProps = {
	scale: number
	hintOpacity: number
}

type GradientsDict = { [name: string]: CanvasGradient }

export function setup(canvas: HTMLCanvasElement, level: Level): State {
	const ctx = canvas.getContext("2d")
	if (!ctx) throw new Error("Can't get canvas rendering context")

	canvas.width = innerWidth
	canvas.height = innerHeight

	return {
		level,
		ctx,
		canvas,
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
		boardOffsetX: 0,
		boardOffsetY: 0,
		displayProps: [],
		hexes: [],
	},
	gap = 1.1
export function render(delta: number, state: State) {
	const { width, height, ctx, level, sizeChanged, cursor, canvas } = state

	// recompute constants if size changes
	if (sizeChanged) {
		Object.assign(cache, getRenderCache(state))
		state.sizeChanged = false
	}

	const { colGap, rowGap, hexRadius, boardOffsetY, boardOffsetX, displayProps, hexes } = cache,
		boardPos = screen2board(cursor, state, cache),
		focusedHex = boardPos ? level.hexes[boardPos[0]]?.[boardPos[1]] : null,
		focusedDP = boardPos ? displayProps[boardPos[0]]?.[boardPos[1]] : null,
		animationSpeed = delta * 5 // 200ms animation

	ctx.clearRect(0, 0, width, height)
	ctx.save()
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.lineJoin = "round"
	ctx.translate(width / 2 + boardOffsetX, height / 2 + boardOffsetY)

	for (const [hex, dp] of hexes) {
		drawHex(hex, dp)
		if (dp) {
			const scaleDir = focusedHex == hex && hex.type != HexType.ColumnHint && hex.hidden ? 1 : -1,
				opacityDir = hex.hint == HintLevel.Shown ? 1 : -1
			dp.scale = clamp(dp.scale + scaleDir * animationSpeed, 0, 1)
			dp.hintOpacity = clamp(dp.hintOpacity + opacityDir * animationSpeed, 0, 1)
		}
	}

	// draw focused Hex on top of the other Hexes
	if (focusedHex) {
		canvas.style.cursor = isInterractable(focusedHex) ? "pointer" : "initial"
		drawHex(focusedHex, focusedDP)
	} else canvas.style.cursor = "initial"

	// draw hints on top of everything
	for (const [hex, dp] of hexes) {
		drawHint(hex.x, hex.y, hex, dp)
	}

	ctx.restore()

	function drawBorder(hex: FullHex | EmptyHex, displayProps: DisplayProps | null) {
		switch (true) {
			case hex.hidden:
				ctx.fillStyle = "#111"
				ctx.strokeStyle = "white"
				break
			case hex.type == HexType.Empty:
				ctx.fillStyle = "transparent"
				ctx.strokeStyle = "white"
				break
			case hex.type == HexType.Full:
				ctx.fillStyle = "magenta"
				ctx.strokeStyle = "white"
				break
		}

		const scale = 1 + cubicOut(displayProps?.scale ?? 0) * 0.12
		ctx.scale(scale, scale)
		ctx.beginPath()
		ctx.moveTo(hexRadius, 0)
		ctx.lineTo(0.5 * hexRadius, -h * hexRadius)
		ctx.lineTo(-0.5 * hexRadius, -h * hexRadius)
		ctx.lineTo(-hexRadius, 0)
		ctx.lineTo(-0.5 * hexRadius, h * hexRadius)
		ctx.lineTo(0.5 * hexRadius, h * hexRadius)
		ctx.closePath()

		ctx.fill()
		ctx.lineWidth = clamp(0.1 * hexRadius, 1, 10)
		ctx.stroke()

		ctx.strokeStyle = "white"
		ctx.lineWidth = 0.7
		ctx.stroke()
	}

	function drawHexLabel(
		hex: FullHex | EmptyHex,
		neighbours: (Hex | null)[],
		displayProps: DisplayProps | null,
	) {
		const scale = 1 + cubicOut(displayProps?.scale ?? 0) * 0.12
		ctx.scale(scale, scale)
		if (hex.hint == HintLevel.Hidden) ctx.globalAlpha = 0.4 + 0.6 * (displayProps?.hintOpacity ?? 1)
		ctx.font = Math.floor(hexRadius) + "px 'Louis George Cafe'"
		ctx.fillStyle = "white"
		ctx.fillText(countFullHexes(neighbours).toString(), 0, 0.05 * hexRadius)
	}

	function drawColLabel(
		hex: ColumnHint,
		neighbours: (Hex | null)[],
		displayProps: DisplayProps | null,
	) {
		const label = countFullHexes(neighbours).toString(),
			scale = 1 + cubicOut(displayProps?.scale ?? 0) * 0.12

		ctx.save()
		if (hex.hint == HintLevel.Hidden) ctx.globalAlpha = 0.4 + 0.6 * (displayProps?.hintOpacity ?? 1)
		ctx.fillStyle = "white"
		ctx.font = `bold ${Math.floor(hexRadius * 0.7)}px 'Louis George Cafe'`
		ctx.rotate(hex.angle * (TAU / 6))
		ctx.translate(0, 0.5 * hexRadius)
		ctx.scale(scale, scale)
		ctx.fillText(label, 0, 0)
		ctx.restore()
	}

	function drawHex(hex: Hex, dp: DisplayProps | null) {
		ctx.save()
		ctx.translate(hex.x * colGap, (hex.y + (hex.x % 2) * 0.5) * rowGap)

		if (hex.type == HexType.ColumnHint) {
			drawColLabel(hex, inColumn(hex.x, hex.y, hex.angle, level), dp)
		} else if (hex.hidden) {
			drawBorder(hex, dp)
		} else if (hex.type == HexType.Empty) {
			drawBorder(hex, dp)
			switch (hex.precision) {
				case Precision.Number:
					drawHexLabel(hex, immediateNeighbours(hex.x, hex.y, level), dp)
					break
				case Precision.Precise:
					drawHexLabel(hex, immediateNeighbours(hex.x, hex.y, level), dp)
					break
			}
		} else if (hex.type == HexType.Full) {
			drawBorder(hex, dp)
			if (hex.precision != Precision.None)
				drawHexLabel(hex, distantNeighbours(hex.x, hex.y, level), dp)
		}

		ctx.restore()
	}

	function drawHint(x: number, y: number, hex: Hex, dp: DisplayProps | null) {
		const opacity = cubicOut(dp?.hintOpacity ?? 1)

		if ((hex.hint != HintLevel.Shown && !dp?.hintOpacity) || hex.precision == Precision.None) return

		ctx.save()
		ctx.translate(x * colGap, (y + (x % 2) * 0.5) * rowGap)

		if (hex.type == HexType.ColumnHint) {
			ctx.rotate(hex.angle * (TAU / 6))
			ctx.fillStyle = "white"
			ctx.globalAlpha = 0.5 * opacity
			ctx.fillRect(-0.1 * hexRadius, hexRadius, 0.2 * hexRadius, state.width * state.height)
		} else if (hex.type == HexType.Empty) {
			ctx.beginPath()
			ctx.moveTo(2 * gap * hexRadius, 0)
			ctx.lineTo(2.5 * gap * hexRadius, h * gap * hexRadius)
			ctx.lineTo(2 * gap * hexRadius, 2 * h * gap * hexRadius)
			ctx.lineTo(gap * hexRadius, 2 * h * gap * hexRadius)
			ctx.lineTo(0.5 * gap * hexRadius, 3 * h * gap * hexRadius)
			ctx.lineTo(-0.5 * gap * hexRadius, 3 * h * gap * hexRadius)
			ctx.lineTo(-1 * gap * hexRadius, 2 * h * gap * hexRadius)
			ctx.lineTo(-2 * gap * hexRadius, 2 * h * gap * hexRadius)
			ctx.lineTo(-2.5 * gap * hexRadius, h * gap * hexRadius)
			ctx.lineTo(-2 * gap * hexRadius, 0)
			ctx.lineTo(-2.5 * gap * hexRadius, -h * gap * hexRadius)
			ctx.lineTo(-2 * gap * hexRadius, -2 * h * gap * hexRadius)
			ctx.lineTo(-1 * gap * hexRadius, -2 * h * gap * hexRadius)
			ctx.lineTo(-0.5 * gap * hexRadius, -3 * h * gap * hexRadius)
			ctx.lineTo(0.5 * gap * hexRadius, -3 * h * gap * hexRadius)
			ctx.lineTo(gap * hexRadius, -2 * h * gap * hexRadius)
			ctx.lineTo(2 * gap * hexRadius, -2 * h * gap * hexRadius)
			ctx.lineTo(2.5 * gap * hexRadius, -h * gap * hexRadius)
			ctx.lineTo(2 * gap * hexRadius, 0)
			ctx.closePath()
			ctx.strokeStyle = "black"
			ctx.lineWidth = 0.1 * hexRadius
			ctx.fillStyle = "white"
			ctx.globalAlpha = 0.3 * opacity
			ctx.fill()
			ctx.globalAlpha = 0.7 * opacity
			ctx.stroke()
		} else if (hex.type == HexType.Full) {
			ctx.beginPath()
			ctx.moveTo(4 * gap * hexRadius, 0)
			ctx.lineTo(3.5 * gap * hexRadius, h * gap * hexRadius)
			ctx.lineTo(4 * gap * hexRadius, 2 * h * gap * hexRadius)
			ctx.lineTo(3.5 * gap * hexRadius, 3 * h * gap * hexRadius)
			ctx.lineTo(2.5 * gap * hexRadius, 3 * h * gap * hexRadius)
			ctx.lineTo(2 * gap * hexRadius, 4 * h * gap * hexRadius)
			ctx.lineTo(gap * hexRadius, 4 * h * gap * hexRadius)
			ctx.lineTo(0.5 * gap * hexRadius, 5 * h * gap * hexRadius)
			ctx.lineTo(-0.5 * gap * hexRadius, 5 * h * gap * hexRadius)
			ctx.lineTo(-1 * gap * hexRadius, 4 * h * gap * hexRadius)
			ctx.lineTo(-2 * gap * hexRadius, 4 * h * gap * hexRadius)
			ctx.lineTo(-2.5 * gap * hexRadius, 3 * h * gap * hexRadius)
			ctx.lineTo(-3.5 * gap * hexRadius, 3 * h * gap * hexRadius)
			ctx.lineTo(-4 * gap * hexRadius, 2 * h * gap * hexRadius)
			ctx.lineTo(-3.5 * gap * hexRadius, h * gap * hexRadius)
			ctx.lineTo(-4 * gap * hexRadius, 0)
			ctx.lineTo(-3.5 * gap * hexRadius, -h * gap * hexRadius)
			ctx.lineTo(-4 * gap * hexRadius, -2 * h * gap * hexRadius)
			ctx.lineTo(-3.5 * gap * hexRadius, -3 * h * gap * hexRadius)
			ctx.lineTo(-2.5 * gap * hexRadius, -3 * h * gap * hexRadius)
			ctx.lineTo(-2 * gap * hexRadius, -4 * h * gap * hexRadius)
			ctx.lineTo(-1 * gap * hexRadius, -4 * h * gap * hexRadius)
			ctx.lineTo(-0.5 * gap * hexRadius, -5 * h * gap * hexRadius)
			ctx.lineTo(0.5 * gap * hexRadius, -5 * h * gap * hexRadius)
			ctx.lineTo(gap * hexRadius, -4 * h * gap * hexRadius)
			ctx.lineTo(2 * gap * hexRadius, -4 * h * gap * hexRadius)
			ctx.lineTo(2.5 * gap * hexRadius, -3 * h * gap * hexRadius)
			ctx.lineTo(3.5 * gap * hexRadius, -3 * h * gap * hexRadius)
			ctx.lineTo(4 * gap * hexRadius, -2 * h * gap * hexRadius)
			ctx.lineTo(3.5 * gap * hexRadius, -h * gap * hexRadius)
			ctx.closePath()
			ctx.strokeStyle = "magenta"
			ctx.lineWidth = 0.1 * hexRadius
			ctx.fillStyle = "white"
			ctx.globalAlpha = 0.3 * opacity
			ctx.fill()
			ctx.globalAlpha = 0.7 * opacity
			ctx.stroke()
		}

		ctx.restore()
	}
}

function countFullHexes(list: (Hex | null)[]) {
	return list.reduce((acc, cur) => acc + (cur && cur.type == HexType.Full ? 1 : 0), 0)
}

function getRenderCache({ width, height, level }: State): RenderCache {
	const hexRadius = Math.min(
			clamp((0.9 * height) / (2 * level.height), 20, 70),
			clamp((0.9 * width) / (2 * level.width), 20, 70),
		),
		rowGap = hexRadius * h * 2 * gap,
		colGap = hexRadius * 1.5 * gap,
		boardOffsetX = (-level.width / 2 + 0.5) * colGap,
		boardOffsetY = (-level.height / 2 + 0.2) * rowGap,
		displayProps: DisplayProps[][] = level.hexes.map(col =>
			col.map(_ => ({ scale: 0, hintOpacity: 0 })),
		),
		hexes: [Hex, DisplayProps | null][] = (level.hexes.flat().filter(Boolean) as Hex[]).map(h => [
			h,
			displayProps[h?.x]?.[h?.y],
		])

	return { hexRadius, rowGap, colGap, boardOffsetX, boardOffsetY, displayProps, hexes }
}

export function screen2board(
	screenPos: Position,
	state: State,
	cache = getRenderCache(state),
): Position | null {
	const { colGap, rowGap, hexRadius, boardOffsetX, boardOffsetY } = cache,
		{ level, width, height } = state,
		boardCursor = [
			screenPos[0] - width / 2 - boardOffsetX,
			screenPos[1] - height / 2 - boardOffsetY,
		] as Position,
		closest = [0, 0] as Position

	let min = Infinity,
		cur = min
	for (let x = 0; x < level.width; x++) {
		for (let y = 0; y < level.height; y++) {
			cur = Math.hypot(boardCursor[0] - x * colGap, boardCursor[1] - (y + (x % 2) * 0.5) * rowGap)
			if (cur < min && cur < hexRadius) {
				min = cur
				closest[0] = x
				closest[1] = y
			}
		}
	}
	return min != Infinity ? closest : null
}
