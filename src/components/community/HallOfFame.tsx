import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Trophy, Users, Loader2, Star, ShieldAlert, Award } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'

export function HallOfFame() {
  const [activeTab, setActiveTab] = useState<'elite' | 'monthly'>('elite')

  // 1. Charger l'Élite Éternelle (Joueurs de Rang Iconique ou Divin : total_hours >= 380)
  const { data: eliteUsers, isLoading: eliteLoading } = useQuery({
    queryKey: ['hall_of_fame_elite'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*, users_metadata(avatar_url)')
        .gte('total_hours', 380) // Seuil d'entrée pour le Rang Iconique
        .order('total_hours', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  // 2. Charger l'historique des Champions du Mois
  const { data: monthlyWinners, isLoading: winnersLoading } = useQuery({
    queryKey: ['hall_of_fame_monthly'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('monthly_winners')
        .select('*, users_metadata(display_name, avatar_url)')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    }
  })

  return (
    <section className="glass border-white/5 rounded-[2.5rem] overflow-hidden text-left shadow-2xl mb-16 relative">
      {/* Halo d'arrière-plan */}
      <div className="absolute top-0 right-0 w-64 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* En-tête */}
      <div className="p-8 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-3 text-white">
            <Trophy className="text-yellow-500 animate-pulse" size={20} /> LE HALL OF FAME DU SANCTUARY
          </h3>
          <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest mt-1">Le panthéon éternel des légendes d'Evazion</p>
        </div>

        {/* Onglets interactifs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('elite')}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
              activeTab === 'elite' ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-white/5 text-white/40 hover:text-white"
            )}
          >
            L'Élite Éternelle
          </button>
          <button
            onClick={() => setActiveTab('monthly')}
            className={cn(
              "px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300",
              activeTab === 'monthly' ? "border-yellow-500 bg-yellow-500/10 text-yellow-500" : "border-white/5 text-white/40 hover:text-white"
            )}
          >
            Champions du Mois
          </button>
        </div>
      </div>

      {/* RENDER ONGLETS */}
      {activeTab === 'elite' ? (
        <div className="p-8">
          {eliteLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
          ) : eliteUsers && eliteUsers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {eliteUsers.map((player: any) => {
                const rankInfo = getRank(player.total_hours)
                const meta = Array.isArray(player.users_metadata) ? player.users_metadata[0] : player.users_metadata

                return (
                  <div 
                    key={player.user_id} 
                    className="p-6 rounded-[2rem] bg-white/[0.02] border flex items-center gap-4 animate-fade-in"
                    style={{ borderColor: `${rankInfo.color}30` }}
                  >
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0 relative">
                      {meta?.avatar_url ? (
                        <img src={meta.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <Star size={20} className="text-white/10" />
                      )}
                      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: rankInfo.color }} />
                    </div>
                    <div>
                      <h4 translate="no" className="font-black text-lg text-white leading-none mb-1">@{player.display_name}</h4>
                      <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: rankInfo.color }}>
                        {rankInfo.name} • {player.total_hours}H
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* --- DESIGN D'ATTENTE HOLOGRAPHIQUE UNIQUE --- */
            <div className="py-12 text-center max-w-xl mx-auto space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto text-white/20">
                <Users size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="font-display font-black text-xl uppercase text-white/40 tracking-tight">Le Panthéon est silencieux...</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  Aucun membre n'a encore franchi le seuil d'accès de <strong>380 heures de jeu</strong> pour entrer au rang Iconique ou Divin. Qui sera la première légende à graver son nom à l'affiche du Sanctuary ?
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-center text-white/10 animate-pulse">
                    👤
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* RENDER HISTORIQUE DES CHAMPIONS DU MOIS */
        <div className="p-8">
          {winnersLoading ? (
            <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-yellow-500" size={32} /></div>
          ) : monthlyWinners && monthlyWinners.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {monthlyWinners.map((winner: any) => {
                const meta = Array.isArray(winner.users_metadata) ? winner.users_metadata[0] : winner.users_metadata

                return (
                  <div key={winner.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 flex items-center gap-4 animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
                      {meta?.avatar_url ? (
                        <img src={meta.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <Award size={24} className="text-yellow-500 animate-pulse" />
                      )}
                    </div>
                    <div>
                      <h4 translate="no" className="font-black text-lg text-white leading-none mb-1">@{meta?.display_name || 'Gamer'}</h4>
                      <span className="text-[9px] font-black uppercase text-yellow-500 tracking-wider">
                        CHAMPION DE : {winner.month_year}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* DESIGN D'ATTENTE CHAMPIONS */
            <div className="py-12 text-center max-w-xl mx-auto space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-2xl flex items-center justify-center mx-auto animate-pulse">
                <Trophy size={28} />
              </div>
              <div className="space-y-2">
                <h4 className="font-display font-black text-xl uppercase text-white/40 tracking-tight">Aucun titre mensuel décerné</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-semibold">
                  Le calcul de puissance s'exécute le 1er de chaque mois civile. Les premiers lauréats du titre de « Joueur du Mois » seront automatiquement intronisés ici !
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}