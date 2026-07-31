/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        void: "#0A0A0C",
        obsidian: "#111114",
        graphite: {
          DEFAULT: "#1B1C20",
          light: "#232428",
          border: "#2E3036",
        },
        gold: {
          DEFAULT: "#D4AF37",
          bright: "#F0C862",
          dim: "#8A712A",
        },
        pearl: "#EDEDEA",
        mist: "#9A9BA2",
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        gold: "0 0 24px rgba(212,175,55,0.35)",
        glass: "0 8px 32px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        "gold-gradient": "linear-gradient(135deg, #F0C862 0%, #D4AF37 50%, #8A712A 100%)",
        "radial-glow": "radial-gradient(circle at center, rgba(212,175,55,0.18), transparent 70%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
