import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ManiIcon } from '@/components/ui/ManiIcon'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useLeaderboard } from '@/hooks/useLeaderboard'
import { useTeams } from '@/hooks/useTeams'
import { useConfirm } from '@/hooks/useConfirm'
import { useTeamMetas } from '@/hooks/useTeamMeta'
import { Trophy, Users, Loader2, Star, Gamepad2, Swords, Landmark, MessageSquare, Award, Target, Plus, Shield, Trash2 } from 'lucide-react'
import { getRank } from '@/lib/ranks'
import { cn } from '@blinkdotnew/ui'
import { useAuth } from '@/hooks/useAuth' 
import { useUserMetadata, useUpdateCommunity } from '@/hooks/useUserMetadata' 
import { NeonButton } from '@/components/ui/NeonButton' 
import { CyberCard } from '@/components/ui/CyberCard'
import { toast } from 'react-hot-toast'
import { useTeamPerks } from '@/hooks/useTeamPerks'
import { useTeamConfigs, useMyMembershipRequests, useTeamMembershipActions } from '@/hooks/useTeamMembership'
import { TeamMembershipModal } from '@/components/community/TeamMembershipModal'
import { TeamRequestsAdmin } from '@/components/community/TeamRequestsAdmin'
import { TeamConfigsAdmin } from '@/components/community/TeamConfigsAdmin'
import { FaceToFaceAdmin } from '@/components/community/FaceToFaceAdmin'

import { MonthlyRewardCard } from '@/components/community/MonthlyRewardCard'
import { HallOfFame } from '@/components/community/HallOfFame'
import { useLoyalty } from '@/hooks/useLoyalty'
import { TeamRenewalsAdmin } from '@/components/community/TeamRenewalsAdmin'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'

// New community proposal components
import { ClanWarCard } from '@/components/community/ClanWarCard'
import { TeamHqModal } from '@/components/community/TeamHqModal'
import { SocialFeedWall } from '@/components/community/SocialFeedWall'
import { LfgMatchmakingBoard } from '@/components/community/LfgMatchmakingBoard'
import { CommunityQuestsEvents } from '@/components/community/CommunityQuestsEvents'
import { AchievementsGrid } from '@/components/community/AchievementsGrid'
import { CreateTeamModal } from '@/components/community/CreateTeamModal'
import { AdminMasterControlModal } from '@/components/admin/AdminMasterControlModal'
import { Sliders } from 'lucide-react'

type CommunityTab = 'teams' | 'leaderboard' | 'social_lfg' | 'quests' | 'achievements';

