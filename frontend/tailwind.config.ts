import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // デザインシステムのカラーパレット
        primary: {
          DEFAULT: '#f85532', // コーラルピンク
          50: '#fef7f3',
          100: '#feede5',
          200: '#fdd8cc',
          300: '#fbbb9f',
          400: '#f89071',
          500: '#f85532',
          600: '#e43820',
          700: '#c02917',
          800: '#9e2318',
          900: '#7f2118',
        },
        secondary: {
          DEFAULT: '#7fb069', // ナチュラルグリーン
          50: '#f3f8f1',
          100: '#e3efdd',
          200: '#c9e0be',
          300: '#a8cc95',
          400: '#89b670',
          500: '#7fb069',
          600: '#5d8a46',
          700: '#4a6d39',
          800: '#3e5730',
          900: '#34492a',
        },
        accent: {
          DEFAULT: '#2f5f7f', // くすみブルー
          50: '#f1f6fa',
          100: '#e1ecf4',
          200: '#c7dded',
          300: '#a3c7e1',
          400: '#79aad1',
          500: '#5890c4',
          600: '#4877b4',
          700: '#3f62a4',
          800: '#2f5f7f',
          900: '#324b69',
        },
        // 栄養素カテゴリー
        nutrition: {
          carbs: '#d4a574',      // 炭水化物
          protein: '#e8a598',    // タンパク質
          vitamin: '#7fb069',    // ビタミン・ミネラル
          dairy: '#a293ba',      // 乳製品
          fruit: '#e6a3b3',      // 果物
        },
        // アレルギー対応
        allergy: {
          safe: '#10b981',       // 安全
          caution: '#f59e0b',    // 注意
          danger: '#ef4444',     // 危険
          unknown: '#6b7280',    // 不明
        },
        // システムカラー
        background: '#faf8f5', // 温かいナチュラルホワイト
        surface: '#ffffff',
        text: {
          primary: '#1a1a1a',
          secondary: '#4a4a4a',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Hiragino Sans',
          'Hiragino Kaku Gothic ProN',
          'Yu Gothic Medium',
          'Meiryo',
          'Apple Color Emoji',
          'Segoe UI Emoji',
          'Noto Color Emoji',
          'sans-serif'
        ],
      },
      fontSize: {
        'xs': ['12px', { lineHeight: '1.4' }],
        'sm': ['14px', { lineHeight: '1.5' }],
        'base': ['16px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.5' }],
        'xl': ['20px', { lineHeight: '1.4' }],
        '2xl': ['24px', { lineHeight: '1.3' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
      },
      spacing: {
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      padding: {
        'safe': 'env(safe-area-inset-bottom)', // Safe-Area対応
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'medium': '0 2px 12px rgba(0, 0, 0, 0.12)',
        'strong': '0 4px 20px rgba(0, 0, 0, 0.16)',
        'primary': '0 2px 8px rgba(248, 85, 50, 0.3)',
        'secondary': '0 2px 8px rgba(127, 176, 105, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      screens: {
        'xs': '375px',  // iPhone SE
        'sm': '428px',  // iPhone 14 Pro Max
        'md': '768px',  // iPad
        'lg': '1024px', // iPad Pro
        'xl': '1280px', // Desktop
        '2xl': '1536px', // Large Desktop
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class', // ダークモード対応
}

export default config