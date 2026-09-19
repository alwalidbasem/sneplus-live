// Shared Tailwind theme (loaded BEFORE the Tailwind CDN script on every page).
window.tailwind = window.tailwind || {};
window.tailwind.config = {
  theme: {
    extend: {
      colors: {
        ink:      '#111111',
        surface:  '#18181B',
        surface2: '#232327',
        line:     'rgba(255,255,255,0.09)',
        hype:     '#CE0606',
        hypedark: '#A00505',
        gold:     '#E6E6E6',
        mint:     '#2ED573',
        alert:    '#B00020',
        alertdark:'#8B001A',
        deep:     '#0B0B0F',
        charcoal: '#111111',
        softgrey: '#E6E6E6',
        grey:     '#7A7A7A',
        ink2:     '#0B0B0F',
        text:     '#FFFFFF',
        muted:    '#9C9C9C',
      },
      fontFamily: {
        display: ['Switzer', 'Satoshi', 'Montserrat', 'Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        numeric: ['Inter', 'sans-serif'],
        ar: ['Tajawal', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(206,6,6,0.4), 0 8px 40px -8px rgba(206,6,6,0.45)',
      }
    }
  }
};
