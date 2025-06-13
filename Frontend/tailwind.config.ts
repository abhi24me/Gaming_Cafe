
import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '0.5rem', // Reduced for smaller screens
        sm: '1rem',     
        md: '1.5rem',
        lg: '2rem',     
      },
      screens: {
        "2xl": "1400px",
      },
    },
  	extend: {
      fontFamily: {
        sans: ["var(--font-roboto)", "sans-serif"],
        heading: ["var(--font-orbitron)", "sans-serif"],
      },
  		colors: {
        /* Wello Color Palette */
        background: 'hsl(var(--background))', /* Jet Black #0D0D0D */
        foreground: 'hsl(var(--foreground))', /* Light Gray/White */

        card: {
          DEFAULT: 'hsl(var(--card))', /* Charcoal #1C1C1C */
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))', /* Darker for popovers */
          foreground: 'hsl(var(--popover-foreground))'
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))', /* Electric Blue #007BFF */
          foreground: 'hsl(var(--primary-foreground))' /* White for contrast */
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))', /* Neon Green #39FF14 */
          foreground: 'hsl(var(--secondary-foreground))' /* Dark text for contrast */
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))', /* Deep Purple #6F42C1 */
          foreground: 'hsl(var(--accent-foreground))' /* White/Light text */
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))', /* Standard red */
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))', /* Input background */
        ring: 'hsl(var(--ring))', /* Primary color for rings */

        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
      boxShadow: {
        'glow-primary-sm': '0 0 8px hsl(var(--primary-glow)), 0 0 16px hsl(var(--primary-glow))',
        'glow-primary-md': '0 0 12px hsl(var(--primary-glow)), 0 0 24px hsl(var(--primary-glow))',
        'glow-accent-sm': '0 0 8px hsl(var(--accent-glow)), 0 0 16px hsl(var(--accent-glow))',
        'glow-accent-md': '0 0 12px hsl(var(--accent-glow)), 0 0 24px hsl(var(--accent-glow))',
        'border-glow-accent': '0 0 10px -2px hsl(var(--accent-glow)), 0 0 3px hsl(var(--accent-glow)) inset',
        'border-glow-primary': '0 0 10px -2px hsl(var(--primary-glow)), 0 0 3px hsl(var(--primary-glow)) inset',
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
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
