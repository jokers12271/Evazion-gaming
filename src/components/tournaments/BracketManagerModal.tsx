import React, { useEffect, useState } from 'react';
import { ModalShell } from '@/components/ui/ModalShell';
import { Users, Shuffle, Swords, Trophy, ListOrdered } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { BracketFormat, BracketSystem, useTournamentBracket } from '@/hooks/useTournamentBracket';
import { useTournamentRoster } from '@/hooks/useTournamentParticipation';
import { useTournaments } from '@/hooks/useTournaments';
import { cyberAudio } from '@/lib/cyberAudio';

export function BracketManagerModal({
  isOpen,
  onClose,
  tournamentId
}: {
  isOpen: boolean;
  onClose: () => void;
  tournamentId: string;
}) {
  const { config, runDraw, saveConfig } = useTournamentBracket(tournamentId);
  const { data: roster = [] } = useTournamentRoster(tournamentId);
  const { tournaments = [] } = useTournaments();
  const tourney = tournaments.find((t) => t.id === tournamentId);

  const [teamCount, setTeamCount] = useState<number>(config.team_count || 8);
  const [teams, setTeams] = useState<string[]>(() => {
    const base = config.teams?.length ? config.teams : [];
    return Array.from({ length: config.team_count || 8 }, (_, i) => base[i] || `Équipe ${i + 1}`);
  });
  const [format, setFormat] = useState<BracketFormat>(config.format || 'single');
  const [system, setSystem] = useState<BracketSystem>(config.system || 'cup');
  const [saving, setSaving] = useState(false);

  const rosterKey = roster.join('|');

  // Pre-remplissage a l'ouverture : inscrits valides dans l'ordre d'inscription,
  // et format/systeme herites du tournoi selectionne.
  useEffect(() => {
    if (!isOpen) return;
    const names = roster;
    const targetCount = names.length > 0 ? names.length : (config.team_count || 8);
    const count = Math.max(2, Math.min(20, targetCount));
    setTeamCount(count);
    setTeams(
      Array.from({ length: count }, (_, i) => names[i] || config.teams?.[i] || `Équipe ${i + 1}`)
    );
    if (tourney) {
      setFormat(tourney.format === 'aller_retour' ? 'double' : 'single');
      setSystem(tourney.system === 'championnat' ? 'league' : 'cup');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rosterKey, tournamentId]);

  const handleCountChange = (n: number) => {
    const clamped = Math.max(2, Math.min(20, n || 2));
    setTeamCount(clamped);
    setTeams((prev) => {
      const next = [...prev];
      if (next.length < clamped) {
        for (let i = next.length; i < clamped; i++) next.push(`Équipe ${i + 1}`);
      } else {
        next.length = clamped;
      }
      return next;
    });
  };

  const handleNameChange = (i: number, value: string) => {
    setTeams((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  };

  const handleDraw = async () => {
    const cleaned = teams.map((t) => t.trim()).filter(Boolean);
    if (cleaned.length < 2) {
      toast.error('Il faut au moins 2 équipes.');
      return;
    }
    setSaving(true);
    try {
      await saveConfig({ team_count: cleaned.length, format, system });
      await runDraw(cleaned, format, system);
      cyberAudio.playSuccess();
      toast.success('Tirage au sort effectué ! Visible par tous les joueurs.');
      onClose();
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Gestion de l'Arbre" accent="violet">
      <div className="space-y-5 text-left font-display">
        {tourney && (
          <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/30 text-[10px] font-mono uppercase text-primary flex items-center gap-2">
            <Trophy size={13} /> Tournoi : <span className="text-white font-black truncate">{tourney.title}</span>
          </div>
        )}

        {roster.length > 0 && (
          <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 flex items-center gap-2">
            <ListOrdered size={13} /> {roster.length} inscrit{roster.length > 1 ? 's' : ''} pré-chargé{roster.length > 1 ? 's' : ''} dans l'ordre d'inscription
          </div>
        )}

        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <label className="flex items-center gap-2 text-xs font-black uppercase text-white mb-3">
            <Users size={15} className="text-secondary" /> Nombre d'équipes (2 à 20)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={2}
              max={20}
              value={teamCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <input
              type="number"
              min={2}
              max={20}
              value={teamCount}
              onChange={(e) => handleCountChange(Number(e.target.value))}
              className="w-16 bg-white/5 border border-white/20 rounded-lg px-2 py-1 text-sm text-white text-center font-black focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-black/40 border border-white/10">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-white mb-2">
              <Swords size={14} className="text-amber-400" /> Format
            </label>
            <div className="space-y-2">
              {([['single', 'Éliminatoire direct'], ['double', 'Aller-retour']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFormat(val)}
                  className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    format === val
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/10">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase text-white mb-2">
              <Trophy size={14} className="text-primary" /> Système
            </label>
            <div className="space-y-2">
              {([['cup', 'Coupe (élimination)'], ['league', 'Championnat (poules)']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSystem(val)}
                  className={`w-full py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all cursor-pointer ${
                    system === val
                      ? 'bg-primary/20 border-primary/50 text-primary'
                      : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/40 border border-white/10">
          <label className="text-[10px] font-black uppercase text-white mb-3 block">
            Pseudos des équipes / joueurs
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {teams.map((t, i) => (
              <input
                key={i}
                type="text"
                value={t}
                onChange={(e) => handleNameChange(i, e.target.value)}
                placeholder={`Équipe ${i + 1}`}
                className="bg-white/5 border border-white/20 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:outline-none focus:border-secondary"
              />
            ))}
          </div>
        </div>

        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-mono uppercase text-white/60 hover:text-white"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleDraw}
            disabled={saving}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black text-xs uppercase tracking-wider shadow-neon-violet flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Shuffle size={14} /> {saving ? 'Tirage...' : 'Lancer le Tirage'}
          </button>
        </div>

        <p className="text-[10px] text-white/40 text-center italic">
          Le tirage au sort est aléatoire et visible instantanément par tous les joueurs.
        </p>
      </div>
    </ModalShell>
  );
}
