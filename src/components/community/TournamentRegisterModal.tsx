import { Tournament } from '@/hooks/useTournaments'
import { NeonButton } from '@/components/ui/NeonButton'
import { Trophy, X } from 'lucide-react'
import { useLoyalty } from '@/hooks/useLoyalty'
import { getRank } from '@/lib/ranks'

interface Props {
  tourney: Tournament
  onClose: () => void
  onConfirm: () => void
  isPending: boolean
}

export function TournamentRegisterModal({ tourney, onClose, onConfirm, isPending }: Props) {
  const { data: loyalty } = useLoyalty()
  const userRank = getRank(loyalty?.total_hours || 0)

  const isPaid = (tourney as any).is_paid;
  const baseFee = (tourney as any).fee_amount || 0;

  // Calcul du tarif réduit automatisé selon le Rang
  let finalFee = baseFee
  let discountLabel = ''

  if (userRank.name === 'Pro' || userRank.name === 'Elite') {
    finalFee = Math.round(baseFee * 0.75)
    discountLabel = '🎟️ -25% de réduction Rang Pro/Elite appliquée'
  } else if (userRank.name === 'Légende') {
    finalFee = Math.round(baseFee * 0.50)
    discountLabel = '🎟️ -50% de réduction Rang Légende appliquée'
  } else if (userRank.name === 'Iconique' || userRank.name === 'Divin') {
    finalFee = 0
    discountLabel = '🎟️ Inscription GRATUITE Rang Iconique/Divin appliquée'
  }

  const isReallyPaid = isPaid && finalFee > 0;
  const phone = (tourney as any).payment_phone || '+242 05 795 72 48';

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
      <div className="glass p-10 rounded-[2.5rem] border-2 border-primary shadow-neon-violet max-w-md w-full relative">
        <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none">
          <X size={20} />
        </button>

        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/30">
          <Trophy className="text-primary animate-pulse" size={32} />
        </div>

        <h3 className="text-2xl font-black uppercase mb-2">Inscription au Tournoi</h3>
        <p className="text-[10px] text-primary font-black uppercase tracking-widest mb-6">{tourney.title}</p>

        {discountLabel && (
          <div className="bg-primary/10 border border-primary/20 px-3 py-2 rounded-xl text-[9px] font-black uppercase text-primary tracking-wider mb-4 animate-pulse">
            {discountLabel}
          </div>
        )}

        <div className="bg-white/5 border border-white/5 rounded-2xl p-5 space-y-4 mb-8 text-left text-xs font-bold uppercase tracking-tighter">
          <div className="flex justify-between border-b border-white/5 pb-2">
            <span className="text-white/40">Frais d'inscription</span>
            <span className="text-white">{isReallyPaid ? `${finalFee} FCFA` : 'GRATUIT'}</span>
          </div>
          
          {isReallyPaid && (
            <div className="pt-2 text-center text-[10px] text-white/60 tracking-normal leading-relaxed capitalize-none">
              Veuillez régler en liquide à l'accueil de la salle de jeux, ou effectuez un transfert Mobile Money au : <br />
              <span className="text-primary font-black text-sm tracking-widest block mt-2" translate="no">
                {phone}
              </span>
              (Mentionnez votre nom de gamer dans le motif)
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <NeonButton 
            variant="violet"
            className="w-full py-4 text-xs font-black shadow-neon-violet"
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