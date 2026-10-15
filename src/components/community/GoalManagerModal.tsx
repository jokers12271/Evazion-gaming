import React, { useEffect, useState } from 'react';
import { Loader2, Save, Target, Trash2 } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { useConfirm } from '@/hooks/useConfirm';
import {
  daysLeftInMonth,
  useCommunityGoal,
  useDeleteCommunityGoal,
  useSaveCommunityGoal,
} from '@/hooks/useCommunityGoal';
import { describeEventError } from '@/hooks/useCommunityEvents';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface GoalDraft {
  label: string;
  title: string;
  current_hours: string;
  target_hours: string;
  reward_text: string;
  is_active: boolean;
}

const EMPTY: GoalDraft = {
  label: 'Objectif Communautaire',
  title: '',
  current_hours: '0',
  target_hours: '1000',
  reward_text: '',
  is_active: true,
};

/**
 * Gestion admin de l'Objectif Communautaire : modification, suppression et
 * recreation de la jauge. Les valeurs vivent en base (community_goal) et non
 * plus en dur dans le front.
 */
export function GoalManagerModal({ isOpen, onClose }: Props) {
  const { data: goal } = useCommunityGoal();
  const saveGoal = useSaveCommunityGoal();
  const deleteGoal = useDeleteCommunityGoal();
  const { confirm, dialog } = useConfirm();

  const [draft, setDraft] = useState<GoalDraft>(EMPTY);

  useEffect(() => {
    setDraft(
      goal
        ? {
            label: goal.label || EMPTY.label,
            title: goal.title || '',
            current_hours: String(goal.current_hours ?? 0),
            target_hours: String(goal.target_hours ?? 1000),
            reward_text: goal.reward_text || '',
            is_active: goal.is_active !== false,
          }
        : EMPTY
    );
  }, [goal?.updated_at, goal?.id]);

  const handleSave = async () => {
    const current = Number(draft.current_hours);
    const target = Number(draft.target_hours);

    if (!Number.isFinite(current) || current < 0) {
      toast.error('Les heures actuelles doivent etre un nombre positif.');
      return;
    }
    if (!Number.isFinite(target) || target <= 0) {
      toast.error("L'objectif doit etre superieur a 0.");
      return;
    }

    try {
      await saveGoal.mutateAsync({
        label: draft.label,
        title: draft.title,
        current_hours: current,
        target_hours: target,
        reward_text: draft.reward_text,
        is_active: draft.is_active,
      });
      toast.success('Objectif communautaire mis a jour.');
    } catch (error) {
      toast.error(describeEventError(error));
    }
  };

  const handleDelete = () => {
    confirm({
      title: "Supprimer l'objectif",
      subject: draft.title || draft.label,
      message:
        "La jauge collective disparaitra de la page Communaute. Tu pourras la recreer ensuite avec le meme bouton.",
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await deleteGoal.mutateAsync();
          setDraft(EMPTY);
          toast.success('Objectif supprime.');
        } catch (error) {
          toast.error(describeEventError(error));
        }
      },
    });
  };

  const field =
    'w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] font-sans text-white placeholder-white/25 focus:border-primary focus:outline-none';
  const label = 'block text-[8px] font-mono uppercase text-white/50 mb-0.5';
  const saving = saveGoal.isPending || deleteGoal.isPending;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Gestion de l'Objectif Communautaire" accent="violet">
      <div className="space-y-2.5 font-display">
        <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/25 flex items-center gap-2">
          <Target size={16} className="text-primary shrink-0" />
          <p className="text-[10px] font-sans text-white/75 leading-relaxed">
            Cette jauge est partagee par toute la communaute. Les heures modifiees ici s'affichent immediatement pour
            tous les joueurs.
          </p>
        </div>

        <div>
          <label className={label}>Intitule du badge</label>
          <input
            value={draft.label}
            onChange={(e) => setDraft({ ...draft, label: e.target.value })}
            placeholder="Objectif Communautaire"
            className={field}
          />
        </div>

        <div>
          <label className={label}>Titre de l'objectif</label>
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="LE GRAND PALIER DES 1 000 HEURES DU SANCTUARY"
            className={field}
          />
        </div>

        <div>
          <label className={label}>Description</label>
          <textarea
            value={draft.reward_text}
            onChange={(e) => setDraft({ ...draft, reward_text: e.target.value })}
            rows={2}
            placeholder="Recompense debloquee a 100%"
            className={`${field} resize-none`}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className={label}>Heures actuelles</label>
            <input
              type="number"
              min={0}
              value={draft.current_hours}
              onChange={(e) => setDraft({ ...draft, current_hours: e.target.value })}
              className={field}
            />
          </div>
          <div>
            <label className={label}>Heures visees</label>
            <input
              type="number"
              min={1}
              value={draft.target_hours}
              onChange={(e) => setDraft({ ...draft, target_hours: e.target.value })}
              className={field}
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/10">
          <span className="text-[9px] font-mono uppercase text-white/50">Jours restants</span>
          <span className="text-[10px] font-mono font-black text-primary">{daysLeftInMonth()} jours</span>
        </div>

        <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/10 cursor-pointer">
          <input
            type="checkbox"
            checked={draft.is_active}
            onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
            className="w-3.5 h-3.5 shrink-0 accent-primary cursor-pointer"
          />
          <span className="text-[10px] font-sans text-white/80">Afficher l'objectif aux joueurs</span>
        </label>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2 rounded-xl bg-primary/20 border border-primary text-[9px] font-mono uppercase font-black text-primary flex items-center justify-center gap-1.5 hover:bg-primary/30 transition-all cursor-pointer disabled:opacity-50"
          >
            {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
            {goal ? 'Enregistrer' : "Creer l'objectif"}
          </button>
          {goal && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-2.5 rounded-xl bg-red-500/15 border border-red-500 text-[9px] font-mono uppercase font-black text-red-300 flex items-center gap-1 hover:bg-red-500/25 transition-all cursor-pointer shrink-0 disabled:opacity-50"
              title="Supprimer l'objectif"
            >
              <Trash2 size={11} />
            </button>
          )}
        </div>
      </div>
      {dialog}
    </ModalShell>
  );
}
