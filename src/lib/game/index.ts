export type Level = {}

export function parse(text: string): Level {
	if (text == "test") return "bite"
	else throw new Error("Invalid level string")
}

export function setup(ctx: CanvasRenderingContext2D, level: Level) {}

export function render(delta: number, ctx: CanvasRenderingContext2D, level: Level) {}
