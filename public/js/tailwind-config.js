// Shared Tailwind theme (loaded BEFORE the Tailwind CDN script on every page).
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink:      '#111114',
        surface:  '#19191D',
        surface2: '#212127',
        line:     'rgba(255,255,255,0.09)',
        hype:     '#FF2D6B',
        hypedark: '#C71F52',
        gold:     '#FFC53D',
        mint:     '#2ED573',
        ink2:     '#0C0C0E',
        text:     '#F2F1ED',
        muted:    '#9A98A2',
      },
      fontFamily: {
        display: ['"Archivo Black"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        ar: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,45,107,0.4), 0 8px 40px -8px rgba(255,45,107,0.45)',
      }
    }
  }
};
