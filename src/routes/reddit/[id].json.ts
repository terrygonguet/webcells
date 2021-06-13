import type { RequestHandler } from "@sveltejs/kit"
import snoowrap from "snoowrap"
import { config } from "dotenv"
import cheerio from "cheerio"
import type Snoowrap from "snoowrap"

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

type Puzzle = {
	id: string
	title: string
	data: string
}

const get: RequestHandler = async function get(req) {
	const { id } = req.params,
		{ title, selftext_html }: Snoowrap.Submission = await (r as any).getSubmission(id).fetch()
	if (!title.toLowerCase().startsWith("[level]") || !selftext_html)
		return { status: 400, body: { error: true, message: "Not a level" } }
	const $ = cheerio.load(selftext_html),
		data = $("pre > code").text().trim()
	if (!data) return { status: 400, body: { error: true, message: "Not a level" } }
	const puzzle: Puzzle = {
		title,
		data,
		id,
	}

	return {
		body: puzzle,
	}
}

export { get }
