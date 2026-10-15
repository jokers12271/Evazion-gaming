import React, { useState } from 'react';
import { Swords, Trophy, Flame, Plus, Shield, Check, Clock, Coins, User, Trash2 } from 'lucide-react';
import { NeonButton } from '@/components/ui/NeonButton';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';

export interface Challenge {
  id: string;
  game: string;
  creator: string;
  creatorId?: string;
  creatorRank: string;
  stake: string; // e.g. "1 MANI", "Pour l'Honneur", "2 MANI"
  time: string;
  format: string; // e.g. "10 min match", "First to 5"
  status: 'open' | 'accepted' | 'completed';
  opponent?: string;
}

const INITIAL_CHALLENGES: Challenge[] = [
  {
    id: 'ch-1',
    game: 'EA Sports FC 24',
    creator: 'Darius_Brazza',
    creatorRank: 'Élite',
    stake: '1 MANI',
    time: 'Aujourd\'hui 17:30',
    format: 'Match Classique 10 min · Real Madrid vs All',
    status: 'open'
  },
  {
    id: 'ch-2',
    game: 'Tekken 8',
    creator: 'Kazuya_Mikalou',
    creatorRank: 'Pro',
    stake: 'Pour l\'Honneur',
    time: 'Aujourd\'hui 18:15',
    format: 'First to 5 (FT5) · Sans handicap',
    status: 'open'
  },
  {
    id: 'ch-3',
    game: 'Mortal Kombat 1',
    creator: 'Cyborg_Maya',
    creatorRank: 'Légende',
    stake: '2 MANI',
    time: 'Ce soir 20:00',
    format: 'Best of 3 · Arène Tournoi',
    status: 'open'
  }
];

