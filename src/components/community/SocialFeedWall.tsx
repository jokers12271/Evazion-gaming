import React, { useState, useEffect } from 'react';
import { Flame, Crown, Zap, Target, Send, MessageSquare, Sparkles, Video, Trophy, Trash2, Shield } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import {
  useCommunityStore,
  SocialPost,
  describeCommunityPostError,
  getCommunityPostsBackendState,
  POSTS_MIGRATION_FILE
} from '@/lib/communityData';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useGames } from '@/hooks/useGames';
import { useConfirm } from '@/hooks/useConfirm';
import { toast } from 'react-hot-toast';
import { cyberAudio } from '@/lib/cyberAudio';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getRank } from '@/lib/ranks';
import { useNavigate } from '@/lib/router';

export function SocialFeedWall() {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = (metadata as any)?.is_admin || false;
  const communityDataStore = useCommunityStore();
  const posts: SocialPost[] = communityDataStore.getSocialPosts();
  const { confirm: askConfirm, dialog: confirmDialog } = useConfirm();
  const backendMissing = getCommunityPostsBackendState() === 'missing';
  const navigate = useNavigate();

  // Ouvre la fiche du joueur concerne (avatar ou pseudo cliquables).
  const openProfile = (userId: string) => {
    if (!userId || userId.startsWith('tmp_')) return;
    navigate({ to: `/dashboard/player/${userId}` });
  };
  const [newContent, setNewContent] = useState('');
  const [selectedGame, setSelectedGame] = useState('');
  const [postType, setPostType] = useState<'exploit' | 'clip' | 'announcement'>('exploit');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Disciplines : source unique = ludotheque (table games), triee A-Z.
  const { games } = useGames();
  const disciplines = React.useMemo(
    () => (games || []).map((g: any) => g.title).filter(Boolean).sort((a: string, b: string) => a.localeCompare(b, 'fr')),
    [games]
  );

  // Si le jeu choisi disparait de la ludotheque, on rebascule sur le premier.
  useEffect(() => {
    if (disciplines.length === 0) {
      setSelectedGame('');
      return;
    }
    if (!selectedGame || !disciplines.includes(selectedGame)) {
      setSelectedGame(disciplines[0]);
    }
  }, [disciplines, selectedGame]);

  const handleReact = async (postId: string, reaction: 'fire' | 'goat' | 'bolt' | 'clutch') => {
    if (!user) {
      toast.error("Connectez-vous pour réagir aux exploits !");
      return;
    }
    cyberAudio.playClick();
    try {
      await communityDataStore.reactToPost(postId, reaction, user.id);
    } catch (e) {
      toast.error(describeCommunityPostError(e));
    }
  };

  // Suppression : auteur du post OU admin. Confirmation systeme.
  const handleDelete = (post: SocialPost) => {
    const isOwner = !!user && post.author_id === user.id;
    if (!isOwner && !isAdmin) return;

    askConfirm({
      title: 'Supprimer cette publication',
      subject: `${post.author_name} · ${post.game}`,
      message: isOwner
        ? 'Votre publication sera retiree du fil du Sanctuary.'
        : 'Suppression admin : cette publication sera retiree du fil pour tous les joueurs.',
      confirmLabel: 'SUPPRIMER',
      onConfirm: async () => {
        try {
          await communityDataStore.deleteSocialPost(post.id);
          toast.success('Publication supprimée');
        } catch (e) {
          toast.error(describeCommunityPostError(e));
        }
      },
    });
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    if (!user) {
      toast.error("Veuillez vous connecter pour publier sur le mur de la salle");
      return;
    }
    if (!selectedGame) {
      toast.error("Ludothèque vide : ajoutez un jeu avant de publier");
      return;
    }

    setIsSubmitting(true);
    cyberAudio.playSuccess();
    try {
      await communityDataStore.addSocialPost({
        author_id: user.id,
        author_name: user.user_metadata?.display_name || 'Gamer',
        author_avatar: user.user_metadata?.avatar_url,
        content: newContent.trim(),
        type: postType,
        game: selectedGame
      });

      setNewContent('');
      toast.success("Exploit partagé sur le mur du Sanctuary ! 🔥", { position: 'bottom-center' });
    } catch (e) {
      toast.error(describeCommunityPostError(e));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Formulaire de publication rapide */}
      <CyberCard variant="violet" hoverEffect={false} className="p-3 md:p-6">
        <div className="flex items-center gap-1.5 md:gap-2 mb-2 pb-1.5 md:mb-3 md:pb-2 border-b border-white/10">
          <Sparkles size={13} className="text-primary md:h-4 md:w-4 shrink-0" />
          <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white leading-tight">
            Partager un Exploit ou une Action d'Anthologie
          </span>
        </div>

        <form onSubmit={handleCreatePost} className="space-y-2 md:space-y-3">
          <textarea
            required
            rows={2}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Racontez votre plus belle victoire, un combo meurtrier ou un but d'anthologie sur nos écrans..."
            className="w-full bg-black/40 border border-white/10 rounded-lg md:rounded-xl p-2 md:p-3 text-[11px] md:text-xs text-white focus:outline-none focus:border-primary font-sans resize-none"
          />

          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3 pt-0.5 md:pt-1">
            <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
              <select
                value={selectedGame}
                onChange={(e) => setSelectedGame(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-md md:rounded-lg px-1.5 md:px-2.5 py-1 md:py-1.5 text-[9px] md:text-[10px] font-mono uppercase text-white/80 focus:outline-none focus:border-primary max-w-[46%] md:max-w-none"
              >
                {disciplines.length === 0 && <option value="">Ludotheque vide</option>}
                {disciplines.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <div className="flex rounded-md md:rounded-lg bg-black/40 border border-white/10 p-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setPostType('exploit')}
                  className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-mono uppercase font-black cursor-pointer transition-all ${
                    postType === 'exploit' ? 'bg-primary text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Exploit
                </button>
                <button
                  type="button"
                  onClick={() => setPostType('clip')}
                  className={`px-1.5 md:px-2.5 py-0.5 md:py-1 rounded text-[8px] md:text-[9px] font-mono uppercase font-black cursor-pointer transition-all ${
                    postType === 'clip' ? 'bg-secondary text-black' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Highlight
                </button>
              </div>
            </div>

            <NeonButton
              type="submit"
              size="sm"
              variant="violet"
              disabled={isSubmitting || !newContent.trim()}
              className="py-1 md:py-1.5 px-2.5 md:px-4 text-[9px] md:text-[10px] shrink-0"
            >
              <Send size={11} className="mr-1 md:mr-1.5 md:h-3 md:w-3" /> Publier
            </NeonButton>
          </div>
        </form>
      </CyberCard>

      {/* Alerte : la table des publications n'existe pas encore en base. */}
      {backendMissing && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
          <p className="text-[9px] md:text-[10px] font-mono uppercase text-amber-300 leading-relaxed">
            Mur social indisponible : applique la migration {POSTS_MIGRATION_FILE} dans Supabase
            (SQL Editor) pour activer les publications.
          </p>
        </div>
      )}

      {/* Flux de posts : box defilante pour ne pas saturer l'ecran */}
      <div className="rounded-2xl bg-white/[0.02] border border-white/10 p-3 md:p-4">
        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-white/5">
          <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white">
            Fil du Sanctuary
          </span>
          <span className="text-[9px] md:text-[10px] font-mono text-white/35">
            {posts.length} publication{posts.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="space-y-3 md:space-y-4 max-h-[560px] overflow-y-auto custom-scrollbar pr-1">
        {posts.length === 0 ? (
          <p className="py-10 text-center text-[9px] md:text-[10px] uppercase font-black tracking-widest text-white/20">
            Le fil est vide... Partagez votre premier exploit !
          </p>
        ) : (
        posts.map((post) => {
          const userReaction = user ? post.user_reactions?.[user.id] : null;
          const authorRank = getRank(post.profile?.total_hours || 0);
          const authorTeam = post.profile?.community_team || post.team_id;

          return (
            <div
              key={post.id}
              className="p-3 md:p-5 rounded-xl md:rounded-2xl bg-white/[0.02] border border-white/10 hover:border-white/20 transition-all font-display"
            >
              <div className="flex items-start justify-between gap-2 md:gap-4 mb-1.5 md:mb-3">
                {/* Profil de l'auteur : avatar + pseudo cliquables vers sa fiche */}
                <button
                  type="button"
                  onClick={() => openProfile(post.author_id)}
                  title={`Voir le profil de ${post.author_name}`}
                  className="flex items-center gap-1.5 md:gap-3 min-w-0 text-left cursor-pointer group/author"
                >
                  <img
                    src={post.author_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${post.author_name}`}
                    alt={post.author_name}
                    className="w-7 h-7 md:w-10 md:h-10 rounded-lg md:rounded-xl object-cover border border-white/20 shrink-0"
                    style={post.profile ? { boxShadow: `0 0 0 1px ${authorRank.color}55` } : undefined}
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-xs font-black uppercase text-white flex items-center gap-1 md:gap-2">
                      <span className="truncate group-hover/author:text-primary transition-colors">{post.author_name}</span>
                      {post.type === 'duel_result' && (
                        <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[7px] md:text-[8px] font-mono shrink-0">
                          Victoire 1v1
                        </span>
                      )}
                      {post.type === 'exploit' && (
                        <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-primary/20 text-primary border border-primary/30 text-[7px] md:text-[8px] font-mono shrink-0">
                          Exploit Salle
                        </span>
                      )}
                      {post.type === 'clip' && (
                        <span className="px-1.5 md:px-2 py-0.5 rounded-full bg-secondary/20 text-secondary border border-secondary/30 text-[7px] md:text-[8px] font-mono shrink-0">
                          Highlight
                        </span>
                      )}
                    </div>
                    <div className="text-[9px] md:text-[10px] font-mono text-white/40 flex items-center gap-1 md:gap-2 mt-0.5">
                      <span className="text-secondary font-bold truncate">{post.game}</span>
                      <span>·</span>
                      <span className="truncate">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: fr })}
                      </span>
                    </div>
                    {/* Rang + team lus sur le profil de l'auteur */}
                    <div className="flex items-center gap-1 mt-0.5">
                      <span
                        className="px-1 py-0.5 rounded text-[7px] md:text-[8px] font-mono font-black uppercase"
                        style={{ backgroundColor: `${authorRank.color}22`, color: authorRank.color }}
                      >
                        {authorRank.name}
                      </span>
                      {authorTeam && (
                        <span className="px-1 py-0.5 rounded text-[7px] md:text-[8px] font-mono font-black uppercase bg-white/5 border border-white/10 text-white/50 truncate max-w-[110px]">
                          {authorTeam}
                        </span>
                      )}
                    </div>
                  </div>
                </button>

                {(user?.id === post.author_id || isAdmin) && (
                  <button
                    type="button"
                    onClick={() => handleDelete(post)}
                    title={isAdmin && user?.id !== post.author_id ? 'Supprimer (Admin)' : 'Supprimer ma publication'}
                    className={`shrink-0 flex items-center gap-1 px-1.5 md:px-2 py-1 rounded-lg md:rounded-xl border border-white/10 bg-white/5 font-mono font-black uppercase text-[8px] md:text-[9px] cursor-pointer transition-all active:scale-95 hover:bg-white/10 ${
                      isAdmin && user?.id !== post.author_id
                        ? 'text-primary hover:text-primary/70'
                        : 'text-red-400 hover:text-red-300'
                    }`}
                  >
                    {isAdmin && user?.id !== post.author_id ? <Shield size={10} className="md:h-[11px] md:w-[11px]" /> : <Trash2 size={10} className="md:h-[11px] md:w-[11px]" />}
                    <span className="hidden sm:inline">Supprimer</span>
                  </button>
                )}
              </div>

              <p className="text-[10px] md:text-sm text-white/90 font-sans leading-relaxed mb-2 md:mb-4 pl-1">
                {post.content}
              </p>

              {/* Boutons de réactions */}
              <div className="flex flex-wrap items-center gap-1.5 md:gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => handleReact(post.id, 'fire')}
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border text-[10px] md:text-xs font-mono font-black flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    userReaction === 'fire'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-neon-orange'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Flame size={11} className="text-amber-400 md:h-[13px] md:w-[13px]" />
                  <span>{post.likes.fire}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReact(post.id, 'goat')}
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border text-[10px] md:text-xs font-mono font-black flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    userReaction === 'goat'
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-neon-violet'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Crown size={11} className="text-purple-400 md:h-[13px] md:w-[13px]" />
                  <span>{post.likes.goat}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReact(post.id, 'bolt')}
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border text-[10px] md:text-xs font-mono font-black flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    userReaction === 'bolt'
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-neon-cyan'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Zap size={11} className="text-cyan-400 md:h-[13px] md:w-[13px]" />
                  <span>{post.likes.bolt}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReact(post.id, 'clutch')}
                  className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl border text-[10px] md:text-xs font-mono font-black flex items-center gap-1 md:gap-1.5 cursor-pointer transition-all active:scale-95 ${
                    userReaction === 'clutch'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Target size={11} className="text-emerald-400 md:h-[13px] md:w-[13px]" />
                  <span>{post.likes.clutch}</span>
                </button>
              </div>
            </div>
          );
        })
        )}
        </div>
      </div>

      {confirmDialog}
    </div>
  );
}
