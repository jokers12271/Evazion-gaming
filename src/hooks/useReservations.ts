import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from './useAuth'

export function useReservations() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: reservations, isLoading } = useQuery({
    queryKey: ['reservations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      // MODIFIÉ : Utilisation de maybeSingle() à la place de single() pour éviter les plantages de requêtes
      const { data: profile, error: profileError } = await supabase
        .from('users_metadata')
        .select('is_admin')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Erreur de profil dans useReservations :", profileError.message);
      }

      // Requête de base
      let query = supabase.from('reservations').select('*, loyalty_points(points, total_hours)');
      
      // Si l'utilisateur n'est PAS admin, il ne voit que les siennes
      if (!profile?.is_admin) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query.order('start_time', { ascending: false });
      if (error) {
        console.error("Erreur d'affichage des réservations (votre base de données rejette la jointure) :", error.message); // AJOUTÉ
        throw error;
      }
      return data || [];
    },
    enabled: !!user,
    refetchInterval: 10000 // Actualisation en temps réel toutes les 10 secondes
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status, end_time, started_at }: { id: string, status: string, end_time?: string, started_at?: string }) => {
      const updateData: any = { status };
      if (end_time) updateData.end_time = end_time;
      if (started_at) updateData.started_at = started_at;
      const { error } = await supabase.from('reservations').update(updateData).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['loyalty_points'] });
      queryClient.invalidateQueries({ queryKey: ['admin_stats'] });
    }
  });

  const deleteReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reservations').delete().eq('id', id);
      if (error) throw error; // MODIFIÉ (Intercepte et lève l'erreur)
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reservations'] })
  });

  // AJOUT DE LA MUTATION DE CRÉATION DE RÉSERVATION MANQUANTE
  const createReservation = useMutation({
    mutationFn: async (newRes: { 
      station_id: string; 
      start_time: string; 
      end_time: string; 
      display_name: string; 
      status: string;
      user_id?: string;
    }) => {
      // Si un user_id spécifique est passé (ex: scan par l'admin), on l'utilise, sinon on prend l'utilisateur connecté
      const finalUserId = newRes.user_id || user?.id;
      if (!finalUserId) throw new Error("Aucun ID utilisateur disponible pour la réservation.");

      const { error } = await supabase.from('reservations').insert([
        {
          station_id: newRes.station_id,
          start_time: newRes.start_time,
          end_time: newRes.end_time,
          display_name: newRes.display_name,
          status: newRes.status,
          user_id: finalUserId
        }
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  });

  // AJOUTÉ : Mutation de mise en pause d'une réservation individuelle
  const pauseReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('pause_reservation', { res_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  });

  // AJOUTÉ : Mutation de reprise de pause d'une réservation individuelle
  const resumeReservation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc('resume_reservation', { res_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
    }
  });

  // MISE À JOUR DU RETOUR POUR INCLURE TOUTES LES MUTATIONS
  return { 
    reservations, 
    isLoading, 
    updateStatus, 
    deleteReservation, 
    createReservation, 
    pauseReservation, 
    resumeReservation // AJOUTÉS AU RETOUR
  };
}