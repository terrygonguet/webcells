import { showColumnHints } from "$lib/stores"
import { clamp, last, pickEl, randInt } from "$lib/utils"
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
	mistakes: number
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
			mistakes: 0,
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
		hexes: (Hex | null)[][] = [],
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
		raw = rawLines
	// extract the two indidual layers
	let layer1: string[] = []
	for (let i = 0; i < raw.length; i += 2) {
		let line = "",
			offset = 0
		for (let j = 0; j < raw[i].length; j += 2) {
			line += raw[i + offset]?.slice(j, j + 2) ?? ".."
			offset = (offset + 1) % 2
		}
		layer1.push(line)
	}
	let layer2: string[] = []
	for (let i = 0; i < raw.length; i += 2) {
		let line = "..",
			offset = 0
		for (let j = 2; j < raw[i].length; j += 2) {
			line += raw[i + offset]?.slice(j, j + 2) ?? ".."
			offset = (offset + 1) % 2
		}
		layer2.push(line)
	}
	// superpose the 2 layers
	for (let i = 0; i < layer1.length; i++) {
		let line = "",
			offset = 0
		const l1 = layer1[i]
		for (let j = 0; j < l1.length; j += 2) {
			const l2 = layer2[i + offset],
				pair1 = l1?.slice(j, j + 2) ?? "..",
				pair2 = l2?.slice(j, j + 2) ?? ".."
			line += pair1 == ".." ? pair2 : pair1
			offset = (offset + 1) % 2
		}
		lines.push(line)
	}

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
			if (!hexes[x]) hexes[x] = []
			hexes[x][y] = hex
		}
	}
	// remove useless rows
	while (hexes[0].every(c => !c) && hexes[1].every(c => !c)) hexes.splice(0, 2)
	while (last(hexes).every(c => !c) && last(hexes, -2).every(c => !c)) hexes.splice(-2, 2)
	// remove useless columns
	while (hexes.every(col => !col[0] && !col[1])) hexes.forEach(col => col.splice(0, 2))
	while (hexes.every(col => !last(col) && !last(col, -2))) hexes.forEach(col => col.splice(-2, 2))
	// remap x & y
	for (let x = 0; x < hexes.length; x++) {
		for (let y = 0; y < hexes.length; y++) {
			const hex = hexes[x][y]
			if (!hex) continue
			hex.x = x
			hex.y = y
		}
	}

	return {
		title,
		author,
		flavor: (flavor1 + "\n" + flavor2).trim(),
		width: hexes.length,
		height: hexes[0].length,
		hexes,
		mistakes: 0,
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
		mistakes: 0,
	}
}
