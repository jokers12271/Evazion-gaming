import { useState } from 'react'
import { useTeamPerks, useManageTeamPerks, TeamPerk } from '@/hooks/useTeamPerks'
import { NeonButton } from '@/components/ui/NeonButton'
import { Plus, Trash2, Edit2, Settings, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TeamPrivilegesAdmin() {
  const [selectedTeam, setSelectedTeam] = useState('FC 26')
  const [perkText, setPerkText] = useState('')
  const [editingPerk, setEditingPerk] = useState<TeamPerk | null>(null)

  const { data: perks, isLoading } = useTeamPerks(selectedTeam)
  const { addPerk, updatePerk, deletePerk } = useManageTeamPerks()

  const handlePerkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!perkText.trim()) return

    try {
      if (editingPerk) {
        await updatePerk.mutateAsync({ id: editingPerk.id, perkText })
        toast.success("Privilège mis à jour !", { position: "bottom-center" })
        setEditingPerk(null)
      } else {
        await addPerk.mutateAsync({ teamId: selectedTeam, perkText })
        toast.success("Privilège ajouté avec succès !", { position: "bottom-center" })
      }
      setPerkText('')
    } catch (err) {
      toast.error("Erreur de sauvegarde", { position: "bottom-center" })
    }
  }

  const handleEditInit = (perk: TeamPerk) => {
    setEditingPerk(perk)
    setPerkText(perk.perk_text)
  }

  return (
    <div className="glass p-8 rounded-[2.5rem] border-primary/20 text-left mb-16 animate-fade-in shadow-2xl">
      <h3 className="text-xl font-display font-black uppercase mb-6 text-primary flex items-center gap-3">
        <Settings size={22} className="text-primary animate-spin" style={{ animationDuration: '6s' }} />
        Gestionnaire de Privilèges de Teams (Admin)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Colonne 1 : Choix de la Team & Formulaire d'ajout */}
        <div className="md:col-span-1 space-y-4">
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Sélectionner la Team</label>
            <select 
              value={selectedTeam} 
              onChange={e => { setSelectedTeam(e.target.value); setEditingPerk(null); setPerkText(''); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="FC 26" className="bg-background">Team - FC26</option>
              <option value="Tekken" className="bg-background">Team - Tekken</option>
              <option value="GTA" className="bg-background">Team - GTA</option>
              <option value="Naruto" className="bg-background">Team - Naruto</option>
              <option value="Fortnite" className="bg-background">Team - Fortnite</option>
              <option value="2K NBA" className="bg-background">Team - 2K NBA</option>
            </select>
          </div>

          <form onSubmit={handlePerkSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-black text-white/40">Texte du privilège</label>
              <input
                required
                type="text"
                placeholder="Ex: Inscription tournoi gratuite"
                value={perkText}
                onChange={e => setPerkText(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-primary"
              />
            </div>
            <NeonButton type="submit" variant="violet" className="w-full py-3 text-[10px] font-black">
              {editingPerk ? "METTRE À JOUR" : "AJOUTER LE PRIVILÈGE"}
            </NeonButton>
            {editingPerk && (
              <button 
                type="button" 
                onClick={() => { setEditingPerk(null); setPerkText(''); }}
                className="w-full py-1 text-[9px] font-black uppercase text-white/40 hover:text-white"
              >
                Annuler l'édition
              </button>
            )}
          </form>
        </div>

        {/* Colonne 2 & 3 : Liste des privilèges déjà configurés */}
        <div className="md:col-span-2 bg-black/30 p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-black uppercase text-white/40 tracking-wider mb-4">Privilèges configurés pour la Team {selectedTeam} :</p>
            
            {isLoading ? (
              <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : (
              <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                {perks?.map(perk => (
                  <div key={perk.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-white animate-fade-in">
                    <span className="text-xs font-bold uppercase tracking-tighter">{perk.perk_text}</span>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleEditInit(perk)}
                        className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20"
                        title="Modifier"
                      >
                        <Edit2 size={12} />
                      </button>
                      <button 
                        onClick={() => { if(confirm("Supprimer ce privilège ?")) deletePerk.mutate(perk.id); }}
                        className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
                {(!perks || perks.length === 0) && (
                  <p className="text-xs italic text-white/20 uppercase tracking-widest text-center py-8">Aucun privilège configuré pour le moment</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}