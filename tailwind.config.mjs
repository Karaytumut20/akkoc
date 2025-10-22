// karaytumut20/akkoc/akkoc-5d22abddfbdb608ed63a7118f16d75c890f4721a/tailwind.config.mjs

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      gridTemplateColumns:{
        'auto': 'repeat(auto-fit, minmax(200px, 1fr))'
      },
      // ⭐ EKLEME BAŞLANGICI: ANIMATION VE KEYFRAMES ⭐
      keyframes: {
        // Tailwind'in ping animasyonunu biraz özelleştirdik
        ping: { 
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },
      animation: {
        // Ping animasyonunun süresini ve tekrarını tanımlar
        ping: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
      // ⭐ EKLEME BİTİŞİ ⭐
    },
  },
  plugins: [],
};