import { randInt } from "$lib/utils"

export type Level = {
	title: string
	author: string
	flavor?: string
	width: number
	height: number
	hexes: (Hex | null)[][]
}

export type Hex = EmptyHex | FullHex | ColumnHint

export type EmptyHex = {
	type: HexType.Empty
	hidden: boolean
	precision: Precision
	scale: number
}

export type FullHex = {
	type: HexType.Full
	hidden: boolean
	precision: Precision.None | Precision.Number
	scale: number
}

export type ColumnHint = {
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

export type Position = [number, number]

export function parse(text: string): Level {
	if (text == "test") {
		const width = randInt(5, 30),
			height = randInt(5, 20)
		return {
			title: "Test",
			author: "DrFill",
			flavor: "This is a test\nover two lines",
			width,
			height,
			hexes: Array(width)
				.fill(0)
				.map(_ =>
					Array(height)
						.fill(0)
						.map(_ => {
							const t = Math.random(),
								precision = Math.random() < 0.5 ? Precision.None : Precision.Number,
								hidden = Math.random() < 0.5
							if (t < 0.2) return { type: HexType.Full, precision, hidden, scale: 0 }
							else if (t < 0.3)
								return {
									type: HexType.ColumnHint,
									precision: Precision.Number,
									angle: randInt(0, 6) as ColumnHint["angle"],
									scale: 0,
								}
							else if (t < 0.8) return { type: HexType.Empty, precision, hidden, scale: 0 }
							else return null
						}),
				),
		}
	} else throw new Error("Invalid level string")
}

export enum UncoveringResult {
	Nothing,
	Correct,
	Incorrect,
}
export function uncoverHex(
	x: number,
	y: number,
	expected: HexType.Empty | HexType.Full,
	level: Level,
) {
	const hex = level.hexes[x]?.[y]
	if (!hex || hex.type == HexType.ColumnHint || !hex.hidden) return UncoveringResult.Nothing
	const correct = hex.type == expected
	if (correct) {
		hex.hidden = false
		return UncoveringResult.Correct
	} else return UncoveringResult.Incorrect
}

export function isInterractable(hex: Hex) {
	return hex.type == HexType.ColumnHint || hex.hidden
}

const immediateNeighboursCountCache = new Map<string, number>()
export function countImmediateNeighbours(x: number, y: number, level: Level) {
	const cacheId = `${x} ${y}`,
		cached = immediateNeighboursCountCache.get(cacheId),
		oddCol = x % 2 ? 1 : -1
	if (cached) return cached

	const neighbours = [
		level.hexes[x + 1]?.[y],
		level.hexes[x + 1]?.[y + oddCol],
		level.hexes[x - 1]?.[y],
		level.hexes[x - 1]?.[y + oddCol],
		level.hexes[x]?.[y + 1],
		level.hexes[x]?.[y - 1],
	].filter(hex => hex && hex.type == HexType.Full)

	immediateNeighboursCountCache.set(cacheId, neighbours.length)
	return neighbours.length
}

const distantNeighboursCountCache = new Map<string, number>()
export function countDistantNeighbours(x: number, y: number, level: Level): number {
	const cacheId = `${x} ${y}`,
		cached = distantNeighboursCountCache.get(cacheId),
		oddCol = x % 2 ? 1 : -1
	if (cached) return cached

	const neighbours = [
		level.hexes[x + 1]?.[y],
		level.hexes[x + 1]?.[y + oddCol],
		level.hexes[x - 1]?.[y],
		level.hexes[x - 1]?.[y + oddCol],
		level.hexes[x]?.[y + 1],
		level.hexes[x]?.[y - 1],

		level.hexes[x - 2]?.[y - 1],
		level.hexes[x - 2]?.[y],
		level.hexes[x - 2]?.[y + 1],

		level.hexes[x - 1]?.[y + oddCol * 2],
		level.hexes[x - 1]?.[y - oddCol],

		level.hexes[x]?.[y - 2],
		level.hexes[x]?.[y + 2],

		level.hexes[x + 1]?.[y + oddCol * 2],
		level.hexes[x + 1]?.[y - oddCol],

		level.hexes[x + 2]?.[y - 1],
		level.hexes[x + 2]?.[y],
		level.hexes[x + 2]?.[y + 1],
	].filter(hex => hex && hex.type == HexType.Full)

	distantNeighboursCountCache.set(cacheId, neighbours.length)
	return neighbours.length
}

const colCountCache = new Map<string, number>()
export function countInColumn(
	x: number,
	y: number,
	angle: ColumnHint["angle"],
	level: Level,
): number {
	const cacheId = `${x} ${y}`,
		cached = colCountCache.get(cacheId)
	if (cached) return cached

	const offset = [
		[0, 1],
		[-1, 0.5],
		[-1, -0.5],
		[0, -1],
		[1, -0.5],
		[1, 0.5],
	][angle] as [number, number]
	let sum = 0,
		cx = x,
		cy = y + (x % 2) * 0.5

	do {
		cx += offset[0]
		cy += offset[1]
		if (level.hexes?.[Math.floor(cx)]?.[Math.floor(cy)]?.type == HexType.Full) sum++
	} while (cx >= 0 && cx <= level.width && cy >= 0 && cy <= level.height)

	colCountCache.set(cacheId, sum)
	return sum
}
