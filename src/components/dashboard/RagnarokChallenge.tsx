import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useRagnarok } from '@/hooks/useRagnarok'
import { useMyMembershipRequests } from '@/hooks/useTeamMembership'
import { NeonButton } from '@/components/ui/NeonButton'
import { Swords, Loader2, Calendar, Trophy } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@blinkdotnew/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useLoyalty } from '@/hooks/useLoyalty' // AJOUTÉ

interface Props {
  boxClass: string
  boxStyle: any
}

export function RagnarokChallenge({ boxClass, boxStyle }: Props) {
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const { myChallenges, createChallenge, respondToChallenge } = useRagnarok()
  const { data: myMembershipRequests } = useMyMembershipRequests()
  const { data: loyalty } = useLoyalty() // AJOUTÉ : Charge le solde de l'utilisateur

  
  const myManiPoints = loyalty?.points || 0; // AJOUTÉ
  const myTotalHours = loyalty?.total_hours || 0; // AJOUTÉ

  const approvedTeams = myMembershipRequests?.filter(r => r.status === 'approved').map(r => r.team_id) || [];
  const hasTeams = approvedTeams.length > 0;

  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current') // AJOUTÉ : Gestion de l'historique
  const [showForm, setShowForm] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false) // AJOUTÉ : Pop-up de confirmation d'envoi
  const [challengedId, setChallengedId] = useState('')
  const [currencyType, setCurrencyType] = useState<'MANI' | 'Hours'>('MANI')
  const [amount, setAmount] = useState<number | ''>('')
  const [scheduleDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleTime, setScheduledTime] = useState('15:00')
  const [selectedDuelTeam, setSelectedDuelTeam] = useState('')

  const activeDuelTeam = selectedDuelTeam || approvedTeams[0] || '';

  // MODIFIÉ : Charge de manière robuste les adversaires approuvés en interrogeant directement la table d'adhésion
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['team_opponents', activeDuelTeam],
    queryFn: async () => {
      if (!activeDuelTeam) return []
      
      // Interroger directement la table d'adhésion (simplifie la jointure PostgREST à 100%)
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select('user_id, team_id, status, users_metadata(display_name, is_admin)')
        .eq('team_id', activeDuelTeam)
        .eq('status', 'approved');

      if (error) throw error;

      // Décoder les profils et filtrer en JS (exclure soi-même et les admins, gère is_admin = null)
      return (data || [])
        .map((row: any) => {
          const profile = Array.isArray(row.users_metadata) ? row.users_metadata[0] : row.users_metadata;
          return {
            user_id: row.user_id,
            display_name: profile?.display_name || 'Gamer',
            is_admin: profile?.is_admin
          };
        })
        .filter(g => g.user_id !== user?.id && g.is_admin !== true);
    },
    enabled: !!user && !!activeDuelTeam
  })

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasTeams) return toast.error("Rejoignez d'abord une Team.", { position: "bottom-center" })
    if (!challengedId) return toast.error("Sélectionnez un adversaire éligible.", { position: "bottom-center" })
    if (!amount || amount <= 0) return toast.error("Montant de mise invalide.", { position: "bottom-center" })

    // AJOUTÉ : Barrière de contrôle stricte de provision de soldes de mise
    if (currencyType === 'MANI') {
      if (Number(amount) > myManiPoints) {
        toast.error(`Vous n'avez pas assez de MANI pour lancer ce défi. Votre solde : ${myManiPoints} MANI.`, { position: "bottom-center" });
        return;
      }
    } else if (currencyType === 'Hours') {
      if (Number(amount) > myTotalHours) {
        toast.error(`Vous n'avez pas assez d'Heures de Rang pour lancer ce défi. Votre solde : ${myTotalHours} H.`, { position: "bottom-center" });
        return;
      }
      // RÈGLE : Minimum de 2 heures requis pour parier des heures de rang
      if (Number(amount) < 2) {
        toast.error("Le montant minimum d'heures de jeu requis pour lancer un défi Ragnarok est de 2 heures.", { position: "bottom-center" });
        return;
      }
    }

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

    try {
      await createChallenge.mutateAsync({
        challengedId,
        currencyType,
        amount: Number(amount),
        scheduledAt,
        teamId: activeDuelTeam // AJOUTÉ : Transmet l'arène du duel
      })
      setShowSuccessModal(true); // Ouvre la modale de réussite d'envoi
      setChallengedId('')
      setAmount('')
      setShowForm(false)
    } catch (err: any) {
      console.error(err)
      toast.error(`Échec du duel : ${err.message || err}`, { position: "bottom-center" });
    }
  }

  if (!hasTeams) {
    return (
      <section className={boxClass} style={boxStyle}>
        <div className="flex items-center gap-2 mb-4 text-left text-white">
          <Swords size={14} className="text-muted-foreground" />
          <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black">Ragnarok Duel</h3>
        </div>
        <p className="text-[10px] italic text-left text-white/20 uppercase tracking-widest leading-relaxed">
          🔒 Rejoignez au moins une Team validée dans l'onglet Communauté pour débloquer l'arène des défis Ragnarok.
        </p>
      </section>
    )
  }

  // Filtrer les défis selon l'onglet choisi
  const pendingOrActiveList = myChallenges.data?.filter(c => c.status === 'pending' || c.status === 'active') || [];
  const completedOrCancelledList = myChallenges.data?.filter(c => c.status === 'completed' || c.status === 'cancelled') || [];

  return (
    <section className={cn(boxClass, "relative overflow-hidden")} style={boxStyle}>
      {/* Filigrane d'arène du blason (Opacité de 6 %, bords arrondis et fondu progressif) */}
      <div 
        className="absolute right-0 bottom-0 w-32 md:w-40 h-32 md:h-40 pointer-events-none opacity-[0.16] flex items-center justify-end z-0 overflow-hidden select-none"
        style={{ 
          maskImage: 'radial-gradient(circle, black 30%, transparent 80%)',
          WebkitMaskImage: 'radial-gradient(circle, black 30%, transparent 80%)'
        }}
      >
        <img src="/blason.png" className="w-full h-full object-contain translate-x-4 translate-y-4 scale-110 select-none pointer-events-none" alt="Sanctuary Arena Seal" />
      </div>

      <div className="flex items-center justify-between mb-6 text-white text-left relative z-10">
        <h3 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Swords size={14} className="text-accent animate-pulse" />
          Arène Ragnarok (PVP)
        </h3>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="text-[9px] font-black uppercase text-accent tracking-widest hover:underline focus:outline-none"
        >
          {showForm ? "Fermer" : "Lancer un Défi"}
        </button>
      </div>

      {!showForm ? (
        <div className="space-y-4">
          {/* Onglets de navigation : En cours vs Historique */}
          <div className="flex border-b border-white/5 pb-2 mb-4 text-[9px] font-black uppercase tracking-widest gap-4">
            <button 
              onClick={() => setActiveTab('current')}
              className={cn("pb-1 focus:outline-none transition-colors", activeTab === 'current' ? "text-accent border-b-2 border-accent" : "text-white/40 hover:text-white")}
            >
              Duels en cours ({pendingOrActiveList.length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={cn("pb-1 focus:outline-none transition-colors", activeTab === 'history' ? "text-accent border-b-2 border-accent" : "text-white/40 hover:text-white")}
            >
              Historique ({completedOrCancelledList.length})
            </button>
          </div>

          <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar text-left text-white">
            {myChallenges.isLoading ? (
              <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-accent" size={20} /></div>
            ) : (activeTab === 'current' ? pendingOrActiveList : completedOrCancelledList).length > 0 ? (
              (activeTab === 'current' ? pendingOrActiveList : completedOrCancelledList).map((challenge) => {
                const isChallenger = challenge.challenger_id === user?.id;
                const opponentName = isChallenger 
                  ? challenge.challenged_metadata?.display_name 
                  : challenge.challenger_metadata?.display_name;

                return (
                  <div key={challenge.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider" translate="no">
                          {isChallenger ? `Défi contre @${opponentName}` : `Proposé par @${opponentName}`}
                        </p>
                        <span className="text-[8px] font-black uppercase tracking-wider text-white/30">
                          Le {format(new Date(challenge.scheduled_at), 'dd/MM à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[8px] font-black uppercase px-2.5 py-1 rounded-full border",
                        challenge.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : challenge.status === 'completed' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" : "bg-accent/10 text-accent border-accent/20"
                      )}>
                        {challenge.status === 'active' ? 'Fight !' : challenge.status === 'completed' ? 'Fini' : challenge.status === 'cancelled' ? 'Annulé' : 'Attente'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                      <span className="text-white/40">{challenge.status === 'completed' ? 'Butin' : 'Mise en jeu'}</span>
                      <span className="text-accent text-glow-orange font-black">
                        {isChallenger ? `${challenge.amount}` : `${challenge.challenged_wager}`} {challenge.currency_type}
                      </span>
                    </div>

                    {/* Actions de consensus (Fight ou Fuir) pour l'adversaire défié */}
                    {!isChallenger && challenge.status === 'pending' && (
                      <div className="flex gap-2 pt-2 border-t border-white/5">
                        <button
                          onClick={() => respondToChallenge.mutate({ challengeId: challenge.id, action: 'Fight' })}
                          disabled={respondToChallenge.isPending}
                          className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-green-500/10"
                        >
                          FIGHT !
                        </button>
                        <button
                          onClick={() => respondToChallenge.mutate({ challengeId: challenge.id, action: 'Fuir' })}
                          disabled={respondToChallenge.isPending}
                          className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                          FUIR
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] italic text-center text-white/25 uppercase tracking-widest py-8 leading-relaxed">
                {activeTab === 'current' ? "Aucun duel actif ou en attente" : "Aucun historique de combat enregistré"}
              </p>
            )}
          </div>
        </div>
      ) : (
        /* FORMULAIRE DE CRÉATION DE DÉFI */
        <form onSubmit={handleChallengeSubmit} className="space-y-4 text-left text-white animate-fade-in">
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Choisir la Team du Duel</label>
            <select
              value={activeDuelTeam}
              onChange={e => { setSelectedDuelTeam(e.target.value); setChallengedId(''); }}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
            >
              {approvedTeams.map(tId => (
                <option key={tId} value={tId} className="bg-background">Team - {tId}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Adversaire éligible</label>
            {membersLoading ? (
              <div className="flex justify-center py-2"><Loader2 className="animate-spin text-accent" size={16} /></div>
            ) : (
              <select
                required
                value={challengedId}
                onChange={e => setChallengedId(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent"
              >
                <option value="" className="bg-background">Sélectionner un rival...</option>
                {teamMembers?.map(g => (
                  <option key={g.user_id} value={g.user_id} className="bg-background" translate="no">
                    {g.display_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-black text-white/40">Enjeu</label>
              <select
                value={currencyType}
                onChange={e => setCurrencyType(e.target.value as 'MANI' | 'Hours')}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none"
              >
                <option value="MANI" className="bg-background">Jetons MANI</option>
                <option value="Hours" className="bg-background">Heures de Rang</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-black text-white/40">Montant</label>
              <input
                required
                type="number"
                placeholder="Ex: 10"
                value={amount}
                onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-4">
            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-black text-white/40">Date</label>
              <input
                required
                type="date"
                value={scheduleDate}
                onChange={e => setScheduledDate(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent text-center font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[8px] uppercase font-black text-white/40">Heure</label>
              <input
                required
                type="time"
                value={scheduleTime}
                onChange={e => setScheduledTime(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-accent text-center font-bold"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4">
            <NeonButton
              type="submit"
              variant="orange"
              disabled={createChallenge.isPending}
              className="w-full py-4 text-xs font-black shadow-neon-orange"
            >
              {createChallenge.isPending ? "ENVOI DU DUEL..." : "LANCER LE DÉFI (GO)"}
            </NeonButton>
          </div>
        </form>
      )}

      {/* AJOUTÉ : Pop-up centré de réussite lors du lancement réussi d'un défi (Créateur) */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-10 rounded-[3rem] border-2 border-accent shadow-neon-orange max-w-md w-full relative overflow-hidden" style={{ borderColor: '#f97316' }}>
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-orange-500/30">
              <Swords className="text-orange-500 animate-pulse" size={32} />
            </div>

            <h3 className="text-2xl font-black uppercase mb-2 tracking-tight text-orange-500 text-glow-orange">Défi Lancé !</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-white/40 mb-6">Arène du Ragnarok</p>

            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-xs font-bold italic leading-relaxed text-white/80">
                "Votre proposition de duel PVP Ragnarok a été envoyée avec succès à votre adversaire. Le combat commencera dès qu'il aura accepté de relever le défi ("FIGHT") !"
              </p>
            </div>

            <NeonButton 
              variant="orange"
              className="w-full py-4 text-xs font-black"
              onClick={() => setShowSuccessModal(false)}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

    </section>
  )
}