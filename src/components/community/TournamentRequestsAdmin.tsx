import React from 'react';
import { Check, X, Clock, Users, Loader2, Inbox, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import {
  useAllPendingTournamentRequests,
  useProcessTournamentRequest
} from '@/hooks/useTournamentParticipation';
import { getRank } from '@/lib/ranks';
import { toast } from 'react-hot-toast';
import { cn } from '@blinkdotnew/ui';

function computeFee(baseFee: number, hours: number) {
  const rank = getRank(hours || 0);
  if (!baseFee || baseFee <= 0) return { fee: 0, rank, discount: 'Tournois gratuit' };

  let fee = baseFee;
  let discount = '';

  if (rank.name === 'Pro') {
    fee = Math.round(baseFee * 0.85);
    discount = '-15% Rang Pro';
  } else if (rank.name === 'Elite' || rank.name === 'Légende') {
    fee = Math.round(baseFee * 0.75);
    discount = `-25% Rang ${rank.name}`;
  } else if (rank.name === 'Iconique') {
    fee = Math.round(baseFee * 0.5);
    discount = '-50% Rang Iconique';
  } else if (rank.name === 'Divin') {
    fee = 0;
    discount = 'GRATUIT - Rang Divin';
  }

  return { fee, rank, discount };
}

export function TournamentRequestsAdmin() {
  const { data: requests, isLoading } = useAllPendingTournamentRequests();
  const processRequest = useProcessTournamentRequest();

  const handle = async (req: any, status: 'approved' | 'rejected') => {
    const title = req.tournaments?.title || 'du Hub';
    if (status === 'rejected' && !window.confirm(`Rejeter l'inscription de @${req.display_name} ?`)) return;
    if (status === 'approved' && !window.confirm(`Valider l'inscription de @${req.display_name} a "${title}" ?`)) return;

    try {
      await processRequest.mutateAsync({
        tournamentId: req.tournament_id,
        playerId: req.user_id,
        status,
        tournamentTitle: title
      });
      toast.success(
        status === 'approved'
          ? `Inscription de @${req.display_name} validee.`
          : `Inscription de @${req.display_name} rejetee.`
      );
    } catch (e: any) {
      toast.error(`Erreur : ${e.message || e}`);
    }
  };

  const list = requests || [];

  return (
    <div className="mb-10 text-left">
      <CyberCard variant="orange" hoverEffect={false} className="p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h3 className="text-sm font-black uppercase text-white tracking-wider flex items-center gap-2">
            <Users size={16} className="text-amber-400" />
            Demandes d'inscriptions aux tournois
            {!isLoading && list.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black">
                {list.length}
              </span>
            )}
          </h3>
        </div>
        <p className="text-[10px] md:text-xs text-white/40 mb-4">
          Validez ou rejetez les demandes des joueurs. Le tarif est deja calcule selon leur rang de fidelite.
        </p>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[10px] font-mono uppercase text-white/40">
            <Loader2 size={14} className="animate-spin" /> Chargement...
          </div>
        ) : list.length === 0 ? (
          <div className="py-8 text-center border border-dashed border-white/10 rounded-xl">
            <Inbox size={22} className="mx-auto text-white/15 mb-2" />
            <p className="text-[10px] font-mono uppercase text-white/30 tracking-widest">
              Aucune demande en attente
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
            {list.map((req: any, i: number) => {
              const tourney = Array.isArray(req.tournaments) ? req.tournaments[0] : req.tournaments;
              const loyalty = Array.isArray(req.loyalty_points) ? req.loyalty_points[0] : req.loyalty_points;
              const { fee, rank, discount } = computeFee(tourney?.fee_amount || 0, loyalty?.total_hours || 0);

              return (
                <div
                  key={`${req.tournament_id}-${req.user_id}-${i}`}
                  className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        @{req.display_name}
                        <span className={cn('ml-2 text-[9px] font-mono px-1.5 py-0.5 rounded border', rank.border, rank.bg, rank.label)}>
                          {rank.name}
                        </span>
                      </div>
                      <div className="text-[9px] font-mono text-white/40 flex items-center gap-1 mt-1">
                        <Trophy size={10} className="text-primary shrink-0" />
                        <span className="truncate">{tourney?.title || 'Tournoi inconnu'}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-[9px] font-mono text-white/30 flex items-center gap-1">
                      <Clock size={9} />
                      {req.created_at ? format(new Date(req.created_at), 'dd/MM HH:mm', { locale: fr }) : '--'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="min-w-0">
                      <div className="text-[9px] font-mono uppercase text-white/40">A encaisser</div>
                      <div className={cn('text-sm font-black font-mono', fee > 0 ? 'text-amber-400' : 'text-emerald-400')}>
                        {fee > 0 ? `${fee.toLocaleString()} FCFA` : 'GRATUIT'}
                      </div>
                      {discount && <div className="text-[8px] font-mono text-emerald-400/80 truncate">{discount}</div>}
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handle(req, 'rejected')}
                        disabled={processRequest.isPending}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer disabled:opacity-50"
                        title="Rejeter"
                      >
                        <X size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handle(req, 'approved')}
                        disabled={processRequest.isPending}
                        className="py-2 px-3 rounded-lg bg-emerald-500 text-black text-[10px] font-black uppercase flex items-center gap-1 hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Check size={12} /> Valider
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CyberCard>
    </div>
  );
}
