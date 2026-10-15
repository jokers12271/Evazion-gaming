import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Award, Coins, Clock, Settings2, Trash2, Save, Sparkles } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { ModalShell } from '@/components/ui/ModalShell';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useTournamentPrizes, DEFAULT_PRIZE_TEMPLATES, type TournamentPrize } from '@/hooks/useTournamentPrizes';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';
import { cn } from '@blinkdotnew/ui';
import { ManiIcon } from '@/components/ui/ManiIcon';

const PLACE_META = [
  { icon: Trophy, ring: 'from-amber-500/15 via-amber-500/5', border: 'border-amber-500/40', text: 'text-amber-400', badge: 'bg-amber-400 text-black' },
  { icon: Medal, ring: 'from-purple-500/15 via-purple-500/5', border: 'border-purple-500/30', text: 'text-purple-300', badge: 'bg-white/10 text-white' },
  { icon: Award, ring: 'from-cyan-500/15 via-cyan-500/5', border: 'border-cyan-500/30', text: 'text-cyan-300', badge: 'bg-white/10 text-white' }
];

const FIELD =
  'w-full bg-white/5 border border-white/20 rounded-lg px-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-secondary';
const LABEL = 'block text-[9px] font-mono uppercase text-white/50 mb-1';

export function PrizePoolBreakdown({ tournamentId }: { tournamentId: string }) {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;
  const { prizes, isLoading, savePrizes, deletePrize, deleteAllPrizes } = useTournamentPrizes(tournamentId);

  const [isOpen, setIsOpen] = useState(false);
  const [count, setCount] = useState(3);
  const [draft, setDraft] = useState<TournamentPrize[]>(DEFAULT_PRIZE_TEMPLATES);
  const [saving, setSaving] = useState(false);

  // Ouvre la modale avec les valeurs actuelles (ou le podium par defaut si vide)
  useEffect(() => {
    if (!isOpen) return;
    const base = prizes.length > 0 ? prizes : DEFAULT_PRIZE_TEMPLATES;
    setCount(Math.min(3, Math.max(1, base.length)));
    setDraft(DEFAULT_PRIZE_TEMPLATES.map((t) => ({ ...t })));
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalCash = prizes.reduce((s, p) => s + (p.cashprize || 0), 0);
  const totalMani = prizes.reduce((s, p) => s + (p.mani || 0), 0);

  const update = (place: number, patch: Partial<TournamentPrize>) => {
    setDraft((prev) => prev.map((p) => (p.place === place ? { ...p, ...patch } : p)));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await savePrizes(draft.slice().sort((a, b) => a.place - b.place).slice(0, count));
      cyberAudio.playSuccess();
      toast.success(`Podium enregistre (${count} prix).`);
      setIsOpen(false);
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOne = async (place: number) => {
    if (!window.confirm(`Supprimer le prix de la ${place}e place ?`)) return;
    try {
      await deletePrize(place);
      toast.success('Prix supprime.');
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Supprimer tout le podium ? (aucun prize ne sera affiche)')) return;
    try {
      await deleteAllPrizes();
      setIsOpen(false);
      toast.success('Podium supprime.');
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  return (
    <div className="space-y-3 md:space-y-4 text-left font-display">
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/10">
        <div className="min-w-0">
          <h4 className="text-xs md:text-base font-black uppercase text-white flex items-center gap-1.5 md:gap-2">
            <Trophy className="text-amber-400 w-4 h-4 md:w-4 md:h-4" size={16} /> Répartition du Cashprize & Dotations
          </h4>
          <span className="text-[9px] md:text-[10px] font-sans text-white/50">
            Montants garantis versés en espèces (FCFA) ou Mobile Money (Airtel/MoMo) le jour J
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {totalCash > 0 && (
            <div className="text-right hidden sm:block">
              <span className="text-[9px] font-mono uppercase text-white/40 block">CASHPOOL TOTAL</span>
              <span className="text-sm md:text-base font-black text-amber-400 font-mono">
                {totalCash.toLocaleString()} FCFA
              </span>
            </div>
          )}
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="py-1.5 px-2.5 rounded-lg bg-secondary/15 border border-secondary/40 text-secondary text-[9px] md:text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer hover:bg-secondary/25 transition-colors"
            >
              <Settings2 size={12} /> <span className="hidden sm:inline">Gerer</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="text-[10px] italic text-white/25 uppercase tracking-widest py-4">Chargement...</p>
      ) : prizes.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-white/10 rounded-xl">
          <p className="text-[10px] font-mono uppercase text-white/30 tracking-widest">Aucun podium configure</p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="mt-3 py-1.5 px-3 rounded-lg bg-secondary text-black text-[10px] font-black uppercase cursor-pointer"
            >
              Configurer le podium
            </button>
          )}
        </div>
      ) : (
        <div className={cn('grid gap-2 md:gap-3', prizes.length === 1 ? 'grid-cols-1' : prizes.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3')}>
          {prizes.map((prize) => {
            const meta = PLACE_META[prize.place - 1] || PLACE_META[2];
            const Icon = meta.icon;
            return (
              <div
                key={prize.place}
                className={cn('p-3 md:p-4 rounded-xl bg-black/40 bg-gradient-to-br to-transparent border relative overflow-hidden', meta.ring, meta.border)}
              >
                <div className="flex items-center justify-between gap-1 mb-1.5 md:mb-2">
                  <span className={cn('text-[10px] md:text-xs font-black uppercase flex items-center gap-1 md:gap-1.5', meta.text)}>
                    <Icon className="w-3.5 h-3.5 md:w-[15px] md:h-[15px]" size={15} /> {prize.title}
                  </span>
                  {prize.badge && (
                    <span className={cn('text-[8px] md:text-[9px] font-mono px-1.5 md:px-2 py-0.5 rounded font-black', meta.badge)}>
                      {prize.badge}
                    </span>
                  )}
                </div>

                <div className="text-base md:text-xl font-black text-white font-mono mb-1.5 md:mb-2">
                  {(prize.cashprize || 0).toLocaleString()}{' '}
                  <span className="text-[10px] md:text-xs text-white/60 font-sans">FCFA</span>
                </div>

                <div className="space-y-0.5 md:space-y-1 text-[9px] md:text-[11px] font-sans text-white/70">
                  {prize.mani > 0 && (
                    <div className="flex items-center gap-1 md:gap-1.5 text-amber-300">
                      <ManiIcon className="w-3 h-3" /> +{prize.mani}
                    </div>
                  )}
                  {prize.ps5_hours > 0 && (
                    <div className="flex items-center gap-1 md:gap-1.5 text-secondary">
                      <Clock className="w-3 h-3 md:w-3 md:h-3" size={12} /> +{prize.ps5_hours} Heure{prize.ps5_hours > 1 ? 's' : ''} de Jeu PS5 Pro offerte{prize.ps5_hours > 1 ? 's' : ''}
                    </div>
                  )}
                  {prize.extra && (
                    <div className="text-white/40 text-[8px] md:text-[9px] font-mono flex items-start gap-1">
                      <Sparkles className="w-2.5 h-2.5 md:w-3 md:h-3 mt-0.5 shrink-0" size={12} />
                      <span>{prize.extra}</span>
                    </div>
                  )}
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOne(prize.place)}
                    title="Supprimer ce prix"
                    className="absolute top-2 right-2 p-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                  >
                    <Trash2 size={10} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Gestion admin du podium */}
      <ModalShell isOpen={isOpen} onClose={() => setIsOpen(false)} title="Gerer le Podium & Dotations" accent="orange">
        <div className="space-y-3 text-left">
          <div>
            <span className={LABEL}>Nombre de prix au podium</span>
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCount(n)}
                  className={cn(
                    'py-1.5 rounded-lg border text-[10px] font-black uppercase cursor-pointer transition-colors',
                    count === n
                      ? 'bg-secondary text-black border-secondary'
                      : 'bg-white/5 border-white/15 text-white/60 hover:text-white'
                  )}
                >
                  {n} prix
                </button>
              ))}
            </div>
          </div>

          {draft.slice(0, count).map((prize) => {
            const meta = PLACE_META[prize.place - 1];
            return (
              <CyberCard key={prize.place} variant="default" hoverEffect={false} className="p-2.5 space-y-2">
                <div className="flex items-center gap-1.5">
                  <meta.icon className={cn('w-3.5 h-3.5', meta.text)} size={14} />
                  <span className={cn('text-[10px] font-black uppercase', meta.text)}>Podium {prize.place}</span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className={LABEL}>Intitule</label>
                    <input
                      className={FIELD}
                      value={prize.title}
                      onChange={(e) => update(prize.place, { title: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Badge</label>
                    <input
                      className={FIELD}
                      value={prize.badge}
                      onChange={(e) => update(prize.place, { badge: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Cashprize (FCFA)</label>
                    <input
                      type="number"
                      min={0}
                      className={cn(FIELD, 'text-center font-black')}
                      value={prize.cashprize}
                      onChange={(e) => update(prize.place, { cashprize: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={cn(LABEL, "flex items-center gap-1.5")}>Dotation <ManiIcon className="w-3 h-3" /></label>
                    <input
                      type="number"
                      min={0}
                      className={cn(FIELD, 'text-center font-black')}
                      value={prize.mani}
                      onChange={(e) => update(prize.place, { mani: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Heures PS5 Pro</label>
                    <input
                      type="number"
                      min={0}
                      className={cn(FIELD, 'text-center font-black')}
                      value={prize.ps5_hours}
                      onChange={(e) => update(prize.place, { ps5_hours: Number(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={LABEL}>Extra (trophee, bonus...)</label>
                    <input
                      className={FIELD}
                      value={prize.extra}
                      onChange={(e) => update(prize.place, { extra: e.target.value })}
                      placeholder="+ Trophée Officiel The Sanctuary gravé"
                    />
                  </div>
                </div>
              </CyberCard>
            );
          })}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2 rounded-lg bg-secondary text-black text-[10px] font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save size={12} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
            </button>
            <button
              type="button"
              onClick={handleDeleteAll}
              className="py-2 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase flex items-center gap-1.5 cursor-pointer hover:bg-red-500/20 transition-colors"
            >
              <Trash2 size={12} /> Supprimer
            </button>
          </div>
        </div>
      </ModalShell>
    </div>
  );
}
