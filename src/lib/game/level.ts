import { pickEl, randInt } from "$lib/utils"
import {
	ColumnHint,
	distantNeighbours,
	Hex,
	HexType,
	HintLevel,
	immediateNeighbours,
	inColumn,
	isColumnHintOrUncovered,
	Precision,
} from "./game"

export type Level = {
	title: string
	author: string
	flavor?: string
	width: number
	height: number
	hexes: (Hex | null)[][]
}

export function randomLevel(): Level {
	const width = randInt(10, 15),
		height = randInt(10, 15),
		level: Level = {
			title: "Test",
			author: "DrFill",
			flavor: "This is a test\nover two lines",
			width,
			height,
			hexes: Array(width)
				.fill(0)
				.map((_, x) =>
					Array(height)
						.fill(0)
						.map((_, y) => {
							const t = Math.random(),
								hidden = Math.random() < 0.5
							if (t < 0.2)
								return {
									type: HexType.Full,
									precision: Math.random() < 0.5 ? Precision.None : Precision.Number,
									hidden,
									hint: HintLevel.None,
									x,
									y,
								}
							else if (t < 0.3)
								return {
									type: HexType.ColumnHint,
									precision: Math.random() < 0.5 ? Precision.Precise : Precision.Number,
									angle: randInt(0, 6) as ColumnHint["angle"],
									hint: HintLevel.None,
									x,
									y,
								}
							else if (t < 0.8)
								return {
									type: HexType.Empty,
									precision: pickEl([Precision.None, Precision.Number, Precision.Precise]),
									hidden,
									hint: HintLevel.None,
									x,
									y,
								}
							else return null
						}),
				),
		}
	level.hexes.flat().forEach(h => {
		if (!h) return
		let toCheck
		switch (h.type) {
			case HexType.ColumnHint:
				toCheck = inColumn(h.x, h.y, h.angle, level)
				break
			case HexType.Empty:
				toCheck = immediateNeighbours(h.x, h.y, level)
				break
			case HexType.Full:
				toCheck = distantNeighbours(h.x, h.y, level)
				break
		}
		if (toCheck.every(isColumnHintOrUncovered)) h.hint = HintLevel.Hidden
	})

	return level
}

export function parse(string: string): Level {
	if (!string.startsWith("WebcellsV1")) throw new Error("Unsupported level format")
	const [version, title, author, flavor, widthStr, heightStr, hexStr] = string.split(":")
	if (!title) throw new Error("Missing title")
	if (!widthStr || isNaN(parseInt(widthStr))) throw new Error("Missing or invalid width")
	if (!heightStr || isNaN(parseInt(heightStr))) throw new Error("Missing or invalid height")
	if (!hexStr) throw new Error("Missing level data")

	const width = parseInt(widthStr),
		height = parseInt(heightStr),
		hexes: (Hex | null)[][] = Array(width)
			.fill(0)
			.map(_ => []),
		precisions: { [char: string]: Precision } = {
			x: Precision.None,
			n: Precision.Number,
			p: Precision.Precise,
		},
		angles: { [char: string]: ColumnHint["angle"] } = {
			"|": 0,
			"\\": 5,
			"/": 1,
		}

	for (let i = 0; i < hexStr.length; i += 2) {
		const char1 = hexStr[i],
			char2 = hexStr[i + 1],
			x = (i / 2) % width,
			y = Math.floor(i / 2 / width)
		let hex: Hex | null

		switch (char1.toLowerCase()) {
			case "x":
				hex = null
				break
			case "e":
				hex = {
					type: HexType.Empty,
					hidden: char1 == "e",
					hint: HintLevel.None,
					precision: precisions[char2] ?? Precision.Number,
					x,
					y,
				}
				break
			case "f":
				hex = {
					type: HexType.Full,
					hidden: char1 == "f",
					hint: HintLevel.None,
					precision: (precisions[char2] as any) ?? Precision.Number,
					x,
					y,
				}
				break
			case "|":
			case "/":
			case "\\":
				hex = {
					type: HexType.ColumnHint,
					angle: angles[char1] ?? 0,
					hint: HintLevel.None,
					precision: (precisions[char2] as any) ?? Precision.Number,
					x,
					y,
				}
				break
			default:
				throw new Error(`Unknown character "${char1}" at position ${i}`)
		}
		hexes[x][y] = hex
	}

	return {
		title,
		author,
		flavor,
		width,
		height,
		hexes,
	}
}
