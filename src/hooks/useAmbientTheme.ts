import { useEffect, useState } from 'react'

export type AmbientTheme = 'cyan' | 'violet' | 'gold' | 'matrix'

export const THEMES: Record<AmbientTheme, { name: string; icon: string; primary: string; secondary: string; ring: string }> = {
  cyan: { name: 'Evazion Cyan', icon: '⚡', primary: '270 90% 60%', secondary: '180 100% 50%', ring: '180 100% 50%' },
  violet: { name: 'Sanctuary Violet', icon: '🔮', primary: '270 90% 60%', secondary: '290 100% 60%', ring: '290 100% 60%' },
  gold: { name: 'Ragnarök Gold', icon: '👑', primary: '45 100% 50%', secondary: '35 100% 55%', ring: '45 100% 50%' },
  matrix: { name: 'Brazza Matrix', icon: '🌴', primary: '140 100% 45%', secondary: '150 100% 50%', ring: '140 100% 45%' },
}

export function useAmbientTheme() {
  const [theme, setTheme] = useState<AmbientTheme>(() => {
    return (localStorage.getItem('evazion_ambient_theme') as AmbientTheme) || 'cyan'
  })

  useEffect(() => {
    localStorage.setItem('evazion_ambient_theme', theme)
    const root = document.documentElement
    const t = THEMES[theme]
    if (t) {
      root.style.setProperty('--primary', t.primary)
      root.style.setProperty('--secondary', t.secondary)
      root.style.setProperty('--ring', t.ring)
      root.setAttribute('data-ambient-theme', theme)
    }
  }, [theme])

  return { theme, setTheme }
}
