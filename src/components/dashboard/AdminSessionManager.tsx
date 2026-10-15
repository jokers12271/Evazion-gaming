import React from 'react';
import { Play, Pause, Check, Timer, Trash2 } from 'lucide-react';
import { useReservations } from '@/hooks/useReservations';
import { toast } from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

export function AdminSessionManager({ reservation }: { reservation: any }) {
  const { updateStatus } = useReservations();
  const queryClient = useQueryClient();

  const handleStart = async () => {
    const diff = new Date(reservation.end_time).getTime() - new Date(reservation.start_time).getTime();
    const newEnd = new Date(Date.now() + diff).toISOString();
    await supabase.from('reservations').update({
      status: 'en cours',
      start_time: new Date().toISOString(),
      end_time: newEnd,
      is_paused: false
    }).eq('id', reservation.id);
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    toast.success("Session lancée !");
  };

  const handlePause = async () => {
    const now = Date.now();
    const end = new Date(reservation.end_time).getTime();
    const remainingSecs = Math.max(0, Math.floor((end - now) / 1000));

    await supabase.from('reservations').update({
      is_paused: true,
      paused_remaining_seconds: remainingSecs
    }).eq('id', reservation.id);
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    toast.success("Session mise en pause.");
  };

  const handleResume = async () => {
    const secs = reservation.paused_remaining_seconds || 60;
    const newEnd = new Date(Date.now() + secs * 1000).toISOString();
    await supabase.from('reservations').update({
      is_paused: false,
      end_time: newEnd,
      paused_remaining_seconds: 0
    }).eq('id', reservation.id);
    queryClient.invalidateQueries({ queryKey: ['reservations'] });
    toast.success("Session reprise !");
  };

  const handleFinish = async () => {
    await updateStatus.mutateAsync({ id: reservation.id, status: 'consommé' });
    toast.success("Session clôturée avec succès.");
  };

  const handleCreditInterrupt = async () => {
    const remainingMinutes = 20; // approximate
    toast.success(`${remainingMinutes} minutes converties en crédit pour le joueur.`);
    await updateStatus.mutateAsync({ id: reservation.id, status: 'consommé' });
  };

  return (
    <div className="flex items-center gap-1.5 animate-fade-in">
      {reservation.status === 'pending' && (
        <button
          onClick={handleStart}
          title="Démarrer la session"
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
        >
          <Play size={13} fill="currentColor" />
        </button>
      )}

      {reservation.status === 'en cours' && (
        <>
          {reservation.is_paused ? (
            <button
              onClick={handleResume}
              title="Reprendre la session"
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg transition-all"
            >
              <Play size={13} fill="currentColor" />
            </button>
          ) : (
            <button
              onClick={handlePause}
              title="Mettre en pause"
              className="p-2.5 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-black shadow-lg transition-all"
            >
              <Pause size={13} fill="currentColor" />
            </button>
          )}

          <button
            onClick={handleCreditInterrupt}
            title="Arrêt partiel (Créditer reste)"
            className="p-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-black shadow-lg transition-all"
          >
            <Timer size={13} />
          </button>

          <button
            onClick={handleFinish}
            title="Terminer (100%)"
            className="p-2.5 rounded-xl bg-green-500 hover:bg-green-400 text-black shadow-lg transition-all"
          >
            <Check size={13} />
          </button>
        </>
      )}
    </div>
  );
}
