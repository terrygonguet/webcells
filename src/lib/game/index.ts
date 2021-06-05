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
					{ type: CellType.Empty, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: true, precision: Precision.Number },
					{ type: CellType.Empty, hidden: true, precision: Precision.Precise },
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 1 },
				],
				[
					{ type: CellType.Full, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.Number },
					{ type: CellType.Empty, hidden: false, precision: Precision.Precise },
					{ type: CellType.Full, hidden: true, precision: Precision.Number },
				],
				[
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 2 },
					{ type: CellType.Full, hidden: true, precision: Precision.Number },
					{ type: CellType.Full, hidden: true, precision: Precision.None },
					{ type: CellType.Full, hidden: true, precision: Precision.Number },
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 3 },
				],
				[
					{ type: CellType.Full, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.None },
					{ type: CellType.Empty, hidden: false, precision: Precision.Number },
					{ type: CellType.Empty, hidden: false, precision: Precision.Precise },
					{ type: CellType.Full, hidden: true, precision: Precision.Number },
				],
				[
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 4 },
					{ type: CellType.Empty, hidden: true, precision: Precision.None },
					{ type: CellType.Empty, hidden: true, precision: Precision.Number },
					{ type: CellType.Empty, hidden: true, precision: Precision.Precise },
					{ type: CellType.ColumnHint, precision: Precision.Number, angle: 5 },
				],
			],
		}
	else throw new Error("Invalid level string")
}

export function setup(ctx: CanvasRenderingContext2D, level: Level) {}

export function render(delta: number, ctx: CanvasRenderingContext2D, level: Level) {}
