import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface SpotlightEvent {
  title: string;
  subtitle: string;
  date: string;
  description: string;
  cashprize: string;
  mani: string;
  slots: string;
  image_url: string;
}

export const EMPTY_SPOTLIGHT: SpotlightEvent = {
  title: '',
  subtitle: '',
  date: '',
  description: '',
  cashprize: '',
  mani: '',
  slots: '',
  image_url: ''
};

export const DEFAULT_SPOTLIGHT: SpotlightEvent = {
  title: 'EA SPORTS FC 26',
  subtitle: 'SANCTUARY MASTERS',
  date: 'Samedi 4 Octobre - 15h00',
  description: 'Le plus grand tournoi 1v1 de Brazzaville sur consoles PS5 Pro et ecrans 4K.',
  cashprize: '150 000 FCFA',
  mani: '+60 Jetons',
  slots: '28/32 Places Reservees (4 Restantes)',
  image_url: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200'
};

/**
 * Evenement phare.
 * - Public : ne renvoie que l'evenement publie (is_active = true).
 * - Admin : renvoie aussi le brouillon (is_active = false).
 */
export function useSpotlight(isAdmin = false) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['spotlight_event', isAdmin],
    queryFn: async () => {
      let builder = supabase.from('spotlight_event').select('*').eq('id', 'main');
      if (!isAdmin) builder = builder.eq('is_active', true);
      const { data, error } = await builder.maybeSingle();

      if (error || !data) return null;
      if (!isAdmin && data.is_active === false) return null;

      return {
        title: data.title,
        subtitle: data.subtitle,
        date: data.date,
        description: data.description,
        cashprize: data.cashprize,
        mani: data.mani,
        slots: data.slots,
        image_url: data.image_url
      } as SpotlightEvent;
    },
    refetchInterval: 4000
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['spotlight_event'] });
  };

  /** Publie (ou met a jour) l'evenement et le rend visible. */
  const publishSpotlight = async (data: SpotlightEvent) => {
    const { error } = await supabase.from('spotlight_event').upsert({
      id: 'main',
      ...data,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    if (error) throw new Error(error.message);
    invalidate();
  };

  /** Masque l'evenement sans le supprimer (brouillon conserve). */
  const unpublishSpotlight = async () => {
    const { error } = await supabase
      .from('spotlight_event')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', 'main');
    if (error) throw new Error(error.message);
    invalidate();
  };

  return {
    spotlight: query.data ?? null,
    isLoading: query.isLoading,
    publishSpotlight,
    unpublishSpotlight,
    // Alias retro-compatibles
    saveSpotlight: publishSpotlight,
    updateSpotlight: publishSpotlight
  };
}
