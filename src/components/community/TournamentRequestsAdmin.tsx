import { useAllPendingTournamentRequests, useProcessTournamentRequest } from '@/hooks/useTournamentParticipation'
import { Trophy, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TournamentRequestsAdmin() {
  const { data: requests, isLoading } = useAllPendingTournamentRequests()
  const processRequest = useProcessTournamentRequest()

  const handleAction = async (tournamentId: string, playerId: string, status: 'approved' | 'rejected', tournamentTitle?: string) => {
    try {
      await processRequest.mutateAsync({ tournamentId, playerId, status, tournamentTitle })
      toast.success(status === 'approved' ? "Inscription validée !" : "Inscription déclinée.", { position: "bottom-center" })
    } catch (err) {
      toast.error("Erreur technique lors de la validation", { position: "bottom-center" })
    }
  }

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (!requests || requests.length === 0) return null

  return (
    <div className="glass p-8 rounded-[2.5rem] border-primary/20 text-left mb-16 animate-fade-in shadow-2xl">
      <h3 className="text-xl font-display font-black uppercase mb-6 text-primary flex items-center gap-3">
        <Trophy size={22} className="text-primary animate-pulse" />
        Demandes d'Inscriptions aux Tournois ({requests.length})
      </h3>

      <div className="space-y-4">
        {requests.map(req => (
          <div key={`${req.tournament_id}-${req.user_id}`} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                <Trophy size={16} className="text-primary/30" />
              </div>
              <div>
                <p className="text-sm font-black uppercase" translate="no">@{req.display_name}</p>
                <p className="text-[10px] text-primary font-black uppercase tracking-wider">S'inscrit au tournoi : "{req.tournaments?.title}"</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => handleAction(req.tournament_id, req.user_id, 'approved', req.tournaments?.title)}
                disabled={processRequest.isPending}
                className="p-3 bg-green-500 text-black rounded-xl hover:scale-105 transition-all shadow-lg shadow-green-500/10"
                title="Valider l'inscription (Paiement validé)"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => handleAction(req.tournament_id, req.user_id, 'rejected', req.tournaments?.title)}
                disabled={processRequest.isPending}
                className="p-3 bg-red-500 text-white rounded-xl hover:scale-105 transition-all shadow-lg"
                title="Rejeter la demande"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}