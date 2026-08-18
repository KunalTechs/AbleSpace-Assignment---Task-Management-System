'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'light' | 'dark';
type ColorMode = 'amber' | 'blue' | 'pink' | 'rose' | 'emerald' | 'black';

interface ThemeContextType {
  theme: ThemeMode;
  color: ColorMode;
  setTheme: (theme: ThemeMode) => void;
  setColor: (color: ColorMode) => void;
}

const defaultContext: ThemeContextType = {
  theme: 'light',
  color: 'blue',
  setTheme: () => {},
  setColor: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const CustomThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [color, setColorState] = useState<ColorMode>('blue');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = (localStorage.getItem('app-theme') as ThemeMode) || 'light';
    const savedColor = (localStorage.getItem('app-color') as ColorMode) || 'blue';
    setThemeState(savedTheme);
    setColorState(savedColor);
    applyTheme(savedTheme, savedColor);
    setMounted(true);
  }, []);

  const applyTheme = (t: ThemeMode, c: ColorMode) => {
    const root = document.documentElement;
    if (t === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    root.setAttribute('data-color', c);
  };

  const setTheme = (t: ThemeMode) => {
    setThemeState(t);
    localStorage.setItem('app-theme', t);
    applyTheme(t, color);
  };

  const setColor = (c: ColorMode) => {
    setColorState(c);
    localStorage.setItem('app-color', c);
    applyTheme(theme, c);
  };

  return (
    <ThemeContext.Provider value={{ theme, color, setTheme, setColor }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeCustom = () => useContext(ThemeContext);
