import { useAllPendingTournamentRequests, useProcessTournamentRequest } from '@/hooks/useTournamentParticipation'
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
        {requests.map(req => (
          <div 
            key={`${req.tournament_id}-${req.user_id}`} 
            /* GRILLE COMPACTE ALIGNÉE SUR MOBILE (AJOUTÉ) */
            className="group grid grid-cols-[40px_1fr_90px] items-center gap-3 md:gap-6 p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white text-xs"
          >
            {/* Colonne 1 : Icone (Anti-écrasement shrink-0) */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              <Trophy size={16} className="text-primary/30" />
            </div>

            {/* Colonne 2 : Texte et Identité */}
            <div className="text-left truncate">
              <p className="text-xs font-black uppercase leading-none mb-1" translate="no">@{req.display_name}</p>
              <p className="text-[9px] text-primary font-black uppercase tracking-wider truncate">Tournoi : "{req.tournaments?.title}"</p>
            </div>

            {/* Colonne 3 : Actions de validation */}
            <div className="flex gap-2 shrink-0 justify-end">
              <button 
                onClick={() => handleAction(req.tournament_id, req.user_id, 'approved', req.tournaments?.title)}
                disabled={processRequest.isPending}
                className="p-2 bg-green-500 text-black rounded-lg hover:scale-110 transition-transform shadow-lg shadow-green-500/10"
                title="Valider l'inscription"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => handleAction(req.tournament_id, req.user_id, 'rejected', req.tournaments?.title)}
                disabled={processRequest.isPending}
                className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform shadow-lg"
                title="Rejeter l'inscription"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}