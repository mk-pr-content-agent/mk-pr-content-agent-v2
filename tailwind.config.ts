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
        primary: { DEFAULT: "#1E3A5F", hover: "#16304F", subtle: "#E8EEF5" },
        secondary: { DEFAULT: "#0E7C7B", subtle: "#E3F3F2" },
        ink: { DEFAULT: "#1A1D21", muted: "#5F6670" },
        surface: { DEFAULT: "#FFFFFF", subtle: "#F6F7F9" },
        line: "#D9DCE1",
        reject: { DEFAULT: "#B42318", bg: "#FDECEA" },
        hold: { DEFAULT: "#B54708", bg: "#FEF3E2" },
        pass: { DEFAULT: "#16794C", bg: "#E7F5EE" },
        info: { DEFAULT: "#1E5FA8", bg: "#E8F0FA" },
      },
      borderRadius: { md: "8px", lg: "12px" },
      borderWidth: { hairline: "0.5px" },
      boxShadow: { none: "none" },
      fontFamily: {
        sans: [
          "Pretendard Variable",
          "Apple SD Gothic Neo",
          "Malgun Gothic",
          "system-ui",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
