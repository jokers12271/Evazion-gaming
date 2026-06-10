import { TeamConfig } from '@/hooks/useTeamMembership'
import { NeonButton } from '@/components/ui/NeonButton'
import { Users, X } from 'lucide-react'
import { useLoyalty } from '@/hooks/useLoyalty'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'

interface Props {
  teamId: string
  config: TeamConfig
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function TeamMembershipModal({ teamId, config, onClose, onConfirm, isPending }: Props) {
  const { data: loyalty } = useLoyalty()
  const userRank = getRank(loyalty?.total_hours || 0)

  // Calcul de la cotisation mensuelle réduite selon le Rang
  let finalMonthlyFee = config.monthly_fee
  let discountLabel = ''

  if (userRank.name === 'Légende') {
    finalMonthlyFee = Math.round(config.monthly_fee * 0.75)
    discountLabel = '🏆 Remise de cotisation -25% Rang Légende appliquée'
  } else if (userRank.name === 'Iconique' || userRank.name === 'Divin') {
    finalMonthlyFee = Math.round(config.monthly_fee * 0.50)
    discountLabel = '🏆 Remise de cotisation -50% Rang Iconique/Divin appliquée'
  }

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

        {discountLabel && (
          <div className="bg-secondary/10 border border-secondary/20 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-secondary tracking-wider mb-4 animate-pulse">
            {discountLabel}
          </div>
        )}

        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 mb-8 text-left text-xs font-bold uppercase tracking-tighter">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Frais d'intégration (Unique)</span>
            <span className="text-white">{config.join_fee} FCFA</span>
          </div>
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Cotisation Mensuelle</span>
            <span className="text-white">{finalMonthlyFee} FCFA / mois</span>
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
            className="w-full py-4 text-xs font-black shadow-neon-cyan"
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