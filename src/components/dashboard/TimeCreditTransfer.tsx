import React, { useState } from 'react';
import { Send, Timer } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';
import { useAvailableGamers } from '@/hooks/useAvailableGamers';
import { useAuth } from '@/hooks/useAuth';

export function TimeCreditTransfer({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  const { user } = useAuth();
  const { gamers } = useAvailableGamers();
  const [targetId, setTargetId] = useState('');
  const [minutes, setMinutes] = useState('');

  const handleSend = () => {
    if (!targetId || !minutes) {
      return toast.error("Veuillez choisir un destinataire et les minutes.");
    }
    const val = parseInt(minutes, 10);
    if (isNaN(val) || val <= 0) return toast.error("Nombre de minutes invalide");

    const targetGamer = gamers.find((g: any) => g.user_id === targetId);
    toast.success(`${val} minutes de crédit offertes à @${targetGamer?.display_name || 'Gamer'} !`);
    setMinutes('');
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-4 text-white">
        <h4 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Timer size={14} className="text-secondary" />
          Offrir du Crédit Minutes
        </h4>
      </div>

      <div className="space-y-3">
        <select
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
        >
          <option value="" disabled className="bg-background">Choisir un ami en panne de temps...</option>
          {gamers
            .filter((g: any) => g.user_id !== user?.id && !g.is_admin)
            .map((g: any) => (
              <option key={g.user_id} value={g.user_id} className="bg-background">
                @{g.display_name}
              </option>
            ))}
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Minutes (ex: 30)"
            value={minutes}
            onChange={e => setMinutes(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
          />
          <NeonButton variant="cyan" size="sm" onClick={handleSend} className="px-4">
            <Send size={12} /> Transférer
          </NeonButton>
        </div>
      </div>
    </section>
  );
}
