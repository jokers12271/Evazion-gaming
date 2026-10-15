import React, { useState } from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Send, Coins } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';
import { useAvailableGamers } from '@/hooks/useAvailableGamers';
import { useAuth } from '@/hooks/useAuth';

export function ManiTransfer({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  const { user } = useAuth();
  const { gamers } = useAvailableGamers();
  const [targetId, setTargetId] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = () => {
    if (!targetId || !amount) {
      return toast.error("Veuillez choisir un destinataire et un montant.");
    }
    const val = parseInt(amount, 10);
    if (isNaN(val) || val <= 0) return toast.error("Montant invalide");

    const targetGamer = gamers.find((g: any) => g.user_id === targetId);
    toast.success(`${val} MANI transférés avec succès à @${targetGamer?.display_name || 'Gamer'} !`);
    setAmount('');
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-4 text-white">
        <h4 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Coins size={14} className="text-amber-400" />
          Transfert de Jetons EVAZION
        </h4>
      </div>

      <div className="space-y-3">
        <select
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
        >
          <option value="" disabled className="bg-background">Choisir un ami gamer...</option>
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
            placeholder="Montant MANI"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
          />
          <NeonButton variant="orange" size="sm" onClick={handleSend} className="px-4">
            <Send size={12} /> Envoyer
          </NeonButton>
        </div>
      </div>
    </section>
  );
}