export function Community() {
  const queryClient = useQueryClient()
  const { data: leaders, isLoading } = useLeaderboard()
  const { teams, deleteTeam } = useTeams()
  const { confirm: askConfirm, dialog: confirmDialog } = useConfirm()
  const { data: teamMetas } = useTeamMetas()
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const updateCommunityMutation = useUpdateCommunity()
  const [leftTeamName, setLeftTeamName] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CommunityTab>('teams')

  const { data: loyalty } = useLoyalty()
  const userRank = getRank(loyalty?.total_hours || 0)

  const currentTeam = (metadata as any)?.community_team || null
  const isAdmin = (metadata as any)?.is_admin || false
  const userDisplayName = (metadata as any)?.display_name || (user as any)?.email || 'Joueur'
  const [joinedTeamName, setJoinedTeamName] = useState<string | null>(null)
  
  const [targetJoinTeam, setTargetJoinTeam] = useState<any | null>(null)
  const [hqTeam, setHqTeam] = useState<any | null>(null)
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false)
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false)

  const { data: teamConfigs } = useTeamConfigs()
  const { data: myRequests } = useMyMembershipRequests()
  const { createRequest, leaveTeam, requestRenewal } = useTeamMembershipActions()

  const approvedTeams = myRequests?.filter((r: any) => r.status === 'approved') || []
  const pendingTeams = myRequests?.filter((r: any) => r.status === 'pending') || []
  const totalTeamsCount = approvedTeams.length;

  const { data: allMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['all_team_members_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('team_membership_requests')
        .select(`
          user_id,
          team_id,
          status,
          users_metadata ( display_name, avatar_url, is_admin )
        `)
        .eq('status', 'approved');

      if (error) throw error;
      
      return (data || []).filter((m: any) => {
        const profile = Array.isArray(m.users_metadata) ? m.users_metadata[0] : m.users_metadata;
        return profile?.is_admin !== true;
      });
    }
  });

  const { data: allTeamPerks } = useTeamPerks()

  const handleJoinTeam = async (teamId: string) => {
    if (!user) {
      toast.error("Veuillez vous connecter pour rejoindre une team", { position: "bottom-center" });
      window.location.hash = '#/login';
      return;
    }

    const config = teamConfigs?.find((c: any) => c.team_id === teamId);
    if (config) {
      setTargetJoinTeam({ teamId, config });
    } else {
      setTargetJoinTeam({ teamId, config: { join_fee: 5000, monthly_fee: 2000, payment_phone: '+242 06 612 34 56' } });
    }
  }

  const handleConfirmRequest = async () => {
    if (!targetJoinTeam) return;

    try {
      await createRequest.mutateAsync(targetJoinTeam.teamId);
      toast.success("Demande d'adhésion validée avec succès !", { position: "bottom-center" });
      setJoinedTeamName(targetJoinTeam.teamId);
      setTargetJoinTeam(null);
    } catch (err: any) {
      toast.error(err.message || "Erreur de transmission", { position: "bottom-center" });
    }
  }

  const handleLeaveTeamSubmit = async (teamId: string) => {
    if (!confirm(`Voulez-vous vraiment quitter la Team ${teamId} ? Vos statistiques de victoires sur cette équipe seront perdues.`)) return;

    try {
      await leaveTeam.mutateAsync({ teamId, displayName: metadata?.display_name || 'Gamer' });
      setLeftTeamName(teamId);
    } catch (err) {
      toast.error("Échec du départ de la Team", { position: "bottom-center" });
    }
  }

  const handleDeleteTeam = (team: any) => {
    askConfirm({
      title: 'Supprimer cette Team',
      subject: team.name,
      message: "La Team, sa configuration (cotisations, statut, avantages) et ses demandes d'adhésion seront supprimées définitivement. Les membres perdront leur rattachement.",
      confirmLabel: 'SUPPRIMER',
      isPending: deleteTeam.isPending,
      onConfirm: async () => {
        try {
          await supabase.from('team_membership_requests').delete().eq('team_id', team.id);
          await supabase.from('team_configs').delete().eq('team_id', team.id);

          deleteTeam.mutate(team.id, {
            onSuccess: () => {
              toast.success(`Team ${team.name} supprimée.`);
              queryClient.invalidateQueries({ queryKey: ['team_configs'] });
              refetchMembers();
            },
            onError: (err: any) => {
              toast.error(err?.message || 'Suppression impossible.', { position: 'bottom-center' });
            }
          });
        } catch (err: any) {
          toast.error(err?.message || 'Suppression impossible.', { position: 'bottom-center' });
        }
      }
    });
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Le Cocon Social",
      desc: "Rejoignez une Team de jeu (FC 26, Tekken, etc.), réglez vos cotisations de groupe et faites-vous de vrais alliés en salle.",
      icon: <Users size={28} />
    },
    {
      title: "L'Arène Ragnarok",
      desc: "C'est ici que s'affrontent les membres de chaque Team. Provoquez vos rivaux et pariez des jetons ou des heures de rang !",
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
      <OnboardingModal pageKey="community" steps={onboardingSteps} />
      {isAdmin && <AdminOnboardingModal pageKey="community" steps={adminOnboardingSteps} />}
      
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="community social backdrop"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-6xl relative z-20">
        
        {/* HEADER */}
        <header className="mb-12">
          <div className="px-3 py-1 md:px-4 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] md:tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-2 shadow-lg mb-5 relative z-10">
            <Users className="text-secondary" size={14} />
            <span className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-black" translate="no">Le Sanctuaire Social</span>
          </div>
          <h1 className="text-3xl md:text-7xl font-black uppercase tracking-tighter text-white leading-[0.85] mb-4">
            L'ÉLITE DU <br /><span className="text-primary text-glow-violet italic">SANCTUARY</span>
          </h1>
          <p className="text-xs md:text-sm text-white/60 font-sans max-w-xl mx-auto">
            Guerres de clans, classements de légende, recherche de partenaires et vie communautaire des gamers de Brazzaville.
          </p>
        </header>

        {/* NAVIGATION PAR ONGLETS (Modern UX Tabs) */}
        <div className="flex flex-wrap items-center justify-center gap-1 md:gap-2 mb-6 md:mb-12 bg-black/40 p-1 md:p-1.5 rounded-xl md:rounded-2xl border border-white/10 backdrop-blur-md max-w-3xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('teams')}
            className={cn(
              "px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 md:gap-2 cursor-pointer select-none",
              activeTab === 'teams'
                ? "bg-primary text-black shadow-neon-violet"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Swords size={14} /> Teams & Clans
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={cn(
              "px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 md:gap-2 cursor-pointer select-none",
              activeTab === 'leaderboard'
                ? "bg-secondary text-black shadow-neon-cyan"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Trophy size={14} /> Classements & Hall
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('social_lfg')}
            className={cn(
              "px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 md:gap-2 cursor-pointer select-none",
              activeTab === 'social_lfg'
                ? "bg-amber-400 text-black shadow-neon-orange"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <MessageSquare size={14} /> Mur Social & LFG
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quests')}
            className={cn(
              "px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 md:gap-2 cursor-pointer select-none",
              activeTab === 'quests'
                ? "bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Target size={14} /> Quêtes & Soirées
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('achievements')}
            className={cn(
              "px-2 md:px-4 py-1.5 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1 md:gap-2 cursor-pointer select-none",
              activeTab === 'achievements'
                ? "bg-purple-500 text-white shadow-neon-violet"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Award size={14} /> Badges
          </button>
        </div>

        {/* 1. SECTIONS ADMIN (Visible quel que soit l'onglet si admin) */}
        {isAdmin && (
          <div className="mb-5 md:mb-10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-1 text-left bg-black/40 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-amber-500/20">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-amber-400 shrink-0 md:h-4 md:w-4" />
                <span className="text-[9px] md:text-[10px] font-mono uppercase text-amber-400 font-black tracking-widest">
                  Panneau d'Arbitrage & Administration du Hub
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(true)}
                className="px-2.5 md:px-3.5 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-amber-400 text-black text-[9px] md:text-[10px] font-mono font-black uppercase flex items-center gap-1 md:gap-1.5 cursor-pointer hover:bg-amber-300 shadow-neon-orange transition-all"
              >
                <Sliders size={11} className="md:h-3 md:w-3" /> Centre de Gestion Globale
              </button>
            </div>
            <TeamRenewalsAdmin />
            <TeamRequestsAdmin />
            <TeamConfigsAdmin />
            <FaceToFaceAdmin />
          </div>
        )}

        {/* ONGLET 1 : TEAMS & CLANS */}
        {activeTab === 'teams' && (
          <div className="space-y-12">
            {/* Guerre des Clans Hebdomadaire */}
            <ClanWarCard teams={teams} />

            {/* Liste des Écuries */}
            <section className="text-left">
              <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <Gamepad2 className="text-primary" size={24} />
                  <h2 className="text-lg md:text-3xl font-display font-black uppercase tracking-wider text-white">
                    Les Écuries du Sanctuaire ({teams.length})
                  </h2>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setIsCreateTeamOpen(true)}
                    className="px-4 py-2 rounded-xl bg-primary/20 border border-primary/40 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/30 transition-all cursor-pointer"
                  >
                    + Créer une Team
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teams.map((team: any) => {
                  const isMyTeam = approvedTeams.some((r: any) => r.team_id === team.id);
                  const teamMembers = allMembers?.filter((m: any) => m.team_id === team.id) || [];
                  const config = teamConfigs?.find((c: any) => c.team_id === team.id);
                  const teamMeta = (teamMetas || {})[team.id] || {};
                  const teamStatus = config?.status || teamMeta.status || 'Actif · Top Tier';
                  const isTeamResting = /inactif|repos/i.test(teamStatus);

                  return (
                    <CyberCard
                      key={team.id}
                      accentColor={team.color}
                      className="min-h-[250px] sm:min-h-[360px] p-4 sm:p-8"
                      style={isMyTeam ? { boxShadow: `0 0 25px color-mix(in srgb, ${team.color} 25%, transparent)` } : undefined}
                      overlay={
                        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                          <img
                            src={team.image}
                            className="w-full h-full object-cover opacity-30 scale-105 group-hover:scale-115 group-hover:opacity-55 transition-all duration-1000"
                            alt={team.name}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />
                        </div>
                      }
                    >
                      <div className="flex flex-col justify-between flex-1 gap-3">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-2 sm:mb-3">
                          <h3 translate="no" className="text-lg sm:text-2xl font-display font-black uppercase text-white leading-none">
                            {team.name}
                          </h3>
                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={cn(
                                "px-1.5 sm:px-2 py-0.5 rounded-full text-[7px] sm:text-[8px] font-mono font-black uppercase tracking-wider border whitespace-nowrap",
                                isTeamResting
                                  ? "bg-white/5 border-white/15 text-white/50"
                                  : "bg-emerald-500/15 border-emerald-400/40 text-emerald-300"
                              )}
                            >
                              {teamStatus}
                            </span>
                            <span
                              className="w-3.5 h-3.5 rounded-full shadow-md"
                              style={{ backgroundColor: team.color }}
                            />
                            {isAdmin && (
                              <button
                                type="button"
                                aria-label={`Supprimer ${team.name}`}
                                onClick={() => handleDeleteTeam(team)}
                                className="p-1 rounded-lg bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                              >
                                <Trash2 size={11} />
                              </button>
                            )}
                          </div>
                        </div>

                        <p className="text-[11px] sm:text-xs text-white/60 font-sans mb-3 sm:mb-4 line-clamp-2">
                          "{team.tagline}"
                        </p>

                        <div className="flex items-center gap-2 sm:gap-3 text-[9px] sm:text-[10px] font-mono text-white/50 mb-4 sm:mb-6">
                          <span>{teamMembers.length} Gamers Membres</span>
                          <span>·</span>
                          <span className="text-secondary font-bold">{config?.monthly_fee || 2000} FCFA/mois</span>
                        </div>
                      </div>

                      <div className="relative z-10 mt-auto space-y-2.5 pt-4 border-t border-white/10">
                        {/* Bouton QG : reserve aux joueurs (l'admin passe par ADMINISTRER) */}
                        {!isAdmin && (
                          <button
                            type="button"
                            onClick={() => setHqTeam({ team, members: teamMembers, config })}
                            className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 hover:text-white text-[9px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                          >
                            <Users size={12} /> Voir le QG & Roster ({teamMembers.length})
                          </button>
                        )}

                        {/* Actions : gestion admin ou adhésion joueur */}
                        {isAdmin ? (
                          <NeonButton
                            variant="violet"
                            sweep
                            cornerAccents
                            onClick={() => setHqTeam({ team, members: teamMembers, config })}
                            className="w-full py-2.5 text-[9px] font-black tracking-widest bg-primary/30"
                            style={{ borderColor: `${team.color}40` }}
                          >
                            ADMINISTRER
                          </NeonButton>
                        ) : isMyTeam ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleLeaveTeamSubmit(team.id)}
                              className="flex-1 py-2 text-[8px] font-black uppercase tracking-wider border border-red-500/20 hover:bg-red-500/10 text-red-400 rounded-xl transition-colors cursor-pointer"
                            >
                              Quitter
                            </button>
                            <button
                              onClick={() => {
                                requestRenewal.mutate({ teamId: team.id, displayName: metadata?.display_name || 'Gamer' });
                              }}
                              className="flex-1 py-2 text-[8px] font-black uppercase tracking-wider rounded-xl border border-secondary/40 bg-secondary/15 text-secondary hover:bg-secondary/25 transition-all cursor-pointer"
                            >
                              Cotisation
                            </button>
                          </div>
                        ) : pendingTeams.some((r: any) => r.team_id === team.id) ? (
                          <NeonButton
                            variant="ghost"
                            disabled
                            className="w-full py-2.5 text-[9px] font-black tracking-widest cursor-not-allowed opacity-60 animate-pulse text-amber-400"
                          >
                            DEMANDE EN ATTENTE
                          </NeonButton>
                        ) : (
                          <NeonButton
                            variant="violet"
                            disabled={totalTeamsCount >= 3 || createRequest.isPending}
                            onClick={() => handleJoinTeam(team.id)}
                            className="w-full py-2.5 text-[9px] font-black tracking-widest bg-primary/30"
                            style={{ borderColor: `${team.color}40` }}
                          >
                            {totalTeamsCount >= 3 ? "LIMITE TEAMS ATTEINTE (3 MAX)" : "INTÉGRER LA TEAM"}
                          </NeonButton>
                        )}
                      </div>
                      </div>
                    </CyberCard>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* ONGLET 2 : CLASSEMENTS & HALL OF FAME */}
        {activeTab === 'leaderboard' && (
          <div className="space-y-12">
            <MonthlyRewardCard isAdmin={isAdmin} />

            {/* TABLEAU DES SCORES "TOP 10 MINEURS" */}
            <CyberCard hoverEffect={false} className="text-left p-0 overflow-hidden">
              <div className="p-3 md:p-8 border-b border-white/5 bg-white/5 flex items-center justify-between gap-2">
                <h3 className="font-black uppercase tracking-widest text-[10px] md:text-sm flex items-center gap-2 md:gap-3 text-white">
                  <Trophy className="text-secondary shrink-0 h-4 w-4 md:h-5 md:w-5" /> TOP 10 MINEURS DE TEMPS DE JEU
                </h3>
                <span className="text-[7px] md:text-[9px] font-black text-white/30 uppercase tracking-widest italic text-right">Actualisé en direct</span>
              </div>

              {isLoading ? (
                <div className="p-20 flex flex-col items-center justify-center">
                  <Loader2 className="animate-spin text-secondary mb-4" size={32} />
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/40">Lecture de la base...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 text-[7px] md:text-[9px] font-black uppercase tracking-widest text-white/40">
                        <th className="py-2 px-2 md:py-4 md:px-6">#</th>
                        <th className="py-2 px-2 md:py-4 md:px-6">Gamer</th>
                        <th className="py-2 px-2 md:py-4 md:px-6">Rang Actuel</th>
                        <th className="py-2 px-2 md:py-4 md:px-6">Temps Joué</th>
                        <th className="py-2 px-2 md:py-4 md:px-6 text-right"><span className="inline-flex items-center gap-1">Collecte <ManiIcon className="w-3 h-3 md:w-4 md:h-4" /></span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-xs font-mono">
                      {leaders?.slice(0, 10).map((leader: any, idx: number) => {
                        const rank = getRank(leader.total_hours || 0);
                        return (
                          <tr key={leader.user_id || idx} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-2 px-2 md:py-4 md:px-6 font-black text-secondary text-[10px] md:text-xs">
                              #{idx + 1}
                            </td>
                            <td className="py-2 px-2 md:py-4 md:px-6 font-bold text-white font-display uppercase text-[10px] md:text-xs">
                              {leader.display_name || 'Gamer'}
                            </td>
                            <td className="py-2 px-2 md:py-4 md:px-6">
                              <span className="px-1.5 md:px-2 py-0.5 rounded text-[7px] md:text-[9px] font-black uppercase border border-white/10 whitespace-nowrap" style={{ color: rank.color }}>
                                {rank.name}
                              </span>
                            </td>
                            <td className="py-2 px-2 md:py-4 md:px-6 text-white/80 text-[10px] md:text-xs whitespace-nowrap">
                              {(leader.total_hours || 0).toFixed(1)}h
                            </td>
                            <td className="py-2 px-2 md:py-4 md:px-6 text-right font-black text-amber-400 text-[10px] md:text-xs whitespace-nowrap">
                              {Math.floor((leader.total_hours || 0) / 4)} <ManiIcon className="w-3 h-3 md:w-4 md:h-4" />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CyberCard>

            <HallOfFame isAdmin={isAdmin} />
          </div>
        )}

        {/* ONGLET 3 : MUR SOCIAL & LFG */}
        {activeTab === 'social_lfg' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <SocialFeedWall />
            </div>
            <div className="lg:col-span-7">
              <LfgMatchmakingBoard />
            </div>
          </div>
        )}

        {/* ONGLET 4 : QUÊTES & SOIRÉES */}
        {activeTab === 'quests' && (
          <CommunityQuestsEvents />
        )}

        {/* ONGLET 5 : BADGES */}
        {activeTab === 'achievements' && (
          <AchievementsGrid />
        )}

      </div>

      {/* Modal Adhésion Team */}
      {targetJoinTeam && (
        <TeamMembershipModal
          onClose={() => setTargetJoinTeam(null)}
          teamId={targetJoinTeam.teamId}
          config={targetJoinTeam.config}
          onConfirm={handleConfirmRequest}
          isPending={createRequest.isPending}
        />
      )}

      {/* Modal QG de Clan */}
      {hqTeam && (
        <TeamHqModal
          team={hqTeam.team}
          members={hqTeam.members}
          config={hqTeam.config}
          isAdmin={isAdmin}
          isMember={approvedTeams.some((r: any) => r.team_id === hqTeam.team.id)}
          onClose={() => setHqTeam(null)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ['teams'] });
            queryClient.invalidateQueries({ queryKey: ['team_configs'] });
            refetchMembers();
          }}
          onJoin={() => {
            const tId = hqTeam.team.id;
            setHqTeam(null);
            handleJoinTeam(tId);
          }}
        />
      )}

      {/* Modal Créer une Team pour Admin */}
      <CreateTeamModal
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        onSuccess={() => {
          refetchMembers();
          window.location.reload();
        }}
      />

      {isAdmin && (
        <AdminMasterControlModal
          isOpen={isMasterModalOpen}
          onClose={() => setIsMasterModalOpen(false)}
        />
      )}

      {/* Confirmation de suppression d'une Team */}
      {confirmDialog}
    </div>
  );
}
