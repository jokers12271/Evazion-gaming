import { TeamConfig } from '@/hooks/useTeamMembership'
import { NeonButton } from '@/components/ui/NeonButton'
import { Users, X, Landmark } from 'lucide-react'

interface Props {
  teamId: string
  config: TeamConfig
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function TeamMembershipModal({ teamId, config, onClose, onConfirm, isPending }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
      <div className="glass p-10 rounded-[2.5rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none">
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-secondary/30">
          <Users className="text-secondary animate-pulse" size={32} />
        </div>

        <h3 className="text-2xl font-black uppercase mb-2">Adhésion Team - {teamId}</h3>
        <p className="text-[10px] uppercase font-black tracking-widest text-secondary mb-6">Règlement des Frais Requis</p>

        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 mb-8 text-left text-xs font-bold uppercase tracking-tighter">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Frais d'intégration (Liquide)</span>
            <span className="text-white">{config.join_fee} FCFA</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Frais Mensuels</span>
            <span className="text-white">{config.monthly_fee} FCFA / mois</span>
          </div>
          <div className="pt-2 text-center text-[10px] text-white/60 tracking-normal leading-relaxed capitalize-none">
            Pour régler à distance, effectuez un dépôt Mobile Money au : <br />
            <span className="text-secondary font-black text-sm tracking-widest block mt-2" translate="no">
              {config.payment_phone}
            </span>
            (Indiquez votre nom de gamer dans le motif)
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <NeonButton 
            variant="cyan"
            className="w-full py-4 text-xs font-black"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? "TRANSMISSION..." : "SOUMETTRE MA DEMANDE"}
          </NeonButton>
          <button 
            onClick={onClose}
            className="text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors focus:outline-none"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}