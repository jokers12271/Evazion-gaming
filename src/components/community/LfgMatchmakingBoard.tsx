import React, { useState, useEffect, useRef } from 'react';
import { Users, Gamepad2, Calendar, Phone, Plus, X, Search, ChevronDown, CheckCircle, Trash2, Shield } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import {
  useCommunityStore,
  LfgPost,
  describeCommunityPostError,
  getCommunityPostsBackendState,
  POSTS_MIGRATION_FILE
} from '@/lib/communityData';
import { useAuth } from '@/hooks/useAuth';
import { useLoyalty } from '@/hooks/useLoyalty';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useGames } from '@/hooks/useGames';
import { useConfirm } from '@/hooks/useConfirm';
import { getRank } from '@/lib/ranks';
import { useNavigate } from '@/lib/router';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';

export function LfgMatchmakingBoard() {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = (metadata as any)?.is_admin || false;
  const { data: loyalty } = useLoyalty();
  const userRank = getRank(loyalty?.total_hours || 0);
  const { confirm: askConfirm, dialog: confirmDialog } = useConfirm();
  const backendMissing = getCommunityPostsBackendState() === 'missing';
  const navigate = useNavigate();

  // Ouvre la fiche du joueur concerne (avatar ou pseudo cliquables).
  const openProfile = (userId: string) => {
    if (!userId || userId.startsWith('tmp_')) return;
    navigate({ to: `/dashboard/player/${userId}` });
  };

  const communityDataStore = useCommunityStore();
  const posts: LfgPost[] = communityDataStore.getLfgPosts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterGame, setFilterGame] = useState('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [gameSearch, setGameSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disciplines : source unique = ludotheque (table games), triee A-Z.
  // useGames invalide le cache a chaque ajout/suppression, donc la liste
  // suit la ludotheque automatiquement.
  const { games } = useGames();
  const disciplines = React.useMemo(
    () => (games || []).map((g: any) => g.title).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, 'fr')),
    [games]
  );

  // Form states
  const [game, setGame] = useState('');

  // Si le jeu choisi disparait de la ludotheque, on rebascule sur le premier.
  useEffect(() => {
    if (disciplines.length === 0) {
      setGame('');
      return;
    }
    if (!game || !disciplines.includes(game)) {
      setGame(disciplines[0]);
    }
  }, [disciplines, game]);

  // Fermeture animee de la modale.
  const [modalMounted, setModalMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setModalMounted(true);
      setClosing(false);
      return;
    }
    if (!modalMounted) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setModalMounted(false);
      setClosing(false);
    }, 220);
  }, [isModalOpen, modalMounted]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const closeModal = () => setIsModalOpen(false);
  const [mode, setMode] = useState<'1v1 Sparring' | 'Ranked Duo' | 'Squad 4v4' | 'Co-op Chill'>('1v1 Sparring');
  const [schedule, setSchedule] = useState('');
  const [note, setNote] = useState('');
  const [whatsapp, setWhatsapp] = useState('+242 06 ');

  const filteredPosts = filterGame === 'ALL' ? posts : posts.filter(p => p.game === filterGame);

  const filteredDisciplines = React.useMemo(() => {
    const term = gameSearch.trim().toLowerCase();
    if (!term) return disciplines;
    return disciplines.filter((d) => d.toLowerCase().includes(term));
  }, [disciplines, gameSearch]);

  // Fermer le panneau filtre au clic exterieur.
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isFilterOpen) return;

    const onPointerDown = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [isFilterOpen]);

  // Si le jeu filtre disparait de la ludotheque, on rebascule sur "Tous".
  useEffect(() => {
    if (filterGame !== 'ALL' && disciplines.length > 0 && !disciplines.includes(filterGame)) {
      setFilterGame('ALL');
    }
  }, [disciplines, filterGame]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Veuillez vous connecter pour publier une annonce");
      return;
    }
    if (!schedule.trim() || !note.trim()) {
      toast.error("Veuillez remplir les horaires et vos disponibilités");
      return;
    }
    if (!game) {
      toast.error("Ludothèque vide : ajoutez un jeu avant de publier");
      return;
    }

    setIsSubmitting(true);
    cyberAudio.playSuccess();
    try {
      await communityDataStore.addLfgPost({
        user_id: user.id,
        user_name: user.user_metadata?.display_name || 'Gamer',
        user_avatar: user.user_metadata?.avatar_url,
        rank_name: userRank.name,
        game,
        platform: 'PS5 Pro',
        mode,
        schedule,
        note,
        whatsapp_number: whatsapp.trim() || undefined
      });

      closeModal();
      setSchedule('');
      setNote('');
      toast.success("Annonce de matchmaking publiée sur le tableau ! 🎯", { position: 'bottom-center' });
    } catch (e) {
      toast.error(describeCommunityPostError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Suppression : auteur du post OU admin. Confirmation systeme.
  const handleDelete = (post: LfgPost) => {
    const isOwner = !!user && post.user_id === user.id;
    if (!isOwner && !isAdmin) return;

    askConfirm({
      title: 'Supprimer cette annonce',
      subject: `${post.game} · ${post.user_name}`,
      message: isOwner
        ? 'Votre annonce sera retiree du LFG.'
        : 'Suppression admin : cette annonce sera retiree du LFG pour tous les joueurs.',
      confirmLabel: 'SUPPRIMER',
      onConfirm: async () => {
        try {
          await communityDataStore.deleteLfgPost(post.id);
          toast.success('Annonce supprimée');
        } catch (e) {
          toast.error(describeCommunityPostError(e));
        }
      },
    });
  };

  return (
    <div className="space-y-6 text-left">
      {/* En-tête et filtres */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="text-xl md:text-2xl font-black uppercase text-white font-display flex items-center gap-2">
            <Users className="text-secondary" size={22} /> Tableau de Recherche de Joueurs & Rivaux (LFG)
          </h3>
          <p className="text-xs text-white/50 font-sans mt-0.5">
            Trouvez un coéquipier pour grimper en Ranked ou un rival pour vous entraîner sur les PS5 Pro du Sanctuary.
          </p>
        </div>

        <NeonButton
          size="sm"
          variant="cyan"
          sweep
          onClick={() => {
            if (!user) {
              toast.error("Connectez-vous pour déposer une annonce");
              return;
            }
            setIsModalOpen(true);
          }}
          className="shrink-0 text-xs py-2 px-4"
        >
          <Plus size={14} className="mr-1.5" /> Déposer une Annonce
        </NeonButton>
      </div>

      {/* Filtre de jeu : un seul bouton, la liste reste masquee */}
      <div className="relative" ref={filterRef}>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsFilterOpen((v) => !v)}
            className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono font-black uppercase cursor-pointer transition-all flex items-center gap-1.5 ${
              isFilterOpen || filterGame !== 'ALL'
                ? 'bg-secondary/20 border-secondary text-white shadow-neon-cyan'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
          >
            <Gamepad2 size={12} /> {filterGame === 'ALL' ? 'Filtrer par jeu' : filterGame}
            <ChevronDown size={12} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
          </button>

          {filterGame !== 'ALL' && (
            <button
              onClick={() => setFilterGame('ALL')}
              className="px-2.5 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/50 hover:text-white text-[10px] font-mono font-black uppercase cursor-pointer transition-all"
            >
              Réinitialiser
            </button>
          )}

          <span className="text-[10px] font-mono text-white/35">
            {filteredPosts.length} annonce{filteredPosts.length > 1 ? 's' : ''}
          </span>
        </div>

        {isFilterOpen && (
          <div className="mt-2 rounded-2xl bg-black/60 border border-white/10 p-2.5 animate-fade-in">
            <div className="relative mb-2">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                value={gameSearch}
                onChange={(e) => setGameSearch(e.target.value)}
                placeholder="Rechercher un jeu..."
                className="w-full pl-7 pr-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] text-white placeholder:text-white/25 focus:outline-none focus:border-secondary/50"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
              <button
                onClick={() => setFilterGame('ALL')}
                className={`px-2.5 py-1 rounded-lg border text-[9px] font-mono font-black uppercase cursor-pointer transition-all ${
                  filterGame === 'ALL'
                    ? 'bg-secondary/20 border-secondary text-white'
                    : 'bg-white/5 border-white/10 text-white/55 hover:text-white'
                }`}
              >
                Tous les Jeux
              </button>

              {filteredDisciplines.map((d) => (
                <button
                  key={d}
                  onClick={() => setFilterGame(d)}
                  className={`px-2.5 py-1 rounded-lg border text-[9px] font-mono font-black uppercase cursor-pointer transition-all ${
                    filterGame === d
                      ? 'bg-secondary/20 border-secondary text-white'
                      : 'bg-white/5 border-white/10 text-white/55 hover:text-white'
                  }`}
                >
                  {d}
                </button>
              ))}

              {filteredDisciplines.length === 0 && (
                <p className="px-1 py-2 text-[9px] font-mono uppercase text-white/25">Aucun jeu trouve</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grille des annonces : box defilante pour ne pas saturer l'ecran */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3 md:p-4">
        {backendMissing && (
          <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[9px] md:text-[10px] font-mono uppercase text-amber-300 leading-relaxed">
            Tableau indisponible : applique la migration {POSTS_MIGRATION_FILE} dans Supabase
            (SQL Editor) pour activer les annonces.
          </p>
        )}
        {filteredPosts.length === 0 ? (
          <p className="py-10 text-center text-[9px] md:text-[10px] uppercase font-black tracking-widest text-white/20">
            {backendMissing
              ? 'Annonces indisponibles pour le moment'
              : 'Aucune annonce pour ce filtre... Soyez le premier !'}
          </p>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
        {filteredPosts.map((post) => {
          // Rang et team recalcules depuis le profil vivant de l'auteur ;
          // le rang saisi a la publication sert de repli.
          const authorRank = post.profile
            ? getRank(post.profile.total_hours)
            : { ...getRank(0), name: post.rank_name };
          const authorTeam = post.profile?.community_team;

          return (
          <div
            key={post.id}
            className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between font-display"
          >
            <div>
              <div className="flex items-start justify-between gap-1.5 md:gap-2 mb-1.5 md:mb-3">
                {/* Profil de l'auteur : avatar + pseudo cliquables vers sa fiche */}
                <button
                  type="button"
                  onClick={() => openProfile(post.user_id)}
                  title={`Voir le profil de ${post.user_name}`}
                  className="flex items-center gap-1.5 md:gap-2.5 min-w-0 text-left cursor-pointer group/author"
                >
                  <img
                    src={post.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.user_name}`}
                    alt=""
                    className="w-7 h-7 md:w-9 md:h-9 rounded-lg md:rounded-xl object-cover border border-white/20 shrink-0"
                    style={post.profile ? { boxShadow: `0 0 0 1px ${authorRank.color}55` } : undefined}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-xs font-black uppercase text-white leading-tight truncate group-hover/author:text-secondary transition-colors">
                      {post.user_name}
                    </div>
                    <div className="text-[8px] md:text-[9px] font-mono text-secondary truncate">
                      Rang {authorRank.name}
                    </div>
                    {authorTeam && (
                      <div className="text-[7px] md:text-[8px] font-mono text-white/45 truncate">
                        {authorTeam}
                      </div>
                    )}
                  </div>
                </button>

                <span className="px-1.5 md:px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-[7px] md:text-[8px] font-mono uppercase shrink-0">
                  {post.mode}
                </span>
              </div>

              <div className="text-[10px] md:text-xs font-black text-white uppercase tracking-tight mb-0.5 md:mb-1 text-primary truncate">
                {post.game}
              </div>

              <p className="text-[10px] md:text-xs text-white/70 font-sans mb-1.5 md:mb-3 line-clamp-2 md:line-clamp-3">
                "{post.note}"
              </p>

              <div className="text-[9px] md:text-[10px] font-mono text-amber-400/90 mb-2 md:mb-4 flex items-center gap-1 md:gap-1.5">
                <Calendar size={10} className="md:h-3 md:w-3 shrink-0" /> <span className="truncate">{post.schedule}</span>
              </div>
            </div>

            <div className="pt-2 md:pt-3 border-t border-white/5 flex items-center justify-between gap-1.5 md:gap-2">
              {post.whatsapp_number ? (
                <a
                  href={`https://wa.me/${post.whatsapp_number.replace(/\D/g, '')}?text=Salut%20${encodeURIComponent(post.user_name)},%20j'ai%20vu%20ton%20annonce%20sur%20The%20Sanctuary%20pour%20jouer%20%C3%A0%20${encodeURIComponent(post.game)}%20!`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[9px] md:text-[10px] font-mono font-black uppercase flex items-center gap-1 md:gap-1.5 transition-all truncate"
                >
                  <Phone size={10} className="md:h-3 md:w-3 shrink-0" /> WhatsApp
                </a>
              ) : (
                <span className="text-[8px] md:text-[9px] font-mono text-white/40 truncate">RDV Direct en Salle</span>
              )}

              {(user?.id === post.user_id || isAdmin) && (
                <button
                  type="button"
                  onClick={() => handleDelete(post)}
                  title={isAdmin && user?.id !== post.user_id ? 'Supprimer (Admin)' : 'Supprimer mon annonce'}
                  className={`text-[8px] md:text-[9px] font-mono uppercase cursor-pointer shrink-0 flex items-center gap-1 transition-colors ${
                    isAdmin && user?.id !== post.user_id
                      ? 'text-primary hover:text-primary/70'
                      : 'text-red-400 hover:text-red-300'
                  }`}
                >
                  {isAdmin && user?.id !== post.user_id ? <Shield size={10} className="md:h-[11px] md:w-[11px]" /> : <Trash2 size={10} className="md:h-[11px] md:w-[11px]" />}
                  Supprimer
                </button>
              )}
            </div>
          </div>
          );
        })}
        </div>
        )}
      </div>

      {/* Modale d'ajout d'annonce */}
      {modalMounted && (
        <div
          className={`fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 md:p-4 font-display ${closing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`}
        >
          <div
            className={`w-full max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar relative text-left ${closing ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
          >
            <CyberCard variant="cyan" hoverEffect={false} className="p-4 md:p-8">
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 md:top-5 md:right-5 text-white/60 hover:text-white"
              >
                <X size={16} className="md:h-[18px] md:w-[18px]" />
              </button>

              <h3 className="text-sm md:text-xl font-black uppercase text-white mb-1">
                Publier une Annonce de Matchmaking
              </h3>
              <p className="text-[10px] md:text-xs text-white/50 font-sans mb-3 md:mb-5">
                Votre proposition sera affichée pour tous les membres du Sanctuaire.
              </p>

              <form onSubmit={handleCreatePost} className="space-y-3 md:space-y-4">
                <div>
                  <label className="text-[8px] md:text-[9px] font-mono uppercase text-white/50 block mb-1">Discipline / Jeu</label>
                  <select
                    value={game}
                    onChange={(e) => setGame(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2 md:p-3 text-[10px] md:text-xs text-white focus:outline-none focus:border-secondary"
                  >
                    {disciplines.length === 0 && <option value="">Ludotheque vide</option>}
                    {disciplines.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[8px] md:text-[9px] font-mono uppercase text-white/50 block mb-1">Mode de Session</label>
                  <div className="grid grid-cols-2 gap-1.5 md:gap-2">
                    {(['1v1 Sparring', 'Ranked Duo', 'Squad 4v4', 'Co-op Chill'] as const).map((m) => (
                      <button
                        type="button"
                        key={m}
                        onClick={() => setMode(m)}
                        className={`p-1.5 md:p-2 rounded-xl border text-[9px] md:text-[10px] font-mono uppercase font-black cursor-pointer transition-all ${
                          mode === m
                            ? 'border-secondary bg-secondary/20 text-white'
                            : 'border-white/10 bg-white/5 text-white/60'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[8px] md:text-[9px] font-mono uppercase text-white/50 block mb-1">Créneau Prévu au Sanctuaire</label>
                  <input
                    required
                    type="text"
                    placeholder="Ex: Samedi 16h - 18h ou Ce soir dès 20h"
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2 md:p-3 text-[10px] md:text-xs text-white focus:outline-none focus:border-secondary font-sans"
                  />
                </div>

                <div>
                  <label className="text-[8px] md:text-[9px] font-mono uppercase text-white/50 block mb-1">Numéro WhatsApp (Optionnel pour contact direct)</label>
                  <input
                    type="text"
                    placeholder="+242 06 123 45 67"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2 md:p-3 text-[10px] md:text-xs text-white focus:outline-none focus:border-secondary font-mono"
                  />
                </div>

                <div>
                  <label className="text-[8px] md:text-[9px] font-mono uppercase text-white/50 block mb-1">Message & Objectif de la session</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Précisez votre niveau, ce que vous souhaitez travailler ou le défi..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl p-2 md:p-3 text-[10px] md:text-xs text-white focus:outline-none focus:border-secondary font-sans resize-none"
                  />
                </div>

                <div className="flex gap-2 md:gap-3 pt-1 md:pt-2">
                  <NeonButton type="button" variant="ghost" onClick={closeModal} className="flex-1 py-2 md:py-3 text-[10px] md:text-xs">
                    Annuler
                  </NeonButton>
                  <NeonButton type="submit" variant="cyan" sweep disabled={isSubmitting} className="flex-1 py-2 md:py-3 text-[10px] md:text-xs">
                    {isSubmitting ? 'Publication...' : "Publier l'Annonce"}
                  </NeonButton>
                </div>
              </form>
            </CyberCard>
          </div>
        </div>
      )}

      {confirmDialog}
    </div>
  );
}
