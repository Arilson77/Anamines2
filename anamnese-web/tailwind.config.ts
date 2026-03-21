import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        sage: {
          50:  '#f3f7f4',
          100: '#e8f0eb',
          200: '#c8dccf',
          400: '#7c9a8a',
          600: '#4a7a5e',
          800: '#2d5940',
        },
        terra: {
          100: '#f5ebe5',
          400: '#c07060',
          600: '#8b4a35',
        },
        gold: {
          100: '#f5eddc',
          400: '#c4963a',
          600: '#8a6830',
        },
      },
    },
  },
  plugins: [],
};

export default config;
