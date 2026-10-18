/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        laba: {
          primary: '#16A34A',     // 永續主綠
          tech: '#0EA5A4',        // 科技湖水藍
          data: '#3B82F6',        // 專業數據藍
          nature: '#65A30D',      // 自然草綠
          surface: '#F8FAFC',     // 頁面背景
          text: '#1F2937',        // 主要文字
        }
      },
      screens: {
        'xs': '480px',            // 針對小螢幕手機特別優化
      }
    },
  },
  plugins: [],
}
