import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useRecordMatch } from '@/hooks/useCommunityStats'
import { Swords, Loader2 } from 'lucide-react'
import { NeonButton } from '@/components/ui/NeonButton'
import { toast } from 'react-hot-toast'

export function FaceToFaceAdmin() {
  const [selectedTeam, setSelectedTeam] = useState('FC 26')
  const [player1Id, setPlayer1Id] = useState('')
  const [player2Id, setPlayer2Id] = useState('')
  const recordMatch = useRecordMatch()

  // MODIFIÉ : Chargement robuste des combattants approuvés (gère les colonnes de valeurs NULL)
  const { data: teamMembers, isLoading } = useQuery({
    queryKey: ['admin_faceoff_members', selectedTeam],
    queryFn: async () => {
      if (!selectedTeam) return []
      
      // Interroger directement la table d'adhésion pour simplifier la jointure
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select('user_id, team_id, status, users_metadata(display_name, is_admin)')
        .eq('team_id', selectedTeam)
        .eq('status', 'approved');

      if (error) throw error;

      // Décoder les profils et filtrer en JS (exclure les admins, gère is_admin = true, false ou null)
      return (data || [])
        .map((row: any) => {
          const profile = Array.isArray(row.users_metadata) ? row.users_metadata[0] : row.users_metadata;
          return {
            user_id: row.user_id,
            display_name: profile?.display_name || 'Gamer',
            is_admin: profile?.is_admin
          };
        })
        .filter(g => g.is_admin !== true); // Exclure uniquement les administrateurs
    }
  })

  const handleMatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!player1Id || !player2Id) return toast.error("Veuillez sélectionner deux combattants.", { position: "bottom-center" })
    if (player1Id === player2Id) return toast.error("Un joueur ne peut s'affronter lui-même.", { position: "bottom-center" })

    const winnerId = window.prompt(`Qui a gagné le match ? \nEntrez '1' pour @${teamMembers?.find(m => m.user_id === player1Id)?.display_name} \nEntrez '2' pour @${teamMembers?.find(m => m.user_id === player2Id)?.display_name}`)
    if (winnerId !== '1' && winnerId !== '2') return toast.error("Sélection de vainqueur annulée.", { position: "bottom-center" })

    const finalWinnerId = winnerId === '1' ? player1Id : player2Id;
    const finalWinnerName = teamMembers?.find(m => m.user_id === finalWinnerId)?.display_name;

    try {
      await recordMatch.mutateAsync({
        teamId: selectedTeam,
        player1Id,
        player2Id,
        winnerId: finalWinnerId
      })
      toast.success(`Victoire de @${finalWinnerName} enregistrée !`, {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(180, 100%, 50%)',
          borderRadius: '1rem',
          boxShadow: '0 0 15px hsl(180, 100%, 50%, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      })
      setPlayer1Id('')
      setPlayer2Id('')
    } catch (err) {
      toast.error("Erreur de sauvegarde", { position: "bottom-center" })
    }
  }

  return (
    <div className="glass p-8 rounded-[2.5rem] border-secondary/20 text-left mb-16 animate-fade-in shadow-2xl">
      <h3 className="text-xl font-display font-black uppercase mb-6 text-secondary flex items-center gap-3">
        <Swords size={22} className="text-secondary" />
        Saisie Face à Face : Sport & Combat (Admin)
      </h3>

      <form onSubmit={handleMatchSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
        <div className="space-y-1.5">
          <label className="text-[8px] uppercase font-black text-white/40">Sélectionner la Team</label>
          <select 
            value={selectedTeam} 
            onChange={e => { setSelectedTeam(e.target.value); setPlayer1Id(''); setPlayer2Id(''); }}
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

        <div className="space-y-1.5">
          <label className="text-[8px] uppercase font-black text-white/40">Combattant 1</label>
          {isLoading ? (
            <div className="py-2 flex justify-center"><Loader2 className="animate-spin text-secondary" size={16} /></div>
          ) : (
            <select 
              value={player1Id} 
              onChange={e => setPlayer1Id(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="" className="bg-background">Sélectionner Joueur 1...</option>
              {teamMembers?.filter(m => m.user_id !== player2Id).map(m => (
                <option key={m.user_id} value={m.user_id} className="bg-background" translate="no">{m.display_name}</option>
              ))}
            </select>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-[8px] uppercase font-black text-white/40">Combattant 2</label>
          {isLoading ? (
            <div className="py-2 flex justify-center"><Loader2 className="animate-spin text-secondary" size={16} /></div>
          ) : (
            <select 
              value={player2Id} 
              onChange={e => setPlayer2Id(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              <option value="" className="bg-background">Sélectionner Joueur 2...</option>
              {teamMembers?.filter(m => m.user_id !== player1Id).map(m => (
                <option key={m.user_id} value={m.user_id} className="bg-background" translate="no">{m.display_name}</option>
              ))}
            </select>
          )}
        </div>

        <NeonButton type="submit" variant="cyan" disabled={recordMatch.isPending} className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2">
          <Swords size={12} /> ENREGISTRER MATCH
        </NeonButton>
      </form>
    </div>
  )
}