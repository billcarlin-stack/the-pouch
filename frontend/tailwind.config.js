/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                hfc: {
                    brown: "#4D2004", // Primary Brown
                    gold: "#F6B000",  // Gold Blue
                    white: "#FFFFFF",
                    light: "#F4F6F8", // Background Grey
                    slate: "#334155", // Text
                    success: "#10B981",
                    warning: "#F59E0B",
                    danger: "#EF4444",
                },
                gold: {
                    50: "#fffbeb",
                    100: "#fef3c7",
                    200: "#fde68a",
                    300: "#fcd34d",
                    400: "#F6B000",  // HFC Gold
                    500: "#F6B000",  // HFC Gold
                    600: "#d97706",
                    700: "#b45309",
                    800: "#92400e",
                    900: "#78350f",
                },
                "hfc-dark": "#0F0A07",
                "hfc-card": "#1A1411",
                "hfc-brown-deep": "#2a1203",
            },
            fontFamily: {
                sans: ['Work Sans', 'Inter', 'Roboto', 'system-ui', 'sans-serif'],
                space: ['Space Grotesk', 'system-ui', 'sans-serif'],
                work: ['Work Sans', 'sans-serif'],
            },
            backgroundImage: {
                'hero-gradient': 'linear-gradient(135deg, #4D2004 0%, #F6B000 100%)',
            },
            boxShadow: {
                'card': '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                'card-hover': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                'nav': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                'glow-inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
                'gold-glow': '0 0 20px -5px rgba(246, 176, 0, 0.3)',
                'gold-glow-none': '0 0 0px 0px rgba(246, 176, 0, 0)',
            },
            spacing: {
                '18': '4.5rem',
                '22': '5.5rem',
                '72': '18rem',
                '80': '20rem',
                '88': '22rem',
                '96': '24rem',
            },
            borderRadius: {
                'xl': '12px',
                '2xl': '16px',
                '3xl': '24px',
            },
            maxWidth: {
                '8xl': '88rem',
                '9xl': '96rem',
            }
        },
    },
    plugins: [],
}
