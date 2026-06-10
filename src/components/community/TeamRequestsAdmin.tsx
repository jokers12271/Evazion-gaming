import { useAllPendingRequests, useTeamMembershipActions } from '@/hooks/useTeamMembership'
import { Users, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TeamRequestsAdmin() {
  const { data: requests, isLoading } = useAllPendingRequests()
  const { processRequest } = useTeamMembershipActions()

  const handleAction = async (playerId: string, teamId: string, status: 'approved' | 'rejected') => {
    try {
      await processRequest.mutateAsync({ playerId, teamId, status })
      toast.success(status === 'approved' ? "Adhésion approuvée avec succès !" : "Demande déclinée.")
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
        <Users size={22} className="text-primary animate-pulse" />
        Demandes d'Adhésion en Attente ({requests.length})
      </h3>

      <div className="space-y-2">
        {requests.map(req => (
          <div 
            key={req.user_id} 
            /* GRILLE COMPACTE ALIGNÉE SUR MOBILE (AJOUTÉ) */
            className="group grid grid-cols-[40px_1fr_90px] items-center gap-3 md:gap-6 p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white text-xs"
          >
            {/* Colonne 1 : Avatar (Anti-écrasement shrink-0) */}
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
              {req.users_metadata?.avatar_url ? (
                <img src={req.users_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
              ) : (
                <Users size={16} className="text-white/30" />
              )}
            </div>

            {/* Colonne 2 : Texte et Identité */}
            <div className="text-left truncate">
              <p className="text-xs font-black uppercase leading-none mb-1" translate="no">@{req.users_metadata?.display_name}</p>
              <p className="text-[9px] text-primary font-black uppercase tracking-wider">Adhésion : Team {req.team_id}</p>
            </div>

            {/* Colonne 3 : Actions de validation */}
            <div className="flex gap-2 shrink-0 justify-end">
              <button 
                onClick={() => handleAction(req.user_id, req.team_id, 'approved')}
                disabled={processRequest.isPending}
                className="p-2 bg-green-500 text-black rounded-lg hover:scale-110 transition-transform shadow-lg"
                title="Approuver l'adhésion"
              >
                <Check size={14} />
              </button>
              <button 
                onClick={() => handleAction(req.user_id, req.team_id, 'rejected')}
                disabled={processRequest.isPending}
                className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform shadow-lg"
                title="Rejeter la demande"
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