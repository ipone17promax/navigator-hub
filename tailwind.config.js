/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1.5rem",
        "2xl": "2rem",
      },
    },
    extend: {
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        // 主题色：通过 CSS 变量注入，支持三套主题切换
        // 注：同时提供 DEFAULT（生成 text-ink 类）和 default（生成 text-ink-default 类）
        //     兼容两种写法，避免与 @apply 的后缀解析混淆
        bg: {
          base: "var(--bg-base)",
          elevate: "var(--bg-elevate)",
        },
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
        },
        ink: {
          DEFAULT: "var(--ink-default)",
          muted: "var(--ink-muted)",
          subtle: "var(--ink-subtle)",
        },
        stroke: {
          DEFAULT: "var(--stroke-default)",
          hover: "var(--stroke-hover)",
        },
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 60%, transparent) 0%, color-mix(in srgb, var(--brand-secondary) 60%, transparent) 100%)",
      },
      boxShadow: {
        glow: "0 0 40px -8px color-mix(in srgb, var(--brand-primary) 55%, transparent)",
        "glow-lg":
          "0 0 60px -4px color-mix(in srgb, var(--brand-secondary) 45%, transparent)",
        card: "0 10px 40px -12px rgba(0,0,0,0.6)",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.7s cubic-bezier(0.22,1,0.36,1) both",
        "gradient-shift": "gradientShift 14s ease-in-out infinite",
        shimmer: "shimmer 3.2s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        gradientShift: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        shimmer: {
          "0%": { transform: "translateX(-120%) skewX(-20deg)" },
          "100%": { transform: "translateX(220%) skewX(-20deg)" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
    },
  },
  plugins: [
    // 文本渐变工具类
    function ({ addUtilities }) {
      addUtilities({
        ".text-brand-gradient": {
          background:
            "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          WebkitTextFillColor: "transparent",
          color: "transparent",
        },
        ".scrollbar-none": {
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        },
        ".scrollbar-none::-webkit-scrollbar": {
          display: "none",
        },
      });
    },
  ],
};
