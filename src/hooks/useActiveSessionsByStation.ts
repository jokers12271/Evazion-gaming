import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ActiveSessionInfo {
  station_id: string
  status: 'en cours' | 'pending'
  end_time: string | null
  display_name: string | null
  type: 'reservation' | 'team'
}

export function useActiveSessionsByStation() {
  return useQuery({
    queryKey: ['active_sessions_by_station'],
    queryFn: async () => {
      const now = Date.now()
      const map = new Map<string, ActiveSessionInfo>()

      // 1. Réservations individuelles actives
      const { data: reservations, error: resError } = await supabase
        .from('reservations')
        .select('station_id, status, start_time, end_time, display_name')
        .in('status', ['en cours', 'pending'])

      if (resError) throw resError

      for (const res of reservations ?? []) {
        if (res.status === 'en cours') {
          map.set(res.station_id, {
            station_id: res.station_id,
            status: 'en cours',
            end_time: res.end_time,
            display_name: res.display_name,
            type: 'reservation',
          })
          continue
        }

        const start = res.start_time ? new Date(res.start_time).getTime() : NaN
        const end = res.end_time ? new Date(res.end_time).getTime() : NaN
        if (Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end) {
          map.set(res.station_id, {
            station_id: res.station_id,
            status: 'pending',
            end_time: res.end_time,
            display_name: res.display_name,
            type: 'reservation',
          })
        }
      }

      // 2. Sessions d'équipe actives
      const { data: teamSessions, error: teamError } = await supabase
        .from('team_sessions')
        .select('station_id, status, start_time, end_time')
        .in('status', ['en cours', 'pending'])

      if (!teamError) {
        for (const ts of teamSessions ?? []) {
          if (map.has(ts.station_id)) continue

          if (ts.status === 'en cours') {
            map.set(ts.station_id, {
              station_id: ts.station_id,
              status: 'en cours',
              end_time: ts.end_time,
              display_name: null,
              type: 'team',
            })
            continue
          }

          const start = ts.start_time ? new Date(ts.start_time).getTime() : NaN
          const end = ts.end_time ? new Date(ts.end_time).getTime() : NaN
          if (Number.isFinite(start) && Number.isFinite(end) && start <= now && now <= end) {
            map.set(ts.station_id, {
              station_id: ts.station_id,
              status: 'pending',
              end_time: ts.end_time,
              display_name: null,
              type: 'team',
            })
          }
        }
      }

      return map
    },
    refetchInterval: 10000,
  })
}
