import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query' // MODIFIÉ
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface UserMetadata {
  user_id: string
  membership_type: 'standard' | 'vip'
  display_name: string
  avatar_url: string
  is_admin: boolean
  community_team?: string | null
  is_present?: boolean // AJOUTÉ
  last_scanned_at?: string | null // AJOUTÉ
}

export function useUserMetadata() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['user_metadata', user?.id],
    queryFn: async () => {
      if (!user) return null
      
      // 1. Tenter de récupérer le profil dans la table users_metadata
      const { data, error } = await supabase
        .from('users_metadata')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) {
        console.error("Erreur lors de la récupération des métadonnées:", error.message)
        throw error
      }

      // 2. Si l'utilisateur existe déjà, on retourne ses données
      if (data) return data as UserMetadata

      // 3. Si l'utilisateur n'existe pas (nouveau compte), on le crée instantanément
      // On utilise le début de son email comme nom par défaut
      const defaultName = user.email ? user.email.split('@')[0] : 'Gamer'
      
      const { data: inserted, error: insError } = await supabase
        .from('users_metadata')
        .insert({
          user_id: user.id,
          display_name: defaultName,
          membership_type: 'standard',
          avatar_url: '',
          is_admin: false
        })
        .select()
        .single()

      if (insError) {
        console.error("Erreur lors de la création du profil par défaut:", insError.message)
        throw insError
      }

      return inserted as UserMetadata
    },
    enabled: !!user, // Ne s'exécute que si l'utilisateur est connecté
    staleTime: 1000 * 60 * 5, // Cache de 5 minutes
  })
}

// AJOUTÉ : Mutation pour mettre à jour la team choisie par l'utilisateur
export function useUpdateCommunity() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (teamName: string | null) => {
      if (!user) throw new Error("Vous devez être connecté.")
      const { error } = await supabase
        .from('users_metadata')
        .update({ community_team: teamName })
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_metadata', user?.id] })
    }
  })
}

// AJOUTÉ : Mutation pour enregistrer l'entrée ou la sortie d'un joueur
export function useUpdatePresence() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (status: 'entree' | 'sortie') => {
      if (!user) throw new Error("Vous devez être connecté.")
      const isEntering = status === 'entree';

      const { error } = await supabase
        .from('users_metadata')
        .update({ 
          is_present: isEntering,
          last_scanned_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_metadata', user?.id] })
      queryClient.invalidateQueries({ queryKey: ['present_users'] }) // Utilisé par la page Salon
    }
  })
}

// AJOUTÉ : Mutation de modération pour bannir ou débannir un compte joueur (Admin)
export function useToggleBanPlayer() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, isBanned }: { userId: string, isBanned: boolean }) => {
      const { error } = await supabase
        .from('users_metadata')
        .update({ is_banned: isBanned })
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user_metadata', variables.userId] })
      queryClient.invalidateQueries({ queryKey: ['admin_users'] })
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] })
    }
  })
}