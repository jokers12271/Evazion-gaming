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
import { HallOfFame } from '@/components/community/HallOfFame'
import { useLoyalty } from '@/hooks/useLoyalty'
import { TeamRenewalsAdmin } from '@/components/community/TeamRenewalsAdmin'
import { useAllPendingRenewals } from '@/hooks/useTeamMembership'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Swords } from 'lucide-react'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { Landmark } from 'lucide-react'

// AJOUTÉ : Liste statique des Teams de jeux du Sanctuary
const TEAMS = [
  { id: 'FC 26', name: 'Team - FC26', tagline: 'Pour les rois de la pelouse et du ballon rond.', color: '#22c55e', border: 'hover:border-green-500/40', glow: 'shadow-green-500/20', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202507/2511/19ad6574090b6a71c88f0e6152ae5a668cc85882d87c51b5.png' },
  { id: 'Tekken', name: 'Team - Tekken', tagline: 'L\'arène suprême des combattants au poing d\'acier.', color: '#ef4444', border: 'hover:border-red-500/40', glow: 'shadow-red-500/20', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202212/1621/rCvLik1PKDSoCaEvTIx42H3Q.png' },
  { id: 'GTA', name: 'Team - GTA', tagline: 'Les braqueurs et pilotes hors-pair de Los Santos.', color: '#a855f7', border: 'hover:border-purple-500/40', glow: 'shadow-purple-500/20', image: 'https://www.keycense.com/_next/image?url=https%3A%2F%2Ffirebasestorage.googleapis.com%2Fv0%2Fb%2Fkeycense.appspot.com%2Fo%2Fproducts%252F6826e508ef47456f98f21bb9.jpg%3Falt%3Dmedia%26token%3Dca4d55bd-6f96-4fd5-b0fc-5d9c64cc1a59&w=3840&q=60' },
  { id: 'Naruto', name: 'Team - Naruto', tagline: 'Ninja de Konoha, maîtrisez votre chakra au combat.', color: '#f97316', border: 'hover:border-orange-500/40', glow: 'shadow-orange-500/20', image: 'https://image.api.playstation.com/vulcan/ap/rnd/202307/3118/20233826622f18fdc7d19d4138a67323050dc44f23d0dc26.jpg' },
  { id: 'Fortnite', name: 'Team - Fortnite', tagline: 'Construction rapide, top 1 et danses légendaires.', color: '#06b6d4', border: 'hover:border-cyan-500/40', glow: 'shadow-cyan-500/20', image: 'https://cms-assets.unrealengine.com/cm6l5gfpm05kr07my04cqgy2x/output=format:webp/cmhkq5qwo2mid07on940m6a7k' },
  { id: '2K NBA', name: 'Team - 2K NBA', tagline: 'Dunk, drible et paniers à trois points sur le parquet.', color: '#eab308', border: 'hover:border-yellow-500/40', glow: 'shadow-yellow-500/20', image: 'https://www.lockercodes.com/wp-content/uploads/NBA-2K26-Locker-Codes.jpg' },
  { id: 'Mortal Kombat', name: 'Team - Mortal Kombat', tagline: 'Rejoignez le combat suprême de l’Earthrealm. Fatality !', color: '#dc2626', border: 'hover:border-red-600/40', glow: 'shadow-red-600/20', image: 'https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/1971870/library_600x900.jpg' } // AJOUTÉ ICI
]


export function Community() {
  const { data: leaders, isLoading } = useLeaderboard()
  const { user } = useAuth() // AJOUTÉ
  const { data: metadata } = useUserMetadata() // AJOUTÉ
  const updateCommunityMutation = useUpdateCommunity() // AJOUTÉ
  const [leftTeamName, setLeftTeamName] = useState<string | null>(null) // AJOUTÉ ICI

  const { data: loyalty } = useLoyalty() // AJOUTÉ : Lecture du cumul de fidélité
  const userRank = getRank(loyalty?.total_hours || 0) // Détermination du Rang

  const currentTeam = (metadata as any)?.community_team || null
  const isAdmin = (metadata as any)?.is_admin || false // AJOUTÉ
  const userDisplayName = (metadata as any)?.display_name || (user as any)?.email || 'Joueur'
  const [joinedTeamName, setJoinedTeamName] = useState<string | null>(null) // AJOUTÉ
  
  // AJOUTÉS : États de gestion d'adhésion payante (Multi-teams 3 Max)
  const [targetJoinTeam, setTargetJoinTeam] = useState<any | null>(null)
  const { data: teamConfigs } = useTeamConfigs()
  const { data: myRequests } = useMyMembershipRequests() // MODIFIÉ
  const { createRequest, leaveTeam, requestRenewal } = useTeamMembershipActions()

  // Extraire les teams rejointes et en attente
  const approvedTeams = myRequests?.filter(r => r.status === 'approved') || []
  const pendingTeams = myRequests?.filter(r => r.status === 'pending') || []
  const totalTeamsCount = approvedTeams.length;

  // MODIFIÉ : Chargement en direct des membres approuvés directement depuis la table de liaison (Pour le support Multi-teams)
  const { data: allMembers } = useQuery({
    queryKey: ['all_team_members_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select(`
          user_id,
          team_id,
          status,
          users_metadata ( display_name, avatar_url )
        `)
        .eq('status', 'approved'); // Uniquement les membres validés payés

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
      // Transmission du teamId et du pseudo de gamer pour la notification admin
      await leaveTeam.mutateAsync({ teamId, displayName: metadata?.display_name || 'Gamer' });
      setLeftTeamName(teamId); // Ouvre le pop-up visuel de confirmation pour le joueur
    } catch (err) {
      toast.error("Échec du départ de la Team", { position: "bottom-center" });
    }
  }

  // Composant pour l'icône de monnaie (Style médaillon identique au logo)
  const ManiIcon = ({ size = "w-6 h-6" }) => (
    <div className={cn("rounded-full overflow-hidden border border-primary/40 bg-background shadow-neon-violet shrink-0 relative", size)}>
      <img src="/mani.jpg" alt="M" className="w-full h-full object-cover scale-110" />
      <div className="absolute inset-0 shadow-[inset_0_0_4px_rgba(0,0,0,0.8)]" />
    </div>
  )

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Le Cocon Social",
      desc: "Rejoignez une Team de jeu (FC 26, Tekken, etc.), réglez vos cotisations de groupe et faites-vous de vrais alliés en salle.",
      icon: <Users size={28} />
    },
    {
      title: "L'Arène Ragnarok",
      desc: "C'est ici que s'affrontent les membres de chaque Team. Provoquez vos rivaux et pariez des MANI ou des heures de rang !",
      icon: <Swords size={28} />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Saisie de face-à-face",
      desc: "Enregistrez ici les résultats des duels sportifs ou de combat en face-à-face disputés dans la salle physique pour mettre à jour le classement.",
      icon: <Users size={28} />
    },
    {
      title: "Cotisations & Gestion des frais",
      desc: "Définissez les frais d'intégration et les cotisations de chaque Team d'un clic. Approuvez ou refusez les demandes d'adhésions reçues.",
      icon: <Landmark size={28} />
    }
  ]

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-center font-display relative overflow-hidden animate-fade-in">
      {/* GUIDE DU JOUEUR */}
      <OnboardingModal pageKey="community" steps={onboardingSteps} />

      {/* GUIDE DU GÉRANT (AJOUTÉ) */}
      {isAdmin && <AdminOnboardingModal pageKey="community" steps={adminOnboardingSteps} />}
      
      {/* Fond d'écran immersif de la page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="/blason.png" 
          className="w-full h-full object-cover opacity-20" 
          alt="community social backdrop"
        />
      </div>
      <div className="container mx-auto px-5 max-w-6xl relative z-20">
        
        {/* HEADER */}
        <header className="mb-20">
          <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-2 shadow-lg mb-5 relative z-10">
            <Users className="text-secondary" size={14} />
            <span className="text-[10px] uppercase tracking-[0.2em] font-black" translate="no">Le Sanctuary Social</span>
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter text-white leading-[0.8]">
            L'ÉLITE DU <br /><span className="text-primary text-glow-violet italic">SANCTUARY</span>
          </h1>
        </header>

        {/* PANNEAU DE CONTRÔLE DES COTISATIONS ADMIN (AJOUTÉ) */}
        {isAdmin && <TeamRenewalsAdmin />}

        {/* AJOUTÉ : Panneau de Validation des Demandes d'Adhésions d'Équipes (Visible uniquement Admin) */}
        {isAdmin && <TeamRequestsAdmin />}
        
        {/* AJOUTÉ : Carte dynamique de récompense mensuelle visible par tous */}
        <MonthlyRewardCard isAdmin={isAdmin} />

        {/* AJOUTÉ : Panneau de Gestion des Privilèges de Team (Visible uniquement Admin) */}
        {isAdmin && <TeamPrivilegesAdmin />}

        {/* AJOUTÉ : Panneau de Gestion des Cotisations (Visible uniquement Admin) */}
        {isAdmin && <TeamConfigsAdmin />}

        {/* AJOUTÉ : Panneau d'Enregistrement de Face-à-Face (Visible uniquement Admin) */}
        {isAdmin && <FaceToFaceAdmin />}

        {/* AJOUTÉ : Classement Mensuel basé sur les victoires de Team (Visible par tous) */}
        <TeamLeaderboard />

        {/* PANNEAU DU HALL OF FAME (AJOUTÉ) */}
        <HallOfFame />

        {/* AJOUTÉ : GRILLE DES TEAMS DE JEUX */}
        <section className="mb-24 text-left">
          <div className="flex items-center gap-3 mb-10 border-b border-white/5 pb-4">
            <Gamepad2 className="text-primary" size={24} />
            <h2 className="text-3xl font-display font-black uppercase tracking-wider text-white">
              Rejoindre une Communauté
            </h2>
          </div>

          {/* BANDEAU DE RELANCE AUTOMATIQUE À J-7 (DÈS LE 24 DU MOIS EN COURS - AJOUTÉ) */}
          {(() => {
            const now = new Date();
            const currentDay = now.getDate();
            const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const isWithinSevenDays = (lastDayOfMonth - currentDay) <= 7;

            // Trouver si l'utilisateur connecté a des abonnements actifs à renouveler
            const myUnpaidActiveTeams = approvedTeams.filter(r => !r.renewal_status);

            if (isWithinSevenDays && myUnpaidActiveTeams.length > 0 && !isAdmin) {
              return (
                <div className="mb-10 bg-yellow-500/10 border-2 border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.25)] p-6 rounded-[2rem] text-left animate-pulse">
                  <h4 className="text-xs font-black uppercase text-yellow-500 tracking-wider mb-2">
                    ⚠️ RELANCE DE COTISATIONS MENSUELLES (ÉCHÉANCE AU 1er)
                  </h4>
                  <p className="text-xs text-white/80 leading-relaxed font-bold uppercase tracking-tight">
                    Vos abonnements pour les Teams ({myUnpaidActiveTeams.map(t => t.team_id).join(', ')}) arrivent à échéance le 1er du mois. 
                    Pour conserver vos privilèges de Team exclusifs, pensez à régler vos cotisations mensuelles (remise de votre Rang appliquée d'office) via le bouton « Payer Cotisation » avant le 1er !
                  </p>
                </div>
              );
            }
            return null;
          })()}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {TEAMS.map((team) => {
              // MODIFIÉ : Vérification si le joueur connecté fait partie de cette team
              const isMyTeam = approvedTeams.some(r => r.team_id === team.id);
              
              // MODIFIÉ : Filtrer les membres réels validés de cette équipe
              const teamMembers = allMembers?.filter((m: any) => m.team_id === team.id) || [];

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
                          style={{ color: team.color, borderColor: team.color, backgroundColor: `${team.color}10` }}>Ma Team</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium mb-4 leading-relaxed">{team.tagline}</p>
                  </div>

                  {/* Liste en direct des membres réels inscrits (Décodage robuste multi-teams) */}
                  <div className="relative z-10 mb-4 bg-black/40 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
                    <p className="text-[9px] font-black uppercase text-white/40 tracking-wider mb-2">Membres ({teamMembers.length}) :</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto pr-1 custom-scrollbar">
                      {teamMembers.map((member: any) => {
                        const profile = Array.isArray(member.users_metadata) ? member.users_metadata[0] : member.users_metadata;
                        const displayName = profile?.display_name || 'Gamer';
                        return (
                          <span 
                            key={member.user_id} 
                            className="text-[9px] font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white/80"
                            translate="no"
                          >
                            @{displayName}
                          </span>
                        );
                      })}
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

                  {/* Tarifs d'adhésion affichés en direct avec remises de rang */}
                  <div className="relative z-10 mb-6 flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
                    <span className="text-white/40">Adhésion : {teamConfigs?.find(c => c.team_id === team.id)?.join_fee || 0} F</span>
                    <span className="text-white/40 flex items-center gap-1.5">
                      Mensuel :{' '}
                      {(() => {
                        const baseMonthly = teamConfigs?.find(c => c.team_id === team.id)?.monthly_fee || 0;
                        let finalMonthly = baseMonthly;
                        let isDiscounted = false;

                        if (userRank.name === 'Légende') {
                          finalMonthly = Math.round(baseMonthly * 0.75);
                          isDiscounted = true;
                        } else if (userRank.name === 'Iconique' || userRank.name === 'Divin') {
                          finalMonthly = Math.round(baseMonthly * 0.50);
                          isDiscounted = true;
                        }

                        return isDiscounted ? (
                          <>
                            <span className="line-through opacity-30">{baseMonthly}</span>
                            <span className="text-cyan-400 font-black animate-pulse">{finalMonthly} F</span>
                          </>
                        ) : (
                          <span className="text-white">{baseMonthly} F</span>
                        );
                      })()}
                    </span>
                  </div>

                  <div className="relative z-10 w-full space-y-2">
                    {isAdmin ? (
                      <NeonButton
                        variant="ghost"
                        className="w-full py-2.5 text-[9px] font-black tracking-widest cursor-default hover:bg-transparent"
                        style={{ borderColor: `${team.color}40`, color: team.color }}
                      >
                        ADMINISTRER LA TEAM
                      </NeonButton>
                    ) : (() => {
                      const request = approvedTeams.find(r => r.team_id === team.id);
                      const isPendingRenewal = request?.renewal_status === 'pending_renewal';

                      if (request) {
                        return (
                          <div className="flex flex-col sm:flex-row gap-2 w-full">
                            {/* Bouton de Désinscription */}
                            <button
                              onClick={() => handleLeaveTeamSubmit(team.id)}
                              className="flex-1 py-2 text-[8px] font-black uppercase tracking-wider border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-xl transition-colors"
                            >
                              Quitter la Team
                            </button>

                            {/* Bouton de Renouvellement (CORRIGÉ ET OPÉRATIONNEL) */}
                            <button
                          onClick={() => {
                            if (!isPendingRenewal && confirm(`Confirmer la demande de renouvellement de votre cotisation pour la Team ${team.id} ?`)) {
                              requestRenewal.mutate({ teamId: team.id, displayName: metadata?.display_name || 'Gamer' }); // MODIFIÉ ICI
                            }
                          }}
                          disabled={isPendingRenewal}
                          className={cn(
                                "flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-xl border transition-all duration-300",
                                isPendingRenewal 
                                  ? "border-yellow-500/20 bg-yellow-500/5 text-yellow-500 cursor-not-allowed animate-pulse" 
                                  : "border-secondary/20 hover:bg-secondary/15 text-secondary"
                              )}
                            >
                              {isPendingRenewal ? "Renouvellement..." : "Payer Cotisation"}
                            </button>
                          </div>
                        );
                      }

                      if (pendingTeams.some(r => r.team_id === team.id)) {
                        return (
                          <NeonButton
                            variant="ghost"
                            disabled
                            className="w-full py-2.5 text-[9px] font-black tracking-widest cursor-not-allowed opacity-60 animate-pulse"
                            style={{ borderColor: 'rgba(234, 179, 8, 0.3)', color: '#eab308' }}
                          >
                            DEMANDE EN ATTENTE
                          </NeonButton>
                        );
                      }

                      return (
                        <NeonButton
                          variant="violet"
                          disabled={totalTeamsCount >= 3 || createRequest.isPending}
                          onClick={() => handleJoinTeam(team.id)}
                          className="w-full py-2.5 text-[9px] font-black tracking-widest"
                          style={{ borderColor: `${team.color}40` }}
                        >
                          {totalTeamsCount >= 3 ? "LIMITE TEAMS ATTEINTE (3 MAX)" : "INTÉGRER LA TEAM"}
                        </NeonButton>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TABLEAU DES SCORES "TOP 10 MINEURS" AVEC ALIGNEMENT GÉOMÉTRIQUE PARFAIT (CORRIGÉ ET MODÉLISÉ) */}
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
                      /* GRILLE COMPACTE ET ALIGNÉE GÉOMÉTRIQUEMENT SUR MOBILE (CORRIGÉ & DISSOCIÉ DE TOUT ÉCRASEMENT D'AVATAR) */
                      className="group grid grid-cols-[30px_42px_1fr_85px] items-center gap-3 md:gap-6 px-4 md:px-8 py-4 border-b border-white/5 hover:bg-white/5 transition-all duration-300 text-white text-xs"
                    >
                      {/* Position */}
                      <div className={cn(
                        "text-sm md:text-xl font-black italic", 
                        index === 0 ? "text-yellow-500" : 
                        index === 1 ? "text-slate-300" : 
                        index === 2 ? "text-orange-400" : "text-white/15"
                      )}>
                        #{index + 1}
                      </div>

                      {/* Photo de profil (Avatar - Verrouillé contre le rétrécissement mobile avec shrink-0) */}
                      <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl overflow-hidden border border-white/10 bg-white/5 flex items-center justify-center relative shrink-0">
                        {meta?.avatar_url ? (
                          <img src={meta.avatar_url} className="w-full h-full object-cover" alt="avatar" />
                        ) : (
                          <Star size={14} className="text-white/10" />
                        )}
                        <div className={cn("absolute bottom-0 left-0 right-0 h-1", rankInfo.bg)} style={{ backgroundColor: rankInfo.color }} />
                      </div>

                      {/* Identité et Rang (Basé sur les Heures, pseudos sécurisés et compacts) */}
                      <div className="text-left truncate flex flex-col justify-center">
                        <div className="font-black text-[11px] md:text-sm uppercase tracking-tight text-white group-hover:text-secondary transition-colors leading-none mb-1.5 truncate" translate="no">
                           {player.display_name || "Gamer"}
                        </div>
                        <div className={cn("text-[10px] font-black uppercase tracking-[0.2em]", rankInfo.label)}>
                          Rang {rankInfo.name} • {player.total_hours || 0}H
                        </div>
                      </div>

                      {/* Score MANI aligné au millimètre près sur la droite */}
                      <div className="flex items-center justify-end gap-1.5 text-right font-black text-secondary text-xs md:text-lg">
                        {player.points || 0}
                        <ManiIcon size="w-5 h-5" />
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

      {/* POP-UP CONFIRMATION DÉPART DE TEAM (AJOUTÉ) */}
      {leftTeamName && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.25)] max-w-md w-full relative">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/30">
              <Users className="text-red-500 animate-pulse" size={32} />
            </div>
            
            <h3 className="text-2xl font-black uppercase mb-2">Team Quittée</h3>
            <p className="text-[10px] uppercase font-black tracking-widest text-red-500 mb-6">Team - {leftTeamName}</p>
            
            <div className="bg-black/50 border border-white/5 rounded-3xl p-6 mb-8 text-center backdrop-blur-sm">
              <p className="text-xs font-bold italic leading-relaxed text-white/80">
                Vous avez bien quitté la Team {leftTeamName}. Vos accès à ses privilèges exclusifs ont été révoqués avec succès.
              </p>
            </div>

            <NeonButton 
              variant="ghost"
              className="w-full py-4 text-xs font-black"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
              onClick={() => setLeftTeamName(null)}
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