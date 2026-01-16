import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // 字体配置 - Modern Professional (Poppins + Open Sans)
      fontFamily: {
        heading: ['var(--font-poppins)', 'sans-serif'],
        body: ['var(--font-open-sans)', 'sans-serif'],
        sans: ['var(--font-open-sans)', 'sans-serif'],
      },
      // 配色方案 - 基于 CSS 变量
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
          dark: '#1D4ED8',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        // 新增 CTA 颜色
        cta: {
          DEFAULT: 'hsl(var(--cta))',
          foreground: 'hsl(var(--cta-foreground))',
        },
        // 语义化颜色
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        info: 'hsl(var(--info))',
        // 主题适配工具色
        glassBg: 'rgb(var(--glass-bg))',
        glassBorder: 'rgb(var(--glass-border))',
        hoverBg: 'rgb(var(--hover-bg))',
        subtleBg: 'rgb(var(--subtle-bg))',
      },
      // 圆角
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      // 动画
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px -5px rgba(59, 130, 246, 0.4)' },
          '50%': { boxShadow: '0 0 30px -5px rgba(59, 130, 246, 0.6)' },
        },
      },
      // 阴影
      boxShadow: {
        'glow-sm': '0 0 15px -3px rgba(59, 130, 246, 0.3)',
        'glow': '0 0 25px -5px rgba(59, 130, 246, 0.4)',
        'glow-lg': '0 0 35px -5px rgba(59, 130, 246, 0.5)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.2)',
      },
      // 背景图案 - 科技感蓝青渐变
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-pattern': 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(16, 185, 129, 0.05) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
