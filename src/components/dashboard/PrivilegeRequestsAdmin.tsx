import { usePrivileges } from '@/hooks/usePrivileges'
import { Check, X, Loader2, Award } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function PrivilegeRequestsAdmin() {
  const { pendingClaims, approveClaim } = usePrivileges()

  const handleApprove = async (claimId: string, userId: string, key: string) => {
    try {
      await approveClaim.mutateAsync({ claimId, userId, privilegeTitle: key })
      toast.success("Privilège distribué et validé à vie !")
    } catch (e: any) {
      console.error("Erreur de validation de privilège physique :", e)
      toast.error(e.message || "Erreur d'approbation")
    }
  }

  if (!pendingClaims.data || pendingClaims.data.length === 0) return null

  return (
    <section className="glass p-8 rounded-[2.5rem] border-amber-500/20 text-left mb-10 shadow-2xl animate-fade-in" style={{ borderColor: 'rgba(245,158,11,0.2)' }}>
      <h3 className="text-sm font-black uppercase text-amber-500 flex items-center gap-2 mb-6">
        <Award className="animate-bounce" size={18} /> Demandes de Privilèges Physiques ({pendingClaims.data.length})
      </h3>

      {pendingClaims.isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-amber-500" size={20} /></div>
      ) : (
        <div className="space-y-4">
          {pendingClaims.data.map((claim: any) => (
            <div 
              key={claim.id} 
              className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-white"
            >
              <div>
                <p className="text-xs font-bold leading-normal">
                  Le joueur <span translate="no" className="text-amber-500">@{claim.users_metadata?.display_name}</span> demande son privilège :
                </p>
                <span className="text-[10px] font-black uppercase tracking-wider text-white/50 block mt-1">
                  🔑 Clé : {claim.privilege_key}
                </span>
              </div>

              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => handleApprove(claim.id, claim.user_id, claim.privilege_key)}
                  disabled={approveClaim.isPending}
                  className="p-3 bg-green-500 text-black rounded-xl hover:scale-110 transition-transform shadow-lg shadow-green-500/10"
                  title="Valider la distribution physique (Cocher à vie)"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}