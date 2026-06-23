import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Extracted from Labread logo
        brand: {
          50:  "#FAF6EC",  // near-white warm cream
          100: "#F0DFB3",  // logo background / warm sand
          200: "#DEBB7A",  // golden wheat
          300: "#C49A45",  // warm gold
          400: "#A07030",  // medium brown
          500: "#7B4A1E",  // warm brown
          600: "#5C3310",  // deep brown
          700: "#3D2200",  // logo text / dark chocolate (primary CTA)
          800: "#2C1800",  // darkest brown (sidebar bg)
          900: "#1A0E00",  // near-black brown
        },
      },
      fontFamily: {
        sans:    ["Inter", "system-ui", "sans-serif"],
        display: ["var(--font-playfair)", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(61 34 0 / 0.08), 0 1px 2px -1px rgb(61 34 0 / 0.06)",
        "card-md": "0 4px 12px 0 rgb(61 34 0 / 0.10)",
      },
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};

export default config;
