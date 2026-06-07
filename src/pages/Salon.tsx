import { useQuery, useQueryClient } from '@tanstack/react-query' // MODIFIÉ
import { supabase } from '@/lib/supabase'
import { Users, Loader2, Star, Clock } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useUserMetadata } from '@/hooks/useUserMetadata' // AJOUTÉ
import { toast } from 'react-hot-toast' // AJOUTÉ
import { NeonButton } from '@/components/ui/NeonButton' // AJOUTÉ

export function Salon() {
  const { data: metadata } = useUserMetadata() // AJOUTÉ
  const isAdmin = metadata?.is_admin || false; // AJOUTÉ
  const queryClient = useQueryClient(); // AJOUTÉ

  // AJOUTÉ : Fonction d'administration pour réinitialiser le salon à la fermeture
  const handleClearAllPresences = async () => {
    if (!confirm("Voulez-vous vraiment vider toutes les présences du salon (fermeture de la salle) ?")) return;
    
    try {
      const { error } = await supabase
        .from('users_metadata')
        .update({ is_present: false })
        .eq('is_present', true);

      if (error) throw error;
      toast.success("Salon vidé avec succès !", {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid #ef4444',
          borderRadius: '1rem',
          boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      });
      queryClient.invalidateQueries({ queryKey: ['present_users'] });
    } catch (e) {
      toast.error("Erreur lors de la fermeture administrative", { position: "bottom-center" });
    }
  };

  // Charger la liste des joueurs dont la colonne 'is_present' est égale à TRUE
  const { data: presentUsers, isLoading } = useQuery({
    queryKey: ['present_users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(points, total_hours)')
        .eq('is_present', true)
        .order('last_scanned_at', { ascending: false });

      if (error) {
        console.error("Erreur de chargement de la salle :", error.message);
        throw error;
      }
      return data || [];
    },
    refetchInterval: 10000 // Actualisation automatique toutes les 10 secondes
  });

  return (
    <div className="pt-40 pb-24 min-h-screen bg-background text-center font-display relative overflow-hidden animate-fade-in">
      {/* Fond d'écran immersif cyberpunk */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="salon backdrop"
        />
      </div>

      <div className="container mx-auto px-4 max-w-5xl relative z-20">
        
        {/* HEADER */}
        <header className="mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-6 text-white">
            <Users className="text-secondary" size={14} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">LE SALON LIVE</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none">
            JOUEURS <br /><span className="text-secondary text-glow-cyan italic">EN SALLE</span>
          </h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-[0.3em] mt-4">
            Liste actualisée en direct • {presentUsers?.length || 0} joueur(s) présent(s)
          </p>
        </header>

        {/* LISTE DES JOUEURS ACTUELLEMENT DANS LA SALLE */}
        <section className="glass border-white/5 rounded-[2.5rem] overflow-hidden text-left shadow-2xl">
          <div className="p-8 border-b border-b-white/5 bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-3 text-white">
              <Star className="text-secondary" size={20} /> ACTUELLEMENT DANS LE COCON
            </h3>
            <div className="flex items-center gap-4">
              <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic animate-pulse">LIVE</span>
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
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Détection de présence en cours...</p>
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
                      className="group flex items-center gap-6 p-8 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white"
                    >
                      {/* Avatar du Joueur */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative">
                        {player.avatar_url ? (
                          <img src={player.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <Star size={20} className="text-white/10" />
                        )}
                        <div className={cn("absolute bottom-0 left-0 right-0 h-1")} style={{ backgroundColor: rankInfo.color }} />
                      </div>

                      {/* Identité & Team */}
                      <div className="flex-1">
                        <div translate="no" className="font-black text-2xl uppercase tracking-tighter text-white group-hover:text-secondary transition-colors leading-none mb-1">
                          {player.display_name}
                        </div>
                        <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                          <span style={{ color: rankInfo.color }}>Rang {rankInfo.name}</span>
                          {player.community_team && (
                            <>
                              <span className="opacity-30">•</span>
                              <span className="text-primary">Team {player.community_team}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Temps depuis l'arrivée */}
                      <div className="text-right flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <Clock size={14} className="text-secondary shrink-0" />
                        <span>
                          Arrivé il y a {player.last_scanned_at ? formatDistanceToNow(new Date(player.last_scanned_at), { locale: fr }) : "quelques instants"}
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-32 text-center">
                  <p className="text-sm uppercase font-black tracking-[0.4em] text-white/15 leading-relaxed">
                    Le cocon est calme... <br />Aucun joueur n'a encore validé sa présence à l'accueil.
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