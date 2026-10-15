import React, { useMemo, useState } from 'react';
import { Swords, Clock, Trophy, Trash2, Check, Radio, X } from 'lucide-react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useTournamentBracket, type BracketMatch } from '@/hooks/useTournamentBracket';
import { useTournamentBets, type TournamentBet } from '@/hooks/useTournamentBets';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';
import { cn } from '@blinkdotnew/ui';

function matchLabel(m: BracketMatch) {
  return `Match ${m.position + 1} (Tour ${m.round}) : ${m.player1 || '?'} vs ${m.player2 || '?'}`;
}

export function TournamentPredictions() {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const loyaltyQuery = useLoyalty();
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;
  const playerMode = !!user && !isAdmin;

  const { matches } = useTournamentBracket();
  const { openBets, bets, createBet, acceptBet, cancelBet, settleBet, deleteBet } = useTournamentBets();

  const balance = loyaltyQuery.data?.points ?? 0;

  // Matchs pariables : deux joueurs connus, non termines.
  const bettableMatches = useMemo(
    () => matches.filter((m) => m.player1 && m.player2 && m.status !== 'finished'),
    [matches]
  );

  const [selectedMatchId, setSelectedMatchId] = useState<string>('');
  const [pick, setPick] = useState<string>('');
  const [stake, setStake] = useState<number>(2);
  const [loading, setLoading] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  const selectedMatch = bettableMatches.find((m) => m.id === selectedMatchId) || null;

  const myName = metadata?.display_name || user?.user_metadata?.display_name || user?.email || 'Gamer';

  const handleCreate = async () => {
    if (!user) return toast.error('Connectez-vous pour parier.');
    if (!selectedMatch) return toast.error('Choisissez un match.');
    if (!pick) return toast.error('Choisissez une equipe.');
    if (stake <= 0) return toast.error('Mise invalide.');
    setLoading(true);
    try {
      await createBet(user.id, myName, selectedMatch.id, matchLabel(selectedMatch), pick, stake);
      cyberAudio.playSuccess();
      toast.success(`Pari publie : ${stake} MANI sur ${pick}.`);
      setPick('');
      setStake(2);
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (bet: TournamentBet, acceptorPick: string) => {
    if (!user) return toast.error('Connectez-vous pour accepter.');
    try {
      await acceptBet(bet.id, user.id, myName, acceptorPick);
      cyberAudio.playSuccess();
      toast.success(`Pari accepte : ${bet.stake} MANI sur ${acceptorPick}.`);
      setAcceptingId(null);
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  const handleCancel = async (bet: TournamentBet) => {
    if (!window.confirm('Annuler ce pari et recuperer votre mise ?')) return;
    try {
      await cancelBet(bet.id);
      toast.success('Pari annule, mise remboursee.');
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  const handleDelete = async (bet: TournamentBet) => {
    if (!window.confirm('Supprimer ce pari ? (admin)')) return;
    try {
      await deleteBet(bet.id);
      toast.success('Pari supprime.');
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  const statusBadge = (s: TournamentBet['status']) => {
    const map: Record<string, string> = {
      open: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
      matched: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
      settled: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      cancelled: 'text-white/40 border-white/10 bg-white/5'
    };
    const label: Record<string, string> = {
      open: 'EN ATTENTE',
      matched: 'ACCEPTE',
      settled: 'REGLE',
      cancelled: 'ANNULE'
    };
    return (
      <span className={cn('px-1.5 md:px-2 py-0.5 rounded border text-[6px] md:text-[8px] font-mono font-black uppercase tracking-wider shrink-0', map[s])}>
        {label[s]}
      </span>
    );
  };

  return (
    <div className={cn('text-left font-display', playerMode ? 'space-y-3 md:space-y-6' : 'space-y-6')}>
      <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10', playerMode ? 'gap-2 pb-2 md:gap-3 md:pb-3' : 'gap-3 pb-3')}>
        <div>
          <h3 className={cn('font-black uppercase text-white flex items-center gap-1.5 md:gap-2', playerMode ? 'text-sm md:text-2xl' : 'text-xl md:text-2xl')}>
            <ManiIcon className={cn('shrink-0', playerMode ? 'w-4 h-4 md:w-[22px] md:h-[22px]' : 'w-[22px] h-[22px]')} /> Pronostics & Paris en Jetons
          </h3>
          <p className={cn('text-white/50 font-sans mt-0.5', playerMode ? 'text-[10px] md:text-xs' : 'text-xs')}>
            Pariez sur un match, un adversaire mise sur l'equipe opposee. Le gagnant remporte les deux mises.
          </p>
        </div>
        {user && !isAdmin && (
          <div className="shrink-0 self-start sm:self-auto px-2 py-1 md:px-3 md:py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono font-black text-xs md:text-sm flex items-center gap-1.5">
            <ManiIcon className="w-3.5 h-3.5 md:w-[14px] md:h-[14px]" /> {balance}
          </div>
        )}
      </div>

      {/* Formulaire de creation (reserve aux joueurs, pas a l'admin) */}
      {user && !isAdmin && (
        <CyberCard variant="violet" hoverEffect={false} className="p-3 md:p-6">
          <div className="text-[10px] md:text-xs font-black uppercase text-white mb-2 md:mb-4 flex items-center gap-2">
            <Swords className="text-secondary w-3.5 h-3.5 md:w-[14px] md:h-[14px]" size={14} /> Creer un pari
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Match</label>
              <select
                value={selectedMatchId}
                onChange={(e) => { setSelectedMatchId(e.target.value); setPick(''); }}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs text-white focus:outline-none focus:border-secondary"
              >
                <option value="" className="bg-[#090c14]">-- Choisir un match --</option>
                {bettableMatches.map((m) => (
                  <option key={m.id} value={m.id} className="bg-[#090c14]">
                    {matchLabel(m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-mono uppercase text-white/60 mb-1">Mise en <ManiIcon className="w-3 h-3" /></label>
              <input
                type="number"
                min={1}
                value={stake}
                onChange={(e) => setStake(Number(e.target.value) || 0)}
                className="w-full bg-white/5 border border-white/20 rounded-xl px-2 py-1.5 md:px-3 md:py-2 text-[10px] md:text-xs text-white text-center font-black focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {selectedMatch && (
            <div className="grid grid-cols-2 gap-2 md:gap-3 mt-2 md:mt-3">
              {[selectedMatch.player1, selectedMatch.player2].map((name, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPick(name)}
                  className={cn(
                    'p-2 md:p-3 rounded-xl border text-left cursor-pointer transition-all',
                    pick === name
                      ? 'border-secondary bg-secondary/20'
                      : 'border-white/10 bg-black/40 hover:border-white/30'
                  )}
                >
                  <div className="text-[9px] font-mono uppercase text-white/40 mb-0.5">Equipe {i + 1}</div>
                  <div className="text-xs md:text-sm font-black uppercase text-white truncate">{name}</div>
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-2 md:mt-4">
            <span className="text-[10px] font-mono uppercase text-white/40">
              Gain potentiel : <span className="text-amber-400 font-black inline-flex items-center gap-1">+{stake} <ManiIcon className="w-3.5 h-3.5" /></span>
            </span>
            <NeonButton size="sm" variant="violet" sweep onClick={handleCreate} disabled={loading} className="py-2 px-5 text-xs font-black uppercase tracking-wider">
              {loading ? 'Publication...' : 'Publier mon pari'}
            </NeonButton>
          </div>
        </CyberCard>
      )}

      {/* Paris ouverts */}
      <div className="space-y-3">
        <div className={cn('font-black uppercase text-white/60', playerMode ? 'text-[10px] md:text-xs' : 'text-xs')}>Paris en attente ({openBets.length})</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {openBets.map((bet) => {
            const isMine = bet.challenger_id === user?.id;
            const isAccepting = acceptingId === bet.id;
            return (
              <div key={bet.id} className={cn('rounded-xl bg-black/50 backdrop-blur-sm border border-white/10', playerMode ? 'p-2.5 space-y-1.5 md:p-3.5 md:space-y-2' : 'p-3.5 space-y-2')}>
                <div>
                  <span className="text-[9px] font-mono uppercase text-white/40">{bet.match_label}</span>
                </div>
                <div className={cn('font-bold text-white', playerMode ? 'text-[10px] md:text-xs' : 'text-xs')}>
                  <span className="text-amber-400">{bet.challenger_name}</span> mise <span className="inline-flex items-center gap-1">{bet.stake} <ManiIcon className="w-3 h-3" /></span> sur <span className="text-secondary font-black">{bet.challenger_pick}</span>
                </div>

                {!isMine && user && !isAdmin && (
                  <div className="flex items-center gap-2 pt-1">
                    {!isAccepting ? (
                      <button
                        type="button"
                        onClick={() => setAcceptingId(bet.id)}
                        className="flex-1 py-1.5 rounded-lg bg-secondary text-black font-black text-[10px] uppercase tracking-wider cursor-pointer"
                      >
                        Accepter (miser sur l'autre equipe)
                      </button>
                    ) : (
                      <div className="flex-1 space-y-2">
                        <div className="text-[9px] font-mono uppercase text-white/50 flex items-center gap-1">Votre mise : <span className="inline-flex items-center gap-1">{bet.stake} <ManiIcon className="w-3 h-3" /></span> sur l'equipe opposee</div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleAccept(bet, otherTeam(bet.match_id, bet.challenger_pick, matches))}
                            className="flex-1 py-1.5 rounded-lg bg-emerald-500 text-black font-black text-[10px] uppercase flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Check size={12} /> Confirmer
                          </button>
                          <button
                            type="button"
                            onClick={() => setAcceptingId(null)}
                            className="py-1.5 px-3 rounded-lg border border-white/10 text-white/60 text-[10px] uppercase cursor-pointer"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    {isMine && (
                      <button
                        type="button"
                        onClick={() => handleCancel(bet)}
                        className="py-1.5 px-3 rounded-lg border border-white/10 text-white/50 hover:text-white text-[10px] uppercase cursor-pointer"
                      >
                        Annuler
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => handleDelete(bet)}
                        className="py-1.5 px-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 size={11} /> Supprimer
                      </button>
                    )}
                  </div>
                  {statusBadge(bet.status)}
                </div>
              </div>
            );
          })}
          {openBets.length === 0 && (
            <p className="text-[10px] italic text-white/25 uppercase tracking-widest py-4">Aucun pari en attente</p>
          )}
        </div>
      </div>

      {/* Historique */}
      <div className="space-y-3">
        <div className={cn('font-black uppercase text-white/60', playerMode ? 'text-[10px] md:text-xs' : 'text-xs')}>Historique des paris</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {bets.filter((b) => b.status !== 'open').map((bet) => (
            <div key={bet.id} className={cn('rounded-xl bg-black/50 backdrop-blur-sm border border-white/10 flex items-center justify-between gap-2', playerMode ? 'p-2.5 md:p-3.5' : 'p-3.5')}>
              <div className="min-w-0">
                <div className={cn('font-bold text-white truncate', playerMode ? 'text-[10px] md:text-xs' : 'text-xs')}>
                  {bet.challenger_name} <span className="text-white/40">({bet.challenger_pick})</span>
                  {' '}vs{' '}
                  {bet.acceptor_name} <span className="text-white/40">({bet.acceptor_pick})</span>
                </div>
                <div className="text-[9px] font-mono text-white/40 mt-0.5 flex items-center gap-1">Mise : <span className="inline-flex items-center gap-1">{bet.stake} <ManiIcon className="w-3 h-3" /></span> · {bet.match_label}</div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {statusBadge(bet.status)}
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => handleDelete(bet)}
                    className="p-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 size={11} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdmin && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono uppercase text-amber-300">
          Mode Arbitre : vous pouvez supprimer tout pari. Le reglement des gains se fait via le bouton de reglement du pari accepte.
        </div>
      )}
    </div>
  );
}

/** Retrouve l'equipe opposee au choix du createur pour un match donne. */
function otherTeam(matchId: string, pick: string, matches: BracketMatch[]): string {
  const m = matches.find((x) => x.id === matchId);
  if (!m) return '';
  return pick === m.player1 ? m.player2 : m.player1;
}
