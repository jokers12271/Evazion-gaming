import React from 'react';
import { Swords } from 'lucide-react';

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
