import { useState, useEffect } from 'react'
import { useCommunityReward } from '@/hooks/useCommunitySettings'
import { NeonButton } from '@/components/ui/NeonButton'
import { Trophy, Edit2, Check, X, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface Props {
  isAdmin: boolean
}

export function MonthlyRewardCard({ isAdmin }: Props) {
  const { reward, updateReward } = useCommunityReward()
  const [isEditing, setIsEditing] = useState(false)
  const [tempValue, setTempValue] = useState('')

  useEffect(() => {
    if (reward.data) {
      setTempValue(reward.data)
    }
  }, [reward.data])

  const handleSave = async () => {
    if (!tempValue.trim()) return

    try {
      await updateReward.mutateAsync(tempValue)
      toast.success("Avantage du Joueur du Mois mis à jour !", { position: "bottom-center" })
      setIsEditing(false)
    } catch (err) {
      toast.error("Erreur d'enregistrement", { position: "bottom-center" })
    }
  }

  return (
    <div 
      className="glass p-12 rounded-[3rem] border-2 border-amber-500 shadow-[0_0_30px_rgba(234,179,8,0.25)] text-center mb-16 animate-fade-in relative overflow-hidden flex flex-col items-center justify-center" 
      style={{ borderColor: '#eab308' }}
    >
      {/* Halo d'arrière-plan or géant */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Bouton d'édition positionné de manière absolue en haut à droite (Exclut de l'alignement central) */}
      {isAdmin && (
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="absolute top-8 right-8 p-3 bg-amber-500/10 text-yellow-500 rounded-xl hover:bg-amber-500 hover:text-black border border-amber-500/20 transition-all z-30 focus:outline-none"
          title="Modifier l'avantage"
        >
          {isEditing ? <X size={16} /> : <Edit2 size={16} />}
        </button>
      )}

      {/* En-tête de la section centré */}
      <div className="flex flex-col items-center gap-2 mb-8 relative z-10 text-center">
        <h3 className="font-display uppercase tracking-[0.25em] text-xs text-yellow-500 font-black flex items-center gap-3 justify-center">
          <Trophy size={18} className="text-yellow-500 animate-bounce" />
          L'AURA DU JOUEUR DU MOIS
        </h3>
        <p className="text-[10px] uppercase font-black text-white/30 tracking-[0.2em] mt-1">Configuré en direct par l'administration d'Evazion</p>
      </div>

      {reward.isLoading ? (
        <div className="py-8 flex justify-center relative z-10"><Loader2 className="animate-spin text-yellow-500" size={28} /></div>
      ) : isEditing ? (
        <div className="space-y-4 animate-fade-in mt-2 w-full max-w-2xl relative z-10">
          <textarea
            required
            value={tempValue}
            onChange={e => setTempValue(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white text-center focus:outline-none focus:border-amber-500 h-28 leading-relaxed font-semibold"
          />
          <NeonButton 
            variant="orange" 
            className="w-full py-4 text-xs font-black flex items-center justify-center gap-2"
            onClick={handleSave}
            disabled={updateReward.isPending}
          >
            <Check size={14} /> Enregistrer la récompense mensuelle
          </NeonButton>
        </div>
      ) : (
        <div className="w-full max-w-3xl relative z-10">
          {/* Récompense affichée en gros caractères de 36px, italique et lumineuse */}
          <p 
            className="text-2xl md:text-4xl font-display font-black italic leading-normal text-yellow-500 text-glow-orange tracking-tight"
            style={{ textShadow: '0 0 20px rgba(234, 179, 8, 0.45)' }}
          >
            " {reward.data} "
          </p>
          <p className="text-[9px] uppercase font-black text-white/30 tracking-[0.3em] mt-8">
            * Réservé au joueur obtenant le plus bas score cumulé de classement mensuel et général
          </p>
        </div>
      )}
    </div>
  )
}