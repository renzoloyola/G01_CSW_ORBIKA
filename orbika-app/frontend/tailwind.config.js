/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: "#1E3A2B",
        "forest-deep": "#152A1F",
        moss: "#4B6B4F",
        "moss-light": "#6F8F6C",
        sage: "#C9D6BE",
        "sage-pale": "#E3EADA",
        amber: "#D98C2B",
        "amber-deep": "#B5701C",
        terra: "#C1502E",
        "terra-pale": "#F3DCCF",
        paper: "#F4F1E6",
        "paper-warm": "#EFEADA",
        card: "#FBF9F2",
        ink: "#1C1B15",
        "ink-soft": "#4A4A3E",
      },
      fontFamily: {
        serif: ["Fraunces", "Georgia", "serif"],
        sans: ["Inter", "Calibri", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,21,0.04), 0 6px 16px rgba(28,27,21,0.06)",
      },
    },
  },
  plugins: [],
};
