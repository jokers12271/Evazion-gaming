import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { STATIONS } from './useStationsStatus';

export interface Station {
  id: string;
  name: string;
  label?: string;
  specs?: string;
  zone: string;
  sort_order?: number;
  is_active?: boolean;
}

export const DEFAULT_STATIONS: Station[] = STATIONS.map((id, index) => ({
  id,
  name: `Station ${index + 1}`,
  label: 'PS5 PRO',
  specs: '4K•120Hz',
  zone: index < 5 ? 'ÎLOT NORD' : 'ÎLOT SUD',
  sort_order: index,
  is_active: true
}));

const LOCAL_KEY = 'sanctuary_stations_catalog_db';

function getLocalStations(): Station[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_STATIONS;
}

export function useStations() {
  const queryClient = useQueryClient();

  const { data: stations = getLocalStations(), isLoading } = useQuery<Station[]>({
    queryKey: ['stations_catalog'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('stations')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error || !data || data.length === 0) {
          return getLocalStations();
        }

        localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
        return data as Station[];
      } catch {
        return getLocalStations();
      }
    },
    staleTime: 5000,
    refetchInterval: 10000
  });

  const updateStationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Station> }) => {
      // 1. Update local cache immediately
      const current = stations;
      const next = current.map(s => (s.id === id ? { ...s, ...updates } : s));
      localStorage.setItem(LOCAL_KEY, JSON.stringify(next));
      queryClient.setQueryData(['stations_catalog'], next);

      // 2. Persist to Supabase database
      try {
        const { error } = await supabase
          .from('stations')
          .update({
            name: updates.name,
            zone: updates.zone,
            specs: updates.specs,
            label: updates.label
          })
          .eq('id', id);

        if (error) {
          console.warn("Supabase update station warning:", error.message);
        }
      } catch (err) {
        console.warn("Supabase update station exception:", err);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stations_catalog'] });
    }
  });

  const updateStation = (id: string, updates: Partial<Station>) => {
    updateStationMutation.mutate({ id, updates });
  };

  return {
    stations,
    updateStation,
    isLoading
  };
}

export function groupStationsByZone(stations: Station[]) {
  const groups: { zone: string; stations: Station[] }[] = [];
  const map = new Map<string, Station[]>();

  for (const s of stations) {
    const zoneKey = s.zone || 'ZONE PRINCIPALE';
    const list = map.get(zoneKey) || [];
    list.push(s);
    map.set(zoneKey, list);
  }

  for (const [zone, list] of map.entries()) {
    groups.push({ zone, stations: list });
  }

  return groups;
}
