import React, { useState } from 'react';
import { Users, Plus, Timer, Coins } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';
import { useAvailableGamers } from '@/hooks/useAvailableGamers';

export function TeamCagnotteForm({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  const { gamers } = useAvailableGamers();
  const [packName, setPackName] = useState('Duo Élite (2H)');
  const [station, setStation] = useState('PS5_1');
  const [selectedPartner, setSelectedPartner] = useState('');

  const handleLaunch = () => {
    if (!selectedPartner) return toast.error("Veuillez choisir un coéquipier pour la cagnotte.");
    toast.success(`Cagnotte d'équipe lancée sur ${station} avec @${selectedPartner} ! Invitation envoyée.`);
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-4 text-white">
        <h4 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Users size={14} className="text-secondary" />
          Cagnotte & Session d'Équipe
        </h4>
      </div>

      <div className="space-y-3">
        <select
          value={packName}
          onChange={e => setPackName(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
        >
          <option value="Duo Élite (2H)">Pack Duo Élite (120 min - 2 Joueurs)</option>
          <option value="Escouade LAN (3H)">Pack Escouade LAN (180 min - 4 Joueurs)</option>
          <option value="Marathon Team (5H)">Pack Marathon Team (300 min)</option>
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={station}
            onChange={e => setStation(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
          >
            {['PS5_1', 'PS5_2', 'PS5_3', 'PS5_4', 'PS5_5', 'PS5_6', 'PS5_7', 'PS5_8', 'PS5_9', 'PS5_10'].map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select
            value={selectedPartner}
            onChange={e => setSelectedPartner(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
          >
            <option value="" disabled>Inviter un coéquipier...</option>
            {gamers.map((g: any) => (
              <option key={g.user_id} value={g.display_name}>
                @{g.display_name}
              </option>
            ))}
          </select>
        </div>

        <NeonButton variant="cyan" size="sm" onClick={handleLaunch} className="w-full py-2.5">
          <Plus size={14} /> Créer la Session Groupée
        </NeonButton>
      </div>
    </section>
  );
}
