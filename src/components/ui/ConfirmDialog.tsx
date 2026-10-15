import { createPortal } from 'react-dom'
import { useEffect, useRef } from 'react'
import { TriangleAlert, X } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { NeonButton } from '@/components/ui/NeonButton'

export interface ConfirmOptions {
  title: string
  /** Nom de l'element concerne, affiche en dessous du titre. */
  subject?: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  isPending?: boolean
  onConfirm: () => void
}

/**
 * Boite de confirmation de suppression, dans le style des autres modales du
 * projet (CyberCard + NeonButton en portal).
 *
 * Elle remplace les `window.confirm()` : ces derniers bloquent le thread,
 * s'affichent hors theme et ne permettent pas d'indiquer quel element est
 * reellement supprime.
 */
export function ConfirmDialog({
  title,
  subject,
  message,
  confirmLabel = 'SUPPRIMER',
  cancelLabel = 'ANNULER',
  isPending = false,
  onConfirm,
  onClose,
}: ConfirmOptions & { onClose: () => void }) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  // Echap annule, Entree valide, et le focus part sur l'action principale.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') onConfirm()
    }
    window.addEventListener('keydown', onKey)
    confirmRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onConfirm])

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
      <CyberCard
        accentColor="#ef4444"
        hoverEffect={false}
        className="p-10 max-w-md w-full"
        topRight={
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        }
      >
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
          <TriangleAlert className="text-red-400" size={32} />
        </div>

        <h3 className="text-2xl font-black uppercase mb-2">{title}</h3>
        {subject && (
          <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-6 break-words">
            {subject}
          </p>
        )}

        <p className="text-[11px] text-white/60 tracking-normal leading-relaxed mb-8">
          {message ?? 'Cette action est definitive et ne peut pas etre annulee.'}
        </p>

        <div className="flex flex-col gap-4">
          <NeonButton
            ref={confirmRef}
            variant="danger"
            className="w-full py-4 text-xs font-black"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? 'SUPPRESSION...' : confirmLabel}
          </NeonButton>
          <button
            onClick={onClose}
            disabled={isPending}
            className="text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors focus:outline-none disabled:opacity-30"
          >
            {cancelLabel}
          </button>
        </div>
      </CyberCard>
    </div>,
    document.body
  )
}
