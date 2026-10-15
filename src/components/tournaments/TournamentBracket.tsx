import React, { useMemo, useState, useEffect } from 'react';
import { Trophy, Swords, RefreshCw, Settings, Radio, Check, Clock, Crown, Shuffle, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '@blinkdotnew/ui';
import { useTournamentBracket, aggregateTie, type BracketMatch, type MatchStatus } from '@/hooks/useTournamentBracket';
import { BracketManagerModal } from './BracketManagerModal';
import { ModalShell } from '@/components/ui/ModalShell';
import { cyberAudio } from '@/lib/cyberAudio';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/* ─── Carte d'un match (user : scores + qualifié ; admin : bouton) ────── */
function BracketNode({
  match,
  leg2,
  isDouble,
  isAdmin,
  onEdit
}: {
  match: BracketMatch;
  leg2?: BracketMatch | null;
  isDouble?: boolean;
  isAdmin?: boolean;
  onEdit: (m: BracketMatch) => void;
}) {
  // La finale en aller-retour n'a pas de match retour : elle s'affiche comme un match simple.
  const twoLegs = Boolean(isDouble && leg2);
  const isLive = match.status === 'live' || leg2?.status === 'live';
  const isFinished =
    match.status === 'finished' && (!twoLegs || leg2!.status === 'finished');

  const agg = aggregateTie(match, leg2 ?? undefined);

  const scoreCell = (value: number | null) => (
    <span className={cn('tabular-nums', value === null ? 'text-white/25' : 'text-white')}>
      {value === null ? '–' : value}
    </span>
  );

  const teamRow = (name: string, slot: 1 | 2) => {
    const isPlayer1 = slot === 1;
    const winnerName = twoLegs ? agg.winner : match.winner;
    const isWinner = isFinished && Boolean(name) && winnerName === name;

    const aller = isPlayer1 ? match.score1 : match.score2;
    const retour = leg2 ? (isPlayer1 ? leg2.score2 : leg2.score1) : null;
    const total = twoLegs ? (isPlayer1 ? agg.player1Agg : agg.player2Agg) : aller ?? 0;

    return (
      <div
        className={cn(
          'grid items-center px-2.5 py-1.5 gap-1 border-b border-white/5',
          twoLegs ? 'grid-cols-[1fr_22px_22px_28px]' : 'grid-cols-[1fr_28px]',
          isWinner ? 'bg-emerald-500/15' : ''
        )}
      >
        <span
          className={cn(
            'text-[11px] font-black uppercase truncate',
            isWinner ? 'text-emerald-300' : name ? 'text-white' : 'text-white/25 italic'
          )}
          title={name || 'En attente'}
        >
          {name || 'En attente'}
        </span>

        {twoLegs ? (
          <>
            <span className="text-center text-[11px] font-mono">{scoreCell(aller)}</span>
            <span className="text-center text-[11px] font-mono">{scoreCell(retour)}</span>
            <span className={cn('text-center text-[12px] font-mono font-black', isWinner ? 'text-emerald-300' : 'text-white')}>
              {total}
            </span>
          </>
        ) : (
          <span className={cn('text-center text-[11px] font-mono font-black', isWinner ? 'text-emerald-300' : 'text-white/80')}>
            {aller ?? '–'}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'w-full rounded-lg border bg-[#0a0d14] overflow-hidden',
        isLive
          ? 'border-red-500/60 shadow-[0_0_14px_rgba(239,68,68,0.3)]'
          : isFinished
          ? 'border-emerald-500/35'
          : 'border-white/10'
      )}
    >
      <div className="flex items-center justify-between px-2.5 py-1 bg-white/[0.03] border-b border-white/5">
        <span className="text-[7px] font-mono uppercase tracking-widest text-white/35">
          {twoLegs ? `TIE ${match.position + 1}` : `M${match.position + 1}`}
        </span>
        <span
          className={cn(
            'text-[7px] font-mono font-black uppercase px-1.5 py-0.5 rounded-full border flex items-center gap-1',
            isLive
              ? 'text-red-400 border-red-500/40 bg-red-500/10'
              : isFinished
              ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
              : 'text-white/35 border-white/10 bg-white/5'
          )}
        >
          {isLive && <Radio size={7} className="animate-pulse" />}
          {isFinished && <Check size={7} />}
          {isLive ? 'LIVE' : isFinished ? 'FINI' : 'À VENIR'}
        </span>
      </div>

      {twoLegs ? (
        <div className="grid grid-cols-[1fr_22px_22px_28px] px-2.5 py-0.5 gap-1 text-[7px] font-mono uppercase text-white/30 border-b border-white/5">
          <span>Équipe</span>
          <span className="text-center">All.</span>
          <span className="text-center">Ret.</span>
          <span className="text-center text-white/50">Tot.</span>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_28px] px-2.5 py-0.5 text-[7px] font-mono uppercase text-white/30 border-b border-white/5">
          <span>Équipe</span>
          <span className="text-center">Score</span>
        </div>
      )}

      {teamRow(match.player1, 1)}
      {teamRow(match.player2, 2)}

      {match.match_date && (
        <div className="px-2.5 py-1 border-t border-white/5 flex items-center gap-1 text-[8px] font-mono text-white/35">
          <Clock size={8} /> {format(new Date(match.match_date), 'dd MMM · HH:mm', { locale: fr })}
        </div>
      )}

      {isAdmin && (
        <button
          type="button"
          onClick={() => onEdit(match)}
          className="w-full py-1 bg-white/[0.02] hover:bg-white/[0.08] border-t border-white/5 text-white/50 hover:text-white text-[8px] font-mono font-black uppercase tracking-wider cursor-pointer transition-all"
        >
          {twoLegs ? 'Résultats (Aller / Retour)' : 'Modifier le match'}
        </button>
      )}
    </div>
  );
}

/* ─── Modale d'édition d'un match (admin) ─────────────────────────────── */
function MatchEditModal({
  match,
  leg2,
  isDouble,
  onClose,
  onSave,
  saving
}: {
  match: BracketMatch | null;
  leg2?: BracketMatch | null;
  isDouble?: boolean;
  onClose: () => void;
  onSave: (legs: BracketMatch[]) => void;
  saving: boolean;
}) {
  const [aller, setAller] = useState<BracketMatch | null>(match);
  const [retour, setRetour] = useState<BracketMatch | null>(leg2 ?? null);
  const [tab, setTab] = useState<1 | 2>(1);

  useEffect(() => {
    setAller(match);
    setRetour(leg2 ?? null);
    setTab(1);
  }, [match, leg2]);

  if (!aller) return null;

  const active = tab === 2 && retour ? retour : aller;
  const setActive = (next: BracketMatch) => {
    if (tab === 2 && retour) setRetour(next);
    else setAller(next);
  };

  const setScore = (who: 1 | 2, value: string) => {
    const num = value === '' ? null : Number(value);
    const next = { ...active, [who === 1 ? 'score1' : 'score2']: num } as BracketMatch;
    const s1 = who === 1 ? num : next.score1;
    const s2 = who === 2 ? num : next.score2;
    if (s1 !== null && s2 !== null) {
      next.winner = s1 > s2 ? next.player1 : s2 > s1 ? next.player2 : null;
      if (next.winner) next.status = 'finished';
    }
    setActive(next);
  };

  const setField = (field: keyof BracketMatch, value: any) => {
    setActive({ ...active, [field]: value } as BracketMatch);
  };

  const handleSave = () => {
    const legs: BracketMatch[] = [aller];
    if (isDouble && retour) legs.push(retour);
    onSave(legs);
  };

  const agg = retour ? aggregateTie(aller, retour) : null;

  return (
    <ModalShell isOpen={!!match} onClose={onClose} title="Modifier les résultats" accent="cyan">
      <div className="space-y-4 text-left font-display">
        {isDouble && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-black/40 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => setTab(1)}
              className={cn('py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer', tab === 1 ? 'bg-secondary text-black' : 'text-white/60 hover:text-white')}
            >
              Match Aller
            </button>
            <button
              type="button"
              onClick={() => setTab(2)}
              className={cn('py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer', tab === 2 ? 'bg-secondary text-black' : 'text-white/60 hover:text-white')}
            >
              Match Retour
            </button>
          </div>
        )}

        {tab === 2 && isDouble && (
          <div className="px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] font-mono uppercase text-amber-300">
            Match retour — camps inversés. Le cumul aller + retour désigne le qualifié.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-white/60 mb-1 block">Équipe 1 (domicile)</label>
            <input type="text" value={active.player1} onChange={(e) => setField('player1', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-white/60 mb-1 block">Équipe 2 (extérieur)</label>
            <input type="text" value={active.player2} onChange={(e) => setField('player2', e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-secondary" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] font-mono uppercase text-white/60 mb-1 block">{active.player1 || 'Équipe 1'} — score</label>
            <input type="number" min={0} value={active.score1 ?? ''} onChange={(e) => setScore(1, e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-2 text-sm text-white text-center font-black focus:outline-none focus:border-secondary" />
          </div>
          <div>
            <label className="text-[10px] font-mono uppercase text-white/60 mb-1 block">{active.player2 || 'Équipe 2'} — score</label>
            <input type="number" min={0} value={active.score2 ?? ''} onChange={(e) => setScore(2, e.target.value)} className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-2 text-sm text-white text-center font-black focus:outline-none focus:border-secondary" />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-white/60 mb-1 block">Date & heure du match</label>
          <input type="datetime-local" value={active.match_date ? active.match_date.slice(0, 16) : ''} onChange={(e) => setField('match_date', e.target.value ? new Date(e.target.value).toISOString() : null)} className="w-full bg-white/5 border border-white/20 rounded-lg px-2.5 py-2 text-xs text-white font-bold focus:outline-none focus:border-secondary" />
        </div>

        <div>
          <label className="text-[10px] font-mono uppercase text-white/60 mb-2 block">Statut</label>
          <div className="grid grid-cols-3 gap-2">
            {(['pending', 'live', 'finished'] as MatchStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setField('status', st)}
                className={cn(
                  'py-2 rounded-lg text-[10px] font-black uppercase border transition-all cursor-pointer',
                  active.status === st
                    ? st === 'live'
                      ? 'bg-red-500/20 border-red-500/50 text-red-300'
                      : st === 'finished'
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                      : 'bg-white/10 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                )}
              >
                {st === 'pending' ? 'À venir' : st === 'live' ? 'En direct' : 'Fini'}
              </button>
            ))}
          </div>
        </div>

        {isDouble && agg && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10">
            <div className="text-[9px] font-mono uppercase text-white/40 mb-2">Cumul aller + retour</div>
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className={cn('truncate', agg.winner === aller.player1 ? 'text-emerald-300 font-black' : 'text-white/70')}>{aller.player1}</span>
              <span className="font-black text-white">{agg.player1Agg}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono mt-1">
              <span className={cn('truncate', agg.winner === aller.player2 ? 'text-emerald-300 font-black' : 'text-white/70')}>{aller.player2}</span>
              <span className="font-black text-white">{agg.player2Agg}</span>
            </div>
            <div className="mt-2 text-[9px] font-mono uppercase text-center">
              {agg.winner
                ? <span className="text-emerald-400">Qualifié : {agg.winner}</span>
                : agg.bothPlayed
                ? <span className="text-amber-400">Égalité — à départager</span>
                : <span className="text-white/40">En attente des deux manches</span>}
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-mono uppercase text-white/60 hover:text-white">Annuler</button>
          <button type="button" onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl bg-secondary text-black font-black text-xs uppercase tracking-wider shadow-neon-cyan cursor-pointer disabled:opacity-50">
            {saving ? 'Sauvegarde...' : 'Valider'}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ─── Classement automatique (mode championnat) ───────────────────────── */
function LeagueStandings({ matches, teams }: { matches: BracketMatch[]; teams: string[] }) {
  const rows = useMemo(() => {
    const stats = new Map<string, { pts: number; played: number; diff: number; gf: number }>();
    for (const t of teams) stats.set(t, { pts: 0, played: 0, diff: 0, gf: 0 });

    for (const m of matches) {
      if (m.status !== 'finished' || m.score1 === null || m.score2 === null) continue;
      if (!m.player1 || !m.player2) continue;
      const a = stats.get(m.player1);
      const b = stats.get(m.player2);
      if (!a || !b) continue;
      a.played++; b.played++;
      a.gf += m.score1; b.gf += m.score2;
      a.diff += m.score1 - m.score2;
      b.diff += m.score2 - m.score1;
      if (m.score1 > m.score2) a.pts += 3;
      else if (m.score2 > m.score1) b.pts += 3;
      else { a.pts += 1; b.pts += 1; }
    }

    return [...stats.entries()]
      .map(([name, s]) => ({ name, ...s }))
      .sort((x, y) => y.pts - x.pts || y.diff - x.diff || y.gf - x.gf);
  }, [matches, teams]);

  return (
    <div className="rounded-xl bg-black/40 border border-white/10 overflow-hidden">
      <div className="px-3 py-2 bg-white/5 border-b border-white/10 flex items-center gap-2">
        <Crown size={14} className="text-amber-400" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white">Classement du Championnat</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-[9px] font-mono uppercase text-white/40 border-b border-white/5">
              <th className="px-3 py-2">#</th>
              <th className="px-3 py-2">Équipe</th>
              <th className="px-2 py-2 text-center">J</th>
              <th className="px-2 py-2 text-center">+/-</th>
              <th className="px-3 py-2 text-center">Pts</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.name} className={cn('border-b border-white/5', i === 0 ? 'bg-amber-500/10' : '')}>
                <td className="px-3 py-2 font-mono font-black text-white/60">{i + 1}</td>
                <td className={cn('px-3 py-2 font-black uppercase truncate', i === 0 ? 'text-amber-300' : 'text-white')}>{r.name}</td>
                <td className="px-2 py-2 text-center font-mono text-white/60">{r.played}</td>
                <td className="px-2 py-2 text-center font-mono text-white/60">{r.diff > 0 ? `+${r.diff}` : r.diff}</td>
                <td className="px-3 py-2 text-center font-mono font-black text-secondary">{r.pts}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-[10px] uppercase text-white/30">Aucune équipe</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Composant principal ─────────────────────────────────────────────── */
export function TournamentBracket({ isAdmin, tournamentId }: { isAdmin: boolean; tournamentId: string }) {
  const { config, matches, isLoading, updateMatch, resetScores, deleteBracket } = useTournamentBracket(tournamentId);
  const [managerOpen, setManagerOpen] = useState(false);
  const [editing, setEditing] = useState<BracketMatch | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isLeague = config.system === 'league';
  const isDouble = config.format === 'double';

  const rounds = useMemo(() => {
    const map = new Map<number, BracketMatch[]>();
    for (const m of matches) {
      if (m.leg === 2) continue;
      const list = map.get(m.round) || [];
      list.push(m);
      map.set(m.round, list);
    }
    return [...map.entries()].sort((a, b) => a[0] - b[0]);
  }, [matches]);

  const roundLabel = (round: number, total: number) => {
    if (round === total) return 'Finale';
    if (round === total - 1) return 'Demi-Finales';
    if (round === total - 2) return 'Quarts de Finale';
    return `Tour ${round}`;
  };

  const champion = useMemo(() => {
    if (isLeague) return null;
    if (rounds.length === 0) return null;
    const finalRound = rounds[rounds.length - 1];
    const finalMatch = finalRound?.[1]?.[0];
    if (!finalMatch) return null;
    if (isDouble) {
      const leg2 = matches.find(
        (m) => m.round === finalMatch.round && m.position === finalMatch.position && m.leg === 2
      );
      return aggregateTie(finalMatch, leg2).winner;
    }
    return finalMatch.status === 'finished' && finalMatch.winner ? finalMatch.winner : null;
  }, [rounds, isLeague, isDouble, matches]);

  // Manche retour associée au match en cours d'édition.
  const editingLeg2 = useMemo(() => {
    if (!editing || !isDouble) return null;
    return matches.find(
      (m) => m.round === editing.round && m.position === editing.position && m.leg === 2
    ) ?? null;
  }, [editing, isDouble, matches]);

  const handleSave = async (legs: BracketMatch[]) => {
    setSaving(true);
    try {
      for (const leg of legs) {
        await updateMatch(leg, matches);
      }
      cyberAudio.playSuccess();
      toast.success('Résultat(s) mis à jour !');
      setEditing(null);
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      await resetScores();
      cyberAudio.playClick();
      toast.success('Scores réinitialisés.');
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  const handleDeleteBracket = async () => {
    if (!window.confirm("Supprimer tout l'arbre de tournoi ? Cette action est irréversible.")) return;
    setDeleting(true);
    try {
      await deleteBracket();
      cyberAudio.playClick();
      toast.success("Arbre de tournoi supprimé.");
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 text-left font-display">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div>
          <h3 className="text-xl md:text-2xl font-black uppercase text-white flex items-center gap-2">
            <Swords className="text-secondary" size={22} /> Arbre de Tournoi Interactif
          </h3>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            {isLeague
              ? 'Championnat : chaque équipe affronte les autres, classement automatique.'
              : 'Coupe : confrontations à élimination, vainqueur propulsé au tour suivant.'}
            {' '}· Format : {config.format === 'double' ? 'Aller-retour' : 'Match unique'}.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-wider text-white/70 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw size={12} /> Réinitialiser
            </button>
            <button
              type="button"
              onClick={() => { setManagerOpen(true); cyberAudio.playClick(); }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-neon-violet"
            >
              <Settings size={12} /> Gestion de l'arbre
            </button>
            {matches.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteBracket}
                disabled={deleting}
                className="px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/40 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <Trash2 size={12} /> {deleting ? 'Suppression...' : "Supprimer l'arbre"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Champion */}
      {champion && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-transparent border border-amber-500/40 flex items-center gap-3">
          <Crown className="text-amber-400 shrink-0" size={28} />
          <div>
            <span className="text-[9px] font-mono uppercase text-amber-400/70 tracking-widest">Champion du tournoi</span>
            <div className="text-xl font-black uppercase text-amber-300">{champion}</div>
          </div>
        </div>
      )}

      {isLoading && matches.length === 0 ? (
        <p className="text-center text-xs uppercase text-white/30 py-8">Chargement de l'arbre...</p>
      ) : matches.length === 0 ? (
        <div className="p-10 rounded-2xl bg-white/[0.02] border border-dashed border-white/15 text-center">
          <Shuffle className="mx-auto text-white/20 mb-3" size={32} />
          <p className="text-xs uppercase font-black text-white/40">Aucun tirage au sort pour l'instant</p>
          {isAdmin && (
            <button
              type="button"
              onClick={() => { setManagerOpen(true); cyberAudio.playClick(); }}
              className="mt-4 px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-[10px] font-black uppercase tracking-wider cursor-pointer"
            >
              Lancer la gestion de l'arbre
            </button>
          )}
        </div>
      ) : isLeague ? (
        <div className="space-y-6">
          <LeagueStandings matches={matches} teams={config.teams} />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {matches.filter((m) => m.leg === 1).map((m) => (
              <BracketNode
                key={m.id}
                match={m}
                isDouble={isDouble}
                leg2={
                  isDouble
                    ? matches.find((x) => x.round === m.round && x.position === m.position && x.leg === 2) ?? null
                    : null
                }
                isAdmin={isAdmin}
                onEdit={setEditing}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-6 min-w-max">
            {rounds.map(([round, roundMatches], idx) => (
              <div key={round} className="w-64 space-y-3">
                <div className="text-[10px] font-black uppercase tracking-wider text-secondary pb-2 border-b border-white/10 flex items-center justify-between">
                  <span>{roundLabel(round, rounds.length)}</span>
                  <span className="text-[9px] font-mono text-white/40">{roundMatches.length} match{roundMatches.length > 1 ? 's' : ''}</span>
                </div>
                <div className={cn('space-y-3', idx > 0 && 'pt-6')}>
                  {roundMatches.map((m) => (
                    <BracketNode
                      key={m.id}
                      match={m}
                      isDouble={isDouble}
                      leg2={
                        isDouble
                          ? matches.find((x) => x.round === m.round && x.position === m.position && x.leg === 2) ?? null
                          : null
                      }
                      isAdmin={isAdmin}
                      onEdit={setEditing}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modales */}
      <BracketManagerModal isOpen={managerOpen} onClose={() => setManagerOpen(false)} tournamentId={tournamentId} />
      <MatchEditModal
        match={editing}
        leg2={editingLeg2}
        isDouble={isDouble && Boolean(editingLeg2)}
        onClose={() => setEditing(null)}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
