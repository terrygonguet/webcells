const plugin = require("tailwindcss/plugin")

module.exports = {
	mode: "jit",
	purge: ["./src/**/*.{html,js,svelte,ts}"],
	theme: {
		extend: {},
	},
	plugins: [
		plugin(function buttons({ addUtilities, addComponents, theme }) {
			const color1 = `var(--btn-bg-color-1, ${theme("colors.blue.500")})`,
				color2 = `var(--btn-bg-color-2, ${theme("colors.purple.700")})`,
				color3 = `var(--btn-bg-color-3, ${theme("colors.yellow.500")})`,
				color4 = `var(--btn-bg-color-4, ${theme("colors.yellow.600")})`
			addComponents({
				".btn": {
					textAlign: "center",
					padding: ".5rem 1rem",
					fontSize: theme("fontSize.xl"),
					fontWeight: "bold",
					textTransform: "uppercase",
					color: "var(--btn-color, white)",
					cursor: "pointer",
					background: `linear-gradient(to bottom right, ${color1}, ${color2}, ${color3}, ${color4})`,
					backgroundSize: "300% 300%",
					backgroundPosition: "0 0",
					transition: "background-position .3s ease-in-out",
					"&:hover": {
						backgroundPosition: "100% 100%",
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
