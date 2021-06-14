import { showColumnHints } from "$lib/stores"
import { last, pickEl, randInt } from "$lib/utils"
import { get } from "svelte/store"
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
		colHints = get(showColumnHints),
		level: Level = {
			title: "",
			author: "The Machine",
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
									hint: colHints ? HintLevel.Shown : HintLevel.None,
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
	if (string.startsWith("Webcells level v1")) return parseWebcellsV1(string)
	else if (string.startsWith("Hexcells level v1")) return parseHexcellsV1(string)
	else throw new Error("Unsupported level format")
}

function parseHexcellsV1(string: string): Level {
	const [version, title, author, flavor1, flavor2, ...rawLines] = string.split("\n"),
		hexes: (Hex | null)[][] = Array(33)
			.fill(0)
			.map(_ => []),
		precisions: { [char: string]: Precision } = {
			".": Precision.None,
			"+": Precision.Number,
			c: Precision.Precise,
			n: Precision.Precise,
		},
		angles: { [char: string]: ColumnHint["angle"] } = {
			"|": 0,
			"\\": 5,
			"/": 1,
		},
		colHints = get(showColumnHints)

	let lines: string[] = [],
		layer1: string[] = [],
		layer2: string[] = []
	// consolidate lines
	for (let i = 0; i < rawLines.length; i++) {
		let line = ""
		for (let j = 0; j < 33; j++) {
			line += rawLines[i + (j % 2)]?.slice(j * 2, j * 2 + 2) ?? ".."
		}
		;(i % 2 ? layer2 : layer1).push(line)
	}
	// superpose the 2 layers
	for (let i = 0; i < layer1.length - 1; i++) {
		const l1 = layer1[i],
			l2 = layer2[i]
		let line = ""
		for (let j = 0; j < l1.length; j += 2) {
			const pair1 = l1.slice(j, j + 2),
				pair2 = l2.slice(j, j + 2)
			line += pair1 == ".." ? pair2 : pair1
		}
		lines.push(line)
	}
	// remove useless rows
	while (rawLines[0] == "..................................................................")
		rawLines.splice(0, 1)
	while (last(rawLines) == "..................................................................")
		rawLines.splice(-1, 1)
	if (rawLines.length == 0) throw new Error("Empty level")
	// remove useless columns
	while (lines.every(l => l.startsWith("...."))) lines = lines.map(l => l.slice(4))
	while (lines.every(l => l.endsWith("...."))) lines = lines.map(l => l.slice(0, l.length - 4))

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]
		for (let j = 0; j < line.length; j += 2) {
			const char1 = line[j],
				char2 = line[j + 1],
				x = Math.floor(j / 2),
				y = i
			let hex: Hex | null
			switch (char1.toLowerCase()) {
				case ".":
					hex = null
					break
				case "o":
					hex = {
						type: HexType.Empty,
						hidden: char1 == "o",
						hint: HintLevel.None,
						precision: precisions[char2] ?? Precision.Number,
						x,
						y,
					}
					break
				case "x":
					hex = {
						type: HexType.Full,
						hidden: char1 == "x",
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
						hint: colHints ? HintLevel.Shown : HintLevel.None,
						precision: (precisions[char2] as any) ?? Precision.Number,
						x,
						y,
					}
					break
				default:
					throw new Error(`Unknown character "${char1}" at position ${x},${i}`)
			}
			hexes[x][y] = hex
		}
	}

	return {
		title,
		author,
		flavor: flavor1 + "\n" + flavor2,
		width: Math.ceil(lines[0].length / 2),
		height: lines.length,
		hexes,
	}
}

function parseWebcellsV1(string: string): Level {
	const [version, title, author, flavor, widthStr, heightStr, hexStr] = string.split(":")

	if (!title) throw new Error("Missing title")
	if (!widthStr || isNaN(parseInt(widthStr))) throw new Error("Missing or invalid width")
	if (!heightStr || isNaN(parseInt(heightStr))) throw new Error("Missing or invalid height")
	if (!hexStr) throw new Error("Missing level data")

	const colHints = get(showColumnHints),
		width = parseInt(widthStr),
		height = parseInt(heightStr)

	if (hexStr.length != width * height * 2)
		throw new Error("Invalid level data: too many or too few hexes")

	const hexes: (Hex | null)[][] = Array(width)
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
					hint: colHints ? HintLevel.Shown : HintLevel.None,
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
