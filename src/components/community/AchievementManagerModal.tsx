import React, { useEffect, useState } from 'react';
import { Award, Loader2, Plus, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useConfirm } from '@/hooks/useConfirm';
import {
  useAchievements,
  useCreateAchievement,
  useDeleteAchievement,
  useUpdateAchievement,
  describeAchievementError,
  type AchievementRow,
  type AchievementCategory,
  type AchievementStatus,
} from '@/hooks/useAchievements';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Draft = {
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  mani_reward: string;
  unlock_rule: string;
  status: AchievementStatus;
  unlocked: boolean;
  progress: string;
  max_progress: string;
};

const EMPTY: Draft = {
  title: '',
  description: '',
  icon: '🏆',
  category: 'prestige',
  mani_reward: '10',
  unlock_rule: '',
  status: 'active',
  unlocked: false,
  progress: '0',
  max_progress: '',
};

const CATEGORIES: { value: AchievementCategory; label: string }[] = [
  { value: 'combat', label: 'Combat' },
  { value: 'fidelite', label: 'Fidélité' },
  { value: 'social', label: 'Social' },
  { value: 'prestige', label: 'Prestige' },
];

// Suggestions d'icônes : un simple emoji collé ici reste lisible partout,
// contraire a une icône polaire dont la fonte peut manquer.
const ICON_SUGGESTIONS = ['🏆', '🥇', '🦉', '⚽', '🏛️', '💰', '🤝', '🪙', '🔥', '⭐', '🎯', '🛡️', '👑', '🎮'];

function toDraft(ach: AchievementRow): Draft {
  return {
    title: ach.title,
    description: ach.description || '',
    icon: ach.icon || '🏆',
    category: ach.category,
    mani_reward: String(ach.mani_reward ?? 0),
    unlock_rule: ach.unlock_rule || '',
    status: ach.status,
    unlocked: ach.unlocked === true,
    progress: String(ach.progress ?? 0),
    max_progress: ach.max_progress ? String(ach.max_progress) : '',
  };
}

/**
 * Gestion admin des badges.
 *
 * Creation, regles d'obtention, icone, recompense et statut (actif / masque).
 * Les joueurs ne voient jamais cette fenetre : elle n'est ouverte que par le
 * bouton "Gerer les badges" de la vitrine, reserve a l'admin.
 */
