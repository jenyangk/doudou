const { fontFamily } = require('tailwindcss/defaultTheme');

export default {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/**/*.{ts,tsx,mdx}"
	],
	theme: {
		extend: {
			fontFamily: {
        sans: ['var(--font-work-sans)', ...fontFamily.sans],
        rubik: ['var(--font-rubik)', ...fontFamily.sans], // Added Rubik as a secondary/utility
      },
			colors: {
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
      // Adding some retro colors as placeholders based on suggestions
      // These are conceptual and might need actual HSL values in globals.css or direct hex/rgb here
      colors: {
        'retro-background': '#F3EADA', // Creamy background
        'retro-text': '#3A3A3A',       // Dark gray text
        'retro-headline': '#D9534F',   // Muted red/orange for headlines
        'retro-subheadline': '#5A5A5A',// Slightly lighter gray for subheadlines
        'retro-cta': '#FFC107',        // Vibrant yellow for CTA
        'retro-cta-text': '#3A3A3A',   // Dark text on CTA
        'retro-cta-hover': '#E0A800',  // Darker yellow for CTA hover
        'retro-card-bg': '#FFFFFF',    // White or off-white for cards
        'retro-card-title': '#D9534F', // Headline color for card titles
        'retro-card-text': '#3A3A3A',  // Standard text for card content
        // Ensure existing colors are not completely overridden if they are used by shadcn/ui components
        // It's better to define these as new colors rather than overwriting 'background', 'foreground' etc.
        // unless a full theme overhaul is intended.
        // For now, I'm adding them as new distinct colors.
				background: 'hsl(var(--background))', // Keeping original shadcn/ui colors
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			}
		}
	},
	plugins: [require("tailwindcss-animate")]
};
