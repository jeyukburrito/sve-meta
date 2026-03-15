import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        paper: "var(--color-paper)",
        surface: "var(--color-surface)",
        accent: "var(--color-accent)",
        danger: "var(--color-danger)",
        success: "var(--color-success)",
        line: "var(--color-line)",
        muted: "var(--color-muted)",
      },
    },
  },
  plugins: [],
};

export default config;
