import type { RequestHandler } from "@sveltejs/kit"
import snoowrap from "snoowrap"
import { config } from "dotenv"
import cheerio from "cheerio"

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

export type Puzzle = {
	id: string
	title: string
	data: string
	user: string
}

const get: RequestHandler = async function get(req) {
	const puzzles: Puzzle[] = []
	let listing = await r.getSubreddit("hexcellslevels").getNew({ count: 100 })

	while (!listing.isFinished) {
		listing = await listing.fetchMore({ amount: 100, append: true })
	}
	for (const { id, title, selftext_html, author } of listing) {
		if (!title.toLowerCase().startsWith("[level]")) continue
		const $ = cheerio.load(selftext_html ?? ""),
			data = $("pre > code").text()
		if (!data) continue
		puzzles.push({
			id,
			title,
			user: author.name,
			data: data
				.split("\n")
				.slice(0, 38)
				.map(l => l.trim())
				.join("\n"),
		})
	}

	return {
		body: puzzles,
	}
}

export { get }
