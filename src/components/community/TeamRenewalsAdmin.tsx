import { useAllPendingRenewals, useTeamMembershipActions, useTeamConfigs } from '@/hooks/useTeamMembership'
import { getRank } from '@/lib/ranks' // Importer le calculateur de rang global
import { Users, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TeamRenewalsAdmin() {
  const { data: renewals, isLoading } = useAllPendingRenewals()
  const { data: configs } = useTeamConfigs()
  const { processRenewal } = useTeamMembershipActions()

  const handleAction = async (playerId: string, teamId: string, status: 'approved' | 'rejected') => {
    try {
      await processRenewal.mutateAsync({ playerId, teamId, status })
      toast.success(status === 'approved' ? "Renouvellement approuvé !" : "Renouvellement décliné.")
    } catch (err) {
      toast.error("Erreur technique lors de la validation")
    }
  }

  if (isLoading) {
    return <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
  }

  if (!renewals || renewals.length === 0) return null

  return (
    <div className="glass p-6 md:p-8 rounded-[2.5rem] border-primary/20 text-left mb-16 animate-fade-in shadow-2xl">
      <h3 className="text-xl font-display font-black uppercase mb-6 text-primary flex items-center gap-3">
        <Users size={22} className="text-primary animate-pulse" />
        Demandes de Renouvellements de Cotisations ({renewals.length})
      </h3>

      <div className="space-y-2">
        {renewals.map(req => {
          // A. Trouver la cotisation de base configurée
          const config = configs?.find(c => c.team_id === req.team_id)
          const baseFee = config?.monthly_fee || 0

          // B. Déterminer le Rang du joueur grâce à la jointure
          const lp = Array.isArray((req as any).loyalty_points) ? (req as any).loyalty_points[0] : (req as any).loyalty_points
          const hours = lp?.total_hours || 0
          const userRank = getRank(hours)

          // C. Calculer la cotisation réduite selon son Rang
          let finalFee = baseFee
          let discountText = 'Tarif Standard'

          if (userRank.name === 'Légende') {
            finalFee = Math.round(baseFee * 0.75) // -25%
            discountText = '-25% Rang Légende'
          } else if (userRank.name === 'Iconique' || userRank.name === 'Divin') {
            finalFee = Math.round(baseFee * 0.50) // -50%
            discountText = `-50% Rang ${userRank.name}`
          }

          return (
            <div 
              key={`${req.team_id}-${req.user_id}`} 
              className="group grid grid-cols-[40px_1fr_90px] items-center gap-3 md:gap-6 p-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white text-xs"
            >
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                {req.users_metadata?.avatar_url ? (
                  <img src={req.users_metadata.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                ) : (
                  <Users size={16} className="text-white/30" />
                )}
              </div>

              <div className="text-left truncate">
                <p className="text-xs font-black uppercase leading-none mb-1" translate="no">@{req.users_metadata?.display_name}</p>
                <p className="text-[9px] text-primary font-black uppercase tracking-wider">
                  Renouvellement : Team {req.team_id} <span className="text-white font-bold ml-1.5">(Cotisation : {finalFee} FCFA • {discountText})</span> {/* MODIFIÉ ICI */}
                </p>
              </div>

              <div className="flex gap-2 shrink-0 justify-end">
                <button 
                  onClick={() => handleAction(req.user_id, req.team_id, 'approved')}
                  disabled={processRenewal.isPending}
                  className="p-2 bg-green-500 text-black rounded-lg hover:scale-110 transition-transform shadow-lg"
                  title="Approuver le renouvellement"
                >
                  <Check size={14} />
                </button>
                <button 
                  onClick={() => handleAction(req.user_id, req.team_id, 'rejected')}
                  disabled={processRenewal.isPending}
                  className="p-2 bg-red-500 text-white rounded-lg hover:scale-110 transition-transform shadow-lg"
                  title="Rejeter la demande"
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