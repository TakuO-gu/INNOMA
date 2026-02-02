import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",

    // monorepoでpackages配下にもUIがあるなら（今は最小なので任意）
    "../../packages/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // 動的に生成されるクラス（BlockPreviewのブロックタイプ色分け等）
  safelist: [
    // 背景色
    { pattern: /^bg-(blue|purple|green|yellow|orange|amber|red|cyan|pink|lime|indigo|stone|gray|slate|emerald|teal|neutral)-\d{2,3}$/ },
    // テキスト色
    { pattern: /^text-(blue|purple|green|yellow|orange|amber|red|cyan|pink|lime|indigo|stone|gray|slate|emerald|teal|neutral)-\d{2,3}$/ },
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require("@digital-go-jp/tailwind-theme-plugin"),
  ],
} satisfies Config;
