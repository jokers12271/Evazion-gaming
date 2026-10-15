import React from 'react';
import { History, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

export function UnifiedTransferHistory({ boxClass, boxStyle }: { boxClass: string; boxStyle: any }) {
  const history = [
    { id: '1', type: 'reception', label: 'Reçu de @Junior_Apex', value: '+10 MANI', date: 'Hier 18:20' },
    { id: '2', type: 'envoi', label: 'Envoyé à @Ghost_Brazza', value: '-30 MIN', date: 'Il y a 3 j' }
  ];

  return (
    <section className={boxClass} style={boxStyle}>
      <div className="flex items-center justify-between mb-2 text-white">
        <h4 className="font-display uppercase tracking-widest text-[8px] text-muted-foreground font-black flex items-center gap-1">
          <History size={12} className="text-primary" />
          Mes Achats Store & Transferts
        </h4>
      </div>

      <div className="space-y-1.5">
        {history.map(item => (
          <div
            key={item.id}
            className="flex items-center justify-between p-1.5 rounded-lg bg-white/[0.03] border border-white/5 text-[10px] text-white"
          >
            <div className="flex items-center gap-1.5">
              {item.type === 'reception' ? (
                <div className="p-0.5 rounded bg-green-500/20 text-green-400">
                  <ArrowDownLeft size={11} />
                </div>
              ) : (
                <div className="p-0.5 rounded bg-orange-500/20 text-orange-400">
                  <ArrowUpRight size={11} />
                </div>
              )}
              <div>
                <p className="font-bold text-[9.5px] leading-tight">{item.label}</p>
                <span className="text-[7.5px] text-white/40">{item.date}</span>
              </div>
            </div>
            <span
              className={`font-mono font-black text-[10px] ${
                item.type === 'reception' ? 'text-green-400' : 'text-orange-400'
              }`}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
