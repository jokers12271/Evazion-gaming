import React, { useState } from 'react';
import { Swords, Flame, Coins } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';
import { useAvailableGamers } from '@/hooks/useAvailableGamers';
import { useAuth } from '@/hooks/useAuth';

export function RagnarokChallenge({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  const { user } = useAuth();
  const { gamers } = useAvailableGamers();
  const [targetId, setTargetId] = useState('');
  const [game, setGame] = useState('TEKKEN 8');
  const [betMani, setBetMani] = useState('5');

  const handleChallenge = () => {
    if (!targetId) return toast.error("Choisissez un adversaire.");
    const target = gamers.find((g: any) => g.user_id === targetId);
    toast.success(`Défi Ragnarok lancé contre @${target?.display_name || 'Rival'} sur ${game} avec une mise de ${betMani} MANI !`);
  };

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-4 text-white">
        <h4 className="font-display uppercase tracking-widest text-[10px] text-muted-foreground font-black flex items-center gap-2">
          <Swords size={14} className="text-red-500 animate-pulse" />
          Lancer un Défi Ragnarok (PVP)
        </h4>
      </div>

      <div className="space-y-3">
        <select
          value={targetId}
          onChange={e => setTargetId(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
        >
          <option value="" disabled className="bg-background">Choisir un rival...</option>
          {gamers
            .filter((g: any) => g.user_id !== user?.id && !g.is_admin)
            .map((g: any) => (
              <option key={g.user_id} value={g.user_id} className="bg-background">
                @{g.display_name}
              </option>
            ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <select
            value={game}
            onChange={e => setGame(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
          >
            <option value="TEKKEN 8">TEKKEN 8</option>
            <option value="EA SPORTS FC 26">EA SPORTS FC 26</option>
            <option value="MORTAL KOMBAT 1">MORTAL KOMBAT 1</option>
            <option value="STREET FIGHTER 6">STREET FIGHTER 6</option>
          </select>

          <div className="relative">
            <Coins size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-400" />
            <input
              type="number"
              placeholder="Mise MANI"
              value={betMani}
              onChange={e => setBetMani(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-8 pr-2 text-xs text-white"
            />
          </div>
        </div>

        <NeonButton variant="danger" size="sm" onClick={handleChallenge} className="w-full py-2.5">
          <Flame size={14} /> Déclarer le Duel
        </NeonButton>
      </div>
    </section>
  );
}

export function RagnarokAdmin({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  return (
    <section className={boxClass} style={boxStyle}>
      <h3 className="text-sm font-black uppercase text-white mb-3 flex items-center gap-2">
        <Swords size={18} className="text-amber-400" /> Duels Ragnarok en Cours
      </h3>
      <p className="text-xs text-white/50 leading-relaxed">
        Suivi des paris de jetons et validation des scores d'arène disputés en salle.
      </p>
    </section>
  );
}
