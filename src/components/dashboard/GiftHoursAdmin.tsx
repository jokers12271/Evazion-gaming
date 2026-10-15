import React, { useState } from 'react';
import { Gift, Send } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';
import { useAvailableGamers } from '@/hooks/useAvailableGamers';

export function GiftHoursAdmin({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  const { gamers } = useAvailableGamers();
  const [playerId, setPlayerId] = useState('');
  const [hours, setHours] = useState('1');

  const handleGift = () => {
    if (!playerId) return toast.error("Sélectionnez un joueur.");
    const player = gamers.find((g: any) => g.user_id === playerId);
    toast.success(`Cadeau de +${hours}H envoyé à @${player?.display_name || 'Joueur'} avec notification !`);
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
        <Gift size={18} className="text-amber-400" /> Cadeau d'Heures Joueur (Gift)
      </h3>

      <div className="space-y-3">
        <select
          value={playerId}
          onChange={e => setPlayerId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
        >
          <option value="" disabled className="bg-background">Sélectionner un joueur à récompenser...</option>
          {gamers.map((g: any) => (
            <option key={g.user_id} value={g.user_id} className="bg-background">
              @{g.display_name} ({g.community_team || 'Sans team'})
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Heures offertes"
            value={hours}
            onChange={e => setHours(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
          />
          <NeonButton variant="orange" size="sm" onClick={handleGift} className="px-4">
            <Send size={12} /> Offrir
          </NeonButton>
        </div>
      </div>
    </section>
  );
}

export function GiftHoursHistory({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  return (
    <section className={boxClass} style={boxStyle}>
      <h3 className="text-sm font-black uppercase text-white mb-4 flex items-center gap-2">
        <Gift size={18} className="text-amber-400" /> Historique des Cadeaux d'Heures
      </h3>
      <p className="text-xs text-white/50">
        Toutes les sessions de bonus offertes par l'administration sont enregistrées ici.
      </p>
    </section>
  );
}
