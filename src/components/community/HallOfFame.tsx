import React, { useState } from 'react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { useQuery } from '@tanstack/react-query';
import { Crown, Trophy, Users, X, UserMinus, Plus, Clock, Loader2, Search } from 'lucide-react';
import { useHallOfFame, useAddHallOfFame, useRemoveHallOfFame } from '@/hooks/useHallOfFame';
import { supabase } from '@/lib/supabase';
import { getRank } from '@/lib/ranks';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

const POSITIONS = [1, 2, 3];

/** Message lisible quand la table hall_of_fame n'a pas encore ete creee. */
function describeError(err: any) {
  const message = err?.message || '';
  if (/hall_of_fame/i.test(message) && (/schema cache|does not exist|PGRST205/i.test(message))) {
    return "Table hall_of_fame absente : applique supabase/migrations/20261014_hall_of_fame.sql";
  }
  if (/row-level security|permission denied|42501/i.test(message)) {
    return "Ton compte n'est pas reconnu admin sur hall_of_fame (policy is_admin)";
  }
  if (/duplicate key|unique/i.test(message)) {
    return "Ce joueur est deja inscrit, ou la place du podium est occupee";
  }
  return message || 'erreur inconnue';
}

export function HallOfFame({ isAdmin }: { isAdmin?: boolean }) {
  const { data: entries, isLoading } = useHallOfFame();
  const removeEntry = useRemoveHallOfFame();
  const [isManagerOpen, setIsManagerOpen] = useState(false);

  const champions = entries || [];

  const handleRemove = (id: number, name: string) => {
    removeEntry.mutate(id, {
      onSuccess: () => toast.success(`${name} retiré du Hall of Fame.`),
      onError: (err: any) => toast.error(`Retrait impossible : ${describeError(err)}`),
    });
  };

  return (
    <div className="mb-16 text-left">
      <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6 pb-3 md:pb-4 border-b border-white/5">
        <Crown className="text-amber-400 h-4 w-4 md:h-6 md:w-6 shrink-0" />
        <h3 className="font-display font-black uppercase tracking-wider text-sm md:text-xl text-white">
          HALL OF FAME DU SANCTUARY
        </h3>
        {isAdmin && (
          <NeonButton
            variant="orange"
            onClick={() => setIsManagerOpen(true)}
            className="ml-auto px-2 py-1 text-[7px] md:text-[9px] font-black tracking-widest shrink-0"
          >
            GÉRER
          </NeonButton>
        )}
      </div>

      {isLoading ? (
        <div className="p-10 flex flex-col items-center justify-center">
          <Loader2 className="animate-spin text-amber-400 mb-3" size={24} />
          <p className="text-[9px] uppercase font-black tracking-widest text-white/40">Lecture du Hall of Fame...</p>
        </div>
      ) : champions.length === 0 ? (
        <CyberCard hoverEffect={false} className="p-8 md:p-12 text-center">
          <Trophy className="text-white/10 mx-auto mb-3" size={32} />
          <p className="text-[9px] md:text-xs uppercase font-black tracking-[0.3em] text-white/25">
            Le Hall of Fame est encore vide.
          </p>
          {isAdmin && (
            <p className="text-[8px] md:text-[9px] uppercase font-black tracking-widest text-amber-400/60 mt-3">
              Clique sur GÉRER pour inscrire un joueur.
            </p>
          )}
        </CyberCard>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5 md:gap-6">
          {champions.map((c, i) => {
            const profile = c.profile;
            const name = profile?.display_name || 'Joueur';
            const hours = profile?.total_hours || 0;
            const rank = getRank(hours);

            // Badges : icones du rang atteint par le joueur.
            const seen = new Set<string>();
            const badges = rank.perks
              .filter((p) => {
                if (seen.has(p.icon)) return false;
                seen.add(p.icon);
                return true;
              })
              .slice(0, 4);

            return (
              <CyberCard
                key={c.id}
                variant={i === 0 ? 'orange' : 'default'}
                className="p-2.5 md:p-6 relative flex flex-col justify-between"
              >
                {isAdmin && (
                  <button
                    onClick={() => handleRemove(c.id, name)}
                    disabled={removeEntry.isPending}
                    title="Retirer du Hall of Fame"
                    className="absolute top-2 right-2 z-10 w-5 h-5 rounded-md bg-black/60 border border-white/15 text-white/60 hover:text-red-400 hover:border-red-400/50 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                  >
                    <UserMinus size={10} />
                  </button>
                )}

                <div className="flex items-center gap-1.5 md:gap-3 mb-1.5 md:mb-3">
                  <div className="relative shrink-0">
                    <img
                      src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`}
                      alt={name}
                      className="w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover border border-white/20"
                    />
                    {i === 0 && (
                      <Crown
                        size={14}
                        className="absolute -top-1.5 -right-1.5 text-amber-400 fill-amber-400 drop-shadow-[0_0_4px_rgba(245,158,11,0.8)] md:h-3 md:w-3"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[6px] md:text-[9px] font-mono font-black uppercase text-amber-400 block leading-tight truncate">
                      {c.month_label || c.title}
                    </span>
                    <h4
                      className="text-[9px] md:text-xl font-display font-black uppercase text-white truncate"
                      translate="no"
                    >
                      @{name}
                    </h4>
                  </div>
                </div>

                {/* Badges obtenus : icones du rang, visibles sur mobile */}
                {badges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-0.5 mb-1.5 md:hidden" title={badges.map((b) => b.label).join(' · ')}>
                    {badges.map((b, bi) => (
                      <span
                        key={bi}
                        className="w-4 h-4 rounded bg-black/40 border border-white/10 flex items-center justify-center text-[8px] leading-none"
                      >
                        {b.icon}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-1 mb-1.5 md:mb-3">
                  <span
                    className="px-1 md:px-2 py-0.5 rounded text-[6px] md:text-[9px] font-black uppercase border whitespace-nowrap max-w-full truncate"
                    style={{ color: rank.color, borderColor: `${rank.color}55` }}
                  >
                    {rank.name}
                  </span>
                  {profile?.community_team && (
                    <span className="px-1 md:px-2 py-0.5 rounded text-[6px] md:text-[9px] font-black uppercase border border-primary/40 text-primary bg-primary/10 flex items-center gap-1 whitespace-nowrap max-w-full truncate">
                      <Users size={8} className="md:h-2.5 md:w-2.5" />
                      {profile.community_team}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-1 text-[7px] md:text-xs text-white/60 font-mono pt-1.5 md:pt-3 border-t border-white/5">
                  <span className="truncate">{c.title}</span>
                  <span className="font-bold text-white flex items-center gap-0.5 md:gap-1 shrink-0">
                    <Clock size={8} className="md:h-3 md:w-3" />
                    {hours.toFixed(1)}h
                  </span>
                </div>
              </CyberCard>
            );
          })}
        </div>
      )}

      {isManagerOpen && (
        <HallOfFameManager
          onClose={() => setIsManagerOpen(false)}
          existingUserIds={champions.map((c) => c.user_id)}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/*  FENETRE ADMIN : inscrire ou retirer un joueur                             */
/* ------------------------------------------------------------------------- */
function HallOfFameManager({ onClose, existingUserIds }: { onClose: () => void; existingUserIds: string[] }) {
  const { user } = useAuth();
  const addEntry = useAddHallOfFame();
  const [position, setPosition] = useState(1);
  const [title, setTitle] = useState('Joueur du mois');
  const [monthLabel, setMonthLabel] = useState('');
  const [search, setSearch] = useState('');

  const { data: candidates, isLoading } = useQuery({
    queryKey: ['hall_of_fame_candidates', search],
    queryFn: async () => {
      let q = supabase
        .from('users_metadata')
        .select('user_id, display_name, avatar_url, community_team, is_admin, loyalty_points(total_hours)');

      if (search.trim()) {
        q = q.ilike('display_name', `%${search.trim()}%`);
      }

      const { data, error } = await q.limit(40);
      if (error) throw error;

      return (data || [])
        .filter((u: any) => u.user_id !== user?.id)
        .filter((u: any) => !existingUserIds.includes(u.user_id))
        // Les comptes administrateurs n'ont pas leur place au Hall of Fame.
        .filter((u: any) => u.is_admin !== true)
        .map((u: any) => {
          const loyalty = u.loyalty_points;
          const hours = Array.isArray(loyalty) ? loyalty[0]?.total_hours : loyalty?.total_hours;
          return { ...u, total_hours: hours || 0 };
        });
    },
    enabled: true,
  });

  const handleAdd = (userId: string, name: string) => {
    addEntry.mutate(
      { userId, position, title: title.trim() || 'Joueur du mois', monthLabel: monthLabel.trim() || undefined },
      {
        onSuccess: () => {
          toast.success(`${name} inscrit au Hall of Fame.`);
          setSearch('');
        },
        onError: (err: any) => toast.error(`Ajout impossible : ${describeError(err)}`),
      }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-3 md:p-4 animate-fade-in font-display">
      <CyberCard variant="orange" hoverEffect={false} className="max-w-lg w-full max-h-[85vh] overflow-y-auto p-5 md:p-8 relative text-left">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <div className="flex items-center gap-3 md:gap-4 mb-5 md:mb-6">
          <div className="w-9 h-9 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-amber-400 shrink-0">
            <Trophy className="h-4 w-4 md:h-6 md:w-6" />
          </div>
          <div>
            <span className="text-[7px] md:text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 block">
              ADMINISTRATION
            </span>
            <h3 className="text-sm md:text-xl font-black uppercase text-white leading-tight">
              GESTION DU HALL OF FAME
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          {POSITIONS.map((p) => (
            <button
              key={p}
              onClick={() => setPosition(p)}
              className={`py-2 rounded-lg text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-colors cursor-pointer ${
                position === p
                  ? 'bg-amber-500/20 border border-amber-400/50 text-amber-300'
                  : 'bg-white/[0.04] border border-white/10 text-white/40 hover:text-white/70'
              }`}
            >
              Podium #{p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre (ex : Joueur du mois)"
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] md:text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50"
          />
          <input
            value={monthLabel}
            onChange={(e) => setMonthLabel(e.target.value)}
            placeholder="Période (ex : Février 2026)"
            className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] md:text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        <div className="relative mb-3">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un pseudo..."
            className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/10 text-[10px] md:text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-amber-400/50"
          />
        </div>

        {isLoading ? (
          <div className="py-8 flex items-center justify-center">
            <Loader2 className="animate-spin text-amber-400" size={20} />
          </div>
        ) : (candidates || []).length === 0 ? (
          <p className="py-8 text-center text-[8px] md:text-[10px] uppercase font-black tracking-widest text-white/25">
            Aucun joueur disponible.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {(candidates || []).map((u: any) => (
              <div
                key={u.user_id}
                className="flex items-center justify-between p-2 rounded-lg bg-white/[0.03] border border-white/10"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <img
                    src={u.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(u.display_name || 'gamer')}`}
                    alt=""
                    className="w-6 h-6 rounded-md object-cover border border-white/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[10px] md:text-xs font-bold text-white truncate">
                      {u.display_name || 'Gamer'}
                    </div>
                    <div className="text-[8px] md:text-[9px] font-mono text-white/40">
                      {getRank(u.total_hours).name} · {u.total_hours.toFixed(1)}h
                      {u.community_team ? ` · ${u.community_team}` : ''}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleAdd(u.user_id, u.display_name || 'Joueur')}
                  disabled={addEntry.isPending}
                  className="shrink-0 w-6 h-6 rounded-md bg-amber-500/20 border border-amber-400/40 text-amber-300 hover:bg-amber-500/30 transition-colors flex items-center justify-center cursor-pointer disabled:opacity-40"
                  title="Inscrire au Hall of Fame"
                >
                  <Plus size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <p className="text-[7px] md:text-[9px] font-mono text-white/30 uppercase leading-relaxed">
            Retire un joueur avec l'icône rouge sur sa card.
          </p>
          <NeonButton variant="ghost" onClick={onClose} className="shrink-0 px-4 py-2 text-[9px] font-black tracking-widest">
            FERMER
          </NeonButton>
        </div>
      </CyberCard>
    </div>
  );
}