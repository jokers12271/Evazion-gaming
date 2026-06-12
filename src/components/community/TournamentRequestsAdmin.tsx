import { useAllPendingTournamentRequests, useProcessTournamentRequest } from '@/hooks/useTournamentParticipation'
import { getRank } from '@/lib/ranks' // Importer le calculateur de rang global
import { Trophy, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TournamentRequestsAdmin() {
  const { data: requests, isLoading } = useAllPendingTournamentRequests()
  const processRequest = useProcessTournamentRequest()

  const handleAction = async (tournamentId: string, playerId: string, status: 'approved' | 'rejected', tournamentTitle?: string) => {
    try {
      await processRequest.mutateAsync({ tournamentId, playerId, status, tournamentTitle })
      toast.success(status === 'approved' ? "Inscription validée !" : "Inscription déclinée.")
    } catch (err) {
      toast.error("Erreur technique lors de la validation")
    }
  }

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (!requests || requests.length === 0) return null

  return (
    <div className="glass p-6 md:p-8 rounded-[2.5rem] border-primary/20 text-left mb-16 animate-fade-in shadow-2xl">
      <h3 className="text-xl font-display font-black uppercase mb-6 text-primary flex items-center gap-3">
        <Trophy size={22} className="text-primary animate-pulse" />
        Demandes d'Inscriptions aux Tournois ({requests.length})
      </h3>

      <div className="space-y-2">
        {requests.map(req => {
          // A. Extraire les tarifs du tournoi
          const tourney = req.tournaments
          const baseFee = tourney?.fee_amount || 0

          // B. Déterminer le Rang du joueur grâce à la jointure
          const lp = Array.isArray((req as any).loyalty_points) ? (req as any).loyalty_points[0] : (req as any).loyalty_points
          const hours = lp?.total_hours || 0
          const userRank = getRank(hours)

          // C. Calculer le tarif final avec les remises du Rang appliquées
          let finalFee = baseFee
          let discountText = 'Tarif Standard'

          if (tourney?.is_paid) {
            if (userRank.name === 'Pro') {
              finalFee = Math.round(baseFee * 0.85) // -15%
              discountText = '-15% Rang Pro'
            } else if (userRank.name === 'Elite' || userRank.name === 'Légende') {
              finalFee = Math.round(baseFee * 0.75) // -25%
              discountText = `-25% Rang ${userRank.name}`
            } else if (userRank.name === 'Iconique') {
              finalFee = Math.round(baseFee * 0.50) // -50%
              discountText = '-50% Rang Iconique'
            } else if (userRank.name === 'Divin') {
              finalFee = 0 // GRATUIT
              discountText = 'GRATUIT Rang Divin'
            }
          } else {
            finalFee = 0
            discountText = 'Gratuit'
          }

          return (
            <div 
              key={`${req.tournament_id}-${req.user_id}`} 
              className="group grid grid-cols-[40px_1fr_90px] items-center gap-3 md:gap-6 p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white text-xs"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Trophy size={16} className="text-primary/30" />
              </div>

              <div className="text-left truncate">
                <p className="text-xs font-black uppercase leading-none mb-1" translate="no">@{req.display_name}</p>
                <p className="text-[9px] text-primary font-black uppercase tracking-wider truncate">
                  Tournoi : "{tourney?.title}" <span className="text-white font-bold ml-1.5">(Frais : {finalFee > 0 ? `${finalFee} FCFA • ${discountText}` : 'GRATUIT'})</span> {/* MODIFIÉ ICI */}
                </p>
              </div>

              <div className="flex gap-2 shrink-0 justify-end">
                <button 
                  onClick={() => handleAction(req.tournament_id, req.user_id, 'approved', tourney?.title)}
                  disabled={processRequest.isPending}
                  className="p-2 bg-green-500 text-black rounded-lg hover:scale-110 transition-transform shadow-lg"
                  title="Valider l'inscription"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => handleAction(req.tournament_id, req.user_id, 'rejected', tourney?.title)}
                  disabled={processRequest.isPending}
                  className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform shadow-lg"
                  title="Rejeter l'inscription"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}