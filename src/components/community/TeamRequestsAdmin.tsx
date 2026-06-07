import { useAllPendingRequests, useTeamMembershipActions } from '@/hooks/useTeamMembership'
import { Users, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TeamRequestsAdmin() {
  const { data: requests, isLoading } = useAllPendingRequests()
  const { processRequest } = useTeamMembershipActions()

  const handleAction = async (playerId: string, teamId: string, status: 'approved' | 'rejected') => {
    try {
      await processRequest.mutateAsync({ playerId, teamId, status })
      toast.success(status === 'approved' ? "Adhésion approuvée avec succès !" : "Demande déclinée.", { position: "bottom-center" })
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
        <Users size={22} className="text-primary animate-pulse" />
        Demandes d'Adhésion en Attente ({requests.length})
      </h3>

      <div className="space-y-4">
        {requests.map(req => (
          <div key={req.user_id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {req.users_metadata?.avatar_url ? (
                  <img src={req.users_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <Users size={16} className="text-white/30" />
                )}
              </div>
              <div>
                <p className="text-sm font-black uppercase" translate="no">@{req.users_metadata?.display_name}</p>
                <p className="text-[10px] text-primary font-black uppercase tracking-wider">Demande à intégrer la Team {req.team_id}</p>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button 
                onClick={() => handleAction(req.user_id, req.team_id, 'approved')}
                disabled={processRequest.isPending}
                className="p-3 bg-green-500 text-black rounded-xl hover:scale-105 transition-all shadow-lg"
                title="Approuver l'adhésion (Paiement reçu)"
              >
                <Check size={16} />
              </button>
              <button 
                onClick={() => handleAction(req.user_id, req.team_id, 'rejected')}
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