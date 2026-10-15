import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  accent?: 'cyan' | 'orange' | 'violet';
  /** Largeur de la fenêtre : la modale reste jamais plus large que l'écran. */
  size?: 'default' | 'lg' | 'xl' | 'fullscreen';
  children: React.ReactNode;
}

const ACCENTS = {
  cyan: {
    border: 'border-secondary/40',
    glow: 'shadow-neon-cyan',
    text: 'text-secondary',
    ring: 'ring-secondary/20',
  },
  orange: {
    border: 'border-orange-500/40',
    glow: 'shadow-neon-orange',
    text: 'text-orange-400',
    ring: 'ring-orange-500/20',
  },
  violet: {
    border: 'border-primary/40',
    glow: 'shadow-neon-violet',
    text: 'text-primary',
    ring: 'ring-primary/20',
  },
};

// Dimensions de la fenetre. 'default' garde les dimensions historiques.
// Attention : un max-h ne grandit JAMAIS la boite, il ne fait que la plafonner
// — la hauteur reelle suit le contenu. 'fullscreen' impose une hauteur reelle
// (h-full) : la fenetre occupe alors tout l'espace sous le padding de l'overlay.
const SIZES = {
  default: 'max-h-[70vh] sm:max-h-[78vh] sm:max-w-lg',
  md: 'max-h-[80vh] sm:max-h-[85vh] sm:max-w-2xl',
  lg: 'max-h-[80vh] sm:max-h-[85vh] sm:max-w-3xl',
  xl: 'max-h-[82vh] sm:max-h-[88vh] sm:max-w-4xl',
  fullscreen: 'h-full',
} as const;

const FULLSCREEN = 'fullscreen';

export function ModalShell({
  isOpen,
  onClose,
  title,
  accent = 'cyan',
  size = 'default',
  children,
}: ModalShellProps) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const accentCfg = ACCENTS[accent];

  // Animation de fermeture : le timer est stocké dans une ref pour ne jamais être
  // annulé par un re-render intermédiaire (sinon l'overlay resterait dans le DOM).
  useEffect(() => {
    if (isOpen) {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setMounted(true);
      setClosing(false);
      return;
    }

    if (!mounted) return;

    setClosing(true);
    closeTimer.current = setTimeout(() => {
      setMounted(false);
      setClosing(false);
      closeTimer.current = null;
    }, 220);
  }, [isOpen, mounted]);

  // Nettoyage au vrai démontage du composant
  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  // Verrou de scroll + touche Échap
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!mounted) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [mounted, handleKey]);

  if (!mounted) return null;

  const isFullscreen = size === FULLSCREEN;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Backdrop : fade in / out */}
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${
          closing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'
        }`}
      />

      {/* Fenêtre : slide up + scale in / out */}
      <div
        className={`relative w-full ${SIZES[size]} ${
          isFullscreen ? 'flex flex-col overflow-hidden' : 'overflow-y-auto overscroll-contain'
        }
          bg-[#05070c] border ${accentCfg.border} rounded-2xl sm:rounded-2xl
          ${accentCfg.glow}
          ${closing ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
      >
        {/* Barre de fermeture */}
        <div
          className={`${
            isFullscreen ? 'shrink-0' : 'sticky top-0 z-20'
          } flex items-center justify-between gap-2 px-3 py-2 bg-[#05070c] border-b border-white/10`}
        >
          <span className={`font-display font-black uppercase text-[9px] tracking-widest ${accentCfg.text} truncate`}>
            {title}
          </span>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="shrink-0 w-7 h-7 rounded-lg border border-white/15 bg-white/5 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-90 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>

        {/* Contenu : en fullscreen il deroule seul, la fenetre remplit l'ecran */}
        <div
          className={`p-2.5 ${size === 'default' ? 'sm:p-4' : 'sm:p-5'} ${
            isFullscreen ? 'flex-1 min-h-0 overflow-y-auto overscroll-contain' : ''
          }`}
        >
          {children}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}