export function FaceToFaceArena({ inModal = false }: { inModal?: boolean }) {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;
  const [challenges, setChallenges] = useState<Challenge[]>(INITIAL_CHALLENGES);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    game: 'EA Sports FC 24',
    format: 'Match standard 10 min',
    stake: '1 MANI',
    time: 'Aujourd\'hui 18:00'
  });

  const handleAccept = (ch: Challenge) => {
    cyberAudio.playSuccess();
    setChallenges((prev) =>
      prev.map((c) =>
        c.id === ch.id
          ? { ...c, status: 'accepted', opponent: user?.user_metadata?.display_name || 'Vous' }
          : c
      )
    );
    toast.success(`⚔️ Défi accepté contre ${ch.creator} sur ${ch.game} ! Rendez-vous au Lounge.`, {
      icon: '🏆',
      position: 'bottom-center'
    });
  };

  const handleDelete = (ch: Challenge) => {
    cyberAudio.playClick();
    setChallenges((prev) => prev.filter((c) => c.id !== ch.id));
    toast.success(`Défi « ${ch.game} » supprimé.`, { position: 'bottom-center' });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    cyberAudio.playSuccess();

    const newCh: Challenge = {
      id: `ch-${Date.now()}`,
      game: form.game,
      creator: user?.user_metadata?.display_name || 'Gamer_Anonyme',
      creatorId: user?.id,
      creatorRank: 'Amateur',
      stake: form.stake,
      time: form.time,
      format: form.format,
      status: 'open'
    };

    setChallenges([newCh, ...challenges]);
    setShowModal(false);
    toast.success("Votre défi 1v1 est publié dans l'Arène du Sanctuary !", { position: 'bottom-center' });
  };

  return (
    <div className={`${inModal ? '' : 'bg-[#05070c] border border-white/10 rounded-3xl p-4 sm:p-8 backdrop-blur-xl'} relative overflow-hidden font-display ${inModal ? '' : 'my-10'}`}>
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono uppercase tracking-widest text-primary mb-1">
            <Swords size={14} className="shrink-0" />
            <span>Pool de Rivalité & Face-à-Face</span>
          </div>
          <h3 className="text-lg sm:text-3xl font-black uppercase text-white tracking-tight">
            Arène 1v1 <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Brazzaville</span>
          </h3>
          <p className="text-[11px] sm:text-sm text-white/60 font-sans mt-1 leading-relaxed">
            Lancez un duel à un membre du hub ou relevez un défi en direct dans l'arène de tournoi.
          </p>
        </div>

        {!isAdmin && (
          <button
            onClick={() => {
              setShowModal(true);
              cyberAudio.playClick();
            }}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-black text-[10px] sm:text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-neon-violet flex items-center justify-center gap-2 self-start sm:self-auto"
          >
            <Plus size={14} />
            <span>Lancer un Défi</span>
          </button>
        )}
      </div>

      {/* Challenge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-4">
        {challenges.map((ch) => {
          const isOpen = ch.status === 'open';
          const isOwner = Boolean(user?.id) && ch.creatorId === user?.id;
// L'admin ne participe pas : il gère. Il peut donc supprimer n'importe quel défi,
// terminated ou non. Le joueur ne supprime que ses propres défis.
const canDelete = isAdmin || isOwner;

          return (
            <div
              key={ch.id}
              className={`rounded-xl border p-2.5 flex flex-col gap-2 transition-all duration-300 relative ${
                isOpen
                  ? 'border-white/10 bg-white/[0.03] hover:border-secondary/50 hover:bg-white/[0.05]'
                  : 'border-emerald-500/30 bg-emerald-500/5 opacity-80'
              }`}
            >
              {/* Zone 1 — Jeu + Mise */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-secondary font-black truncate">
                  {ch.game}
                </span>
                <span
                  className={`shrink-0 text-[9px] font-mono px-2 py-0.5 rounded border whitespace-nowrap ${
                    ch.stake.includes('MANI')
                      ? 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                      : 'text-white/60 border-white/10 bg-white/5'
                  }`}
                >
                  Mise : {ch.stake}
                </span>
              </div>

              {/* Zone 2 — Créateur */}
              <div className="flex items-center gap-2 rounded-lg bg-black/40 border border-white/5 px-2 py-1.5">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-primary to-secondary p-0.5 shrink-0">
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[9px] font-black">
                    {ch.creator[0]}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate">{ch.creator}</div>
                  <div className="text-[8px] font-mono text-white/50">Rang : {ch.creatorRank}</div>
                </div>
              </div>

              {/* Zone 3 — Format */}
              <div className="rounded-lg bg-black/40 border border-white/5 px-2 py-1.5">
                <p className="text-[10px] text-white/70 font-sans leading-snug">{ch.format}</p>
              </div>

              {/* Zone 4 — Heure + Action */}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
                <div className="flex items-center gap-1 text-[9px] font-mono text-white/50 min-w-0">
                  <Clock size={10} className="shrink-0" />
                  <span className="truncate">{ch.time}</span>
                </div>

                {isOpen ? (
                  !isAdmin && (
                    <button
                      onClick={() => handleAccept(ch)}
                      className="shrink-0 px-2.5 py-1 rounded-md bg-secondary text-black font-black text-[9px] uppercase tracking-wider hover:bg-secondary/90 transition-all cursor-pointer shadow-neon-cyan flex items-center gap-1"
                    >
                      <Swords size={10} />
                      <span>Relever</span>
                    </button>
                  )
                ) : (
                  <span className="shrink-0 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                    <Check size={10} /> Accepté vs {ch.opponent}
                  </span>
                )}

                {canDelete && (
                  <button
                    onClick={() => handleDelete(ch)}
                    title="Supprimer ce défi"
                    className="shrink-0 px-2 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 font-black text-[9px] uppercase tracking-wider hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 size={10} />
                    <span>Supprimer</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Lancer un Défi */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#090c14] border border-white/15 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative">
            <h4 className="text-xl font-black uppercase text-white mb-1">
              Lancer un Défi 1v1
            </h4>
            <p className="text-xs text-white/60 font-sans mb-5">
              Choisissez votre jeu favori et défiez les membres présents à The Sanctuary.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1">Jeu</label>
                <select
                  value={form.game}
                  onChange={(e) => setForm({ ...form, game: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-secondary"
                >
                  <option value="EA Sports FC 24" className="bg-[#090c14]">EA Sports FC 24</option>
                  <option value="Tekken 8" className="bg-[#090c14]">Tekken 8</option>
                  <option value="Street Fighter 6" className="bg-[#090c14]">Street Fighter 6</option>
                  <option value="Mortal Kombat 1" className="bg-[#090c14]">Mortal Kombat 1</option>
                  <option value="Call of Duty Warzone" className="bg-[#090c14]">Call of Duty Warzone</option>
                  <option value="Gran Turismo 7" className="bg-[#090c14]">Gran Turismo 7</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1">Format du match</label>
                <input
                  type="text"
                  value={form.format}
                  onChange={(e) => setForm({ ...form, format: e.target.value })}
                  placeholder="Ex: First to 5, Match 10 min, Pas de prolongation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-secondary"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1">Enjeu / Mise</label>
                <select
                  value={form.stake}
                  onChange={(e) => setForm({ ...form, stake: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-secondary"
                >
                  <option value="Pour l'Honneur" className="bg-[#090c14]">Pour l'Honneur</option>
                  <option value="1 MANI" className="bg-[#090c14]">1 MANI Token</option>
                  <option value="2 MANI" className="bg-[#090c14]">2 MANI Tokens</option>
                  <option value="1 Canette au Bar" className="bg-[#090c14]">1 Boisson au Bar</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono uppercase text-white/70 mb-1">Heure de rendez-vous</label>
                <input
                  type="text"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  placeholder="Ex: Aujourd'hui 18:30"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-secondary"
                  required
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-xs font-mono uppercase text-white/60 hover:text-white"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-secondary text-black font-black text-xs uppercase tracking-wider shadow-neon-cyan hover:bg-secondary/90 cursor-pointer"
                >
                  Publier le défi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
