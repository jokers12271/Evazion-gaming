import { createPortal } from 'react-dom'
import { X, Clock, MapPin } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { usePresenceHistory, formatDuration } from '@/hooks/usePresenceHistory'

interface PresenceHistoryModalProps {
  userId: string
  displayName: string
  onClose: () => void
}

export function PresenceHistoryModal({ userId, displayName, onClose }: PresenceHistoryModalProps) {
  const { entries, visits, totalSeconds, isLoading } = usePresenceHistory(userId)

  return createPortal(
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-3 md:p-4 animate-fade-in text-white font-display">
      <CyberCard
        accentColor="#06b6d4"
        hoverEffect={false}
        className="p-4 md:p-8 max-w-lg w-full max-h-[80vh] flex flex-col"
        topRight={
          <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 text-white/40 hover:text-white transition-colors">
            <X size={17} className="md:hidden" />
            <X size={20} className="hidden md:block" />
          </button>
        }
      >
        <h3 className="text-sm md:text-xl font-black uppercase mb-1 pr-6">Historique : {displayName}</h3>
        <div className="flex gap-2 md:gap-4 text-[9px] md:text-[10px] font-bold uppercase text-white/40 mb-3 md:mb-6">
          <span>{visits} visite{visits > 1 ? 's' : ''}</span>
          <span>•</span>
          <span>{formatDuration(totalSeconds)} cumulés</span>
        </div>

        <div className="flex-1 overflow-y-auto pr-1 md:pr-2 custom-scrollbar space-y-1.5 md:space-y-2">
          {isLoading ? (
            <p className="text-center py-5 md:py-8 text-white/30">Chargement...</p>
          ) : entries.length === 0 ? (
            <p className="text-center py-5 md:py-8 text-white/30">Aucun historique.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between p-2 md:p-3 bg-white/5 rounded-lg border border-white/5 text-[9px] md:text-[10px]">
                <div className="flex items-center gap-2 md:gap-3">
                  <MapPin size={12} className={entry.event === 'entree' ? 'text-green-400' : 'text-orange-400'} />
                  <span className="font-bold uppercase">{entry.event}</span>
                </div>
                <span className="font-mono opacity-60">
                  {new Date(entry.created_at).toLocaleString('fr-FR')}
                </span>
              </div>
            ))
          )}
        </div>
      </CyberCard>
    </div>,
    document.body
  )
}
