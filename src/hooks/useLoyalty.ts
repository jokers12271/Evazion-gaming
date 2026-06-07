import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export interface LoyaltyPoints {
  user_id: string
  points: number 
  total_hours: number
  total_minutes: number
  time_credit_minutes: number
}

export function useLoyalty() {
  const { user } = useAuth()

  return useQuery({
    queryKey: ['loyalty_points', user?.id],
    queryFn: async () => {
      if (!user) return null

      const { data, error } = await supabase
        .from('loyalty_points')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle()

      if (error) throw error
      
      // Si l'utilisateur n'a pas encore de ligne, on lui en crée une PROPRE à 0
      if (!data) {
        const { data: newData, error: err } = await supabase
          .from('loyalty_points')
          .insert({ 
            user_id: user.id,
            points: 0,
            total_hours: 0,
            total_minutes: 0,
            time_credit_minutes: 0 // <--- On force le 0 ici
          })
          .select()
          .single()
        if (err) throw err
        return newData as LoyaltyPoints
      }

      return data as LoyaltyPoints
    },
    enabled: !!user
  })
}