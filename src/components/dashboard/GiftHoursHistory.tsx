import React from 'react';
import { Gift } from 'lucide-react';

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
