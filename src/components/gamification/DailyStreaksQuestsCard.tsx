import React from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { Flame, CheckCircle2, Coins } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { useGamificationStore, DailyQuest } from '@/lib/gamificationData';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';

export function DailyStreaksQuestsCard() {
  const gamificationStore = useGamificationStore();
  const streakData = gamificationStore.getStreakData();
  const quests: DailyQuest[] = gamificationStore.getDailyQuests();

  const handleClaimQuest = (questId: string, reward: number) => {
    cyberAudio.playSuccess();
    gamificationStore.claimQuest(questId);
    toast.success(`Quête validée ! +${reward} Jetons MANI ajoutés 🪙`, {
      position: 'bottom-center'
    });
  };

  return (
    <CyberCard variant="violet" hoverEffect={false} className="p-4 md:p-6 text-left font-display">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[8px] font-mono font-black uppercase tracking-widest flex items-center gap-1">
              <Flame size={11} className="text-amber-400" /> Série Quotidienne (Streak)
            </span>
          </div>
          <h3 className="text-base md:text-xl font-black uppercase text-white">
            Série Active : <span className="text-amber-400">{streakData.days} Jours 🔥</span>
          </h3>
          <p className="text-[11px] text-white/50 font-sans mt-0.5">
            Multiplicateur : <span className="text-secondary font-bold">x{streakData.multiplier}</span>
          </p>
        </div>

        {/* Streak indicators */}
        <div className="flex items-center gap-1 p-1.5 rounded-lg bg-black/50 border border-white/10">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const isCompleted = day <= streakData.days;
            return (
              <div
                key={day}
                className={`w-6 h-6 rounded-md border text-center flex flex-col items-center justify-center text-[9px] font-mono font-black ${
                  isCompleted
                    ? 'border-amber-400 bg-amber-400/20 text-amber-300 shadow-neon-orange'
                    : 'border-white/10 bg-white/5 text-white/30'
                }`}
              >
                <span>J{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3 Quêtes du Jour */}
      <div>
        <div className="text-[10px] font-black uppercase text-white/70 tracking-wider mb-2.5 flex items-center justify-between">
          <span>Quêtes Quotidiennes</span>
          <span className="text-[9px] font-mono text-white/40">3 / 3</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {quests.map((q) => (
            <div
              key={q.id}
              className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                q.claimed
                  ? 'bg-emerald-500/10 border-emerald-500/30 opacity-70'
                  : q.completed
                  ? 'bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/40'
                  : 'bg-white/[0.02] border-white/10'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base">{q.icon}</span>
                  <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                    <ManiIcon className="w-3 h-3" /> +{q.mani_reward}
                  </span>
                </div>
                <h4 className="text-[11px] font-black uppercase text-white mb-0.5">{q.title}</h4>
                <p className="text-[10px] text-white/60 font-sans mb-2.5 line-clamp-2">{q.description}</p>
              </div>

              <div>
                {q.claimed ? (
                  <span className="text-[8.5px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 size={11} /> Reçue
                  </span>
                ) : q.completed ? (
                  <button
                    type="button"
                    onClick={() => handleClaimQuest(q.id, q.mani_reward)}
                    className="w-full py-1 rounded-lg bg-amber-400 text-black text-[9px] font-mono font-black uppercase cursor-pointer hover:bg-amber-300 transition-all active:scale-95 shadow-neon-orange"
                  >
                    Réclamer (<ManiIcon className="w-3 h-3" /> +{q.mani_reward})
                  </button>
                ) : (
                  <div className="text-[8.5px] font-mono text-white/40">
                    Prog : {q.progress} / {q.max_progress}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </CyberCard>
  );
}
