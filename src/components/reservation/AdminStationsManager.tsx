import React, { useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Monitor, Edit3, Check } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useStations } from '@/hooks/useStations';
import { cyberAudio } from '@/lib/cyberAudio';
import { cn } from '@blinkdotnew/ui';

export function AdminStationsManager({ inModal }: { inModal?: boolean }) {
  const { stations, updateStation } = useStations();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [nameVal, setNameVal] = useState('');
  const [zoneVal, setZoneVal] = useState('');
  const [specsVal, setSpecsVal] = useState('');

  const handleEdit = (s: { id: string; name: string; zone: string; specs?: string }) => {
    setEditingId(s.id);
    setNameVal(s.name);
    setZoneVal(s.zone);
    setSpecsVal(s.specs || 'PS5 PRO // 4K 120HZ');
    cyberAudio.playClick();
  };

  const handleSave = (id: string) => {
    updateStation(id, { name: nameVal, zone: zoneVal, specs: specsVal });
    setEditingId(null);
    cyberAudio.playSuccess();
    toast.success(`Poste ${id.replace('_', ' #')} mis à jour !`, { position: 'bottom-center' });
  };

  const innerContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Monitor size={18} className="text-amber-400" />
          <h3 className="text-sm font-black uppercase text-white tracking-wider">
            Configuration des Stations ({stations.length})
          </h3>
        </div>
        <span className="text-[9px] font-mono font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
          Mode Édition
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Modifiez le nom, la zone et les caractéristiques techniques de chaque poste en temps réel.
      </p>

      <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
        {stations.map((s) => {
          const isEditing = editingId === s.id;

          return (
            <div key={s.id} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              {isEditing ? (
                <div className="flex-1 w-full space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={nameVal}
                      onChange={(e) => setNameVal(e.target.value)}
                      className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                      placeholder="Nom (ex: Console #1)"
                    />
                    <input
                      type="text"
                      value={zoneVal}
                      onChange={(e) => setZoneVal(e.target.value)}
                      className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                      placeholder="Zone (ex: LIGNE NORD)"
                    />
                  </div>
                  <input
                    type="text"
                    value={specsVal}
                    onChange={(e) => setSpecsVal(e.target.value)}
                    className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                    placeholder="Caractéristiques (ex: PS5 PRO // 4K 120HZ)"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <div className="text-xs font-black uppercase text-white flex items-center gap-2">
                    <span>{s.id.replace('_', ' #')}</span>
                    <span className="text-amber-400">• {s.name}</span>
                  </div>
                  <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-0.5 flex flex-wrap gap-2">
                    <span>Zone : {s.zone}</span>
                    <span>•</span>
                    <span className="text-secondary">{s.specs || 'PS5 PRO // 4K 120HZ'}</span>
                  </div>
                </div>
              )}

              <div className="self-end sm:self-center">
                {isEditing ? (
                  <button
                    onClick={() => handleSave(s.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500 text-black font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer shadow-md"
                  >
                    <Check size={12} /> Sauver
                  </button>
                ) : (
                  <button
                    onClick={() => handleEdit(s)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 text-white/80 font-black text-[10px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Edit3 size={12} /> Modifier
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );

  if (inModal) {
    return <div className="text-left font-display">{innerContent}</div>;
  }

  return (
    <CyberCard variant="orange" hoverEffect={false} className="p-6 text-left">
      {innerContent}
    </CyberCard>
  );
}
