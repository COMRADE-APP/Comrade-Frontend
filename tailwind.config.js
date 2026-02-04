/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            },
            colors: {
                primary: {
                    50: '#f9f5ff',
                    100: '#f4ebff',
                    200: '#e9d5ff',
                    300: '#d8b4fe',
                    400: '#c084fc',
                    500: '#a855f7',
                    600: '#7f56d9',
                    700: '#6941c6',
                    800: '#5b21b6',
                    900: '#4c1d95',
                },
                // Semantic Theme Colors
                bg: {
                    primary: 'var(--bg-primary)',
                    secondary: 'var(--bg-secondary)',
                    tertiary: 'var(--bg-tertiary)',
                    elevated: 'var(--bg-elevated)',
                },
                text: {
                    primary: 'var(--text-primary)',
                    secondary: 'var(--text-secondary)',
                    tertiary: 'var(--text-tertiary)',
                    inverse: 'var(--text-inverse)',
                },
                border: {
                    DEFAULT: 'var(--border-color)',
                    light: 'var(--border-light)',
                },
                theme: 'var(--border-color)',
            },
        },
    },
    plugins: [],
}
