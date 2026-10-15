import React, { useMemo, useState } from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Award, Lock, CheckCircle2, Sparkles, Settings, Loader2, BookOpen } from 'lucide-react';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useAchievements, type AchievementRow } from '@/hooks/useAchievements';
import { AchievementManagerModal } from '@/components/community/AchievementManagerModal';
import { ModalShell } from '@/components/ui/ModalShell';

/** Regles d'obtention lues depuis la base (champ unlock_rule). */
function AchievementRulesModal({
  achievement,
  onClose,
}: {
  achievement: AchievementRow | null;
  onClose: () => void;
}) {
  if (!achievement) return null;

  return (
    <ModalShell isOpen={!!achievement} onClose={onClose} title="Conditions d'obtention" accent="orange">
      <div className="space-y-2.5 font-display">
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
          <span className="w-10 h-10 rounded-xl bg-black/50 border border-white/15 flex items-center justify-center text-xl shrink-0">
            {achievement.icon}
          </span>
          <div className="min-w-0">
            <span className="text-[8px] font-mono font-black uppercase tracking-widest text-amber-400">
              {achievement.category}
            </span>
            <h3 className="text-sm font-black uppercase text-white leading-tight">{achievement.title}</h3>
          </div>
        </div>

        <p className="text-[10px] font-sans text-white/70 leading-relaxed">{achievement.description}</p>

        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <BookOpen size={12} className="text-secondary shrink-0" />
            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-secondary">
              Règles d'obtention
            </span>
          </div>
          <p className="text-[10px] font-sans text-white/80 whitespace-pre-line leading-relaxed">
            {achievement.unlock_rule || 'Aucune règle particuliere : ce badge est offert par l administration.'}
          </p>
        </div>

        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
          <span className="text-[9px] font-mono uppercase text-white/50">Recompense</span>
          <span className="text-xs font-black font-mono text-amber-400 flex items-center gap-1 shrink-0">
            <ManiIcon className="w-3 h-3" /> +{achievement.mani_reward}
          </span>
        </div>

        {achievement.max_progress ? (
          <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
            <div className="flex justify-between text-[9px] font-mono mb-1">
              <span className="text-white/50">Progression</span>
              <span className="text-white font-black">
                {achievement.progress} / {achievement.max_progress}
              </span>
            </div>
            <div className="w-full h-2 bg-black/60 rounded-full border border-white/10 overflow-hidden p-0.5">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, Math.round((achievement.progress / achievement.max_progress) * 100))}%`,
                }}
              />
            </div>
          </div>
        ) : null}
      </div>
    </ModalShell>
  );
}

export function AchievementsGrid() {
  const { data: metadata } = useUserMetadata();
  const isAdmin = (metadata as any)?.is_admin || false;

  // Les badges masques par l'admin sont filtres par la policy : seuls les
  // badges actifs sont retournes pour un joueur.
  const { data: achievements = [], isLoading } = useAchievements(!isAdmin);

  const [managerOpen, setManagerOpen] = useState(false);
  const [rulesId, setRulesId] = useState<string | null>(null);

  const rulesAchievement = useMemo(
    () => achievements.find((a) => a.id === rulesId) || null,
    [achievements, rulesId]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-4 md:space-y-6 text-left font-display">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 md:gap-4 pb-3 md:pb-4 border-b border-white/10">
        <div>
          <h3 className="text-sm md:text-2xl font-black uppercase text-white flex items-center gap-1.5 md:gap-2">
            <Award className="text-amber-400 shrink-0" size={16} /> Vitrine des Trophées & Badges de Légende
          </h3>
          <p className="text-[9px] md:text-xs text-white/50 font-sans mt-0.5">
            Accomplissez des exploits au Sanctuary pour débloquer ces insignes et encaisser vos primes en jetons.
          </p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2 shrink-0">
          <div className="px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 md:gap-3">
            <Sparkles className="text-amber-400 shrink-0" size={13} />
            <div>
              <div className="text-[7px] md:text-[9px] font-mono uppercase text-amber-400 font-black">
                Badges Débloqués
              </div>
              <div className="text-[10px] md:text-sm font-black text-white">
                {unlockedCount} sur {achievements.length} complétés
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setManagerOpen(true)}
              className="shrink-0 flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-primary/20 border border-primary/50 text-primary hover:bg-primary/30 transition-all active:scale-95 cursor-pointer"
              title="Gerer les badges : création, règles, icône, récompense, statut"
            >
              <Settings size={12} className="md:h-4 md:w-4" />
              <span className="text-[8px] md:text-[10px] font-mono uppercase font-black">Gérer</span>
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-8 text-[10px] font-mono text-white/50">
          <Loader2 size={13} className="animate-spin" /> Chargement des badges...
        </div>
      ) : achievements.length === 0 ? (
        <p className="py-8 text-center text-[10px] md:text-xs font-sans text-white/40">
          {isAdmin
            ? 'Aucun badge. Utilise le bouton Gérer pour en creer un.'
            : 'Aucun badge disponible pour le moment.'}
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-2 md:p-5 rounded-xl md:rounded-2xl border transition-all flex flex-col justify-between ${
                ach.unlocked
                  ? 'bg-gradient-to-br from-white/[0.04] to-amber-500/[0.05] border-amber-500/40 shadow-lg'
                  : 'bg-white/[0.02] border-white/10 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-1.5 md:gap-3 mb-1.5 md:mb-3">
                  <div className="w-7 h-7 md:w-12 md:h-12 rounded-lg md:rounded-2xl bg-black/50 border border-white/15 flex items-center justify-center text-sm md:text-2xl shadow-inner shrink-0">
                    {ach.icon}
                  </div>
                  {ach.unlocked ? (
                    <span className="px-1 md:px-2.5 py-0.5 md:py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[6px] md:text-[8px] font-mono uppercase font-black flex items-center gap-0.5 md:gap-1">
                      <CheckCircle2 size={8} className="md:hidden" />
                      <CheckCircle2 size={11} className="hidden md:block" /> OBTENU
                    </span>
                  ) : (
                    <span className="px-1 md:px-2.5 py-0.5 md:py-1 rounded-full bg-white/10 text-white/40 text-[6px] md:text-[8px] font-mono uppercase flex items-center gap-0.5 md:gap-1">
                      <Lock size={7} className="md:hidden" />
                      <Lock size={10} className="hidden md:block" /> BLOQUÉ
                    </span>
                  )}
                </div>

                <h4 className="text-[9px] md:text-sm font-black uppercase text-white mb-0.5 md:mb-1 line-clamp-2 md:line-clamp-none">
                  {ach.title}
                </h4>
                <p className="hidden md:block text-xs text-white/60 font-sans mb-4 line-clamp-3">
                  {ach.description}
                </p>
              </div>

              <div className="md:pt-3 md:border-t border-white/5 flex items-center justify-between gap-1 text-[7px] md:text-xs font-mono">
                <span className="text-amber-400 font-black flex items-center gap-0.5 md:gap-1">
                  <ManiIcon className="w-2.5 h-2.5 md:w-3 md:h-3" /> +{ach.mani_reward}
                </span>
                {ach.max_progress ? (
                  <span className="text-[6px] md:text-[10px] text-white/40">
                    {ach.progress}/{ach.max_progress}
                  </span>
                ) : null}
              </div>

              {/* Fiche des regles : utile au joueur, visible des deux cotes. */}
              <button
                type="button"
                onClick={() => setRulesId(ach.id)}
                className="mt-1 md:mt-3 w-full py-1 md:py-1.5 rounded-lg md:rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[6px] md:text-[9px] font-mono uppercase font-black text-white/55 hover:text-white transition-all flex items-center justify-center gap-0.5 md:gap-1.5 cursor-pointer"
              >
                <BookOpen size={8} className="md:hidden" />
                <BookOpen size={11} className="hidden md:block" /> Voir les règles
              </button>
            </div>
          ))}
        </div>
      )}

      <AchievementRulesModal achievement={rulesAchievement} onClose={() => setRulesId(null)} />

      {isAdmin && <AchievementManagerModal isOpen={managerOpen} onClose={() => setManagerOpen(false)} />}
    </div>
  );
}
