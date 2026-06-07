import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useRagnarok } from '@/hooks/useRagnarok'
import { NeonButton } from '@/components/ui/NeonButton'
import { Swords, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@blinkdotnew/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  boxClass: string
  boxStyle: any
}

import { useMyMembershipRequests } from '@/hooks/useTeamMembership' // AJOUTÉ

export function RagnarokChallenge({ boxClass, boxStyle }: Props) {
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const { myChallenges, createChallenge, respondToChallenge } = useRagnarok()

  // Charger toutes mes teams d'équipes approuvées en direct
  const { data: myMembershipRequests } = useMyMembershipRequests() // AJOUTÉ
  const approvedTeams = myMembershipRequests?.filter(r => r.status === 'approved').map(r => r.team_id) || [];
  const hasTeams = approvedTeams.length > 0;

  const [showForm, setShowForm] = useState(false)
  const [challengedId, setChallengedId] = useState('')
  const [currencyType, setCurrencyType] = useState<'MANI' | 'Hours'>('MANI')
  const [amount, setAmount] = useState<number | ''>('')
  const [scheduleDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0])
  const [scheduleTime, setScheduledTime] = useState('15:00')
  const [selectedDuelTeam, setSelectedDuelTeam] = useState('') // AJOUTÉ : Team choisie pour le défi

  // Forcer la sélection automatique de la première équipe disponible s'il n'y a pas encore de choix
  const activeDuelTeam = selectedDuelTeam || approvedTeams[0] || '';

  // MODIFIÉ : Charge les adversaires de la Team choisie pour l'arène de duel
  const { data: teamMembers, isLoading: membersLoading } = useQuery({
    queryKey: ['team_opponents', activeDuelTeam],
    queryFn: async () => {
      if (!activeDuelTeam) return []
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, is_admin, team_membership_requests!inner(team_id, status)')
        .eq('team_membership_requests.team_id', activeDuelTeam)
        .eq('team_membership_requests.status', 'approved')
        .eq('is_admin', false);
      if (error) throw error;
      return (data || []).filter(g => g.user_id !== user?.id);
    },
    enabled: !!user && !!activeDuelTeam
  })

  const handleChallengeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!hasTeams) return toast.error("Vous devez rejoindre une Team avant de pouvoir lancer des défis.", { position: "bottom-center" })
    if (!challengedId) return toast.error("Sélectionnez un adversaire éligible.", { position: "bottom-center" })
    if (!amount || amount <= 0) return toast.error("Montant de mise invalide.", { position: "bottom-center" })

    const scheduledAt = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

    try {
      await createChallenge.mutateAsync({
        challengedId,
        currencyType,
        amount: Number(amount),
        scheduledAt
      })
      toast.success("Défi Ragnarok lancé avec succès !", {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(30, 100%, 50%)', // Néon Orange
          borderRadius: '1rem',
          boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      })
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

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-6 text-white text-left">
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

      {/* LISTE DES DEFIS EN COURS */}
      {!showForm ? (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar text-left text-white">
          {myChallenges.isLoading ? (
            <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-accent" size={20} /></div>
          ) : myChallenges.data && myChallenges.data.length > 0 ? (
            myChallenges.data.map((challenge) => {
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
                      challenge.status === 'active' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-accent/10 text-accent border-accent/20"
                    )}>
                      {challenge.status === 'active' ? 'Fight !' : 'Attente'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-tight">
                    <span className="text-white/40">Mise en jeu</span>
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
              L'arène est calme... <br />Lancez un défi à un membre de votre Team !
            </p>
          )}
        </div>
      ) : (
        /* FORMULAIRE DE CRÉATION DE DÉFI */
        <form onSubmit={handleChallengeSubmit} className="space-y-4 text-left text-white animate-fade-in">
                
                {/* AJOUTÉ : Choix de la Team pour le défi (S'affiche si membre de plusieurs Teams) */}
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase font-black text-white/40 font-black">Choisir la Team du Duel</label>
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
    </section>
  )
}