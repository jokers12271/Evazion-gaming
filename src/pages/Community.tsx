import { useQuery } from '@tanstack/react-query' // AJOUTÉ
import { useState } from 'react'
import { supabase } from '@/lib/supabase' // AJOUTÉ
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { Trophy, Users, Loader2, Star, Gamepad2 } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { useAuth } from '@/hooks/useAuth' 
import { useUserMetadata, useUpdateCommunity } from '@/hooks/useUserMetadata' 
import { NeonButton } from '@/components/ui/NeonButton' 
import { toast } from 'react-hot-toast'
import { useTeamPerks } from '@/hooks/useTeamPerks' // AJOUTÉ
import { TeamPrivilegesAdmin } from '@/components/community/TeamPrivilegesAdmin' // AJOUTÉ
import { useTeamConfigs, useMyMembershipRequests, useTeamMembershipActions } from '@/hooks/useTeamMembership' // AJOUTÉ
import { TeamMembershipModal } from '@/components/community/TeamMembershipModal' // AJOUTÉ
import { TeamRequestsAdmin } from '@/components/community/TeamRequestsAdmin' // AJOUTÉ
import { TeamConfigsAdmin } from '@/components/community/TeamConfigsAdmin' // AJOUTÉ
import { FaceToFaceAdmin } from '@/components/community/FaceToFaceAdmin' // AJOUTÉ
import { TeamLeaderboard } from '@/components/community/TeamLeaderboard' // AJOUTÉ
import { MonthlyRewardCard } from '@/components/community/MonthlyRewardCard' // AJOUTÉ

