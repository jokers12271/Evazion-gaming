import React, { useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { Clock, Plus, Trash2, Edit3, Check, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useReservationDurations, DurationItem } from '@/hooks/usePricing';
import { cyberAudio } from '@/lib/cyberAudio';

export function AdminPricingManager({ inModal }: { inModal?: boolean }) {
  const { durations, addDuration, updateDuration, deleteDuration } = useReservationDurations();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [labelVal, setLabelVal] = useState('');
  const [minutesVal, setMinutesVal] = useState(60);
  const [priceVal, setPriceVal] = useState(1500);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newMinutes, setNewMinutes] = useState(60);
  const [newPrice, setNewPrice] = useState(1500);

  const handleEdit = (idx: number, item: DurationItem) => {
    setEditingIndex(idx);
    setLabelVal(item.label);
    setMinutesVal(item.minutes);
    setPriceVal(item.price);
    cyberAudio.playClick();
  };

  const handleSave = (idx: number) => {
    updateDuration(idx, { label: labelVal, minutes: Number(minutesVal), price: Number(priceVal) });
    setEditingIndex(null);
    cyberAudio.playSuccess();
    toast.success("Tarif mis à jour !", { position: 'bottom-center' });
  };

  const handleDelete = (idx: number) => {
    deleteDuration(idx);
    cyberAudio.playClick();
    toast.success("Tarif supprimé.", { position: 'bottom-center' });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;
    addDuration({ label: newLabel, minutes: Number(newMinutes), price: Number(newPrice) });
    setShowAddForm(false);
    setNewLabel('');
    setNewMinutes(60);
    setNewPrice(1500);
    cyberAudio.playSuccess();
    toast.success("Nouveau tarif ajouté !", { position: 'bottom-center' });
  };

  const innerContent = (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-amber-400" />
          <h3 className="text-sm font-black uppercase text-white tracking-wider">
            Grille Tarifaire du Hub ({durations.length})
          </h3>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            cyberAudio.playClick();
          }}
          className="px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 hover:bg-amber-500/30 transition-all cursor-pointer"
        >
          <Plus size={12} /> {showAddForm ? "Fermer" : "Ajouter un tarif"}
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        Modifiez, ajoutez ou supprimez les durées et tarifs proposés aux membres lors de la réservation.
      </p>

      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-4 p-4 rounded-xl bg-black/60 border border-amber-500/30 space-y-3 animate-fade-in">
          <h4 className="text-xs font-black uppercase text-amber-400">Nouveau Tarif</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Libellé (ex: 3 HEURES)"
              className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
              required
            />
            <input
              type="number"
              value={newMinutes}
              onChange={(e) => setNewMinutes(Number(e.target.value))}
              placeholder="Durée en minutes"
              className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
              required
            />
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              placeholder="Prix en FCFA"
              className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 rounded-lg border border-white/10 text-[10px] uppercase font-mono text-white/60 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-black text-[10px] uppercase tracking-wider shadow-md cursor-pointer"
            >
              Enregistrer
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
        {durations.map((item, idx) => {
          const isEditing = editingIndex === idx;

          return (
            <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3">
              {isEditing ? (
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={labelVal}
                    onChange={(e) => setLabelVal(e.target.value)}
                    className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    value={minutesVal}
                    onChange={(e) => setMinutesVal(Number(e.target.value))}
                    className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="number"
                    value={priceVal}
                    onChange={(e) => setPriceVal(Number(e.target.value))}
                    className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-bold focus:outline-none focus:border-amber-400"
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-black uppercase text-white">
                      {item.label} <span className="text-muted-foreground font-normal">({item.minutes} min)</span>
                    </div>
                  </div>
                  <div className="text-xs font-mono font-black text-amber-400">
                    {item.price} FCFA
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1 shrink-0">
                {isEditing ? (
                  <>
                    <button
                      onClick={() => handleSave(idx)}
                      className="p-1.5 rounded-lg bg-emerald-500 text-black cursor-pointer shadow-md"
                      title="Sauver"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      onClick={() => setEditingIndex(null)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white cursor-pointer"
                      title="Annuler"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(idx, item)}
                      className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400 text-white/80 cursor-pointer transition-all"
                      title="Modifier"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(idx)}
                      className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 hover:bg-red-500/20 text-red-400 cursor-pointer transition-all"
                      title="Supprimer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </>
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
