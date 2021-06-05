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

export function setup(ctx: CanvasRenderingContext2D, level: Level) {}

const TAU = 2 * Math.PI,
	h = Math.sqrt(3) / 2
export function render(delta: number, ctx: CanvasRenderingContext2D, level: Level) {
	const {
			canvas: { width, height },
		} = ctx,
		cellRadius = Math.min(
			clamp((0.8 * height) / (2 * level.height), 20, 70),
			clamp((0.8 * width) / (2 * level.width), 20, 70),
		),
		gap = 1.06,
		cellGapV = cellRadius * h * 2 * gap,
		cellGapH = cellRadius * 1.5 * gap,
		gradients: GradientsDict = {},
		drawCell = makeDrawCell(ctx, cellRadius, gradients)

	gradients.yellow = ctx.createRadialGradient(0, 0, 0, 0, 0, cellRadius)
	gradients.yellow.addColorStop(0, "#e7dd7e")
	gradients.yellow.addColorStop(1, "#ead61f")
	gradients.red = ctx.createRadialGradient(0, 0, 0, 0, 0, cellRadius)
	gradients.red.addColorStop(0, "#e36868")
	gradients.red.addColorStop(1, "#c32222")

	ctx.clearRect(0, 0, width, height)
	ctx.save()
	ctx.font = cellGapH + "px 'Louis George Cafe'"
	ctx.textAlign = "center"
	ctx.textBaseline = "middle"
	ctx.translate(width / 2, height / 2)

	// ctx.beginPath()
	// ctx.moveTo(-width, 0)
	// ctx.lineTo(width, 0)
	// ctx.moveTo(0, -height)
	// ctx.lineTo(0, height)
	// ctx.stroke()

	ctx.save()
	ctx.translate((-level.width / 2 + 0.5) * cellGapH, (-level.height / 2 + 0.2) * cellGapV)
	for (let i = 0; i < level.width; i++) {
		const col = level.cells[i]
		for (let j = 0; j < level.height; j++) {
			const cell = col[j]
			// ctx.beginPath()
			// ctx.arc(0, 0, cellRadius, 0, TAU)
			// ctx.stroke()
			drawCell(cell, level)
			ctx.translate(0, cellGapV)
		}
		ctx.translate(cellGapH, (i % 2 ? -0.5 : 0.5) * cellGapV - level.height * cellGapV)
	}
	ctx.restore()

	ctx.restore()
}

type GradientsDict = { [name: string]: CanvasGradient }
function makeDrawCell(ctx: CanvasRenderingContext2D, radius: number, gradients: GradientsDict) {
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

	let i = 0
	return function drawCell(cell: Cell, level: Level) {
		if (!cell) return
		if (cell.type == CellType.ColumnHint) return

		if (cell.hidden) {
			drawHex(gradients.yellow, "yellow")
			return
		}

		switch (cell.type) {
			case CellType.Empty:
				drawHex("rgba(120, 120, 120)", "darkgray")
				fillCellNumber(i++ % 7)
				break
			case CellType.Full:
				drawHex(gradients.red, "red")
				fillCellNumber(i++ % 7)
				break
		}
	}
}
