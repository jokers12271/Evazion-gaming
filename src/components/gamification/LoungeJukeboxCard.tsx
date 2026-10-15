import React, { useState } from 'react';
import { Music, Radio, Volume2, ThumbsUp, Flame, Sparkles } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { useGamificationStore, JukeboxGenre } from '@/lib/gamificationData';
import { cyberAudio } from '@/lib/cyberAudio';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';

export function LoungeJukeboxCard({ inModal = false }: { inModal?: boolean }) {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;

  const gamificationStore = useGamificationStore();
  const genres: JukeboxGenre[] = gamificationStore.getJukeboxGenres();
  const [userVoted, setUserVoted] = useState<string | null>(null);

  const leadingGenre = [...genres].sort((a, b) => b.votes - a.votes)[0];

  const handleVote = (genreId: string) => {
    cyberAudio.playClick();
    gamificationStore.voteGenre(genreId);
    setUserVoted(genreId);
    toast.success("Vote pris en compte ! L'ambiance sonore du Lounge s'adapte 🎵", {
      position: 'bottom-center'
    });
  };

  return (
    <CyberCard variant="cyan" hoverEffect={false} className={`text-left font-display ${inModal ? 'p-0 border-0 bg-transparent shadow-none' : 'p-4 md:p-8'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1">
              <Radio size={12} className="animate-pulse" /> Jukebox Social de la Salle
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-black uppercase text-white">
            Ambiance Sonore en Direct
          </h3>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Votez pour la playlist diffusée sur les enceintes du Sanctuary pendant votre session.
          </p>
        </div>

        {leadingGenre && (
          <div className="p-3 rounded-xl bg-black/60 border border-secondary/40 flex items-center gap-3 shrink-0 shadow-neon-cyan">
            <Volume2 size={20} className="text-secondary animate-bounce" />
            <div>
              <div className="text-[9px] font-mono uppercase text-secondary font-black">
                Ambiance en Tête (Diffusée)
              </div>
              <div className="text-xs font-black uppercase text-white">
                {leadingGenre.name}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {genres.map((g) => {
          const isVoted = userVoted === g.id;
          const isCurrent = leadingGenre.id === g.id;

          return (
            <div
              key={g.id}
              className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                isCurrent
                  ? 'bg-secondary/10 border-secondary/50 shadow-md'
                  : 'bg-white/[0.02] border-white/10 hover:border-white/20'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: g.color }} />
                    <h4 className="text-xs font-black uppercase text-white">{g.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-secondary font-bold">
                    {g.votes} Votes
                  </span>
                </div>
                <p className="text-[11px] text-white/60 font-sans mb-2">{g.vibe}</p>
                <div className="text-[10px] font-mono text-white/40 italic mb-3">
                  Exemples : {g.now_playing}
                </div>
              </div>

              {isAdmin ? (
                <div className="w-full py-1.5 rounded-lg border border-white/10 bg-white/5 text-[9px] font-mono uppercase text-white/50 text-center font-bold">
                  {g.votes} votes enregistrés
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleVote(g.id)}
                  className={`w-full py-1.5 rounded-lg border text-[10px] font-mono uppercase font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                    isVoted
                      ? 'bg-secondary text-black border-secondary'
                      : 'bg-white/5 hover:bg-white/10 border-white/15 text-white/80'
                  }`}
                >
                  <ThumbsUp size={11} /> {isVoted ? "A Voté" : "Voter pour cette playlist"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </CyberCard>
  );
}
