import { useState } from 'react'
import { useTeamLeaderboard } from '@/hooks/useCommunityStats'
import { Trophy, Star, Loader2 } from 'lucide-react'
import { cn } from '@blinkdotnew/ui'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export function TeamLeaderboard() {
  const [selectedTeam, setSelectedTeam] = useState('FC 26')
  const { data: stats, isLoading } = useTeamLeaderboard(selectedTeam)
  const currentMonthText = format(new Date(), 'MMMM yyyy', { locale: fr })

  return (
    <section className="glass border-white/5 rounded-[2.5rem] overflow-hidden text-left shadow-2xl mb-16">
      <div className="p-6 md:p-8 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-black uppercase tracking-widest text-xs md:text-sm flex items-center gap-3 text-white">
            <Trophy className="text-secondary animate-pulse" size={18} /> Classement Mensuel de la Team
          </h3>
          <p className="text-[9px] uppercase font-bold text-white/30 tracking-widest mt-1">Basé sur les victoires de face-à-face • {currentMonthText}</p>
        </div>

        <select 
          value={selectedTeam} 
          onChange={e => setSelectedTeam(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl p-2 md:p-2.5 text-[10px] md:text-xs text-white focus:outline-none"
        >
          <option value="FC 26" className="bg-background">Team - FC26</option>
          <option value="Tekken" className="bg-background">Team - Tekken</option>
          <option value="GTA" className="bg-background">Team - GTA</option>
          <option value="Naruto" className="bg-background">Team - Naruto</option>
          <option value="Fortnite" className="bg-background">Team - Fortnite</option>
          <option value="2K NBA" className="bg-background">Team - 2K NBA</option>
          <option value="Mortal Kombat" className="bg-background">Team - Mortal Kombat</option>
        </select>
      </div>

      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-secondary mb-4" size={24} />
          <p className="text-[9px] uppercase font-black tracking-widest text-white/40">Chargement...</p>
        </div>
      ) : (
        <div className="p-0">
          {stats && stats.length > 0 ? (
            stats.map((row: any, index: number) => {
              const profile = Array.isArray(row.users_metadata) ? row.users_metadata[0] : row.users_metadata;
              if (!profile) return null;

              return (
                <div 
                  key={row.user_id} 
                  /* GRILLE CSS STRICTE : Aligne géométriquement chaque colonne de manière fixe sans débordement possible */
                  className="group grid grid-cols-[30px_42px_1fr_80px] items-center gap-3 md:gap-6 px-4 md:px-8 py-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white text-xs"
                >
                  {/* Colonne 1 : Position (#1, #2) */}
                  <div className={cn(
                    "text-sm md:text-xl font-black italic", 
                    index === 0 ? "text-yellow-500" : 
                    index === 1 ? "text-slate-300" : 
                    index === 2 ? "text-orange-400" : "text-white/15"
                  )}>
                    #{index + 1}
                  </div>

                  {/* Colonne 2 : Photo de profil (Verrouillée avec shrink-0 contre tout écrasement) */}
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative shrink-0">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                    ) : (
                      <Star size={14} className="text-white/10" />
                    )}
                  </div>

                  {/* Colonne 3 : Pseudo du joueur (Police de 11px sur mobile, coupe avec points de suspension si trop long) */}
                  <div translate="no" className="font-black text-[11px] md:text-sm uppercase tracking-tight text-white leading-none truncate text-left">
                    {profile.display_name}
                  </div>

                  {/* Colonne 4 : Compteur de victoires aligné à droite */}
                  <div className="text-right text-[10px] md:text-xs font-black uppercase tracking-wider text-secondary">
                    {row.victories} {row.victories > 1 ? 'Victoires' : 'Victoire'}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-16 text-center">
              <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.25em] text-white/15 leading-relaxed">
                Aucun match enregistré pour la Team {selectedTeam} ce mois-ci.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  )
}