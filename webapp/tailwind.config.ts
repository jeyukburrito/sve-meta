import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#171717",
        paper: "#f6f1e8",
        accent: "#0e6d53",
        danger: "#a33a2b",
        line: "#d8cdbf",
      },
    },
  },
  plugins: [],
};

export default config;
