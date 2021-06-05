const plugin = require("tailwindcss/plugin")

module.exports = {
	mode: "jit",
	purge: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [
		plugin(function buttons({ addUtilities, addComponents, theme }) {
			const active = `var(--btn-bg-active, ${theme("colors.pink.500")})`,
				base = `var(--btn-bg-base, ${theme("colors.pink.600")})`
			addComponents({
				".btn": {
					textAlign: "center",
					padding: ".5rem 1rem",
					fontSize: theme("fontSize.xl"),
					fontWeight: "bold",
					textTransform: "uppercase",
					color: "var(--btn-color, white)",
					cursor: "pointer",
					background: `linear-gradient(to bottom right, ${active}, ${active}, ${base})`,
					backgroundSize: "200% 200%",
					backgroundPosition: "100% 100%",
					transition: "background-position .3s ease-in-out",
					"&:hover": {
						backgroundPosition: "0 0",
					},
				},
			})
		}),
		plugin(function inputs({ addUtilities, theme }) {
			addUtilities({
				".textarea": {
					color: "var(--textarea-color, white)",
					border: `1px solid var(--textarea-border, ${theme("colors.pink.500")})`,
					background: `var(--textarea-bg, ${theme("colors.indigo.500")})`,
					"&::placeholder": {
						color: `var(--textarea-placeholder, ${theme("colors.indigo.200")})`,
					},
				},
			})
		}),
	],
}
