import type { Config } from 'tailwindcss'

const {
	default: flattenColorPalette,
} = require('tailwindcss/lib/util/flattenColorPalette')

const config = {
	darkMode: ['class'],
	content: [
		'./pages/**/*.{ts,tsx}',
		'./components/**/*.{ts,tsx}',
		'./app/**/*.{ts,tsx}',
		'./src/**/*.{ts,tsx}',
		'./components/toasts/**/*.{ts,tsx}'
	],
	prefix: '',
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		fontFamily: {
			sans: [
				'Basier Circle',
				'system-ui',
				'sans-serif'
			]
		},
		extend: {
			screens: {
				xs: '375px',
				'2xl': '1400px'
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				gray: {
					'100': 'hsl(var(--background))',
					'200': 'hsl(var(--elevate-01))',
					'300': 'hsl(var(--elevate-02))',
					'400': 'hsl(var(--foreground-disabled))',
					'500': 'hsl(var(--foreground-gray))',
					'600': 'hsl(var(--foreground-subtle))',
					'700': 'hsl(var(--foreground-muted))',
					'800': 'hsl(var(--foreground))',
					DEFAULT: 'hsl(var(--foreground-gray))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary-01))',
					foreground: 'hsl(var(--primary-foreground))',
					gradientStart: 'hsl(var(--primary-gradient-start))',
					gradientEnd: 'hsl(var(--primary-gradient-end))',
					gradientEndHover: 'hsl(var(--primary-gradient-end-hover))',
					gradientEndActive: 'hsl(var(--primary-gradient-end-active))'
				},
				secondary: {
					'100': 'hsl(var(--secondary-03))',
					'300': 'hsl(var(--secondary-02))',
					'500': 'hsl(var(--secondary-01))',
					DEFAULT: 'hsl(var(--secondary-01))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				tertiary: {
                    black: 'hsl(var(--tertiary-black))',
                    navy: 'hsl(var(--tertiary-navy))',
                    blue: 'hsl(var(--tertiary-blue))',
                    green: 'hsl(var(--tertiary-green))',
                    charcoal: 'hsl(var(--tertiary-charcoal))',
                    lightblue: 'hsl(var(--tertiary-lightblue))',
                    lightgreen: 'hsl(var(--tertiary-lightgreen))',
                    yellow: 'hsl(var(--tertiary-yellow))',
                    pink: 'hsl(var(--tertiary-pink))',
                    cream: 'hsl(var(--tertiary-cream))',
                },
				destructive: {
					DEFAULT: 'hsl(var(--destructive-background))',
					foreground: 'hsl(var(--destructive-foreground))',
					border: 'hsl(var(--destructive-border))',
					background: 'hsl(var(--destructive-background))'
				},
				danger: {
					'500': '#FF0000'
				},
				success: {
					'500': '#0EA739',
					DEFAULT: 'hsl(var(--success-background))',
					foreground: 'hsl(var(--success-foreground))'
				},
				warning: {
					'500': '#D19900'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					cream: 'hsl(var(--accent-cream))',
					lightGreen: 'hsl(var(--accent-light-green))',
					lightBlue: 'hsl(var(--accent-light-blue))',
					darkBlue: 'hsl(var(--accent-dark-blue))',
					darkGreen: 'hsl(var(--accent-dark-green))',
					foreground: 'hsl(var(--accent-foreground))',
					navy: 'hsl(var(--accent-navy))',
					everglade: 'hsl(var(--accent-everglade))',
					sky: 'hsl(var(--accent-sky))',
					snoweymint: 'hsl(var(--accent-snoweymint))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))',
					blue: 'hsl(var(--chart-blue))',
					purple: 'hsl(var(--chart-purple))',
					green: 'hsl(var(--chart-green))',
					orange: 'hsl(var(--chart-orange))',
					yellow: 'hsl(var(--chart-yellow))',
					aave: 'hsl(var(--chart-aave))',
					compound: 'hsl(var(--chart-compound))',
					fluidex: 'hsl(var(--chart-fluid))'
				}
			},
			borderRadius: {
				'1': 'var(--radius)',
				'2': 'calc(var(--radius) + 0.125rem)',
				'3': 'calc(var(--radius) + 0.375rem)',
				'4': 'calc(var(--radius) + 0.625rem)',
				'5': 'calc(var(--radius) + 0.875rem)',
				'6': 'calc(var(--radius) + 1.125rem)',
				'7': 'calc(var(--radius) + 1.375rem)',
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				scroll: {
					to: {
						transform: 'translate(calc(-50% - 0.5rem))'
					}
				},
				pulse: {
					'0%, 100%': {
						boxShadow: '0 0 0 0 var(--pulse-color)'
					},
					'50%': {
						boxShadow: '0 0 0 8px var(--pulse-color)'
					}
				},
				shimmer: {
					'0%': {
						transform: 'translateX(-100%) skewX(-20deg)'
					},
					'100%': {
						transform: 'translateX(200%) skewX(-20deg)'
					}
				},
				'spin-slow': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' },
				},
				'spin-reverse-slow': {
					from: { transform: 'rotate(360deg)' },
					to: { transform: 'rotate(0deg)' },
				},
				'bounce-slow': {
					'0%, 100%': {
						transform: 'translateY(0)',
						animationTimingFunction: 'cubic-bezier(0.8, 0, 1, 1)',
					},
					'50%': {
						transform: 'translateY(-8px)',
						animationTimingFunction: 'cubic-bezier(0, 0, 0.2, 1)',
					},
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(-3deg)' },
					'50%': { transform: 'rotate(3deg)' },
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-10px)' },
				},
				'glow': {
					'0%, 100%': { opacity: '0.5' },
					'50%': { opacity: '1' },
				},
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				scroll: 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
				pulse: 'pulse var(--duration) ease-out infinite',
				shimmer: 'shimmer 1.5s infinite',
				'spin-slow': 'spin-slow 20s linear infinite',
				'spin-reverse-slow': 'spin-reverse-slow 25s linear infinite',
				'bounce-slow': 'bounce-slow 3s ease-in-out infinite',
				'wiggle': 'wiggle 4s ease-in-out infinite',
				'float': 'float 6s ease-in-out infinite',
				'glow': 'glow 2s ease-in-out infinite',
			}
		}
	},
	plugins: [require('tailwindcss-animate'), addVariablesForColors],
} satisfies Config

function addVariablesForColors({ addBase, theme }: any) {
	let allColors = flattenColorPalette(theme('colors'))
	let newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	)

	addBase({
		':root': newVars,
	})
}

export default config
