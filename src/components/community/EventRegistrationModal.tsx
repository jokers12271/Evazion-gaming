import React, { useState } from 'react';
import { Calendar, CheckCircle2, Clock, CreditCard, Loader2, MapPin, ScrollText, Ticket } from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { NeonButton } from '@/components/ui/NeonButton';
import { useSubmitEventRegistration, type EventRegistrationRow } from '@/hooks/useEventRegistrations';
import type { CommunityEventRow } from '@/hooks/useCommunityEvents';

interface Props {
  event: CommunityEventRow | null;
  /** Demande deja en attente pour cette soiree, si elle existe. */
  existing?: EventRegistrationRow;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Fenetre de confirmation d'inscription a une soiree.
 *
 * Affiche les conditions et les frais avant l'envoi. Le joueur ne s'inscrit
 * pas directement : il envoie une demande, qui attend une validation admin.
 */
export function EventRegistrationModal({ event, existing, isOpen, onClose }: Props) {
  const [accepted, setAccepted] = useState(false);
  const [method, setMethod] = useState<'onsite' | 'remote'>('onsite');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const submit = useSubmitEventRegistration();

  if (!event) return null;

  const isFree = Number(event.entry_fee || 0) <= 0;
  const canPayRemote = event.remote_payment_allowed === true;
  const pending = existing?.status === 'pending';
  const confirmed = existing?.status === 'confirmed';

  // Le paiement a distance n'a de sens que si des frais sont demands.
  const effectiveMethod = canPayRemote && !isFree ? method : 'onsite';

  const handleClose = () => {
    setAccepted(false);
    setMethod('onsite');
    setReference('');
    setNote('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!accepted) return;
    submit.mutate(
      {
        eventId: event.id,
        entryFee: Number(event.entry_fee || 0),
        remotePaymentAllowed: canPayRemote,
        paymentMethod: effectiveMethod,
        paymentReference: effectiveMethod === 'remote' ? reference : undefined,
        paymentNote: note,
      },
      { onSuccess: () => handleClose() }
    );
  };

  return (
    <ModalShell isOpen={isOpen} onClose={handleClose} title="Conditions d'inscription" accent="orange">
      <div className="space-y-2.5 font-display">
        {/* Identite de la soiree */}
        <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/25">
          <span className="text-[8px] font-mono font-black uppercase tracking-widest text-orange-400">
            {event.category}
          </span>
          <h3 className="text-sm font-black uppercase text-white leading-tight mt-0.5">{event.title}</h3>
          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-[9px] font-mono text-white/60">
            <span className="inline-flex items-center gap-1">
              <Calendar size={10} /> {event.date_str || 'Date a definir'}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={10} /> {event.time_str || 'Heure a definir'}
            </span>
            {event.game && (
              <span className="inline-flex items-center gap-1">
                <Ticket size={10} /> {event.game}
              </span>
            )}
          </div>
        </div>

        {/* Frais d'inscription */}
        <div className="p-2.5 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-between gap-3">
          <span className="text-[9px] font-mono uppercase text-white/50">Frais d'inscription</span>
          <span
            className={`text-sm font-black font-mono shrink-0 ${
              isFree ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {isFree ? 'Gratuit' : `${Number(event.entry_fee).toFixed(0)} credits`}
          </span>
        </div>

        {/* Conditions */}
        <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ScrollText size={12} className="text-secondary shrink-0" />
            <span className="text-[9px] font-mono font-black uppercase tracking-widest text-secondary">
              Conditions a accepter
            </span>
          </div>
          {event.conditions ? (
            <p className="text-[10px] font-sans text-white/75 whitespace-pre-line leading-relaxed">
              {event.conditions}
            </p>
          ) : (
            <p className="text-[10px] font-sans text-white/50">
              Aucune condition particuliere : sois ponctuel et respecte les autres joueurs du Sanctuary.
            </p>
          )}
        </div>

        {/* Modes de reglement */}
        {canPayRemote && !isFree && (
          <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/10 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <CreditCard size={12} className="text-secondary shrink-0" />
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-secondary">
                Mode de reglement
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setMethod('onsite')}
                className={`p-2 rounded-lg border text-[9px] font-mono uppercase font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  effectiveMethod === 'onsite'
                    ? 'bg-secondary/20 border-secondary text-secondary'
                    : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10'
                }`}
              >
                <MapPin size={13} />
                Sur place
              </button>
              <button
                type="button"
                onClick={() => setMethod('remote')}
                className={`p-2 rounded-lg border text-[9px] font-mono uppercase font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  effectiveMethod === 'remote'
                    ? 'bg-secondary/20 border-secondary text-secondary'
                    : 'bg-white/5 border-white/15 text-white/60 hover:bg-white/10'
                }`}
              >
                <CreditCard size={13} />
                A distance
              </button>
            </div>

            {effectiveMethod === 'remote' && (
              <div className="space-y-1.5 pt-0.5">
                <div>
                  <label className="block text-[8px] font-mono uppercase text-white/50 mb-0.5">
                    Numero de paiement (transaction, virement, Wave...)
                  </label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Ex. TRX-482915"
                    className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] font-mono text-white placeholder-white/25 focus:border-secondary focus:outline-none"
                  />
                </div>
                <p className="text-[8px] font-sans text-white/40 leading-relaxed">
                  L'admin verifie le reglement avant de confirmer ta presence. Tu peux aussi regler sur place.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Message facultatif */}
        <div>
          <label className="block text-[8px] font-mono uppercase text-white/50 mb-0.5">
            Message pour l'admin (facultatif)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder="Ex. je joue en vocal, mon pseudo est ..."
            className="w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] font-sans text-white placeholder-white/25 focus:border-secondary focus:outline-none resize-none"
          />
        </div>

        {/* Acceptation */}
        {!confirmed && (
          <label className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 shrink-0 accent-amber-400 cursor-pointer"
            />
            <span className="text-[10px] font-sans text-amber-100 leading-relaxed">
              J'accepte les conditions ci-dessus et je demande une place pour cette soiree.
            </span>
          </label>
        )}

        {pending && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25">
            <Loader2 size={13} className="text-amber-400 shrink-0 mt-0.5 animate-spin" />
            <span className="text-[10px] font-sans text-amber-100 leading-relaxed">
              Ta demande est deja en attente de validation. Tu peux mettre a jour ton reglement ci-dessus, un
              admin la traitera ensuite.
            </span>
          </div>
        )}

        {confirmed && (
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25">
            <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-[10px] font-sans text-emerald-100 leading-relaxed">
              Ta presence est confirmee par l'administration pour cette soiree.
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-2 rounded-xl border border-white/15 text-[9px] font-mono uppercase font-black text-white/50 hover:text-white transition-colors cursor-pointer"
          >
            Fermer
          </button>
          {!confirmed && (
            <NeonButton
              variant="orange"
              onClick={handleSubmit}
              disabled={!accepted || submit.isPending}
              className="flex-1 py-2 text-[9px] font-mono"
            >
              {submit.isPending ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 size={11} className="animate-spin" /> Envoi
                </span>
              ) : pending ? (
                'Mettre a jour'
              ) : (
                'Envoyer ma demande'
              )}
            </NeonButton>
          )}
        </div>

        <p className="text-[8px] font-sans text-white/35 text-center leading-relaxed">
          Ta place n'est confirmee qu'apres validation par un administrateur du Sanctuary.
        </p>
      </div>
    </ModalShell>
  );
}