export function AchievementManagerModal({ isOpen, onClose }: Props) {
  const { data: achievements = [], isLoading } = useAchievements(true);
  const create = useCreateAchievement();
  const update = useUpdateAchievement();
  const remove = useDeleteAchievement();
  const { confirm, dialog } = useConfirm();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (achievements.length === 0) {
      setSelectedId(null);
      setCreating(true);
      setDraft(EMPTY);
      return;
    }
    setCreating(false);
    setSelectedId((current) =>
      current && achievements.some((a) => a.id === current) ? current : achievements[0].id
    );
  }, [achievements, isLoading]);

  const selected = achievements.find((a) => a.id === selectedId) || null;

  useEffect(() => {
    if (selected) setDraft(toDraft(selected));
  }, [selectedId, selected?.updated_at]);

  const startCreating = () => {
    setCreating(true);
    setSelectedId(null);
    setDraft(EMPTY);
  };

  const handleSave = async () => {
    if (!draft.title.trim()) {
      toast.error('Le titre du badge est obligatoire.');
      return;
    }

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim(),
      icon: draft.icon.trim() || '🏆',
      category: draft.category,
      mani_reward: Number(draft.mani_reward || 0),
      unlock_rule: draft.unlock_rule.trim(),
      status: draft.status,
      unlocked: draft.unlocked,
      progress: Number(draft.progress || 0),
      max_progress: draft.max_progress ? Number(draft.max_progress) : null,
      sort_order: selected?.sort_order ?? achievements.length + 1,
    };

    try {
      if (creating) {
        const created = await create.mutateAsync(payload);
        setCreating(false);
        setSelectedId(created.id);
        toast.success('Badge cree.');
      } else if (selected) {
        await update.mutateAsync({ id: selected.id, payload });
        toast.success('Badge mis a jour.');
      }
    } catch (error) {
      toast.error(describeAchievementError(error));
    }
  };

  const handleDelete = (ach: AchievementRow) => {
    confirm({
      title: 'Supprimer le badge',
      subject: ach.title,
      message: 'Ce badge disparaitra de la vitrine pour tous les joueurs. Action irreversible.',
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await remove.mutateAsync(ach.id);
          toast.success('Badge supprime.');
        } catch (error) {
          toast.error(describeAchievementError(error));
        }
      },
    });
  };

  const handleToggleStatus = async (ach: AchievementRow) => {
    try {
      await update.mutateAsync({
        id: ach.id,
        payload: { status: ach.status === 'active' ? 'inactive' : 'active' },
      });
      toast.success(ach.status === 'active' ? 'Badge masque.' : 'Badge publie.');
    } catch (error) {
      toast.error(describeAchievementError(error));
    }
  };

  const field =
    'w-full px-3 py-2 rounded-lg bg-black/50 border border-white/15 text-xs sm:text-sm font-sans text-white placeholder-white/25 focus:border-amber-400 focus:outline-none';
  const label = 'block text-[10px] font-mono uppercase text-white/60 mb-1';
  const saving = create.isPending || update.isPending || remove.isPending;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Gestion des Badges" accent="orange" size="default">
      <div className="space-y-2.5 font-display">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[10px] font-mono text-white/50">
            <Loader2 size={12} className="animate-spin" /> Chargement des badges...
          </div>
        ) : (
          <>
            {/* Onglets des badges */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex gap-1 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1 [&::-webkit-scrollbar-thumb]:bg-white/25 [&::-webkit-scrollbar-thumb]:rounded-full">
                {achievements.map((ach) => (
                  <button
                    key={ach.id}
                    type="button"
                    onClick={() => {
                      setCreating(false);
                      setSelectedId(ach.id);
                    }}
                    className={`shrink-0 px-2 py-1.5 rounded-lg border text-[9px] font-mono font-black uppercase flex items-center gap-1 transition-all cursor-pointer ${
                      !creating && selectedId === ach.id
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                        : 'bg-white/5 border-white/15 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    <span>{ach.icon}</span>
                    {ach.title}
                    {ach.status === 'inactive' && <span className="text-amber-500">*</span>}
                  </button>
                ))}
                {creating && (
                  <span className="shrink-0 px-2 py-1.5 rounded-lg border border-amber-500 bg-amber-500/20 text-[9px] font-mono font-black uppercase text-amber-400">
                    Nouveau
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={startCreating}
                className="shrink-0 w-7 h-7 rounded-lg border border-amber-500/40 bg-amber-500/15 text-amber-400 flex items-center justify-center hover:bg-amber-500/25 transition-all active:scale-90 cursor-pointer"
                title="Creer un badge"
              >
                <Plus size={14} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Titre + Icône */}
              <div className="grid grid-cols-4 gap-2">
                <div className="col-span-3">
                  <label className={label}>Titre *</label>
                  <input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="Oiseau de Nuit"
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Icône</label>
                  <input
                    value={draft.icon}
                    onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                    maxLength={4}
                    className={`${field} text-center text-base`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {ICON_SUGGESTIONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setDraft({ ...draft, icon })}
                    className={`w-7 h-7 rounded-lg border text-sm flex items-center justify-center transition-all cursor-pointer ${
                      draft.icon === icon
                        ? 'border-amber-500 bg-amber-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              {/* Description & Règles côte à côte */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={label}>Description</label>
                  <textarea
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    rows={3}
                    className={`${field} resize-none`}
                  />
                </div>
                <div>
                  <label className={label}>Règles d'obtention (ce que le joueur doit faire)</label>
                  <textarea
                    value={draft.unlock_rule}
                    onChange={(e) => setDraft({ ...draft, unlock_rule: e.target.value })}
                    rows={3}
                    placeholder={'- Cumuler 100h\n- Gagner 5 duels'}
                    className={`${field} resize-none`}
                  />
                </div>
              </div>

              {/* Catégorie + Récompense */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>Catégorie</label>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value as AchievementCategory })}
                    className={field}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value} className="bg-black text-white">
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={label}>Récompense (jetons)</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.mani_reward}
                    onChange={(e) => setDraft({ ...draft, mani_reward: e.target.value })}
                    className={field}
                  />
                </div>
              </div>

              {/* Progression */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={label}>Progression actuelle</label>
                  <input
                    type="number"
                    min={0}
                    value={draft.progress}
                    onChange={(e) => setDraft({ ...draft, progress: e.target.value })}
                    className={field}
                  />
                </div>
                <div>
                  <label className={label}>Progression max (vide = illimité)</label>
                  <input
                    type="number"
                    min={1}
                    value={draft.max_progress}
                    onChange={(e) => setDraft({ ...draft, max_progress: e.target.value })}
                    className={field}
                  />
                </div>
              </div>

              {/* Statut */}
              <div>
                <label className={label}>Statut du badge</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, status: 'active' })}
                    className={`flex-1 py-2 rounded-lg border text-xs font-mono uppercase font-black transition-all cursor-pointer ${
                      draft.status === 'active'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Actif
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, status: 'inactive' })}
                    className={`flex-1 py-2 rounded-lg border text-xs font-mono uppercase font-black transition-all cursor-pointer ${
                      draft.status === 'inactive'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                        : 'bg-white/5 border-white/15 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Masqué
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500 text-xs font-mono uppercase font-black text-amber-300 flex items-center justify-center gap-2 hover:bg-amber-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                  {creating ? 'Creer le badge' : 'Enregistrer'}
                </button>

                {!creating && selected && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(selected)}
                      disabled={update.isPending}
                      className="px-3 rounded-xl border border-white/15 text-xs font-mono uppercase font-black text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                      title={selected.status === 'active' ? 'Masquer aux joueurs' : 'Publier aux joueurs'}
                    >
                      {selected.status === 'active' ? <EyeOff size={13} /> : <Eye size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(selected)}
                      className="px-3 rounded-xl bg-red-500/15 border border-red-500 text-xs font-mono uppercase font-black text-red-300 flex items-center gap-1.5 hover:bg-red-500/25 transition-all cursor-pointer shrink-0"
                      title="Supprimer le badge"
                    >
                      <Trash2 size={13} />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-start gap-1.5 pt-1 border-t border-white/10">
              <Award size={11} className="text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[9px] font-sans text-white/50 leading-relaxed">
                Un badge masqué reste visible dans cette gestion mais disparait de la vitrine des joueurs. Les
                règles d'obtention s'affichent dans la fiche du badge.
              </p>
            </div>
          </>
        )}
      </div>
      {dialog}
    </ModalShell>
  );
}
