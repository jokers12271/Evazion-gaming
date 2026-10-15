import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Users, Loader2, Star, Clock, Flame, Headphones, Coffee, Check, Radio, Cpu, Sparkles, Activity, LogOut, Swords } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState, useCallback } from 'react'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useAuth } from '@/hooks/useAuth'
import { toast } from 'react-hot-toast'
import { useConfirm } from '@/hooks/useConfirm'
import { NeonButton } from '@/components/ui/NeonButton'
import { ModalShell } from '@/components/ui/ModalShell'
import { cyberAudio } from '@/lib/cyberAudio'
import { useGames } from '@/hooks/useGames'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { useStationsStatus, STATIONS } from '@/hooks/useStationsStatus'
import { useStations } from '@/hooks/useStations'
import { FaceToFaceArena } from '@/components/community/FaceToFaceArena'
import { Link } from '@tanstack/react-router'
import { LoungeJukeboxCard } from '@/components/gamification/LoungeJukeboxCard'

export function Salon() {
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const isAdmin = metadata?.is_admin || false
  const queryClient = useQueryClient()
  const { data: occupiedStations } = useStationsStatus()
  const { stations } = useStations()
  const { games } = useGames()
  const { confirm, dialog: confirmDialog } = useConfirm()
  const [jukeboxOpen, setJukeboxOpen] = useState(false)
  const [arenaOpen, setArenaOpen] = useState(false)
  const closeJukebox = useCallback(() => setJukeboxOpen(false), [])
  const closeArena = useCallback(() => setArenaOpen(false), [])

  const { data: presentUsers, isLoading } = useQuery({
    queryKey: ['present_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(points, total_hours)')
        .eq('is_present', true)
        .order('last_scanned_at', { ascending: false });

      if (error) throw error;
      
      const list = data || [];
      return list.filter((u: any) => u.display_name?.toLowerCase() !== 'test' && u.is_admin !== true);
    },
    refetchInterval: 10000
  });

  const isMePresentInSalon = presentUsers?.some((u: any) => u.user_id === user?.id)
  const myCurrentStatus = presentUsers?.find((u: any) => u.user_id === user?.id)

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
      queryClient.invalidateQueries({ queryKey: ['present_users'] });
      queryClient.invalidateQueries({ queryKey: ['user_metadata'] });
      toast.success("Votre statut de salon a été mis à jour !", { position: "bottom-center" })
    }
  })

  const handleClearAllPresences = () => {
    confirm({
      title: 'Fermer le salon',
      message: 'Tous les joueurs seront marques absents et leur statut remis a zero. Cette action concerne toute la salle.',
      confirmLabel: 'VIDER LE SALON',
      onConfirm: async () => {
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
      }
    });
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
      {confirmDialog}
      <OnboardingModal pageKey="salon" steps={onboardingSteps} />
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
        
        <header className="mb-8 md:mb-12">
          <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[7.5px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-1.5 md:gap-2 shadow-lg mb-4 md:mb-5 relative z-10">
            <Users className="text-secondary" size={14} />
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black">LE SALON LIVE</span>
          </div>
          <h1 className="text-3xl md:text-7xl font-black uppercase tracking-tighter text-white leading-none">
            JOUEURS <br /><span className="text-secondary text-glow-cyan italic">EN SALLE</span>
          </h1>
          <p className="text-muted-foreground uppercase text-[8px] md:text-[10px] font-bold tracking-[0.25em] md:tracking-[0.3em] mt-3 md:mt-4">
            Liste actualisée en direct • {presentUsers?.length || 0} joueur(s) présent(s)
          </p>
        </header>

        {/* RADAR TACTIQUE DES POSTES PS5 PRO */}
        <section className="glass p-3.5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-secondary/20 text-left mb-6 md:mb-10 shadow-2xl relative overflow-hidden animate-fade-in" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
          <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-6 mb-4 md:mb-6 pb-3 md:pb-6 border-b border-white/10">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-secondary/10 border border-secondary/30 flex items-center justify-center text-secondary shadow-neon-cyan">
                <Radio className="animate-pulse" size={20} />
              </div>
              <div>
                <h3 className="text-xs md:text-xl font-display font-black uppercase tracking-wider text-white flex items-center gap-2">
                  RADAR TACTIQUE DU SANCTUARY
                  <span className="text-[7px] md:text-[8px] font-mono font-black uppercase px-1.5 md:px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30">
                    LIVE SCAN
                  </span>
                </h3>
                <p className="text-[8px] md:text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5">
                  Surveillance radar 360° des 10 consoles PS5 Pro en temps réel
                </p>
              </div>
            </div>

            {!isAdmin && (
              <Link to="/reservation">
                <NeonButton variant="cyan" size="sm" sweep cornerAccents className="text-[8px] md:text-[9px] font-mono font-black tracking-widest py-1.5 md:py-2 px-3 md:px-4 shadow-neon-cyan">
                  Réserver un Poste Libre
                </NeonButton>
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8 items-center">
            {/* 1. Écran de Radar Circulaire */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative w-40 h-40 md:w-56 md:h-56 rounded-full border-2 border-secondary/40 bg-black/70 p-2 shadow-[0_0_30px_rgba(6,182,212,0.2),inset_0_0_30px_rgba(6,182,212,0.15)] overflow-hidden flex items-center justify-center">
                <div className="absolute w-3/4 h-3/4 rounded-full border border-secondary/20 pointer-events-none" />
                <div className="absolute w-1/2 h-1/2 rounded-full border border-secondary/20 pointer-events-none" />
                <div className="absolute w-1/4 h-1/4 rounded-full border border-secondary/20 pointer-events-none" />
                
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-secondary/25 pointer-events-none" />
                <div className="absolute inset-y-0 left-1/2 w-[1px] bg-secondary/25 pointer-events-none" />

                <div 
                  className="absolute inset-0 rounded-full animate-radar-sweep pointer-events-none"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, transparent 270deg, rgba(6,182,212,0.45) 360deg)'
                  }}
                />

                <span className="absolute top-1 text-[8px] font-mono font-black text-secondary/60">N</span>
                <span className="absolute bottom-1 text-[8px] font-mono font-black text-secondary/60">S</span>
                <span className="absolute left-2 text-[8px] font-mono font-black text-secondary/60">O</span>
                <span className="absolute right-2 text-[8px] font-mono font-black text-secondary/60">E</span>

                {STATIONS.map((stationId, i) => {
                  const isOccupied = occupiedStations?.includes(stationId);
                  const angle = (i < 5) ? (140 + i * 20) * (Math.PI / 180) : (320 + (i - 5) * 20) * (Math.PI / 180);
                  const radius = (i < 5) ? 65 : 75;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;

                  return (
                    <div 
                      key={stationId}
                      className="absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none"
                      style={{
                        transform: `translate(${x}px, ${y}px)`
                      }}
                    >
                      <div className={cn(
                        "w-2.5 h-2.5 rounded-full shadow-md",
                        isOccupied
                          ? "bg-orange-500 shadow-[0_0_8px_#f97316] radar-blip"
                          : "bg-emerald-400 shadow-[0_0_8px_#22c55e] radar-blip-idle"
                      )} />
                    </div>
                  );
                })}

                <div className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_12px_#06b6d4] z-10 radar-core-dot" />
              </div>
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/50 mt-3">
                FRÉQUENCE 2.4 GHz // ACTIVE PING
              </span>
            </div>

            {/* 2. Mini Grille des 10 Consoles */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-mono font-black uppercase text-white/60 tracking-[0.2em]">
                  Disponibilité des Stations PS5 Pro :
                </span>
                <span className="text-[9px] font-mono font-black text-secondary">
                  {occupiedStations?.length || 0} / 10 Occupées
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 md:gap-2.5">
                {stations.map((station, i) => {
                  const isOccupied = occupiedStations?.includes(station.id);
                  const num = String(i + 1).padStart(2, '0');

                  return (
                    <div 
                      key={station.id}
                      className={cn(
                        "p-1.5 md:p-2.5 rounded-lg md:rounded-xl border flex flex-col justify-between transition-all duration-300 relative overflow-hidden bg-black/40",
                        isOccupied 
                          ? "border-orange-500/30 bg-orange-950/15" 
                          : "border-white/10 hover:border-secondary/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[8px] font-mono font-black text-white/80">
                          #{num}
                        </span>
                        
                        <div className="relative w-4 h-4 flex items-center justify-center shrink-0">
                          <div className={cn(
                            "absolute inset-0 rounded-full animate-radar-pulse",
                            isOccupied ? "bg-orange-500" : "bg-emerald-400"
                          )} />
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full z-10",
                            isOccupied ? "bg-orange-500 radar-blip" : "bg-emerald-400 radar-blip-idle"
                          )} />
                        </div>
                      </div>

                      <div className="flex items-baseline justify-between mt-auto">
                        <span className="text-[10px] font-display font-black text-white leading-none truncate max-w-[70px]" title={station.name}>
                          {station.name}
                        </span>
                        <span className={cn(
                          "text-[7px] font-mono font-bold uppercase tracking-wider",
                          isOccupied ? "text-orange-400" : "text-emerald-400"
                        )}>
                          {isOccupied ? "OCCUPÉ" : "DISPO"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* LISTE DES JOUEURS PRÉSENTS */}
        <section className="glass border-white/5 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden text-left shadow-2xl mb-6 md:mb-10">
          <div className="p-3 md:p-5 border-b border-b-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <h4 className="font-black uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 md:gap-3 text-white">
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
            <div className="p-12 md:p-32 flex flex-col items-center justify-center">
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
                      className="group flex flex-col sm:flex-row sm:items-center gap-2.5 md:gap-6 p-3.5 md:p-8 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white"
                    >
                      <div className="w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative shrink-0">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <Star size={20} className="text-white/10" />
                        )}
                        <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: rankInfo.color }} />
                      </div>

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-1">
                          <span translate="no" className="font-black text-base md:text-2xl uppercase tracking-tighter text-white group-hover:text-secondary transition-colors leading-none">
                            {player.display_name}
                          </span>
                           
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
                <div className="p-10 md:p-20 text-center">
                  <p className="text-[10px] md:text-xs uppercase font-black tracking-[0.3em] md:tracking-[0.4em] text-white/15 leading-relaxed">
                    Le Sanctuaire est paisible... <br />Aucun joueur présent pour l'instant.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* TÉLÉCOMMANDE D'AMBIANCE (Joueurs uniquement) */}
        {isMePresentInSalon && myCurrentStatus && !isAdmin && (
          <section className="glass p-3.5 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border-secondary/20 text-left mb-6 md:mb-10 shadow-2xl animate-fade-in" style={{ borderColor: 'rgba(6,182,212,0.2)' }}>
            <h4 className="text-[10px] md:text-xs font-black uppercase tracking-widest text-secondary mb-3 md:mb-4 flex items-center gap-2">
              <Flame className="animate-pulse" size={18} />
              Ma télécommande de salon (Humeur du jour)
            </h4>
            <p className="text-[8px] md:text-[10px] text-muted-foreground uppercase font-bold mb-4 md:mb-6">Sélectionnez comment vous souhaitez être abordé par les autres membres aujourd'hui :</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-4 mb-4 md:mb-6">
              <button
                onClick={() => updateAmbiance.mutate({ status: 'solo', game: null })}
                className={cn(
                  "p-2.5 md:p-4 rounded-xl md:rounded-2xl border flex items-center gap-2 md:gap-3 text-white transition-all text-left cursor-pointer",
                  myCurrentStatus.ambiance_status === 'solo' ? "border-white/20 bg-white/5" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="p-2 rounded-xl bg-white/10"><Headphones size={18} /></div>
                <div>
                  <h5 className="text-xs font-black uppercase">🎧 Mode Solo / Concentré</h5>
                  <p className="text-[9px] text-muted-foreground">Je joue tranquille, merci de ne pas me déranger.</p>
                </div>
              </button>

              <button
                onClick={() => updateAmbiance.mutate({ status: 'chill', game: null })}
                className={cn(
                  "p-2.5 md:p-4 rounded-xl md:rounded-2xl border flex items-center gap-2 md:gap-3 text-white transition-all text-left cursor-pointer",
                  myCurrentStatus.ambiance_status === 'chill' ? "border-cyan-500/20 bg-cyan-500/5" : "border-white/5 hover:border-white/10"
                )}
              >
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Coffee size={18} /></div>
                <div>
                  <h5 className="text-xs font-black uppercase text-cyan-400">☕ Mode Chill & Coop</h5>
                  <p className="text-[9px] text-muted-foreground">Prêt à discuter, jouer à plusieurs ou s'entraider.</p>
                </div>
              </button>

              <button
                onClick={() => updateAmbiance.mutate({ status: 'competitif', game: games?.[0]?.title || 'TEKKEN 8' })}
                className={cn(
                  "p-2.5 md:p-4 rounded-xl md:rounded-2xl border flex items-center gap-2 md:gap-3 text-white transition-all text-left cursor-pointer",
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

            {myCurrentStatus.ambiance_status === 'competitif' && (
              <div className="space-y-2 border-t border-white/5 pt-4 animate-fade-in">
                <label className="text-[9px] uppercase font-black text-white/40">Sur quel jeu cherchez-vous un rival ?</label>
                <select
                  value={myCurrentStatus.seeking_game || ''}
                  onChange={e => updateAmbiance.mutate({ status: 'competitif', game: e.target.value })}
                  className="w-full max-w-sm bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-secondary"
                >
                  {games.map((game: any) => (
                    <option key={game.id} value={game.title} className="bg-background">{game.title}</option>
                  ))}
                </select>
              </div>
            )}
          </section>
        )}

        {/* BOUTONS MOBILE — JUKEBOX & ARÈNE (les boxes sont dans des modales) */}
        <div className="md:hidden grid grid-cols-2 gap-2.5 mb-6">
          <button
            type="button"
            onClick={() => {
              setJukeboxOpen(true);
              cyberAudio.playClick();
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-secondary/40 bg-secondary/10 px-3 py-3.5 text-left active:scale-95 transition-transform shadow-neon-cyan cursor-pointer"
          >
            <Radio className="text-secondary" size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white leading-tight text-center">
              Jukebox Social
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setArenaOpen(true);
              cyberAudio.playClick();
            }}
            className="flex flex-col items-center justify-center gap-1.5 rounded-2xl border border-primary/40 bg-primary/10 px-3 py-3.5 text-left active:scale-95 transition-transform shadow-neon-violet cursor-pointer"
          >
            <Swords className="text-primary" size={18} />
            <span className="text-[9px] font-black uppercase tracking-wider text-white leading-tight text-center">
              Pool de Rivalité
            </span>
          </button>
        </div>

        {/* JUKEBOX SOCIAL DU LOUNGE */}
        <div className="mb-10 hidden md:block">
          <LoungeJukeboxCard />
        </div>

        {/* FACE-TO-FACE ARENA */}
        <div className="hidden md:block">
          <FaceToFaceArena />
        </div>

        {/* FENÊTRES MODALES (mobile) */}
        <ModalShell
          isOpen={jukeboxOpen}
          onClose={closeJukebox}
          title="Jukebox Social"
          accent="cyan"
        >
          <LoungeJukeboxCard inModal />
        </ModalShell>

        <ModalShell
          isOpen={arenaOpen}
          onClose={closeArena}
          title="Pool de Rivalité — Arène 1v1"
          accent="violet"
        >
          <FaceToFaceArena inModal />
        </ModalShell>
      </div>
    </div>
  );
}
