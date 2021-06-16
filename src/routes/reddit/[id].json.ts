import type { RequestHandler } from "@sveltejs/kit"
import snoowrap from "snoowrap"
import { config } from "dotenv"
import cheerio from "cheerio"
import type Snoowrap from "snoowrap"
import type { Puzzle } from "./levels.json"

config()

const {
		REDDIT_UA = "",
		REDDIT_CLIENTID = "",
		REDDIT_SECRET = "",
		REDDIT_USERNAME = "",
		REDDIT_PASSWORD = "",
	} = process.env,
	r = new snoowrap({
		userAgent: REDDIT_UA,
		clientId: REDDIT_CLIENTID,
		clientSecret: REDDIT_SECRET,
		username: REDDIT_USERNAME,
		password: REDDIT_PASSWORD,
	})

const get: RequestHandler = async function get(req) {
	const { id } = req.params,
		{ title, selftext_html, author }: Snoowrap.Submission = await (r as any)
			.getSubmission(id)
			.fetch()
	if (!title.toLowerCase().startsWith("[level]") || !selftext_html)
		return { status: 400, body: { error: true, message: "Not a level" } }
	const $ = cheerio.load(selftext_html),
		data = $("pre > code").text()
	if (!data) return { status: 400, body: { error: true, message: "Not a level" } }
	const puzzle: Puzzle = {
		id,
		title,
		user: author.name,
		data: data
			.split("\n")
			.slice(0, 38)
			.map(l => l.trim())
			.join("\n"),
	}

	return {
		body: puzzle,
	}
}

export { get }
