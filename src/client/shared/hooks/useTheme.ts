import { useState, useEffect } from 'react';

type Theme = 'dark' | 'light' | 'auto';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('myrmex-theme') as Theme) || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
    localStorage.setItem('myrmex-theme', theme);
  }, [theme]);

  const toggle = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return { theme, setTheme, toggle };
}
