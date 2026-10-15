import React, { createContext, useContext, useEffect, useState } from 'react';

export type NeonThemeId = 'evazion' | 'sanctuary' | 'ragnarok' | 'brazza';

export interface NeonTheme {
  id: NeonThemeId;
  name: string;
  tagline: string;
  primary: string;       // HEX
  primaryRgb: string;    // R, G, B
  secondary: string;     // HEX
  secondaryRgb: string;  // R, G, B
  accent: string;        // HEX
  accentRgb: string;     // R, G, B
  glowColor: string;
}

export const THEMES: Record<NeonThemeId, NeonTheme> = {
  evazion: {
    id: 'evazion',
    name: 'Evazion Cyan',
    tagline: 'Signature Hub Brazzaville',
    primary: '#06b6d4',      // Cyan 500
    primaryRgb: '6, 182, 212',
    secondary: '#a855f7',    // Purple 500
    secondaryRgb: '168, 85, 247',
    accent: '#f97316',       // Orange 500
    accentRgb: '249, 115, 22',
    glowColor: 'rgba(6, 182, 212, 0.4)'
  },
  sanctuary: {
    id: 'sanctuary',
    name: 'Sanctuary Violet',
    tagline: 'Nuit Cyberpunk & Synthwave',
    primary: '#c084fc',      // Purple 400
    primaryRgb: '192, 132, 252',
    secondary: '#ec4899',    // Pink 500
    secondaryRgb: '236, 72, 153',
    accent: '#38bdf8',       // Sky 400
    accentRgb: '56, 189, 248',
    glowColor: 'rgba(192, 132, 252, 0.45)'
  },
  ragnarok: {
    id: 'ragnarok',
    name: 'Ragnarök Gold',
    tagline: 'Élite & Maîtres de Salle',
    primary: '#eab308',      // Yellow 500
    primaryRgb: '234, 179, 8',
    secondary: '#f97316',    // Orange 500
    secondaryRgb: '249, 115, 22',
    accent: '#ef4444',       // Red 500
    accentRgb: '239, 68, 68',
    glowColor: 'rgba(234, 179, 8, 0.45)'
  },
  brazza: {
    id: 'brazza',
    name: 'Brazza Matrix',
    tagline: 'Vert Émeraude & Énergie',
    primary: '#10b981',      // Emerald 500
    primaryRgb: '16, 185, 129',
    secondary: '#06b6d4',    // Cyan 500
    secondaryRgb: '6, 182, 212',
    accent: '#facc15',       // Amber 400
    accentRgb: '250, 204, 21',
    glowColor: 'rgba(16, 185, 129, 0.45)'
  }
};

interface ThemeContextType {
  currentTheme: NeonTheme;
  setTheme: (id: NeonThemeId) => void;
  availableThemes: NeonTheme[];
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: THEMES.evazion,
  setTheme: () => {},
  availableThemes: Object.values(THEMES)
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<NeonThemeId>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sanctuary_theme') as NeonThemeId;
      if (saved && THEMES[saved]) return saved;
    }
    return 'evazion';
  });

  const currentTheme = THEMES[themeId] || THEMES.evazion;

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--primary', currentTheme.primary);
    root.style.setProperty('--primary-rgb', currentTheme.primaryRgb);
    root.style.setProperty('--secondary', currentTheme.secondary);
    root.style.setProperty('--secondary-rgb', currentTheme.secondaryRgb);
    root.style.setProperty('--accent', currentTheme.accent);
    root.style.setProperty('--accent-rgb', currentTheme.accentRgb);
    root.style.setProperty('--glow-color', currentTheme.glowColor);
    root.setAttribute('data-theme', currentTheme.id);
    if (typeof document !== 'undefined' && document.body) {
      document.body.setAttribute('data-theme', currentTheme.id);
    }

    try {
      localStorage.setItem('sanctuary_theme', currentTheme.id);
    } catch {}
  }, [currentTheme]);

  return React.createElement(
    ThemeContext.Provider,
    {
      value: {
        currentTheme,
        setTheme: (id: NeonThemeId) => setThemeId(id),
        availableThemes: Object.values(THEMES)
      }
    },
    children
  );
}

export function useNeonTheme() {
  return useContext(ThemeContext);
}
