import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

// Interface de typage d'un privilège de team
export interface TeamPerk {
  id: string
  team_id: string
  perk_text: string
  created_at: string
}

export function useTeamPerks(teamId?: string) {
  return useQuery({
    queryKey: ['team_perks', teamId],
    queryFn: async () => {
      let query = supabase.from('team_perks').select('*')
      if (teamId) {
        query = query.eq('team_id', teamId)
      }
      const { data, error } = await query.order('created_at', { ascending: true })
      if (error) throw error
      return data as TeamPerk[]
    }
  })
}

export function useManageTeamPerks() {
  const queryClient = useQueryClient()

  // 1. Ajouter un privilège
  const addPerk = useMutation({
    mutationFn: async ({ teamId, perkText }: { teamId: string, perkText: string }) => {
      const { error } = await supabase
        .from('team_perks')
        .insert([{ team_id: teamId, perk_text: perkText }])
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_perks'] })
    }
  })

  // 2. Mettre à jour un privilège
  const updatePerk = useMutation({
    mutationFn: async ({ id, perkText }: { id: string, perkText: string }) => {
      const { error } = await supabase
        .from('team_perks')
        .update({ perk_text: perkText })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_perks'] })
    }
  })

  // 3. Supprimer un privilège
  const deletePerk = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('team_perks')
        .delete()
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team_perks'] })
    }
  })

  return { addPerk, updatePerk, deletePerk }
}