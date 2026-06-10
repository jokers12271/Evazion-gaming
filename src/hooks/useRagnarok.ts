import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'
import { getRank, RANKS } from '@/lib/ranks'

export interface Challenge {
  id: string
  challenger_id: string
  challenged_id: string
  currency_type: 'MANI' | 'Hours'
  amount: number
  challenged_wager: number
  scheduled_at: string
  status: 'pending' | 'active' | 'completed' | 'cancelled'
  winner_id: string | null
  created_at: string
  challenger_metadata?: { display_name: string; avatar_url: string; community_team: string }
  challenged_metadata?: { display_name: string; avatar_url: string; community_team: string }
}

export function useRagnarok() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Lire mes défis actifs (Avec masquage automatique à 48h des duels clos)
  const myChallenges = useQuery({
    queryKey: ['ragnarok_challenges', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('ragnarok_challenges')
        .select(`
          *,
          challenger_metadata:users_metadata!challenger_id ( display_name, avatar_url, community_team ),
          challenged_metadata:users_metadata!challenged_id ( display_name, avatar_url, community_team )
        `)
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Appliquer le masquage de 48 heures pour les défis terminés ou annulés
      const now = new Date();
      const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

      return (data || []).filter((c: any) => {
        // Toujours afficher si le défi est actif ou en attente
        if (c.status === 'pending' || c.status === 'active') {
          return true;
        }
        const createdAt = new Date(c.created_at);
        return createdAt >= fortyEightHoursAgo;
      });
    },
    enabled: !!user,
    refetchInterval: 10000 
  })

  // 2. MODIFIÉ : Créer (lancer) un défi Ragnarok (Avec enregistrement de l'arène de la Team pour les victoires mensuelles)
  const createChallenge = useMutation({
    mutationFn: async ({ challengedId, currencyType, amount, scheduledAt, teamId }: {
      challengedId: string,
      currencyType: 'MANI' | 'Hours',
      amount: number,
      scheduledAt: string,
      teamId: string // AJOUTÉ
    }) => {
      if (!user) throw new Error("Vous devez être connecté.")

      // A. Récupérer les métadonnées de profil du Challenger (Moi)
      const { data: challengerMeta, error: cMetaErr } = await supabase
        .from('users_metadata')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cMetaErr) throw cMetaErr;

      // B. Récupérer séparément les heures réelles du Challenger
      const { data: challengerLp, error: cLpErr } = await supabase
        .from('loyalty_points')
        .select('total_hours')
        .eq('user_id', user.id)
        .maybeSingle()

      if (cLpErr) throw cLpErr;

      // C. Récupérer les métadonnées de profil du défié (Challenged)
      const { data: challengedMeta, error: dMetaErr } = await supabase
        .from('users_metadata')
        .select('*')
        .eq('user_id', challengedId)
        .maybeSingle()

      if (dMetaErr) throw dMetaErr;

      // D. Récupérer séparément les heures réelles du défié
      const { data: challengedLp, error: dLpErr } = await supabase
        .from('loyalty_points')
        .select('total_hours')
        .eq('user_id', challengedId)
        .maybeSingle()

      if (dLpErr) throw dLpErr;

      if (!challengerMeta || !challengedMeta) {
        throw new Error("Profils de joueurs introuvables.");
      }

      // E. Vérifier la conformité de l'équipe (Multi-teams 3 Max)
      // Charger les teams approuvées de chaque joueur
      const { data: challengerTeams } = await supabase
        .from('team_membership_requests')
        .select('team_id')
        .eq('user_id', user.id)
        .eq('status', 'approved');

      const { data: challengedTeams } = await supabase
        .from('team_membership_requests')
        .select('team_id')
        .eq('user_id', challengedId)
        .eq('status', 'approved');

      const challengerTeamList = challengerTeams?.map(t => t.team_id) || [];
      const challengedTeamList = challengedTeams?.map(t => t.team_id) || [];

      // RÈGLE 2 : Seul ceux qui sont dans une communauté validée peuvent défier
      if (challengerTeamList.length === 0) {
        throw new Error("Vous devez rejoindre au moins une Team validée pour lancer des défis.");
      }

      // RÈGLE 3 : Un joueur ne peut défier que celui qui partage au moins une Team en commun avec lui
      const sharedTeams = challengerTeamList.filter(t => challengedTeamList.includes(t));
      if (sharedTeams.length === 0) {
        throw new Error("Vous ne pouvez défier que des joueurs de votre propre Team.");
      }

      // RÈGLE 1 : Restriction de rangs
      const challengerHours = challengerLp?.total_hours || 0;
      const challengedHours = challengedLp?.total_hours || 0;

      const challengerRank = getRank(challengerHours);
      const challengedRank = getRank(challengedHours);

      const cIdx = RANKS.findIndex(r => r.name === challengerRank.name);
      const dIdx = RANKS.findIndex(r => r.name === challengedRank.name);

      const rankDiff = dIdx - cIdx;
      const hasTwoRanksRight = challengerMeta.has_two_ranks_challenge_right === true;
      const maxAllowedDiff = hasTwoRanksRight ? 2 : 1;

      if (rankDiff < 0) {
        // Le défié est de rang inférieur : autorisé
      } else if (rankDiff > maxAllowedDiff) {
        throw new Error(`Vous ne pouvez défier qu'un joueur de même rang ou du rang supérieur suivant (${hasTwoRanksRight ? '2' : '1'} max).`);
      }

      // RÈGLE 4 : Prorata asymétrique (50% de mise si le défié est de rang supérieur)
      const isChallengedHigher = dIdx > cIdx;
      const challengedWager = isChallengedHigher ? amount * 0.5 : amount;

      // F. Insérer la demande de défi (Inclusion de l'arène de la Team)
        const { error: insertErr } = await supabase
          .from('ragnarok_challenges')
          .insert([{
            challenger_id: user.id,
            challenged_id: challengedId,
            currency_type: currencyType,
            amount,
            challenged_wager: challengedWager,
            scheduled_at: scheduledAt,
            status: 'pending',
            team_id: teamId // AJOUTÉ
          }])

      if (insertErr) throw insertErr
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragnarok_challenges', user?.id] })
    }
  })

  // 3. Répondre à un défi (Fight ou Fuir)
  const respondToChallenge = useMutation({
    mutationFn: async ({ challengeId, action }: { challengeId: string, action: 'Fight' | 'Fuir' }) => {
      if (!user) throw new Error("Vous devez être connecté.")

      const status = action === 'Fight' ? 'active' : 'cancelled';

      const { error } = await supabase
        .from('ragnarok_challenges')
        .update({ status })
        .eq('id', challengeId)

      if (error) throw error

      // Si refusé (Fuir), envoyer une notification d'alerte au challenger
      if (action === 'Fuir') {
        const { data: challenge } = await supabase
          .from('ragnarok_challenges')
          .select('challenger_id, challenged_id')
          .eq('id', challengeId)
          .single();

        const { data: refuser } = await supabase
          .from('users_metadata')
          .select('display_name')
          .eq('user_id', user.id)
          .single();

        if (challenge && refuser) {
          await supabase.from('notifications').insert([{
            user_id: challenge.challenger_id,
            message: `Le joueur @${refuser.display_name} a fui votre défi Ragnarok.`
          }]);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragnarok_challenges', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['news'] })
    }
  })

  return { myChallenges, createChallenge, respondToChallenge }
}

// AJOUTÉ : Mutation de résolution administrative d'un défi (Désignation du vainqueur)
export function useResolveChallenge() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ challengeId, winnerId }: { challengeId: string, winnerId: string }) => {
      // Clôturer le duel et enregistrer le vainqueur
      const { error } = await supabase
        .from('ragnarok_challenges')
        .update({ 
          status: 'completed',
          winner_id: winnerId
        })
        .eq('id', challengeId);

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ragnarok_challenges'] })
      queryClient.invalidateQueries({ queryKey: ['all_active_challenges'] })
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] })
      queryClient.invalidateQueries({ queryKey: ['news'] })
    }
  })
}