// AJOUTÉ : Liste statique des Teams de jeux du Sanctuary
const TEAMS = [
  { id: 'FC 26', name: 'Team - FC26', tagline: 'Pour les rois de la pelouse et du ballon rond.', color: '#22c55e', border: 'hover:border-green-500/40', glow: 'shadow-green-500/20', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202507/2511/19ad6574090b6a71c88f0e6152ae5a668cc85882d87c51b5.png' },
  { id: 'Tekken', name: 'Team - Tekken', tagline: 'L\'arène suprême des combattants au poing d\'acier.', color: '#ef4444', border: 'hover:border-red-500/40', glow: 'shadow-red-500/20', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202212/1621/rCvLik1PKDSoCaEvTIx42H3Q.png' },
  { id: 'GTA', name: 'Team - GTA', tagline: 'Les braqueurs et pilotes hors-pair de Los Santos.', color: '#a855f7', border: 'hover:border-purple-500/40', glow: 'shadow-purple-500/20', image: 'https://www.keycense.com/_next/image?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fkeycense.appspot.com%2Fo%2Fproducts%252F6826e508ef47456f98f21bb9.jpg%3Falt%3Dmedia%26token%3Dca4d55bd-6f96-4fd5-b0fc-5d9c64cc1a59&w=3840&q=60' },
  { id: 'Naruto', name: 'Team - Naruto', tagline: 'Ninja de Konoha, maîtrisez votre chakra au combat.', color: '#f97316', border: 'hover:border-orange-500/40', glow: 'shadow-orange-500/20', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202307/3118/20233826622f18fdc7d19d4138a67323050dc44f23d0dc26.jpg' },
  { id: 'Fortnite', name: 'Team - Fortnite', tagline: 'Construction rapide, top 1 et danses légendaires.', color: '#06b6d4', border: 'hover:border-cyan-500/40', glow: 'shadow-cyan-500/20', image: 'https://cms-assets.unrealengine.com/cm6l5gfpm05kr07my04cqgy2x/output=format:webp/cmhkq5qwo2mid07on940m6a7k' },
  { id: '2K NBA', name: 'Team - 2K NBA', tagline: 'Dunk, drible et paniers à trois points sur le parquet.', color: '#eab308', border: 'hover:border-yellow-500/40', glow: 'shadow-yellow-500/20', image: 'https://www.lockercodes.com/wp-content/uploads/NBA-2K26-Locker-Codes.jpg' }
]

export function Community() {
  const { data: leaders, isLoading } = useLeaderboard()
  const { user } = useAuth() // AJOUTÉ
  const { data: metadata } = useUserMetadata() // AJOUTÉ
  const updateCommunityMutation = useUpdateCommunity() // AJOUTÉ

  const currentTeam = (metadata as any)?.community_team || null
  const isAdmin = (metadata as any)?.is_admin || false // AJOUTÉ
  const [joinedTeamName, setJoinedTeamName] = useState<string | null>(null) // AJOUTÉ
  
  // AJOUTÉS : États de gestion d'adhésion payante (Multi-teams 3 Max)
  const [targetJoinTeam, setTargetJoinTeam] = useState<any | null>(null)
  const { data: teamConfigs } = useTeamConfigs()
  const { data: myRequests } = useMyMembershipRequests() // MODIFIÉ
  const { createRequest, leaveTeam } = useTeamMembershipActions()

  // Extraire les teams rejointes et en attente
  const approvedTeams = myRequests?.filter(r => r.status === 'approved') || []
  const pendingTeams = myRequests?.filter(r => r.status === 'pending') || []
  const totalTeamsCount = approvedTeams.length;

  // AJOUTÉ : Requête en direct pour charger la liste des membres inscrits dans les teams
  const { data: allMembers } = useQuery({
    queryKey: ['all_members'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users_metadata')
        .select('user_id, display_name, avatar_url, community_team');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: allTeamPerks } = useTeamPerks() // AJOUTÉ : Charge tous les privilèges dynamiques de la base

  const handleJoinTeam = async (teamId: string) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour rejoindre une team", { position: "bottom-center" });
      window.location.href = '/login';
      return;
    }

    // Charger les configurations de frais pour cette team spécifique
    const config = teamConfigs?.find(c => c.team_id === teamId);
    if (config) {
      setTargetJoinTeam({ teamId, config }); // Ouvre la modale de paiement
    } else {
      toast.error("Frais de team non configurés", { position: "bottom-center" });
    }
  }

  const handleConfirmRequest = async () => {
    if (!targetJoinTeam) return;

    try {
      await createRequest.mutateAsync(targetJoinTeam.teamId);
      toast.success("Demande d'adhésion soumise ! Attente de validation admin.", { position: "bottom-center" });
      setTargetJoinTeam(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur de transmission", { position: "bottom-center" });
    }
  }

  const handleLeaveTeamSubmit = async (teamId: string) => {
    if (!confirm(`Voulez-vous vraiment quitter la Team ${teamId} ? Vos statistiques de victoires sur cette équipe seront perdues.`)) return;

    try {
      await leaveTeam.mutateAsync(teamId); // MODIFIÉ : Quitte uniquement l'équipe demandée
      toast.success(`Vous avez quitté la Team ${teamId}.`, { position: "bottom-center" });
    } catch (err) {
      toast.error("Échec du départ de la Team", { position: "bottom-center" });
    }
  }

  // Composant pour l'icône de monnaie (Style médaillon identique au logo)

  // Composant pour l'icône de monnaie (Style médaillon identique au logo)
  const ManiIcon = ({ size = "w-6 h-6" }) => (
    <div className={cn("rounded-full overflow-hidden border border-primary/40 bg-background shadow-neon-violet shrink-0", size)}>
      <img src="/mani.jpg" alt="M" className="w-full h-full object-cover scale-110" />
      <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]" />
    </div>
  )

  return (
    <div className="pt-40 pb-24 min-h-screen bg-background text-center font-display relative overflow-hidden animate-fade-in">
      {/* Fond d'écran immersif de la page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="community social backdrop"
        />
      </div>
      <div className="container mx-auto px-4 max-w-6xl relative z-20">
        
        {/* HEADER */}
        <header className="mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-6 text-white">
            <Users className="text-secondary" size={14} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Le Sanctuary Social</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-[0.8]">
            L'ÉLITE DU <br /><span className="text-primary text-glow-violet italic">SANCTUARY</span>
          </h1>
        </header>

        
        {/* AJOUTÉ : Carte dynamique de récompense mensuelle visible par tous */}
        <MonthlyRewardCard isAdmin={isAdmin} />

        {/* AJOUTÉ : Panneau de Gestion des Privilèges de Team (Visible uniquement Admin) */}
        {isAdmin && <TeamPrivilegesAdmin />}

        {/* AJOUTÉ : Panneau de Gestion des Cotisations (Visible uniquement Admin) */}
        {isAdmin && <TeamConfigsAdmin />}

        {/* AJOUTÉ : Panneau de Validation des Demandes d'Adhésions d'Équipes (Visible uniquement Admin) */}
        {isAdmin && <TeamRequestsAdmin />}

        {/* AJOUTÉ : Panneau d'Enregistrement de Face-à-Face (Visible uniquement Admin) */}
        {isAdmin && <FaceToFaceAdmin />}

        {/* AJOUTÉ : Classement Mensuel basé sur les victoires de Team (Visible par tous) */}
        <TeamLeaderboard />

        {/* AJOUTÉ : GRILLE DES TEAMS DE JEUX */}
        <section className="mb-24 text-left">
          <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-4">
            <Gamepad2 className="text-primary" size={24} />
            <h2 className="text-3xl font-display font-black uppercase tracking-wider text-white">
              Rejoindre une Communauté
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAMS.map((team) => {
              const isMyTeam = currentTeam === team.id;
              // Filtrer pour obtenir en direct les vrais inscrits de cette équipe
              const teamMembers = allMembers?.filter((m: any) => m.community_team === team.id) || [];

              return (
                <div 
                  key={team.id} 
                  className={cn(
                    "group relative p-8 rounded-[2.5rem] glass border border-white/5 overflow-hidden flex flex-col justify-between min-h-[350px] transition-all duration-500", // Hauteur agrandie
                    team.border,
                    isMyTeam && `border-2`
                  )}
                  style={isMyTeam ? { borderColor: team.color, boxShadow: `0 0 25px ${team.color}30` } : {}}
                >
                  {/* Arrière-plan de la carte (Image plus grande et beaucoup plus visible) */}
                  <div className="absolute inset-0 z-0 overflow-hidden">
                    <img 
                      src={team.image} 
                      className="w-full h-full object-cover opacity-30 scale-105 group-hover:scale-115 group-hover:opacity-65 transition-all duration-1000" 
                      alt={team.name} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
                  </div>

                  {/* Header de la carte */}
                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-4">
                      <h3 translate="no" className="text-2xl font-display font-black uppercase text-white leading-none">
                        {team.name}
                      </h3>
                      {isMyTeam && (
                        <span 
                          className="text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest border"
                          style={{ color: team.color, borderColor: team.color, backgroundColor: `${team.color}10` }}
                        >
                          Ma Team
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-4 leading-relaxed">
                      {team.tagline}
                    </p>
                  </div>

                  {/* Liste en direct des membres réels inscrits */}
                  <div className="relative z-10 mb-4 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase text-white/40 tracking-wider mb-2">Membres ({teamMembers.length}) :</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto pr-1 custom-scrollbar">
                      {teamMembers.map((member: any) => (
                        <span 
                          key={member.user_id} 
                          className="text-[9px] font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white/80"
                          translate="no"
                        >
                          @{member.display_name}
                        </span>
                      ))}
                      {teamMembers.length === 0 && (
                        <p className="text-[9px] italic text-white/20 uppercase tracking-widest py-1">Aucun membre inscrit</p>
                      )}
                    </div>
                  </div>

                  {/* AJOUTÉ : Privilèges exclusifs de la Team configurés en direct par l'admin */}
                  <div className="relative z-10 mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[9px] font-black uppercase text-secondary tracking-wider mb-2">Privilèges exclusifs :</p>
                    <ul className="text-[10px] text-white/80 space-y-1.5 font-bold uppercase tracking-tighter">
                      {allTeamPerks?.filter(p => p.team_id === team.id).map(p => (
                        <li key={p.id} className="flex items-start gap-2">
                          <div className="w-1 h-1 rounded-full bg-secondary mt-1.5 shrink-0" />
                          <span>{p.perk_text}</span>
                        </li>
                      ))}
                      {(!allTeamPerks || allTeamPerks.filter(p => p.team_id === team.id).length === 0) && (
                        <li className="text-[9px] italic text-white/20 uppercase tracking-widest">Aucun privilège configuré</li>
                      )}
                    </ul>
                  </div>

                  {/* Tarifs d'adhésion affichés en direct sur la carte de l'équipe */}
                  <div className="relative z-10 mb-6 flex justify-between items-center text-[9px] font-black uppercase text-white/40 tracking-wider">
                    <span>Adhésion : {teamConfigs?.find(c => c.team_id === team.id)?.join_fee || 0} F</span>
                    <span>Mensuel : {teamConfigs?.find(c => c.team_id === team.id)?.monthly_fee || 0} F</span>
                  </div>

                  {/* Actions de validation d'adhésion, de désinscription, et d'administration (Support Multi-teams 3 Max) */}
                  <div className="relative z-10 w-full">
                    {isAdmin ? (
                      <NeonButton
                        variant="ghost"
                        className="w-full py-2.5 text-[9px] font-black tracking-widest cursor-default hover:bg-transparent"
                        style={{ borderColor: `${team.color}40`, color: team.color }}
                      >
                        ADMINISTRER LA TEAM
                      </NeonButton>
                    ) : approvedTeams.some(r => r.team_id === team.id) ? (
                      <NeonButton
                        variant="ghost"
                        onClick={() => handleLeaveTeamSubmit(team.id)} // MODIFIÉ
                        className="w-full py-2.5 text-[9px] font-black tracking-widest hover:bg-red-500/10 hover:text-red-500 transition-colors"
                        style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
                      >
                        QUITTER LA TEAM
                      </NeonButton>
                    ) : pendingTeams.some(r => r.team_id === team.id) ? (
                      <NeonButton
                        variant="ghost"
                        disabled
                        className="w-full py-2.5 text-[9px] font-black tracking-widest cursor-not-allowed opacity-60 animate-pulse"
                        style={{ borderColor: 'rgba(234, 179, 8, 0.3)', color: '#eab308' }}
                      >
                        DEMANDE EN ATTENTE
                      </NeonButton>
                    ) : (
                      <NeonButton
                        variant="violet"
                        disabled={totalTeamsCount >= 3 || createRequest.isPending}
                        onClick={() => handleJoinTeam(team.id)}
                        className="w-full py-2.5 text-[9px] font-black tracking-widest"
                        style={{ borderColor: `${team.color}40` }}
                      >
                        {totalTeamsCount >= 3 ? "LIMITE TEAMS ATTEINTE (3 MAX)" : "INTÉGRER LA TEAM"}
                      </NeonButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TABLEAU DES SCORES */}
        <section className="glass border-white/5 rounded-[2.5rem] overflow-hidden text-left shadow-2xl">
          <div className="p-8 border-b border-white/5 bg-white/5 flex items-center justify-between">
            <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-3 text-white">
              <Trophy className="text-secondary" size={20} /> TOP 10 MINEURS
            </h3>
            <span className="text-[9px] font-black text-white/30 uppercase tracking-widest italic">Actualisé en direct</span>
          </div>

          {isLoading ? (
            <div className="p-32 flex flex-col items-center justify-center">
              <Loader2 className="animate-spin text-secondary mb-4" size={40} />
              <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Lecture de la base...</p>
            </div>
          ) : (
            <div className="p-0">
              {leaders && leaders.length > 0 ? (
                leaders.map((player: any, index: number) => {
                  // LOGIQUE : LE RANG EST BASÉ SUR LES HEURES
                  const rankInfo = getRank(player.total_hours || 0);
                  const meta = Array.isArray(player.users_metadata) ? player.users_metadata[0] : player.users_metadata;

                  return (
                    <div 
                      key={player.user_id} 
                      className="group flex items-center gap-6 p-8 border-b border-white/5 hover:bg-white/5 transition-all duration-300"
                    >
                      {/* Position */}
                      <div className={cn(
                        "w-12 text-3xl font-black italic", 
                        index === 0 ? "text-yellow-500 text-glow-orange" : 
                        index === 1 ? "text-slate-300" : 
                        index === 2 ? "text-orange-400" : "text-white/10"
                      )}>
                        #{index + 1}
                      </div>

                      {/* Photo de profil (Avatar) */}
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative">
                        {meta?.avatar_url ? (
                          <img src={meta.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <Star size={20} className="text-white/10" />
                        )}
                        <div className={cn("absolute bottom-0 left-0 right-0 h-1", rankInfo.bg)} style={{ backgroundColor: rankInfo.color }} />
                      </div>

                      {/* Identité et Rang (Basé sur les Heures) */}
                      <div className="flex-1">
                        <div className="font-black text-2xl uppercase tracking-tighter text-white group-hover:text-secondary transition-colors leading-none mb-1" translate="no">
                           {player.display_name || "Gamer"}
                        </div>
                        <div className={cn("text-[10px] font-black uppercase tracking-[0.2em]", rankInfo.label)}>
                          Rang {rankInfo.name} • {player.total_hours || 0}H
                        </div>
                      </div>

                      {/* Score MANI (Le critère de classement) */}
                      <div className="text-right">
                        <div className="text-secondary font-black text-3xl tracking-tighter flex items-center justify-end gap-3">
                          {player.points || 0}
                          <ManiIcon size="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-32 text-center">
                  <p className="text-sm uppercase font-black tracking-[0.4em] text-white/10">Le Sanctuary est calme...</p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* AJOUTÉ : Pop-up centré de confirmation d'intégration de team */}
      {joinedTeamName && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-secondary shadow-neon-cyan max-w-md w-full relative">
            <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="text-secondary animate-pulse" size={40} />
            </div>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-4">Félicitations !</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Vous êtes désormais membre officiel de la <span className="text-secondary font-bold">Team {joinedTeamName}</span>. Représentez fièrement vos couleurs lors de vos prochaines sessions !
            </p>
            <NeonButton 
              variant="cyan"
              className="w-full py-4 text-xs font-black"
              onClick={() => setJoinedTeamName(null)}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

      {/* AJOUTÉ : Modale de règlement d'adhésion payante */}
      {targetJoinTeam && (
        <TeamMembershipModal 
          teamId={targetJoinTeam.teamId}
          config={targetJoinTeam.config}
          onClose={() => setTargetJoinTeam(null)}
          onConfirm={handleConfirmRequest}
          isPending={createRequest.isPending}
        />
      )}

    </div>
  )
}
