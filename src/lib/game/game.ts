import type { Level } from "./level"

export type Hex = EmptyHex | FullHex | ColumnHint

export type EmptyHex = {
	type: HexType.Empty
	hidden: boolean
	precision: Precision
	hint: HintLevel
	x: number
	y: number
}

export type FullHex = {
	type: HexType.Full
	hidden: boolean
	precision: Precision.None | Precision.Number
	hint: HintLevel
	x: number
	y: number
}

export type ColumnHint = {
	type: HexType.ColumnHint
	precision: Precision.Number | Precision.Precise
	// number of 60° increments to rotate clockwise
	angle: 0 | 1 | 2 | 3 | 4 | 5
	hint: HintLevel
	x: number
	y: number
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

export enum HintLevel {
	Hidden,
	None,
	Shown,
}

export type Position = [number, number]

export enum InteractionType {
	One = "1",
	Two = "2",
}

export enum InteractionResult {
	Nothing,
	Correct,
	Incorrect,
}

export function interact(x: number, y: number, type: InteractionType, level: Level) {
	const hex = level.hexes[x]?.[y]
	if (!hex) return InteractionResult.Nothing

	if (hex.type == HexType.ColumnHint || !hex.hidden) {
		switch (type) {
			case InteractionType.One:
				hex.hint = hex.hint == HintLevel.Shown ? HintLevel.None : HintLevel.Shown
				return InteractionResult.Nothing
				break
			case InteractionType.Two:
				hex.hint = HintLevel.Hidden
				return InteractionResult.Nothing
				break
		}
	} else if (hex.type == HexType.Empty) {
		switch (type) {
			case InteractionType.One:
				return InteractionResult.Incorrect
				break
			case InteractionType.Two:
				hex.hidden = false
				hideNeighboursHints(hex, level)
				return InteractionResult.Correct
				break
		}
	} else if (hex.type == HexType.Full) {
		switch (type) {
			case InteractionType.One:
				hex.hidden = false
				hideNeighboursHints(hex, level)
				return InteractionResult.Correct
				break
			case InteractionType.Two:
				return InteractionResult.Incorrect
				break
		}
	} else return InteractionResult.Nothing
}

function hideNeighboursHints(hex: Hex, level: Level) {
	const getNeighbours = {
			[HexType.Empty]: (hex: EmptyHex) => immediateNeighbours(hex.x, hex.y, level),
			[HexType.Full]: (hex: FullHex) => distantNeighbours(hex.x, hex.y, level),
			[HexType.ColumnHint]: (hex: ColumnHint) => inColumn(hex.x, hex.y, hex.angle, level),
		},
		toCheck = new Set([
			...distantNeighbours(hex.x, hex.y, level),
			...inColumn(hex.x, hex.y, 0, level),
			...inColumn(hex.x, hex.y, 1, level),
			...inColumn(hex.x, hex.y, 2, level),
			...inColumn(hex.x, hex.y, 3, level),
			...inColumn(hex.x, hex.y, 4, level),
			...inColumn(hex.x, hex.y, 5, level),
		])

	for (const hex of toCheck) {
		if (!hex || hex.hint == HintLevel.Hidden) continue
		if (getNeighbours[hex.type](hex as any).every(isColumnHintOrUncovered))
			hex.hint = HintLevel.Hidden
	}
}

export function isColumnHintOrUncovered(hex: Hex | null) {
	return !hex || hex.type == HexType.ColumnHint || !hex.hidden
}

export function isInterractable(hex: Hex) {
	return hex.type == HexType.ColumnHint || hex.hidden || hex.precision != Precision.None
}

export function countRemainingFullHexes(level: Level) {
	return level.hexes
		.flat()
		.reduce((acc, cur) => acc + (cur?.type == HexType.Full && cur.hidden ? 1 : 0), 0)
}

export function immediateNeighbours(x: number, y: number, level: Level) {
	let neighbours

	// It needs to be in continuous order to compute labels
	if (x % 2) {
		neighbours = [
			level.hexes[x]?.[y - 1] ?? null,
			level.hexes[x + 1]?.[y] ?? null,
			level.hexes[x + 1]?.[y + 1] ?? null,
			level.hexes[x]?.[y + 1] ?? null,
			level.hexes[x - 1]?.[y + 1] ?? null,
			level.hexes[x - 1]?.[y] ?? null,
		]
	} else {
		neighbours = [
			level.hexes[x]?.[y - 1] ?? null,
			level.hexes[x + 1]?.[y - 1] ?? null,
			level.hexes[x + 1]?.[y] ?? null,
			level.hexes[x]?.[y + 1] ?? null,
			level.hexes[x - 1]?.[y] ?? null,
			level.hexes[x - 1]?.[y - 1] ?? null,
		]
	}

	return neighbours
}

export function distantNeighbours(x: number, y: number, level: Level) {
	const oddCol = x % 2 ? 1 : -1,
		neighbours = [
			level.hexes[x + 1]?.[y] ?? null,
			level.hexes[x + 1]?.[y + oddCol] ?? null,
			level.hexes[x - 1]?.[y] ?? null,
			level.hexes[x - 1]?.[y + oddCol] ?? null,
			level.hexes[x]?.[y + 1] ?? null,
			level.hexes[x]?.[y - 1] ?? null,

			level.hexes[x - 2]?.[y - 1] ?? null,
			level.hexes[x - 2]?.[y] ?? null,
			level.hexes[x - 2]?.[y + 1] ?? null,

			level.hexes[x - 1]?.[y + oddCol * 2] ?? null,
			level.hexes[x - 1]?.[y - oddCol] ?? null,

			level.hexes[x]?.[y - 2] ?? null,
			level.hexes[x]?.[y + 2] ?? null,

			level.hexes[x + 1]?.[y + oddCol * 2] ?? null,
			level.hexes[x + 1]?.[y - oddCol] ?? null,

			level.hexes[x + 2]?.[y - 1] ?? null,
			level.hexes[x + 2]?.[y] ?? null,
			level.hexes[x + 2]?.[y + 1] ?? null,
		]

	return neighbours
}

export function inColumn(x: number, y: number, angle: ColumnHint["angle"], level: Level) {
	const offset = [
			[0, 1],
			[-1, 0.5],
			[-1, -0.5],
			[0, -1],
			[1, -0.5],
			[1, 0.5],
		][angle] as [number, number],
		hexes = []
	let cx = x,
		cy = y + (x % 2) * 0.5

	do {
		cx += offset[0]
		cy += offset[1]
		hexes.push(level.hexes?.[Math.floor(cx)]?.[Math.floor(cy)] ?? null)
	} while (cx >= 0 && cx <= level.width && cy >= 0 && cy <= level.height)

	return hexes
}
