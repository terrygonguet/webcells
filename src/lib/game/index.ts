import { clamp, randInt } from "$lib/utils"

export type Level = {
	title: string
	author: string
	flavor?: string
	width: number
	height: number
	cells: Cell[][]
}

export type Cell = null | EmptyCell | FullCell | ColumnHintCell

type EmptyCell = {
	type: CellType.Empty
	hidden: boolean
	precision: Precision
}

type FullCell = {
	type: CellType.Full
	hidden: boolean
	precision: Precision.None | Precision.Number
}

type ColumnHintCell = {
	type: CellType.ColumnHint
	precision: Precision.Number | Precision.Precise
	// number of 60° increments to rotate counter-clockwise
	angle: 0 | 1 | 2 | 3 | 4 | 5
}

export enum Precision {
	None,
	Number,
	Precise,
}

export enum CellType {
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
	cellRadius: number
	cellGapV: number
	cellGapH: number
}

export function parse(text: string): Level {
	if (text == "test")
		return {
			title: "Test",
			author: "DrFill",
			flavor: "This is a test\nover two lines",
			width: 5,
			height: 5,
			cells: [
				[
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 0 },
					{ type: CellType.Empty, hidden: false, precision: Precision.None },
					{ type: CellType.Empty, hidden: true, precision: Precision.Number },
					{ type: CellType.Empty, hidden: true, precision: Precision.Precise },
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 1 },
				],
				[
					{ type: CellType.Full, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.Number },
					{ type: CellType.Empty, hidden: false, precision: Precision.Precise },
					null,
				],
				[
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 2 },
					{ type: CellType.Full, hidden: true, precision: Precision.Number },
					{ type: CellType.Full, hidden: false, precision: Precision.None },
					{ type: CellType.Full, hidden: false, precision: Precision.Number },
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 3 },
				],
				[
					{ type: CellType.Full, hidden: false, precision: Precision.None },
					{ type: CellType.Empty, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: true, precision: Precision.Number },
					{ type: CellType.Empty, hidden: false, precision: Precision.Precise },
					null,
				],
				[
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 4 },
					{ type: CellType.Empty, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.Number },
					{ type: CellType.Empty, hidden: true, precision: Precision.Precise },
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 5 },
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
		cellRadius: 0,
		cellGapV: 0,
		cellGapH: 0,
	}
export function render(delta: number, state: State) {
	const { width, height, ctx, gradients, level, sizeChanged, cursor } = state

	// recompute constants if size changes
	if (sizeChanged) {
		cache.cellRadius = Math.min(
			clamp((0.8 * height) / (2 * level.height), 20, 70),
			clamp((0.8 * width) / (2 * level.width), 20, 70),
		)
		const gap = 1.06
		cache.cellGapV = cache.cellRadius * h * 2 * gap
		cache.cellGapH = cache.cellRadius * 1.5 * gap

		gradients.yellow = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.cellRadius)
		gradients.yellow.addColorStop(0, "#e7dd7e")
		gradients.yellow.addColorStop(1, "#ead61f")
		gradients.red = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.cellRadius)
		gradients.red.addColorStop(0, "#e36868")
		gradients.red.addColorStop(1, "#c32222")
		gradients.gray = ctx.createRadialGradient(0, 0, 0, 0, 0, cache.cellRadius)
		gradients.gray.addColorStop(0, "darkgray")
		gradients.gray.addColorStop(1, "gray")

		state.sizeChanged = false
	}
	const { cellGapH, cellGapV, cellRadius } = cache,
		drawCell = makeDrawCell(state, cache),
		boardOffsetX = (-level.width / 2 + 0.5) * cellGapH,
		boardOffsetY = (-level.height / 2 + 0.2) * cellGapV,
		boardCursor = [cursor[0] - width / 2 - boardOffsetX, cursor[1] - height / 2 - boardOffsetY] as [
			number,
			number,
		],
		[hasFocusedHex, [fx, fy]] = getFocusedHex(boardCursor, cache, level)

	ctx.clearRect(0, 0, width, height)
	ctx.save()
	ctx.font = cellGapH + "px 'Louis George Cafe'"
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.translate(width / 2, height / 2)

	ctx.save()
	ctx.translate(boardOffsetX, boardOffsetY)

	ctx.save()
	for (let i = 0; i < level.width; i++) {
		const col = level.cells[i]
		for (let j = 0; j < level.height; j++) {
			const cell = col[j]
			if (!hasFocusedHex || i != fx || j != fy) drawCell(cell)
			ctx.translate(0, cellGapV)
		}
		ctx.translate(cellGapH, (i % 2 ? -0.5 : 0.5) * cellGapV - level.height * cellGapV)
	}
	ctx.restore()

	if (hasFocusedHex) {
		ctx.save()
		ctx.translate(fx * cellGapH, (fy + (fx % 2) * 0.5) * cellGapV)
		ctx.scale(1.2, 1.2)
		drawCell(level.cells[fx][fy])
		ctx.restore()
	}

	// ctx.beginPath()
	// ctx.moveTo(-width, boardCursor[1])
	// ctx.lineTo(width, boardCursor[1])
	// ctx.moveTo(boardCursor[0], -height)
	// ctx.lineTo(boardCursor[0], height)
	// ctx.stroke()

	ctx.restore()

	ctx.restore()
}

function makeDrawCell(state: State, cache: RenderCache) {
	const { ctx, gradients, level } = state,
		{ cellRadius: radius } = cache

	function drawHex(fill: string | CanvasGradient, stroke: string | CanvasGradient) {
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

	function fillCellNumber(n: number, color = "white") {
		ctx.fillStyle = color
		ctx.fillText(n.toString(), 0, 0.1 * radius)
	}

	return function drawCell(cell: Cell) {
		if (!cell) return
		if (cell.type == CellType.ColumnHint) return

		if (cell.hidden) {
			drawHex(gradients.yellow, "yellow")
			return
		}

		switch (cell.type) {
			case CellType.Empty:
				drawHex(gradients.gray, "darkgray")
				fillCellNumber(0)
				break
			case CellType.Full:
				drawHex(gradients.red, "red")
				fillCellNumber(0)
				break
		}
	}
}

function getFocusedHex(pos: Position, cache: RenderCache, level: Level): [boolean, Position] {
	const { cellGapH, cellGapV, cellRadius } = cache
	let min = Infinity,
		closest: Position = [-1, -1],
		cur = min,
		found = false
	for (let x = 0; x < level.width; x++) {
		for (let y = 0; y < level.height; y++) {
			cur = Math.hypot(pos[0] - x * cellGapH, pos[1] - (y + (x % 2) * 0.5) * cellGapV)
			if (cur < min && cur < cellRadius) {
				min = cur
				closest[0] = x
				closest[1] = y
				found = true
			}
		}
	}
	return [found, closest]
}
