import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface DurationItem {
  id: string;
  label: string;
  minutes: number;
  price: number;
  sort_order?: number;
}

const DEFAULT_DURATIONS: DurationItem[] = [
  { id: 'd30', label: '30 MIN', minutes: 30, price: 1000, sort_order: 0 },
  { id: 'd60', label: '1 HEURE', minutes: 60, price: 1500, sort_order: 1 },
  { id: 'd90', label: '1H 30 MIN', minutes: 90, price: 2000, sort_order: 2 },
  { id: 'd120', label: '2 HEURES', minutes: 120, price: 2500, sort_order: 3 },
  { id: 'd300', label: 'Pack Légende (5H)', minutes: 300, price: 5000, sort_order: 4 }
];

let globalDurations: DurationItem[] = (() => {
  const saved = localStorage.getItem('sanctuary_pricing_catalog');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch {}
  }
  return DEFAULT_DURATIONS;
})();

const listeners = new Set<(durations: DurationItem[]) => void>();

export function useReservationDurations() {
  const [durations, setDurations] = useState<DurationItem[]>(globalDurations);

  useEffect(() => {
    async function fetchFromDb() {
      try {
        const { data, error } = await supabase
          .from('reservation_durations')
          .select('*')
          .order('sort_order', { ascending: true });

        if (data && Array.isArray(data) && data.length > 0) {
          globalDurations = data.map((d: any) => ({
            id: d.id,
            label: d.label,
            minutes: d.minutes,
            price: d.price,
            sort_order: d.sort_order ?? 0
          }));
          localStorage.setItem('sanctuary_pricing_catalog', JSON.stringify(globalDurations));
          setDurations([...globalDurations]);
          listeners.forEach(fn => fn(globalDurations));
        }
      } catch (e) {
        console.warn("Supabase fetch reservation_durations error (using local):", e);
      }
    }

    fetchFromDb();

    const handler = (newDurations: DurationItem[]) => {
      setDurations([...newDurations]);
    };
    listeners.add(handler);

    const storageHandler = (e: StorageEvent) => {
      if (e.key === 'sanctuary_pricing_catalog' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            globalDurations = parsed;
            setDurations([...globalDurations]);
            listeners.forEach(fn => fn(globalDurations));
          }
        } catch {}
      }
    };
    window.addEventListener('storage', storageHandler);

    return () => {
      listeners.delete(handler);
      window.removeEventListener('storage', storageHandler);
    };
  }, []);

  const saveToDbAndState = async (next: DurationItem[]) => {
    globalDurations = next;
    localStorage.setItem('sanctuary_pricing_catalog', JSON.stringify(next));
    setDurations([...next]);
    listeners.forEach(fn => fn(next));

    // Sync to Supabase reservation_durations table
    try {
      // First, sync or upsert items
      for (const [idx, item] of next.entries()) {
        const payload = {
          id: item.id || `d_${Date.now()}_${idx}`,
          label: item.label,
          minutes: item.minutes,
          price: item.price,
          sort_order: idx
        };
        await supabase.from('reservation_durations').upsert(payload, { onConflict: 'id' });
      }
    } catch (err) {
      console.warn("Supabase pricing sync error:", err);
    }
  };

  const addDuration = (item: Omit<DurationItem, 'id'>) => {
    const newItem: DurationItem = {
      ...item,
      id: `d_${Date.now()}`,
      sort_order: globalDurations.length
    };
    const next = [...globalDurations, newItem];
    saveToDbAndState(next);
  };

  const updateDuration = (index: number, item: Partial<DurationItem>) => {
    const next = globalDurations.map((d, i) => i === index ? { ...d, ...item } : d);
    saveToDbAndState(next);
  };

  const deleteDuration = async (index: number) => {
    const target = globalDurations[index];
    const next = globalDurations.filter((_, i) => i !== index);
    saveToDbAndState(next);

    if (target?.id) {
      try {
        await supabase.from('reservation_durations').delete().eq('id', target.id);
      } catch (err) {
        console.warn("Supabase pricing delete error:", err);
      }
    }
  };

  return {
    durations,
    addDuration,
    updateDuration,
    deleteDuration
  };
}
