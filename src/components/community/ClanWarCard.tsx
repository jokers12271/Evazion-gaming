import React from 'react';
import { Swords, Shield, Trophy, Flame, Zap } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useCommunityStore, ClanWarScore } from '@/lib/communityData';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';

export function ClanWarCard({ teams }: { teams: any[] }) {
  const communityDataStore = useCommunityStore();
  const scores: ClanWarScore[] = communityDataStore.getClanWars();

  const sortedScores = [...scores].sort((a, b) => b.points - a.points);
  const leadingTeamId = sortedScores[0]?.team_id;
  const leadingTeam = teams.find(t => t.id === leadingTeamId);

  const handleCheer = (teamId: string) => {
    cyberAudio.playSuccess();
    const next = scores.map(s => s.team_id === teamId ? { ...s, points: s.points + 5 } : s);
    communityDataStore.saveClanWars(next);
    toast.success("Cri de ralliement envoyé ! +5 Points pour votre Team ⚡", { position: 'bottom-center' });
  };

  return (
    <CyberCard
      variant="violet"
      hoverEffect={false}
      className="p-4 md:p-8 relative overflow-hidden text-left mb-6 md:mb-10"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6 pb-4 md:pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1.5 md:mb-2">
            <span className="px-2 py-0.5 md:px-2.5 md:py-1 rounded-full bg-red-500/20 text-red-400 border border-red-500/40 text-[8px] md:text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
              <Swords size={12} /> Guerre des Clans Hebdomadaire
            </span>
            <span className="text-[9px] md:text-[10px] font-mono text-white/40 uppercase">
              Fin dans 3 jours
            </span>
          </div>
          <h3 className="text-lg md:text-3xl font-black uppercase text-white font-display">
            CLASH DES ARMOIRIES : SEMAINE #40
          </h3>
          <p className="text-[10px] md:text-xs text-white/60 font-sans mt-1 max-w-xl">
            Chaque heure passée sur les PS5 Pro du Sanctuary et chaque victoire 1v1 d'un membre rapporte des points de clan.
            La Team en tête décroche le <span className="text-amber-400 font-bold">Bouclier d'Or</span> et <span className="text-secondary font-bold">-15% au Lounge Bar</span> pour tous ses membres.
          </p>
        </div>

        {leadingTeam && (
          <div className="px-3.5 py-3 md:px-5 md:py-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 md:gap-4 shrink-0 shadow-neon-orange">
            <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40">
              <Trophy size={20} className="md:h-[26px] md:w-[26px]" />
            </div>
            <div>
              <div className="text-[8px] md:text-[9px] font-mono uppercase tracking-widest text-amber-400 font-black">
                Clan Leader Actuel
              </div>
              <div className="text-sm md:text-lg font-black uppercase text-white font-display">
                {leadingTeam.name}
              </div>
              <div className="text-[9px] md:text-[10px] font-mono text-white/50">
                {sortedScores[0]?.points} Pts de Puissance
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 pt-4 md:pt-6">
        {sortedScores.map((score, index) => {
          const team = teams.find(t => t.id === score.team_id);
          if (!team) return null;
          const isLeader = index === 0;

          return (
            <div
              key={score.team_id}
              className={`p-3 md:p-4 rounded-xl border transition-all ${
                isLeader 
                  ? 'bg-amber-500/5 border-amber-500/40 shadow-lg' 
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between mb-2 md:mb-3">
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3.5 h-3.5 rounded-full"
                    style={{ backgroundColor: team.color }}
                  />
                  <span className="font-display font-black text-xs md:text-sm uppercase text-white">
                    {team.name}
                  </span>
                </div>
                <span className="text-[10px] md:text-xs font-mono font-black text-amber-400">
                  #{index + 1}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center py-1.5 md:py-2 mb-2 md:mb-3 bg-black/40 rounded-lg border border-white/5">
                <div>
                  <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Duels Gagnés</div>
                  <div className="text-xs md:text-sm font-black text-white">{score.duels_won} ⚔️</div>
                </div>
                <div>
                  <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Heures Hub</div>
                  <div className="text-xs md:text-sm font-black text-secondary">{score.hours_logged}h ⏳</div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] md:text-xs font-mono font-black text-white">
                  {score.points} <span className="text-[8px] md:text-[9px] text-white/50 font-normal">PTS</span>
                </span>
                <button
                  type="button"
                  onClick={() => handleCheer(score.team_id)}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-mono uppercase font-black text-white/80 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Zap size={11} className="text-amber-400" /> Encourager (+5)
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </CyberCard>
  );
}
