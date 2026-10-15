import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';
import { useNeonTheme, THEMES, NeonThemeId } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';

export function ThemeSelector() {
  const { currentTheme, setTheme, availableThemes } = useNeonTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (th: typeof availableThemes[0]) => {
    setTheme(th.id);
    cyberAudio.playSuccess();
    toast.success(`Ambiance activée : ${th.name} ✨`, {
      id: 'theme-change-toast',
      position: 'bottom-center',
      icon: '🎨'
    });
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
          cyberAudio.playClick();
        }}
        title="Changer l'ambiance lumineuse néon"
        className="px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
      >
        <span
          className="w-2.5 h-2.5 rounded-full border border-white/40 shadow-sm"
          style={{ backgroundColor: currentTheme.primary }}
        />
        <Palette size={12} />
        <span className="hidden md:inline">{currentTheme.name.split(' ')[0]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-white/20 bg-[#07090e]/98 backdrop-blur-3xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-[9999] animate-fade-in font-display">
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-white/10 px-1">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-white/80 block">
                Ambiance Néon Lounge
              </span>
              <span className="text-[8px] font-sans text-white/40">
                L'éclairage du Sanctuary s'adapte en direct
              </span>
            </div>
            <Sparkles size={14} className="text-secondary" />
          </div>

          <div className="space-y-1.5">
            {availableThemes.map((th) => {
              const isActive = th.id === currentTheme.id;
              return (
                <button
                  type="button"
                  key={th.id}
                  onClick={() => handleSelect(th)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer select-none",
                    isActive
                      ? "bg-white/15 border border-white/30 text-white shadow-md"
                      : "hover:bg-white/5 text-white/70 hover:text-white border border-transparent"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span
                        className="w-4 h-4 rounded-md shadow-sm border border-white/20"
                        style={{ backgroundColor: th.primary }}
                      />
                      <span
                        className="w-2.5 h-4 rounded-md opacity-80 border border-white/20"
                        style={{ backgroundColor: th.secondary }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-black tracking-tight text-white flex items-center gap-1.5">
                        {th.name}
                      </div>
                      <div className="text-[9px] font-mono text-white/40">
                        {th.tagline}
                      </div>
                    </div>
                  </div>
                  {isActive ? (
                    <span className="p-1 rounded-full bg-secondary/20 text-secondary">
                      <Check size={13} />
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono text-white/30">Choisir</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Mobile-friendly direct segmented bar for the drawer menu
 */
export function ThemeSelectorMobileStrip() {
  const { currentTheme, setTheme, availableThemes } = useNeonTheme();

  return (
    <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-white/60">
        <span className="flex items-center gap-1.5">
          <Palette size={12} className="text-secondary" /> Ambiance Néon Lounge
        </span>
        <span className="text-secondary font-bold">{currentTheme.name}</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {availableThemes.map((th) => {
          const isActive = th.id === currentTheme.id;
          return (
            <button
              type="button"
              key={th.id}
              onClick={() => {
                setTheme(th.id);
                cyberAudio.playSuccess();
                toast.success(`Ambiance : ${th.name}`, { id: 'theme-mob', position: 'bottom-center' });
              }}
              className={cn(
                "p-2 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-all",
                isActive
                  ? "border-secondary/60 bg-secondary/15 text-white shadow-neon-cyan"
                  : "border-white/10 bg-white/5 text-white/60 hover:text-white"
              )}
            >
              <span
                className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40"
                style={{ backgroundColor: th.primary }}
              />
              <span className="text-[10px] font-bold font-display uppercase tracking-tight truncate">
                {th.name.replace('Evazion ', '').replace('Sanctuary ', '').replace('Brazza ', '')}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
