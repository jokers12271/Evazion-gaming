import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useResolveChallenge } from '@/hooks/useRagnarok'
import { Swords, Loader2, Trophy, Award } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface Props {
  boxClass: string
  boxStyle: any
}

export function RagnarokAdmin({ boxClass, boxStyle }: Props) {
  const resolveChallenge = useResolveChallenge()

  // Charger tous les défis acceptés de la salle de jeux (status = 'active')
  const { data: activeChallenges, isLoading } = useQuery({
    queryKey: ['all_active_challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ragnarok_challenges')
        .select(`
          *,
          challenger_metadata:challenger_id ( display_name ),
          challenged_metadata:challenged_id ( display_name )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    }
  })

  const handleDeclareWinner = async (challengeId: string, winnerId: string, winnerName: string) => {
    if (!confirm(`Déclarer @${winnerName} vainqueur de ce duel Ragnarok ? Les mises seront appliquées et transférées.`)) return;

    try {
      await resolveChallenge.mutateAsync({ challengeId, winnerId })
      toast.success(`Victoire de @${winnerName} validée !`, {
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
    } catch (err) {
      toast.error("Erreur technique de validation", { position: "bottom-center" })
    }
  }

  if (!activeChallenges || activeChallenges.length === 0) return null

  return (
    <section className={boxClass} style={boxStyle}>
      <h3 className="text-xl font-display font-black uppercase mb-6 text-accent flex items-center gap-3">
        <Swords size={22} className="text-accent animate-pulse" />
        Défis Ragnarok en cours ({activeChallenges.length})
      </h3>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-accent" size={24} /></div>
      ) : (
        <div className="space-y-6">
          {activeChallenges.map((challenge: any) => {
            const cName = challenge.challenger_metadata?.display_name;
            const dName = challenge.challenged_metadata?.display_name;

            return (
              <div key={challenge.id} className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col gap-4 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest text-glow-orange text-accent">
                      @ {cName} vs @ {dName}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-wider text-white/30">
                      Du : {format(new Date(challenge.scheduled_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </span>
                  </div>
                  <span className="text-[9px] font-black uppercase px-3 py-1 rounded-lg bg-orange-500/10 text-orange-500 border border-orange-500/20 animate-pulse shrink-0">
                    FIGHT ACTIVE
                  </span>
                </div>

                {/* Détail des mises asymétriques */}
                <div className="grid grid-cols-2 gap-4 text-center text-[10px] font-bold uppercase tracking-tight p-3 bg-black/40 rounded-2xl border border-white/5">
                  <div>
                    <span className="text-white/40 block mb-1">Mise @{cName}</span>
                    <span className="text-white text-xs font-black">{challenge.amount} {challenge.currency_type}</span>
                  </div>
                  <div>
                    <span className="text-white/40 block mb-1">Mise @{dName} (50%)</span>
                    <span className="text-white text-xs font-black">{challenge.challenged_wager} {challenge.currency_type}</span>
                  </div>
                </div>

                {/* Saisie du vainqueur */}
                <div className="space-y-2 pt-2">
                  <p className="text-[9px] font-black uppercase text-white/40 tracking-wider">Désigner le vainqueur physique :</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleDeclareWinner(challenge.id, challenge.challenger_id, cName)}
                      disabled={resolveChallenge.isPending}
                      className="flex-1 py-3 bg-primary hover:bg-primary/80 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-primary/40 shadow-neon-violet"
                    >
                      <Trophy size={12} />
                      @{cName} Gagne
                    </button>
                    <button
                      onClick={() => handleDeclareWinner(challenge.id, challenge.challenged_id, dName)}
                      disabled={resolveChallenge.isPending}
                      className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-black rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-secondary/40 shadow-neon-cyan"
                    >
                      <Award size={12} />
                      @{dName} Gagne
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  )
}