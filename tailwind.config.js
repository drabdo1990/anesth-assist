import plugin from 'tailwindcss/plugin';
import { colorTokens, themeVars } from './src/theme/palette.ts';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: colorTokens(),
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 15px -3px rgba(6, 182, 212, 0.25)',
        'glow-red': '0 0 20px -3px rgba(239, 68, 68, 0.35)',
        'glow-emerald': '0 0 15px -3px rgba(16, 185, 129, 0.25)',
        'glow-amber': '0 0 15px -3px rgba(245, 158, 11, 0.25)',
      },
    },
  },
  plugins: [
    // Dark is the default (and what an element with data-theme="dark" gets, even inside a light page).
    plugin(({ addBase }) => {
      addBase({
        ':root, [data-theme="dark"]': { 'color-scheme': 'dark', ...themeVars('dark') },
        '[data-theme="light"]': { 'color-scheme': 'light', ...themeVars('light') },
      });
    }),
  ],
};
