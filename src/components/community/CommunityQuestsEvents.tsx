import React, { useMemo, useState } from 'react';
import {
  Target,
  Calendar,
  Trophy,
  Settings,
  Plus,
  Shield,
  Loader2,
  CheckCircle2,
  Clock,
  BellRing,
  ChevronRight,
} from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { useAuth } from '@/hooks/useAuth';
import { useUserMetadata } from '@/hooks/useUserMetadata';
import { useCommunityEvents, type CommunityEventRow } from '@/hooks/useCommunityEvents';
import { useCommunityGoal } from '@/hooks/useCommunityGoal';
import {
  useMyEventRegistrations,
  usePendingRegistrationCount,
  type RegistrationStatus,
} from '@/hooks/useEventRegistrations';
import { EventRegistrationModal } from '@/components/community/EventRegistrationModal';
import { EventManagerModal } from '@/components/community/EventManagerModal';
import { GoalManagerModal } from '@/components/community/GoalManagerModal';
import { toast } from 'react-hot-toast';

type RegistrationMap = Record<string, RegistrationStatus>;

export function CommunityQuestsEvents() {
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const isAdmin = (metadata as any)?.is_admin || false;

  const { data: events = [], isLoading: eventsLoading } = useCommunityEvents();
  const { data: goal } = useCommunityGoal();
  const { data: myRequests = [] } = useMyEventRegistrations();
  // Badge admin : nombre de demandes qui attendent une validation.
  const { data: pendingTotal = 0 } = usePendingRegistrationCount();

  const [registeringId, setRegisteringId] = useState<string | null>(null);
  const [eventsManagerOpen, setEventsManagerOpen] = useState(false);
  const [goalManagerOpen, setGoalManagerOpen] = useState(false);

  // Statut de la demande du joueur pour chaque soiree.
  const myRegistrations = useMemo<RegistrationMap>(() => {
    const map: RegistrationMap = {};
    myRequests.forEach((r) => {
      map[r.event_id] = r.status;
    });
    return map;
  }, [myRequests]);

  const registeringEvent = events.find((e) => e.id === registeringId) || null;

  const percentage =
    goal && goal.target_hours > 0
      ? Math.min(100, Math.round((goal.current_hours / goal.target_hours) * 100))
      : 0;

  const handleRegisterClick = (event: CommunityEventRow) => {
    if (!user) {
      toast.error('Connectez-vous pour confirmer votre presence !');
      return;
    }
    setRegisteringId(event.id);
  };

  const pendingCount = pendingTotal;

  return (
    <div className="space-y-5 md:space-y-10 text-left font-display">
      {/* 1. Objectif Communautaire */}
      <CyberCard
        variant="violet"
        hoverEffect={false}
        className="p-2.5 md:p-8 rounded-xl md:rounded-[2rem] relative overflow-hidden"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 md:gap-6 mb-2 md:mb-6 pb-2 md:pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-1.5 md:gap-2 mb-1 md:mb-2">
              <span className="px-1.5 md:px-2.5 py-0.5 md:py-1 rounded-full bg-primary/20 text-primary border border-primary/40 text-[8px] md:text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1 md:gap-1.5 animate-pulse">
                <Target size={10} className="md:h-3 md:w-3" /> {goal?.label || "Objectif Communautaire d'Octobre"}
              </span>
              {goal && (
                <span className="text-[8px] md:text-[10px] font-mono text-white/40 uppercase">
                  {goal.days_left} Jours Restants
                </span>
              )}
            </div>
            <h3 className="text-sm md:text-3xl font-black uppercase text-white tracking-tight leading-tight">
              {goal?.title || 'LE GRAND PALIER DES 1 000 HEURES DU SANCTUARY'}
            </h3>
            <p className="text-[10px] md:text-xs text-white/60 font-sans mt-0.5 md:mt-1 max-w-xl">
              Chaque heure de jeu jouée par n'importe quel membre fait grimper cette jauge.
              Si le Sanctuaire atteint 1 000 heures ce mois-ci, la récompense légendaire est débloquée pour toute la
              communauté !
            </p>
          </div>

          <div className="flex items-stretch gap-1 md:gap-3 shrink-0">
            <div className="p-1.5 md:p-4 rounded-lg md:rounded-2xl bg-primary/10 border border-primary/30 flex items-center gap-1.5 md:gap-3 flex-1">
              <Trophy size={13} className="text-amber-400 shrink-0 md:h-7 md:w-7" />
              <div>
                <div className="text-[7px] md:text-[9px] font-mono uppercase text-amber-400 font-black">
                  Récompense Débloquée à 100%
                </div>
                <div className="text-[9px] md:text-xs font-bold text-white max-w-xs font-sans leading-snug line-clamp-2 md:line-clamp-none">
                  {goal?.reward_text || 'Aucune récompense definie.'}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => setGoalManagerOpen(true)}
                className="shrink-0 px-1.5 md:px-3 rounded-lg md:rounded-2xl bg-primary/20 border border-primary/50 text-primary flex flex-col md:flex-row items-center justify-center gap-0.5 md:gap-1.5 hover:bg-primary/30 transition-all active:scale-95 cursor-pointer"
                title="Gerer l'objectif communautaire"
              >
                <Settings size={12} className="md:h-4 md:w-4" />
                <span className="text-[7px] md:text-[10px] font-mono uppercase font-black">Gérer</span>
              </button>
            )}
          </div>
        </div>

        {/* Barre de progression */}
        <div className="space-y-1 md:space-y-2">
          <div className="flex justify-between items-center text-[9px] md:text-xs font-mono">
            <span className="text-white/60">
              Progression globale : <span className="text-white font-black">{goal?.current_hours ?? 0}h</span> /{' '}
              {goal?.target_hours ?? 0}h
            </span>
            <span className="text-primary font-black text-xs md:text-sm">{percentage}%</span>
          </div>

          <div className="w-full h-2 md:h-4 bg-black/60 rounded-full border border-white/10 overflow-hidden p-0.5 relative">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-amber-400 rounded-full transition-all duration-1000 shadow-neon-violet"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-[7px] md:text-[10px] font-mono text-white/40 text-right">
            Encore {Math.max(0, (goal?.target_hours ?? 0) - (goal?.current_hours ?? 0))} heures de jeu requises avant la
            fin du mois
          </div>
        </div>
      </CyberCard>

      {/* 2. Soirées Thématiques & Agenda del Hub */}
      <div>
        {/* Rappel admin : les demandes en attente existent aussi sans passer par la page. */}
        {isAdmin && pendingCount > 0 && (
          <button
            type="button"
            onClick={() => setEventsManagerOpen(true)}
            className="w-full mb-3 p-2 md:p-2.5 rounded-lg md:rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-left hover:bg-amber-500/20 transition-all active:scale-[0.99] cursor-pointer"
          >
            <BellRing size={14} className="text-amber-400 shrink-0 animate-pulse" />
            <span className="text-[9px] md:text-[10px] font-mono text-amber-200 flex-1 leading-snug">
              <span className="font-black">{pendingCount}</span> demande{pendingCount > 1 ? 's' : ''} d'inscription
              en attente de validation
            </span>
            <ChevronRight size={14} className="text-amber-400 shrink-0" />
          </button>
        )}

        <div className="flex items-center justify-between gap-2 mb-3 md:mb-6 pb-2 border-b border-white/10">
          <div>
            <h3 className="text-sm md:text-2xl font-black uppercase text-white flex items-center gap-1.5 md:gap-2 leading-tight">
              <Calendar className="text-secondary shrink-0 md:h-[22px] md:w-[22px]" size={15} /> Soirées Thématiques &
              Agenda du Sanctuary
            </h3>
            <p className="text-[10px] md:text-xs text-white/50 font-sans mt-0.5">
              Tournois express, nuits du combat et sessions coop. Confirmez votre venue pour réserver votre place.
            </p>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => setEventsManagerOpen(true)}
              className="shrink-0 flex items-center gap-1 px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-secondary/20 border border-secondary/50 text-secondary hover:bg-secondary/30 transition-all active:scale-95 cursor-pointer"
              title="Gerer les soirées thématiques"
            >
              <Plus size={12} className="md:h-4 md:w-4" />
              <span className="text-[8px] md:text-[10px] font-mono uppercase font-black">Gérer</span>
              {pendingCount > 0 && (
                <span className="px-1 py-0.5 rounded-full bg-amber-500 text-black text-[7px] md:text-[9px] font-mono font-black">
                  {pendingCount}
                </span>
              )}
            </button>
          )}
        </div>

        {eventsLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[10px] font-mono text-white/50">
            <Loader2 size={13} className="animate-spin" /> Chargement des soirées...
          </div>
        ) : events.length === 0 ? (
          <p className="py-8 text-center text-[10px] md:text-xs font-sans text-white/40">
            Aucune soirée thématique programmée pour le moment.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-6">
            {events.map((evt) => {
              const status = myRegistrations[evt.id];

              return (
                <div
                  key={evt.id}
                  className="rounded-xl md:rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div className="relative h-20 md:h-40 overflow-hidden">
                    {evt.image_url ? (
                      <img
                        src={evt.image_url}
                        alt={evt.title}
                        className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent" />
                    )}
                    {/* Sur mobile l'image est trop courte pour porter un degrade
                        plein cadre : il masquait la photo. On garde une legere
                        vignette basse, seulement sous la categorie. */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent md:from-background md:via-background/40 md:to-transparent" />
                    <span className="absolute top-1 md:top-3 left-1 md:left-3 max-w-[70%] px-1 md:px-2.5 py-0.5 md:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-[6px] md:text-[9px] font-mono uppercase text-secondary font-black truncate">
                      {evt.category}
                    </span>
                    <span className="absolute top-1 md:top-3 right-1 md:right-3 px-1 md:px-2.5 py-0.5 md:py-1 rounded-full bg-black/75 backdrop-blur-md border border-white/15 text-[6px] md:text-[9px] font-mono font-black text-amber-400">
                      {evt.confirmed_count ?? 0}
                    </span>
                    {!evt.is_active && (
                      <span className="absolute bottom-1.5 md:bottom-3 left-1.5 md:left-3 px-1.5 md:px-2 py-0.5 rounded-full bg-black/75 backdrop-blur-md border border-amber-500/40 text-[6px] md:text-[9px] font-mono uppercase text-amber-400 font-black">
                        Masquee
                      </span>
                    )}
                  </div>

                  <div className="p-1.5 md:p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-[6px] md:text-[10px] font-mono uppercase tracking-wider text-secondary mb-0.5 md:mb-1 truncate">
                        {evt.date_str} · {evt.time_str}
                      </div>
                      <h4 className="text-[9px] md:text-base font-black uppercase text-white leading-tight mb-0.5 md:mb-2 line-clamp-2 md:line-clamp-none">
                        {evt.title}
                      </h4>
                      <p className="hidden md:block text-xs text-white/70 font-sans mb-4 line-clamp-3">
                        {evt.description}
                      </p>

                      {evt.reward_text && (
                        <div className="p-1 md:p-2.5 rounded-lg md:rounded-xl bg-amber-500/10 border border-amber-500/20 text-[6px] md:text-[10px] font-mono text-amber-300 mb-1 md:mb-4 flex items-center gap-0.5 md:gap-1.5">
                          <Trophy size={8} className="shrink-0 md:h-[13px] md:w-[13px]" />
                          <span className="line-clamp-2 md:line-clamp-none">{evt.reward_text}</span>
                        </div>
                      )}

                      {/* Frais d'inscription */}
                      <div className="p-1 md:p-2.5 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/10 text-[6px] md:text-[10px] font-mono text-white/60 mb-1 md:mb-4 flex items-center justify-between gap-1">
                        <span className="truncate">Frais</span>
                        <span
                          className={`font-black shrink-0 ${
                            Number(evt.entry_fee || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}
                        >
                          {Number(evt.entry_fee || 0) > 0 ? `${Number(evt.entry_fee).toFixed(0)} cr` : 'Gratuit'}
                        </span>
                      </div>
                    </div>

                    {/* L'admin gere depuis l'espace de gestion, il ne s'inscrit pas. */}
                    {isAdmin ? (
                      <button
                        type="button"
                        onClick={() => setEventsManagerOpen(true)}
                        className="w-full py-1 md:py-2.5 rounded-lg md:rounded-xl border border-secondary/50 bg-secondary/20 text-secondary text-[6px] md:text-[10px] font-mono uppercase font-black cursor-pointer transition-all flex items-center justify-center gap-0.5 md:gap-2 hover:bg-secondary/30 active:scale-95"
                      >
                        <Shield size={9} className="md:h-[14px] md:w-[14px]" /> Gérer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleRegisterClick(evt)}
                        className={`w-full py-1 md:py-2.5 rounded-lg md:rounded-xl border text-[6px] md:text-[10px] font-mono uppercase font-black cursor-pointer transition-all flex items-center justify-center gap-0.5 md:gap-2 ${
                          status === 'confirmed'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                            : status === 'pending'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : status === 'rejected'
                            ? 'bg-red-500/10 border-red-500/50 text-red-300'
                            : 'bg-white/5 hover:bg-white/10 border-white/20 text-white'
                        }`}
                      >
                        {status === 'confirmed' ? (
                          <>
                            <CheckCircle2 size={9} className="text-emerald-400 md:h-[14px] md:w-[14px]" />
                            <span className="hidden md:inline">Présence Confirmée</span>
                            <span className="md:hidden">Confirmée</span>
                          </>
                        ) : status === 'pending' ? (
                          <>
                            <Clock size={9} className="text-amber-400 md:h-[14px] md:w-[14px]" />
                            <span className="hidden md:inline">Demande en attente</span>
                            <span className="md:hidden">En attente</span>
                          </>
                        ) : status === 'rejected' ? (
                          <>
                            <span className="hidden md:inline">Demande refusée</span>
                            <span className="md:hidden">Refusée</span>
                          </>
                        ) : (
                          <>
                            <span className="hidden md:inline">Confirmer ma Présence</span>
                            <span className="md:hidden">S'inscrire</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fenetres */}
      <EventRegistrationModal
        event={registeringEvent}
        existing={myRequests.find((r) => r.event_id === registeringId)}
        isOpen={!!registeringEvent}
        onClose={() => setRegisteringId(null)}
      />

      <GoalManagerModal isOpen={goalManagerOpen} onClose={() => setGoalManagerOpen(false)} />

      <EventManagerModal isOpen={eventsManagerOpen} onClose={() => setEventsManagerOpen(false)} />
    </div>
  );
}
