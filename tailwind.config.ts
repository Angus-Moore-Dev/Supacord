import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: '#1a1a1a',
                'supabase-green': 'var(--supabase-green)',
                green: '#51cf66',
                'darker-green': '#37b24d',
                'darkest-green': '#2b8a3e'
            },
        },
    },
    plugins: [],
};
export default config;
