/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AETHER Dark Theme
        bg: '#0a0a0f',
        surface: '#111118',
        'surface-2': '#1a1a24',
        'surface-3': '#222230',
        border: 'rgba(255,255,255,0.08)',
        'border-2': 'rgba(255,255,255,0.12)',
        
        // Text
        'text-primary': '#ffffff',
        'text-secondary': 'rgba(255,255,255,0.7)',
        'text-muted': 'rgba(255,255,255,0.5)',
        
        // Accent - Cyan
        accent: '#06b6d4',
        'accent-hover': '#22d3ee',
        'accent-subtle': 'rgba(6,182,212,0.15)',
        
        // Status
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        
        // Mechanism Colors
        cyan: '#06b6d4',
        purple: '#a855f7',
        green: '#22c55e',
        orange: '#f97316',
        pink: '#ec4899',
        yellow: '#eab308',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
