import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface PresenceEntry {
  id: string
  event: 'entree' | 'sortie'
  created_at: string
  closed_at: string | null
  duration_seconds: number | null
  display_name: string | null
}

/**
 * Journal des visites d'un joueur, base par la vue `presence_history`
 * (migration 20260930_presence_log).
 *
 * Retourne aussi un resume pour l'affichage : nombre de visites et duree
 * cumulee des sessions cloturees.
 */
export function usePresenceHistory(userId: string | undefined, limit = 20) {
  const query = useQuery({
    queryKey: ['presence_history', userId],
    queryFn: async () => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('presence_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) throw error
      return (data || []) as PresenceEntry[]
    },
    enabled: !!userId,
  })

  const entries = query.data ?? []

  // Une visite = une entree. Les lignes de sortie servent a retrouver la
  // duree de la session correspondante, mais ne comptent pas comme une visite.
  const visits = entries.filter((e) => e.event === 'entree').length
  const totalSeconds = entries.reduce(
    (sum, e) => sum + (e.event === 'entree' ? (e.duration_seconds || 0) : 0),
    0
  )
  const lastVisit = entries.find((e) => e.event === 'entree')?.created_at ?? null

  return {
    entries,
    visits,
    totalSeconds,
    lastVisit,
    isLoading: query.isLoading,
    // La vue n'existe pas tant que la migration n'a pas ete jouee.
    isUnavailable: Boolean(query.error) && !query.data,
  }
}

export function formatDuration(totalSeconds: number) {
  if (!totalSeconds) return '0 min'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.round((totalSeconds % 3600) / 60)
  if (h === 0) return `${m} min`
  if (m === 0) return `${h} h`
  return `${h} h ${String(m).padStart(2, '0')}`
}
