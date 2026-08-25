import type { Config } from 'tailwindcss';
import { createPreset } from 'fumadocs-ui/tailwind-plugin';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './content/**/*.{md,mdx}',
    './node_modules/fumadocs-ui/dist/**/*.js',
  ],
  presets: [createPreset()],
  theme: {
    extend: {
      colors: {
        bg: '#f6f1e7',
        surface: '#ffffff',
        'surface-alt': '#fbf7ef',
        border: '#e6dfce',
        ink: '#1c1712',
        accent: {
          DEFAULT: '#c1571f',
          hover: '#a6481a',
          soft: '#f1dfc8',
        },
        success: {
          DEFAULT: '#2e7d5b',
          soft: '#dceee3',
        },
        error: {
          DEFAULT: '#b7402e',
          soft: '#f4e1da',
        },
        pending: {
          DEFAULT: '#a6790e',
          soft: '#f1e7ce',
        },
        code: {
          bg: '#1e1811',
          border: '#33291d',
          text: '#e9dfce',
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['var(--font-instrument-serif)', 'Georgia', 'serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
};

export default config;
