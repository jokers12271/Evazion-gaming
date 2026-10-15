import React, { useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { Swords } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function FaceToFaceAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [winner, setWinner] = useState('');

  return (
    <div className="mb-10 text-left">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs font-mono font-black text-amber-400 uppercase">
          <Swords size={16} />
          <span>Saisie des Duels Face-à-Face physiques (Admin)</span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-[9px] font-mono font-black uppercase text-amber-400 hover:underline"
        >
          {isOpen ? 'Fermer' : '+ Enregistrer un résultat'}
        </button>
      </div>

      {isOpen && (
        <CyberCard variant="orange" hoverEffect={false} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <input
              type="text"
              placeholder="Pseudo Joueur 1"
              value={p1}
              onChange={e => setP1(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Pseudo Joueur 2"
              value={p2}
              onChange={e => setP2(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
            />
            <input
              type="text"
              placeholder="Pseudo Vainqueur"
              value={winner}
              onChange={e => setWinner(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white"
            />
          </div>
          <NeonButton
            variant="orange"
            size="sm"
            onClick={() => {
              if (!p1 || !p2 || !winner) return toast.error("Tous les champs sont requis.");
              toast.success(`Victoire enregistrée pour @${winner} ! Classement mis à jour.`);
              setP1(''); setP2(''); setWinner('');
            }}
          >
            Valider le match
          </NeonButton>
        </CyberCard>
      )}
    </div>
  );
}
