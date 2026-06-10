import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Users, Loader2, Star, Clock, Flame, Headphones, Coffee, Check } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { NeonButton } from '@/components/ui/NeonButton'
import { GAMES_DATABASE } from '@/lib/gamesData'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { LogOut } from 'lucide-react'


export function Salon() {
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const isAdmin = metadata?.is_admin || false
  const queryClient = useQueryClient()

  // 1. Charger la liste des joueurs présents physiquement en salle
  const { data: presentUsers, isLoading } = useQuery({
    queryKey: ['present_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(points, total_hours)')
        .eq('is_present', true)
        .order('last_scanned_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 10000 // Rafraîchissement automatique toutes les 10 secondes
  });

  // Détecter si le joueur connecté fait partie des personnes présentes
  const isMePresentInSalon = presentUsers?.some((u: any) => u.user_id === user?.id)
  const myCurrentStatus = presentUsers?.find((u: any) => u.user_id === user?.id)

  // 2. Mutation pour modifier son statut d'ambiance et de jeu recherché
  const updateAmbiance = useMutation({
    mutationFn: async ({ status, game }: { status: 'solo' | 'competitif' | 'chill', game: string | null }) => {
      if (!user) return
      const { error } = await supabase
        .from('users_metadata')
        .update({ ambiance_status: status, seeking_game: game })
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['present_users'] })
      toast.success("Votre statut de salon a été mis à jour !", { position: "bottom-center" })
    }
  })

  // 3. Vider administrativement le salon (Fermeture)
  const handleClearAllPresences = async () => {
    if (!confirm("Voulez-vous vraiment vider toutes les présences du salon (fermeture de la salle) ?")) return;
    
    try {
      const { error } = await supabase
        .from('users_metadata')
        .update({ is_present: false, ambiance_status: 'chill', seeking_game: null })
        .eq('is_present', true);

      if (error) throw error;
      toast.success("Salon vidé avec succès !", { position: "bottom-center" });
      queryClient.invalidateQueries({ queryKey: ['present_users'] });
    } catch (e) {
      toast.error("Erreur lors de la fermeture administrative", { position: "bottom-center" });
    }
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Le Salon Live",
      desc: "Consultez en direct la liste des joueurs présents physiquement au Sanctuary pour planifier vos rencontres de jeux.",
      icon: <Users size={28} />
    },
    {
      title: "Ambiances & Humeurs",
      desc: "Mettez à jour votre statut (Solo, Coop ou Recherche de duel) pour indiquer aux autres membres de la salle comment interagir avec vous.",
      icon: <Headphones size={28} />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Fermeture administrative",
      desc: "À la fin de la journée, cliquez sur le bouton orange 'Vider le Salon' pour réinitialiser la présence de tous les joueurs de la salle à absent en un clic.",
      icon: <LogOut size={28} />
    }
  ]

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-center font-display relative overflow-hidden animate-fade-in">
      {/* GUIDE DU JOUEUR */}
      <OnboardingModal pageKey="salon" steps={onboardingSteps} />

      {/* GUIDE DU GÉRANT (AJOUTÉ) */}
      {isAdmin && <AdminOnboardingModal pageKey="salon" steps={adminOnboardingSteps} />}
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="salon backdrop"
        />
      </div>

      <div className="container mx-auto px-5 max-w-5xl relative z-20">
        
        {/* HEADER */}
        <header className="mb-16">
          <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-2 shadow-lg mb-5 relative z-10">
            <Users className="text-secondary" size={14} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">LE SALON LIVE</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none">
            JOUEURS <br /><span className="text-secondary text-glow-cyan italic">EN SALLE</span>
          </h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.3em] mt-4">
            Liste actualisée en direct • {presentUsers?.length || 0} joueur(s) présent(s)
          </p>
        </header>

        {/* --- TÉLÉCOMMANDE D'AMBIANCE (VISIBLE UNIQUEMENT SI LE JOUEUR EST EN SALLE) --- */}
        {isMePresentInSalon && myCurrentStatus && (
          <section className="glass p-8 rounded-[2.5rem] border-secondary/20 text-left mb-10 shadow-2xl animate-fade-in" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
            <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
              <Flame className="animate-pulse" size={18} />
              Ma télécommande de salon (Humeur du jour)
            </h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold mb-6">Sélectionnez comment vous souhaitez être abordé par les autres membres aujourd'hui :</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Option SOLO */}
              <button
                onClick={() => updateAmbiance.mutate({ status: 'solo', game: null })}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-3 text-white transition-all text-left",
                  myCurrentStatus.ambiance_status === 'solo' ? "border-white/20 bg-white/5" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="p-2 rounded-xl bg-white/10"><Headphones size={18} /></div>
                <div>
                  <h5 className="text-xs font-black uppercase">🎧 Mode Solo / Concentré</h5>
                  <p className="text-[9px] text-muted-foreground">Je joue tranquille, merci de ne pas me déranger.</p>
                </div>
              </button>

              {/* Option CHILL */}
              <button
                onClick={() => updateAmbiance.mutate({ status: 'chill', game: null })}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-3 text-white transition-all text-left",
                  myCurrentStatus.ambiance_status === 'chill' ? "border-cyan-500/20 bg-cyan-500/5" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Coffee size={18} /></div>
                <div>
                  <h5 className="text-xs font-black uppercase text-cyan-400">☕ Mode Chill & Coop</h5>
                  <p className="text-[9px] text-muted-foreground">Prêt à discuter, jouer à plusieurs ou s'entraider.</p>
                </div>
              </button>

              {/* Option COMPÉTITIF (CHERCHE RIVAL) */}
              <button
                onClick={() => updateAmbiance.mutate({ status: 'competitif', game: GAMES_DATABASE[0].title })}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-3 text-white transition-all text-left",
                  myCurrentStatus.ambiance_status === 'competitif' ? "border-orange-500/20 bg-orange-500/5" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400"><Flame size={18} /></div>
                <div>
                  <h5 className="text-xs font-black uppercase text-orange-400">🔥 Cherche un Rival (PVP)</h5>
                  <p className="text-[9px] text-muted-foreground">Je cherche du défi. Qui veut m'affronter ?</p>
                </div>
              </button>
            </div>

            {/* Sélecteur de jeu s'il est en mode compétitif */}
            {myCurrentStatus.ambiance_status === 'competitif' && (
              <div className="space-y-2 border-t border-white/5 pt-4 animate-fade-in">
                <label className="text-[9px] uppercase font-black text-white/40">Sur quel jeu cherchez-vous un rival ?</label>
                <select
                  value={myCurrentStatus.seeking_game || ''}
                  onChange={e => updateAmbiance.mutate({ status: 'competitif', game: e.target.value })}
                  className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-secondary"
                >
                  {GAMES_DATABASE.map(game => (
                    <option key={game.id} value={game.title} className="bg-background">{game.title}</option>
                  ))}
                </select>
              </div>
            )}
          </section>
        )}

        {/* LISTE DES JOUEURS PRÉSENTS */}
        <section className="glass border-white/5 rounded-[2.5rem] overflow-hidden text-left shadow-2xl">
          <div className="p-5 border-b border-b-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-black uppercase tracking-widest text-xs flex items-center gap-3 text-white">
              <Star className="text-secondary animate-pulse" size={15} /> ACTUELLEMENT AU SANCTUARY
            </h4>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest italic">LIVE</span>
              {isAdmin && (
                <NeonButton 
                  variant="orange" 
                  size="sm" 
                  className="text-[9px] font-black tracking-widest py-2 px-4 shadow-neon-orange"
                  onClick={handleClearAllPresences}
                >
                  VIDER LE SALON (FERMETURE)
                </NeonButton>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="p-32 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-secondary mb-4" size={40} />
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Détection de présence...</p>
            </div>
          ) : (
            <div className="p-0">
              {presentUsers && presentUsers.length > 0 ? (
                presentUsers.map((player: any) => {
                  const lp = Array.isArray(player.loyalty_points) ? player.loyalty_points[0] : player.loyalty_points;
                  const rankInfo = getRank(lp?.total_hours || 0);

                  return (
                    <div 
                      key={player.user_id} 
                      className="group flex flex-col sm:flex-row sm:items-center gap-6 p-8 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white"
                    >
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative shrink-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <Star size={20} className="text-white/10" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: rankInfo.color }} />
                      </div>

                      {/* Identité & Team */}
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <span translate="no" className="font-black text-2xl uppercase tracking-tighter text-white group-hover:text-secondary transition-colors leading-none">
                            {player.display_name}
                          </span>
                          
                          {/* BADGE D'AMBIANCE / MATCHMAKING (DYNAMIQUE) */}
                          {player.ambiance_status === 'solo' && (
                            <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 text-[8px] font-black uppercase tracking-wider flex items-center gap-1">
                              <Headphones size={10} /> Mode Solo
                            </span>
                          )}
                          {player.ambiance_status === 'chill' && (
                            <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[8px] font-black uppercase tracking-wider flex items-center gap-1 animate-pulse">
                              <Coffee size={10} /> Mode Chill / Coop
                            </span>
                          )}
                          {player.ambiance_status === 'competitif' && (
                            <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md shadow-orange-500/5 animate-bounce">
                              <Flame size={10} /> CHERCHE DUEL : {player.seeking_game || "Combat"}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest mt-1.5">
                          <span style={{ color: rankInfo.color }}>Rang {rankInfo.name}</span>
                          {player.community_team && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-primary font-black uppercase">Team {player.community_team}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Temps d'arrivée */}
                      <div className="text-right flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock size={12} className="text-secondary shrink-0" />
                        <span>
                          Arrivé il y a {player.last_scanned_at ? formatDistanceToNow(new Date(player.last_scanned_at), { locale: fr }) : "quelques instants"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-20 text-center">
                  <p className="text-xs uppercase font-black tracking-[0.4em] text-white/15 leading-relaxed">
                    Le Sanctuaire est paisible... <br />Aucun joueur présent pour l'instant.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}