'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ds } from '../design-system.json';

interface ThemeContextType {
  colors: typeof ds.color_palette;
  spacing: typeof ds.spacing;
  typography: typeof ds.typography;
  breakpoints: typeof ds.grid.breakpoints;
}

const ThemeContext = createContext<ThemeContextType | undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkMode ? 'light' : 'dark';
    setIsDarkMode(!isDarkMode);
    localStorage.setItem('theme', newTheme);
  };

  const value: ThemeContextType = {
    colors: ds.color_palette,
    spacing: ds.spacing,
    typography: ds.typography,
    breakpoints: ds.grid.breakpoints,
    isDarkMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
