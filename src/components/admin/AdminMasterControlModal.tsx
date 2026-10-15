import React, { useState } from 'react';
import { ManiIcon } from '@/components/ui/ManiIcon';
import { 
  X, Shield, Sparkles, Trophy, Gift, Music, Coins, HelpCircle, 
  Flame, Swords, Plus, Trash2, Edit2, RotateCcw, Check, Users, MessageSquare 
} from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { gamificationStore, WheelSegment, DailyQuest, LootboxReward, JukeboxGenre, QuizQuestion } from '@/lib/gamificationData';
import { communityDataStore, ClanWarScore, Achievement } from '@/lib/communityData';
import { tournamentDataStore, TournamentDetails } from '@/lib/tournamentData';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';

type AdminTab = 'wheel' | 'quests' | 'lootbox' | 'jukebox' | 'jackpot' | 'quiz' | 'clans' | 'social' | 'tournament';

interface AdminMasterControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminMasterControlModal({ isOpen, onClose }: AdminMasterControlModalProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>('wheel');

  // Gamification States
  const [wheelSegments, setWheelSegments] = useState<WheelSegment[]>(() => gamificationStore.getWheelSegments());
  const [quests, setQuests] = useState<DailyQuest[]>(() => gamificationStore.getDailyQuests());
  const [lootboxCost, setLootboxCost] = useState<number>(() => gamificationStore.getLootboxCost());
  const [lootboxRewards, setLootboxRewards] = useState<LootboxReward[]>(() => gamificationStore.getLootboxRewards());
  const [jukeboxGenres, setJukeboxGenres] = useState<JukeboxGenre[]>(() => gamificationStore.getJukeboxGenres());
  const [jackpot, setJackpot] = useState(() => gamificationStore.getJackpotData());
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(() => gamificationStore.getQuizQuestions());

  // Community States
  const [clanWars, setClanWars] = useState<ClanWarScore[]>(() => communityDataStore.getClanWars());
  const [socialPosts, setSocialPosts] = useState(() => communityDataStore.getSocialPosts());
  const [lfgPosts, setLfgPosts] = useState(() => communityDataStore.getLfgPosts());

  // Tournament States
  const [mainEvent, setMainEvent] = useState<TournamentDetails>(() => tournamentDataStore.getMainEvent());

  if (!isOpen) return null;

  // 1. Wheel handlers
  const handleSaveWheel = () => {
    gamificationStore.saveWheelSegments(wheelSegments);
    cyberAudio.playSuccess();
    toast.success("Segments de la Roue sauvegardés avec succès !");
  };

  const handleResetSpins = () => {
    gamificationStore.resetSpinsForAll();
    cyberAudio.playSuccess();
    toast.success("Tous les joueurs peuvent à nouveau faire tourner la roue aujourd'hui !");
  };

  // 2. Quests handlers
  const handleSaveQuests = () => {
    gamificationStore.saveDailyQuests(quests);
    cyberAudio.playSuccess();
    toast.success("Quêtes quotidiennes mises à jour !");
  };

  const handleAddQuest = () => {
    const newQ = gamificationStore.addDailyQuest({
      title: 'Nouvelle Quête Hub',
      description: 'Objectif de la quête à accomplir en salle.',
      icon: '🎯',
      mani_reward: 2,
      max_progress: 1
    });
    setQuests([...gamificationStore.getDailyQuests()]);
    toast.success("Nouvelle quête ajoutée !");
  };

  const handleDeleteQuest = (id: string) => {
    gamificationStore.deleteDailyQuest(id);
    setQuests([...gamificationStore.getDailyQuests()]);
    toast.success("Quête supprimée");
  };

  // 3. Lootbox handlers
  const handleSaveLootboxCost = () => {
    gamificationStore.setLootboxCost(lootboxCost);
    cyberAudio.playSuccess();
    toast.success(`Coût de la lootbox mis à jour à ${lootboxCost} MANI`);
  };

  const handleAddLootboxReward = () => {
    const newRew = gamificationStore.addLootboxReward({
      name: 'Nouveau Lot Butin',
      category: 'rare',
      description: 'Descriptif du lot débloqué par le joueur.',
      icon: '🎁',
      value_text: 'Bonus Spécial',
      color: '#06b6d4'
    });
    setLootboxRewards([...gamificationStore.getLootboxRewards()]);
    toast.success("Récompense ajoutée au pool du coffre !");
  };

  const handleDeleteLootboxReward = (id: string) => {
    gamificationStore.deleteLootboxReward(id);
    setLootboxRewards([...gamificationStore.getLootboxRewards()]);
    toast.success("Lot supprimé du coffre");
  };

  // 4. Jukebox handlers
  const handleResetJukeboxVotes = () => {
    const updated = gamificationStore.resetJukeboxVotes();
    setJukeboxGenres([...updated]);
    toast.success("Compteurs de votes du Jukebox réinitialisés !");
  };

  // 5. Jackpot handlers
  const handleSaveJackpot = () => {
    gamificationStore.saveJackpotData(jackpot);
    cyberAudio.playSuccess();
    toast.success("Cagnotte du Grand Jackpot sauvegardée !");
  };

  const handleResetJackpot = () => {
    const res = gamificationStore.resetJackpot(50, '50 Jetons MANI + Lots de bienvenue');
    setJackpot({ ...res });
    toast.success("Tirage au sort effectué et cagnotte réinitialisée !");
  };

  // 6. Quizz handlers
  const handleAddQuiz = () => {
    const newQ: QuizQuestion = {
      question: "Nouvelle question e-sport à poser aux gamers ?",
      options: ["Choix 1", "Choix 2", "Choix 3", "Choix 4"],
      correctIndex: 0,
      game: "MULTI-JEUX"
    };
    gamificationStore.addQuizQuestion(newQ);
    setQuizQuestions([...gamificationStore.getQuizQuestions()]);
    toast.success("Question ajoutée au Quizz !");
  };

  const handleDeleteQuiz = (idx: number) => {
    gamificationStore.deleteQuizQuestion(idx);
    setQuizQuestions([...gamificationStore.getQuizQuestions()]);
    toast.success("Question supprimée");
  };

  // 7. Clan Wars handlers
  const handleSaveClanWars = () => {
    communityDataStore.saveClanWars(clanWars);
    cyberAudio.playSuccess();
    toast.success("Scores de Guerre des Clans mis à jour !");
  };

  const handleResetClanWars = () => {
    communityDataStore.resetClanWars();
    setClanWars([...communityDataStore.getClanWars()]);
    toast.success("Semaine de guerre des clans réinitialisée !");
  };

  // 8. Social moderation
  const handleDeleteSocialPost = async (id: string) => {
    try {
      await communityDataStore.deleteSocialPost(id);
      setSocialPosts([...communityDataStore.getSocialPosts()]);
      toast.success("Post modéré et supprimé du mur social");
    } catch {
      setSocialPosts([...communityDataStore.getSocialPosts()]);
      toast.error("Suppression refusée par la base");
    }
  };

  const handleDeleteLfgPost = async (id: string) => {
    try {
      await communityDataStore.deleteLfgPost(id);
      setLfgPosts([...communityDataStore.getLfgPosts()]);
      toast.success("Annonce de matchmaking supprimée");
    } catch {
      setLfgPosts([...communityDataStore.getLfgPosts()]);
      toast.error("Suppression refusée par la base");
    }
  };

  // 9. Tournament handlers
  const handleSaveMainEvent = () => {
    tournamentDataStore.saveMainEvent(mainEvent);
    cyberAudio.playSuccess();
    toast.success("Paramètres du Main Event sauvegardés !");
  };

  const handleResetBracket = () => {
    tournamentDataStore.resetBracketMatches();
    toast.success("Arbre des playoffs réinitialisé aux confrontations par défaut !");
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 md:p-6 animate-fade-in font-display">
      <CyberCard
        variant="cyan"
        hoverEffect={false}
        className="w-full max-w-5xl h-[92vh] flex flex-col p-6 md:p-8 relative text-left overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black shadow-neon-orange">
              <Shield size={22} />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black uppercase text-white flex items-center gap-2">
                CENTRE DE CONTRÔLE GÉNÉRAL ADMIN <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-400 text-black">SUPERUSER</span>
              </h2>
              <p className="text-[11px] font-sans text-white/50">
                Gérez, configurez, modifiez ou réinitialisez tous les systèmes ludiques, sociaux et compétitifs.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 py-3 overflow-x-auto shrink-0 border-b border-white/10 custom-scrollbar">
          {[
            { id: 'wheel', label: 'Roue de la Fortune', icon: <Sparkles size={13} /> },
            { id: 'quests', label: 'Quêtes & Streaks', icon: <Flame size={13} /> },
            { id: 'lootbox', label: 'Coffres Mystères', icon: <Gift size={13} /> },
            { id: 'jukebox', label: 'Jukebox Lounge', icon: <Music size={13} /> },
            { id: 'jackpot', label: 'Grand Jackpot', icon: <Coins size={13} /> },
            { id: 'quiz', label: 'Quizz E-Sport', icon: <HelpCircle size={13} /> },
            { id: 'clans', label: 'Guerre des Clans', icon: <Swords size={13} /> },
            { id: 'social', label: 'Modération Mur & LFG', icon: <MessageSquare size={13} /> },
            { id: 'tournament', label: 'Main Event & Bracket', icon: <Trophy size={13} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono font-black uppercase whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-secondary text-black border-secondary shadow-neon-cyan'
                  : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto py-5 custom-scrollbar pr-1 space-y-6">

          {/* 1. GESTION ROUE DE LA FORTUNE */}
          {activeTab === 'wheel' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white">Segments & Lots de la Roue</h3>
                  <p className="text-xs text-white/50 font-sans">Modifiez les 8 lots attribuables aux joueurs chaque jour.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetSpins}
                    className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer hover:bg-amber-500/30"
                  >
                    <RotateCcw size={12} /> Réinitialiser les L付ncers de tous
                  </button>
                  <NeonButton size="sm" variant="cyan" onClick={handleSaveWheel} className="text-xs py-1.5">
                    Enregistrer les Lots
                  </NeonButton>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {wheelSegments.map((seg, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-mono text-white/50">
                      <span>Segment #{idx + 1}</span>
                      <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                    </div>
                    <div>
                      <label className="text-[9px] font-mono uppercase text-white/40 block">Intitulé affiché</label>
                      <input
                        type="text"
                        value={seg.label}
                        onChange={(e) => {
                          const updated = [...wheelSegments];
                          updated[idx].label = e.target.value;
                          setWheelSegments(updated);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-mono uppercase text-white/40 block">Icône</label>
                        <input
                          type="text"
                          value={seg.icon}
                          onChange={(e) => {
                            const updated = [...wheelSegments];
                            updated[idx].icon = e.target.value;
                            setWheelSegments(updated);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white text-center"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-mono uppercase text-white/40 block">Valeur</label>
                        <input
                          type="number"
                          value={seg.amount}
                          onChange={(e) => {
                            const updated = [...wheelSegments];
                            updated[idx].amount = Number(e.target.value);
                            setWheelSegments(updated);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white text-center font-mono"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 2. GESTION QUÊTES QUOTIDIENNES */}
          {activeTab === 'quests' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white">Quêtes du Jour</h3>
                  <p className="text-xs text-white/50 font-sans">Définissez les missions quotidiennes des joueurs et leurs primes en jetons.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAddQuest}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[10px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Ajouter une Quête
                  </button>
                  <NeonButton size="sm" variant="cyan" onClick={handleSaveQuests} className="text-xs py-1.5">
                    Sauvegarder
                  </NeonButton>
                </div>
              </div>

              <div className="space-y-3">
                {quests.map((q, idx) => (
                  <div key={q.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center gap-3 justify-between">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <input
                        type="text"
                        value={q.icon}
                        onChange={(e) => {
                          const updated = [...quests];
                          updated[idx].icon = e.target.value;
                          setQuests(updated);
                        }}
                        className="w-10 h-10 bg-black/60 border border-white/10 rounded-lg text-center text-lg"
                      />
                      <div className="flex-1 md:w-80">
                        <input
                          type="text"
                          value={q.title}
                          onChange={(e) => {
                            const updated = [...quests];
                            updated[idx].title = e.target.value;
                            setQuests(updated);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-white mb-1"
                        />
                        <input
                          type="text"
                          value={q.description}
                          onChange={(e) => {
                            const updated = [...quests];
                            updated[idx].description = e.target.value;
                            setQuests(updated);
                          }}
                          className="w-full bg-black/60 border border-white/10 rounded-lg p-1.5 text-[11px] text-white/60 font-sans"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono uppercase text-white/40">Gain <ManiIcon className="w-3 h-3" /> :</span>
                        <input
                          type="number"
                          value={q.mani_reward}
                          onChange={(e) => {
                            const updated = [...quests];
                            updated[idx].mani_reward = Number(e.target.value);
                            setQuests(updated);
                          }}
                          className="w-14 bg-black/60 border border-white/10 rounded-lg p-1.5 text-xs text-amber-400 font-mono text-center font-bold"
                        />
                      </div>

                      <button
                        onClick={() => handleDeleteQuest(q.id)}
                        className="p-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. GESTION COFFRES MYSTÈRES */}
          {activeTab === 'lootbox' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-black uppercase text-white">Prix d'ouverture du coffre</h4>
                  <p className="text-xs text-white/50 font-sans">Montant en jetons prélevé sur le solde du joueur pour chaque ouverture.</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={lootboxCost}
                    onChange={(e) => setLootboxCost(Number(e.target.value))}
                    className="w-20 bg-white/10 border border-white/20 rounded-xl p-2 text-center text-amber-400 font-mono font-bold"
                  />
                  <NeonButton size="sm" variant="violet" onClick={handleSaveLootboxCost} className="text-xs py-2">
                    Mettre à Jour le Prix
                  </NeonButton>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-black uppercase text-white">Pool de Récompenses Révélables ({lootboxRewards.length})</h4>
                  <button
                    onClick={handleAddLootboxReward}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[10px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={12} /> Ajouter un Lot
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {lootboxRewards.map((rew, idx) => (
                    <div key={rew.id} className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded text-black font-black" style={{ backgroundColor: rew.color }}>
                          {rew.category}
                        </span>
                        <button
                          onClick={() => handleDeleteLootboxReward(rew.id)}
                          className="text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={rew.name}
                          onChange={(e) => {
                            const updated = [...lootboxRewards];
                            updated[idx].name = e.target.value;
                            setLootboxRewards(updated);
                            gamificationStore.saveLootboxRewards(updated);
                          }}
                          className="bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-white"
                          placeholder="Nom du lot"
                        />
                        <input
                          type="text"
                          value={rew.value_text}
                          onChange={(e) => {
                            const updated = [...lootboxRewards];
                            updated[idx].value_text = e.target.value;
                            setLootboxRewards(updated);
                            gamificationStore.saveLootboxRewards(updated);
                          }}
                          className="bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-mono text-amber-400"
                          placeholder="Valeur affichée"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={rew.description}
                        onChange={(e) => {
                          const updated = [...lootboxRewards];
                          updated[idx].description = e.target.value;
                          setLootboxRewards(updated);
                          gamificationStore.saveLootboxRewards(updated);
                        }}
                        className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[11px] font-sans text-white/70 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. GESTION JUKEBOX */}
          {activeTab === 'jukebox' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white">Playlists & Ambiance du Jukebox</h3>
                  <p className="text-xs text-white/50 font-sans">Gérez les styles musicaux soumis aux votes des gamers.</p>
                </div>
                <button
                  onClick={handleResetJukeboxVotes}
                  className="px-3 py-1.5 rounded-xl bg-secondary/20 border border-secondary/40 text-secondary text-[10px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer hover:bg-secondary/30"
                >
                  <RotateCcw size={12} /> Réinitialiser les Votes (0)
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {jukeboxGenres.map((g, idx) => (
                  <div key={g.id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-white">{g.name}</span>
                      <span className="text-[10px] font-mono text-secondary font-bold">{g.votes} Votes</span>
                    </div>
                    <input
                      type="text"
                      value={g.vibe}
                      onChange={(e) => {
                        const updated = [...jukeboxGenres];
                        updated[idx].vibe = e.target.value;
                        setJukeboxGenres(updated);
                        gamificationStore.saveJukeboxGenres(updated);
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs text-white/80"
                      placeholder="Descriptif d'ambiance"
                    />
                    <input
                      type="text"
                      value={g.now_playing}
                      onChange={(e) => {
                        const updated = [...jukeboxGenres];
                        updated[idx].now_playing = e.target.value;
                        setJukeboxGenres(updated);
                        gamificationStore.saveJukeboxGenres(updated);
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-[10px] font-mono text-white/50"
                      placeholder="Artistes ou titres phares"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 5. GESTION GRAND JACKPOT */}
          {activeTab === 'jackpot' && (
            <div className="p-5 rounded-2xl bg-black/50 border border-white/10 space-y-4">
              <h3 className="text-base font-black uppercase text-white">Paramètres du Jackpot Collectif</h3>
              <p className="text-xs text-white/50 font-sans">Ajustez la cagnotte en jetons ou déclenchez la remise du prix de fin de mois.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Cagnotte <ManiIcon className="w-3 h-3" /></label>
                  <input
                    type="number"
                    value={jackpot.currentPool}
                    onChange={(e) => setJackpot({ ...jackpot, currentPool: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-amber-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Total Tickets Achetés (Comptoir & App)</label>
                  <input
                    type="number"
                    value={jackpot.totalTickets}
                    onChange={(e) => setJackpot({ ...jackpot, totalTickets: Number(e.target.value) })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Description du Lot Physique & Annonce</label>
                <input
                  type="text"
                  value={jackpot.prizeDesc}
                  onChange={(e) => setJackpot({ ...jackpot, prizeDesc: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white font-sans"
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-white/10">
                <NeonButton size="sm" variant="violet" onClick={handleSaveJackpot} className="text-xs py-2 px-5">
                  Enregistrer les Modifications
                </NeonButton>
                <button
                  onClick={handleResetJackpot}
                  className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-black uppercase cursor-pointer hover:bg-amber-500/30"
                >
                  Effectuer le Tirage & Réinitialiser
                </button>
              </div>
            </div>
          )}

          {/* 6. GESTION DU QUIZZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white">Questions du Quizz E-Sport ({quizQuestions.length})</h3>
                  <p className="text-xs text-white/50 font-sans">Ajoutez ou modifiez les questions du test de connaissances des joueurs.</p>
                </div>
                <button
                  onClick={handleAddQuiz}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[10px] font-mono font-black uppercase flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} /> Ajouter une Question
                </button>
              </div>

              <div className="space-y-3">
                {quizQuestions.map((q, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-secondary uppercase font-bold">
                        Question #{idx + 1} · {q.game}
                      </span>
                      <button onClick={() => handleDeleteQuiz(idx)} className="text-red-400 hover:text-red-300 cursor-pointer">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...quizQuestions];
                        updated[idx].question = e.target.value;
                        setQuizQuestions(updated);
                        gamificationStore.saveQuizQuestions(updated);
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-xs font-bold text-white"
                    />

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${oIdx === q.correctIndex ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white/50'}`}>
                            {oIdx === q.correctIndex ? 'VRAI' : 'FAUX'}
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => {
                              const updated = [...quizQuestions];
                              updated[idx].options[oIdx] = e.target.value;
                              setQuizQuestions(updated);
                              gamificationStore.saveQuizQuestions(updated);
                            }}
                            className="w-full bg-black/40 border border-white/5 rounded p-1.5 text-xs text-white"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. GESTION GUERRE DES CLANS */}
          {activeTab === 'clans' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase text-white">Scores de la Guerre des Clans Hebdomadaire</h3>
                  <p className="text-xs text-white/50 font-sans">Ajustez manuellement les points de chaque clan de salle.</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleResetClanWars}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/40 text-[10px] font-mono font-black uppercase cursor-pointer"
                  >
                    Réinitialiser la Semaine
                  </button>
                  <NeonButton size="sm" variant="cyan" onClick={handleSaveClanWars} className="text-xs py-1.5">
                    Sauvegarder les Scores
                  </NeonButton>
                </div>
              </div>

              <div className="space-y-3">
                {clanWars.map((s, idx) => (
                  <div key={s.team_id} className="p-4 rounded-xl bg-white/[0.03] border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="font-display font-black text-sm uppercase text-white">
                      Clan : {s.team_id.toUpperCase()}
                    </span>

                    <div className="grid grid-cols-3 gap-3 text-xs font-mono">
                      <div>
                        <span className="text-[9px] uppercase text-white/40 block">Points Clan</span>
                        <input
                          type="number"
                          value={s.points}
                          onChange={(e) => {
                            const updated = [...clanWars];
                            updated[idx].points = Number(e.target.value);
                            setClanWars(updated);
                          }}
                          className="w-20 bg-black/60 border border-white/10 rounded-lg p-2 text-center text-amber-400 font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-white/40 block">Duels 1v1 Gagnés</span>
                        <input
                          type="number"
                          value={s.duels_won}
                          onChange={(e) => {
                            const updated = [...clanWars];
                            updated[idx].duels_won = Number(e.target.value);
                            setClanWars(updated);
                          }}
                          className="w-20 bg-black/60 border border-white/10 rounded-lg p-2 text-center text-white font-bold"
                        />
                      </div>
                      <div>
                        <span className="text-[9px] uppercase text-white/40 block">Heures Cumulées</span>
                        <input
                          type="number"
                          value={s.hours_logged}
                          onChange={(e) => {
                            const updated = [...clanWars];
                            updated[idx].hours_logged = Number(e.target.value);
                            setClanWars(updated);
                          }}
                          className="w-20 bg-black/60 border border-white/10 rounded-lg p-2 text-center text-secondary font-bold"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 8. MODÉRATION SOCIAL & LFG */}
          {activeTab === 'social' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-black uppercase text-white mb-3">Modération du Mur Social ({socialPosts.length} posts)</h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {socialPosts.map((post) => (
                    <div key={post.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-white mr-2">{post.author_name}</span>
                        <span className="text-white/60 font-sans line-clamp-1">{post.content}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteSocialPost(post.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer shrink-0"
                        title="Supprimer ce post"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-black uppercase text-white mb-3">Modération du Tableau LFG ({lfgPosts.length} annonces)</h3>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {lfgPosts.map((lfg) => (
                    <div key={lfg.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-secondary mr-2">{lfg.user_name} ({lfg.game})</span>
                        <span className="text-white/60 font-sans line-clamp-1">{lfg.note}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteLfgPost(lfg.id)}
                        className="text-red-400 hover:text-red-300 p-1.5 cursor-pointer shrink-0"
                        title="Supprimer cette annonce"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 9. TOURNOIS MAIN EVENT & BRACKET */}
          {activeTab === 'tournament' && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-black/50 border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-black uppercase text-white">Main Event Spotlight (Grand Tournoi)</h4>
                  <NeonButton size="sm" variant="violet" onClick={handleSaveMainEvent} className="text-xs py-1.5">
                    Mettre à Jour le Tournoi
                  </NeonButton>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Titre de la Compétition</label>
                    <input
                      type="text"
                      value={mainEvent.title}
                      onChange={(e) => setMainEvent({ ...mainEvent, title: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Jeu / Catégorie</label>
                    <input
                      type="text"
                      value={mainEvent.game}
                      onChange={(e) => setMainEvent({ ...mainEvent, game: e.target.value })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-secondary font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Cashprize (FCFA)</label>
                    <input
                      type="number"
                      value={mainEvent.cashprize_fcfa}
                      onChange={(e) => setMainEvent({ ...mainEvent, cashprize_fcfa: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-amber-400 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-mono uppercase text-white/40 block mb-1">Pool <ManiIcon className="w-3 h-3" /></label>
                    <input
                      type="number"
                      value={mainEvent.mani_pool}
                      onChange={(e) => setMainEvent({ ...mainEvent, mani_pool: Number(e.target.value) })}
                      className="w-full bg-black/60 border border-white/10 rounded-lg p-2 text-primary font-mono font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black uppercase text-white">Arbre de Tournoi (Playoff Bracket)</h4>
                  <p className="text-xs text-white/50 font-sans">Réinitialiser les scores et confrontations de l'arbre à l'état initial.</p>
                </div>
                <button
                  onClick={handleResetBracket}
                  className="px-4 py-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-xs font-mono font-black uppercase cursor-pointer hover:bg-red-500/30"
                >
                  Réinitialiser l'Arbre
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-white/40 shrink-0">
          <span>Connecté en tant que Darius_Admin (Super Administrateur)</span>
          <button onClick={onClose} className="text-white hover:underline cursor-pointer">
            Fermer le panneau
          </button>
        </div>
      </CyberCard>
    </div>
  );
}
