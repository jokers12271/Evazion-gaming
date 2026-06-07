import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

// Interface de typage d'une statistique mensuelle de Team
export interface TeamStat {
  user_id: string
  team_id: string
  victories: number
  month_year: string
  users_metadata?: {
    display_name: string
    avatar_url: string
  }
}

// 1. Charger le classement mensuel d'une Team basé sur les victoires
export function useTeamLeaderboard(teamId: string) {
  const currentMonth = format(new Date(), 'MM-yyyy') // Format SQL 'MM-YYYY'

  return useQuery({
    queryKey: ['team_leaderboard', teamId, currentMonth],
    queryFn: async () => {
      if (!teamId) return []

      const { data, error } = await supabase
        .from('team_stats')
        .select('*, users_metadata(display_name, avatar_url)')
        .eq('team_id', teamId)
        .eq('month_year', currentMonth)
        .order('victories', { ascending: false })

      if (error) throw error
      return data as TeamStat[]
    }
  })
}

// 2. Enregistrer le résultat d'un match (Admin)
export function useRecordMatch() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ teamId, player1Id, player2Id, winnerId }: {
      teamId: string,
      player1Id: string,
      player2Id: string,
      winnerId: string
    }) => {
      const { error } = await supabase
        .from('team_matches')
        .insert([{
          team_id: teamId,
          player1_id: player1Id,
          player2_id: player2Id,
          winner_id: winnerId
        }])

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      const currentMonth = format(new Date(), 'MM-yyyy')
      // Actualiser le classement de la Team concernée
      queryClient.invalidateQueries({ queryKey: ['team_leaderboard', variables.teamId, currentMonth] })
    }
  })
}