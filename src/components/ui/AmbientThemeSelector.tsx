import React, { useState, useRef, useEffect } from 'react'
import { Palette, Zap, Sparkles, Crown } from 'lucide-react'
import { useAmbientTheme } from '@/hooks/useAmbientTheme'
import { cn } from '@blinkdotnew/ui'

export function AmbientThemeSelector() {
  const { theme, setTheme } = useAmbientTheme()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const themes = [
    { id: 'cyan', label: 'Evazion Cyan', icon: <Zap size={14} className="text-cyan-400" />, color: '#06b6d4' },
    { id: 'violet', label: 'Sanctuary Violet', icon: <Sparkles size={14} className="text-purple-400" />, color: '#a855f7' },
    { id: 'gold', label: 'Ragnarök Gold', icon: <Crown size={14} className="text-amber-400" />, color: '#f59e0b' },
    { id: 'matrix', label: 'Brazza Matrix', icon: <Zap size={14} className="text-emerald-400" />, color: '#22c55e' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-secondary/50 text-white/70 hover:text-white transition-all flex items-center justify-center shadow-lg"
        title="Changer l'ambiance lumineuse"
      >
        <Palette size={18} className="text-secondary" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-56 rounded-2xl bg-[#070810]/95 border border-white/10 backdrop-blur-2xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-2 z-50 animate-fade-in text-left">
          <div className="px-3 py-2 border-b border-white/5 mb-1">
            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-white/40">
              Ambiance Cyber
            </span>
          </div>
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => {
                setTheme(t.id as any)
                setIsOpen(false)
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                theme === t.id
                  ? "bg-white/10 text-white border border-white/15 shadow-md"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <span className="w-2.5 h-2.5 rounded-full shadow-lg" style={{ backgroundColor: t.color }} />
              <span className="flex-1">{t.label}</span>
              {theme === t.id && <span className="text-[10px] text-secondary font-mono">ACTIF</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
