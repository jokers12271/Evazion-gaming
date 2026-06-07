import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useFavorites() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // 1. Lire la liste des favoris de l'utilisateur (avec jointure pour avoir les détails des profils)
  const favorites = useQuery({
    queryKey: ['favorites', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error } = await supabase
        .from('gamer_favorites')
        .select(`
          favorite_user_id,
          users_metadata:favorite_user_id (
            user_id,
            display_name,
            avatar_url,
            is_present,
            community_team
          )
        `)
        .eq('user_id', user.id)

      if (error) throw error
      return data || []
    },
    enabled: !!user
  })

  // 2. Ajouter un joueur aux favoris
  const addFavorite = useMutation({
    mutationFn: async (favoriteUserId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")
      const { error } = await supabase
        .from('gamer_favorites')
        .insert({ user_id: user.id, favorite_user_id: favoriteUserId })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
    }
  })

  // 3. Supprimer un joueur des favoris
  const removeFavorite = useMutation({
    mutationFn: async (favoriteUserId: string) => {
      if (!user) throw new Error("Vous devez être connecté.")
      const { error } = await supabase
        .from('gamer_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('favorite_user_id', favoriteUserId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] })
    }
  })

  return { favorites, addFavorite, removeFavorite }
}