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

  // 1. Lire mes défis actifs (en cours ou en attente)
  const myChallenges = useQuery({
    queryKey: ['ragnarok_challenges', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('ragnarok_challenges')
        .select(`
          *,
          challenger_metadata:challenger_id ( display_name, avatar_url, community_team ),
          challenged_metadata:challenged_id ( display_name, avatar_url, community_team )
        `)
        .or(`challenger_id.eq.${user.id},challenged_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Challenge[]
    },
    enabled: !!user,
    refetchInterval: 10000 // Actualisation temps réel pour voir les Fight/Fuir
  })

  // 2. Créer (lancer) un défi Ragnarok
  const createChallenge = useMutation({
    mutationFn: async ({ challengedId, currencyType, amount, scheduledAt }: {
      challengedId: string,
      currencyType: 'MANI' | 'Hours',
      amount: number,
      scheduledAt: string
    }) => {
      if (!user) throw new Error("Vous devez être connecté.")

      // A. Récupérer mes métadonnées (Challenger)
      const { data: challengerMeta } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(total_hours)')
        .eq('user_id', user.id)
        .single()

      // B. Récupérer les métadonnées du défié (Challenged)
      const { data: challengedMeta } = await supabase
        .from('users_metadata')
        .select('*, loyalty_points(total_hours)')
        .eq('user_id', challengedId)
        .single()

      if (!challengerMeta || !challengedMeta) throw new Error("Profils introuvables.")

      // RÈGLE 2 : Seul ceux qui sont dans une communauté (Team) peuvent défier
      if (!challengerMeta.community_team) {
        throw new Error("Vous devez d'abord rejoindre une Team pour lancer un défi.")
      }

      // RÈGLE 3 : Un joueur ne peut défier que celui qui est dans la même TEAM que lui
      if (challengerMeta.community_team !== challengedMeta.community_team) {
        throw new Error("Vous ne pouvez défier que des joueurs de votre propre Team.")
      }

      // RÈGLE 1 : Restriction de rangs
      const challengerLp = Array.isArray(challengerMeta.loyalty_points) ? challengerMeta.loyalty_points[0] : challengerMeta.loyalty_points;
      const challengedLp = Array.isArray(challengedMeta.loyalty_points) ? challengedMeta.loyalty_points[0] : challengedMeta.loyalty_points;

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
        // Le défié est de rang inférieur, c'est autorisé (pas de restriction vers le bas)
      } else if (rankDiff > maxAllowedDiff) {
        throw new Error(`Vous ne pouvez défier qu'un joueur de même rang ou du rang supérieur suivant (${hasTwoRanksRight ? '2' : '1'} max).`);
      }

      // RÈGLE 4 : Prorata asymétrique (50% de mise si le défié est de rang supérieur)
      const isChallengedHigher = dIdx > cIdx;
      const challengedWager = isChallengedHigher ? amount * 0.5 : amount;

      // C. Insérer le défi
      const { error } = await supabase
        .from('ragnarok_challenges')
        .insert([{
          challenger_id: user.id,
          challenged_id: challengedId,
          currency_type: currencyType,
          amount,
          challenged_wager: challengedWager,
          scheduled_at: scheduledAt,
          status: 'pending'
        }])

      if (error) throw error
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