import React, { useEffect, useState } from 'react';
import {
  BadgeCheck,
  Check,
  CreditCard,
  Loader2,
  Plus,
  Save,
  Ticket,
  Trash2,
  UserX,
  Users,
} from 'lucide-react';
import { ModalShell } from '@/components/ui/ModalShell';
import { NeonButton } from '@/components/ui/NeonButton';
import { ImageUploadInput } from '@/components/ui/ImageUploadInput';
import { useConfirm } from '@/hooks/useConfirm';
import {
  useCommunityEvents,
  useCreateCommunityEvent,
  useDeleteCommunityEvent,
  useUpdateCommunityEvent,
  describeEventError,
  type CommunityEventRow,
} from '@/hooks/useCommunityEvents';
import {
  useDeleteEventRegistration,
  useEventRegistrations,
  useReviewEventRegistration,
  type EventRegistrationRow,
} from '@/hooks/useEventRegistrations';
import { toast } from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type Draft = {
  title: string;
  category: string;
  game: string;
  date_str: string;
  time_str: string;
  image_url: string;
  description: string;
  reward_text: string;
  conditions: string;
  entry_fee: string;
  remote_payment_allowed: boolean;
  max_slots: string;
  is_active: boolean;
};

const EMPTY_DRAFT: Draft = {
  title: '',
  category: 'Fight Night',
  game: '',
  date_str: '',
  time_str: '',
  image_url: '',
  description: '',
  reward_text: '',
  conditions: '',
  entry_fee: '0',
  remote_payment_allowed: false,
  max_slots: '',
  is_active: true,
};

function toDraft(event: CommunityEventRow): Draft {
  return {
    title: event.title,
    category: event.category || '',
    game: event.game || '',
    date_str: event.date_str || '',
    time_str: event.time_str || '',
    image_url: event.image_url || '',
    description: event.description || '',
    reward_text: event.reward_text || '',
    conditions: event.conditions || '',
    entry_fee: String(event.entry_fee ?? 0),
    remote_payment_allowed: event.remote_payment_allowed === true,
    max_slots: event.max_slots ? String(event.max_slots) : '',
    is_active: event.is_active !== false,
  };
}

function EventForm({ draft, setDraft }: { draft: Draft; setDraft: (d: Draft) => void }) {
  const field = 'w-full px-2 py-1.5 rounded-lg bg-black/50 border border-white/15 text-[10px] font-sans text-white placeholder-white/25 focus:border-secondary focus:outline-none';
  const label = 'block text-[8px] font-mono uppercase text-white/50 mb-0.5';

  return (
    <div className="space-y-2">
      <div>
        <label className={label}>Titre *</label>
        <input
          value={draft.title}
          onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          placeholder="Vendredi Fight Night"
          className={field}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Categorie</label>
          <input
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value })}
            placeholder="Fight Night"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Jeu</label>
          <input
            value={draft.game}
            onChange={(e) => setDraft({ ...draft, game: e.target.value })}
            placeholder="EA Sports FC 26"
            className={field}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Date affichee</label>
          <input
            value={draft.date_str}
            onChange={(e) => setDraft({ ...draft, date_str: e.target.value })}
            placeholder="Vendredi 17"
            className={field}
          />
        </div>
        <div>
          <label className={label}>Heure affichee</label>
          <input
            value={draft.time_str}
            onChange={(e) => setDraft({ ...draft, time_str: e.target.value })}
            placeholder="20h00"
            className={field}
          />
        </div>
      </div>

      <div>
        <label className={label}>Description</label>
        <textarea
          value={draft.description}
          onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          rows={2}
          className={`${field} resize-none`}
        />
      </div>

      <div>
        <label className={label}>Recompense affichee</label>
        <input
          value={draft.reward_text}
          onChange={(e) => setDraft({ ...draft, reward_text: e.target.value })}
          placeholder="Voucher 10 EUR pour le 1er"
          className={field}
        />
      </div>

      <div className="p-2 rounded-lg bg-white/[0.03] border border-white/10">
        <label className={label}>Conditions d'inscription (affichees au joueur)</label>
        <textarea
          value={draft.conditions}
          onChange={(e) => setDraft({ ...draft, conditions: e.target.value })}
          rows={3}
          placeholder="- Presence obligatoire 30 min avant&#10;- Interdiction de rage-quit&#10;- Un seul round par compte"
          className={`${field} resize-none`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={label}>Frais d'inscription (0 = gratuit)</label>
          <input
            type="number"
            min={0}
            value={draft.entry_fee}
            onChange={(e) => setDraft({ ...draft, entry_fee: e.target.value })}
            className={field}
          />
        </div>
        <div>
          <label className={label}>Places max (vide = illimite)</label>
          <input
            type="number"
            min={1}
            value={draft.max_slots}
            onChange={(e) => setDraft({ ...draft, max_slots: e.target.value })}
            className={field}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/10 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.remote_payment_allowed}
          onChange={(e) => setDraft({ ...draft, remote_payment_allowed: e.target.checked })}
          className="w-3.5 h-3.5 shrink-0 accent-secondary cursor-pointer"
        />
        <span className="text-[10px] font-sans text-white/80">
          Autoriser le paiement a distance (le joueur transmet son numero de transaction)
        </span>
      </label>

      <label className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03] border border-white/10 cursor-pointer">
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => setDraft({ ...draft, is_active: e.target.checked })}
          className="w-3.5 h-3.5 shrink-0 accent-secondary cursor-pointer"
        />
        <span className="text-[10px] font-sans text-white/80">
          Soiree visible par les joueurs
        </span>
      </label>

      <div>
        <span className={label}>Image de couverture</span>
        <ImageUploadInput
          value={draft.image_url}
          onChange={(url) => setDraft({ ...draft, image_url: url })}
        />
      </div>
    </div>
  );
}

function RegistrationRow({
  registration,
  event,
}: {
  registration: EventRegistrationRow;
  event: CommunityEventRow;
}) {
  const review = useReviewEventRegistration();
  const remove = useDeleteEventRegistration();
  const [note, setNote] = useState(registration.admin_note || '');

  const playerName = registration.player?.display_name || 'Joueur inconnu';
  const remote = registration.payment_method === 'remote';

  const statusStyle =
    registration.status === 'confirmed'
      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
      : registration.status === 'rejected'
      ? 'bg-red-500/15 border-red-500/30 text-red-300'
      : 'bg-amber-500/15 border-amber-500/30 text-amber-300';

  const statusLabel =
    registration.status === 'confirmed'
      ? 'CONFIRMEE'
      : registration.status === 'rejected'
      ? 'REFUSEE'
      : 'EN ATTENTE';

  return (
    <div className={`p-2 rounded-lg border ${statusStyle} space-y-1.5`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {registration.player?.avatar_url ? (
            <img
              src={registration.player.avatar_url}
              alt=""
              className="w-5 h-5 rounded-full object-cover shrink-0 border border-white/20"
            />
          ) : (
            <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 shrink-0" />
          )}
          <span className="text-[10px] font-black text-white truncate">{playerName}</span>
        </div>
        <span className="text-[8px] font-mono font-black tracking-widest shrink-0">{statusLabel}</span>
      </div>

      {/* Frais, montant, numero de paiement */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[9px] font-mono text-white/70">
        <span className="inline-flex items-center gap-1">
          <Ticket size={9} />
          Frais soiree : {Number(event.entry_fee || 0).toFixed(0)} cr
        </span>
        <span className="inline-flex items-center gap-1">
          <BadgeCheck size={9} />
          Montant regle : {Number(registration.payment_amount || 0).toFixed(0)} cr
        </span>
        <span className="inline-flex items-center gap-1">
          <CreditCard size={9} />
          {remote ? 'Reglement a distance' : 'Reglement sur place'}
        </span>
      </div>

      {remote && registration.payment_reference && (
        <div className="p-1.5 rounded bg-black/40 border border-white/10">
          <span className="text-[8px] font-mono uppercase text-white/40 block">Numero de paiement</span>
          <span className="text-[10px] font-mono font-black text-amber-300 break-all">
            {registration.payment_reference}
          </span>
        </div>
      )}

      {registration.payment_note && (
        <p className="text-[9px] font-sans text-white/55 italic leading-relaxed">
          « {registration.payment_note} »
        </p>
      )}

      {registration.status === 'pending' ? (
        <>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note pour le joueur (facultatif)"
            className="w-full px-2 py-1 rounded bg-black/50 border border-white/15 text-[9px] font-sans text-white placeholder-white/25 focus:border-secondary focus:outline-none"
          />
          <div className="flex gap-1.5">
            <button
              type="button"
              disabled={review.isPending}
              onClick={() =>
                review.mutate({
                  registrationId: registration.id,
                  eventTitle: event.title,
                  playerId: registration.user_id,
                  playerName,
                  status: 'confirmed',
                  adminNote: note,
                })
              }
              className="flex-1 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500 text-[9px] font-mono uppercase font-black text-emerald-300 flex items-center justify-center gap-1 hover:bg-emerald-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {review.isPending ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
              Valider
            </button>
            <button
              type="button"
              disabled={review.isPending}
              onClick={() =>
                review.mutate({
                  registrationId: registration.id,
                  eventTitle: event.title,
                  playerId: registration.user_id,
                  playerName,
                  status: 'rejected',
                  adminNote: note,
                })
              }
              className="flex-1 py-1.5 rounded-lg bg-red-500/20 border border-red-500 text-[9px] font-mono uppercase font-black text-red-300 flex items-center justify-center gap-1 hover:bg-red-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <UserX size={10} /> Refuser
            </button>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[8px] font-mono text-white/40">
            Traitee le {registration.reviewed_at ? new Date(registration.reviewed_at).toLocaleString('fr-FR') : '-'}
          </span>
          <button
            type="button"
            disabled={remove.isPending}
            onClick={() => remove.mutate(registration.id)}
            className="text-white/40 hover:text-red-400 transition-colors cursor-pointer shrink-0"
            title="Supprimer la demande"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

function RegistrantsPanel({ event }: { event: CommunityEventRow }) {
  const { data: registrations = [], isLoading } = useEventRegistrations(event.id);

  const pending = registrations.filter((r) => r.status === 'pending');
  const confirmed = registrations.filter((r) => r.status === 'confirmed');
  const rejected = registrations.filter((r) => r.status === 'rejected');

  const collected = confirmed.reduce((sum, r) => sum + Number(r.payment_amount || 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4 text-[10px] font-mono text-white/50">
        <Loader2 size={12} className="animate-spin" /> Chargement des inscrits...
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/[0.04] border border-white/10">
        <span className="inline-flex items-center gap-1.5 text-[9px] font-mono uppercase text-white/60">
          <Users size={11} /> {confirmed.length} confirme{confirmed.length > 1 ? 's' : ''}
          {pending.length > 0 && <span className="text-amber-400">· {pending.length} en attente</span>}
        </span>
        <span className="text-[9px] font-mono font-black text-amber-400 shrink-0">
          {collected.toFixed(0)} cr encaisse{collected > 1 ? 's' : ''}
        </span>
      </div>

      {event.max_slots && confirmed.length >= event.max_slots && (
        <p className="p-1.5 rounded bg-red-500/10 border border-red-500/25 text-[9px] font-sans text-red-200">
          Places maximailles atteintes ({event.max_slots}). Les nouvelles demandes resteront en attente.
        </p>
      )}

      {registrations.length === 0 ? (
        <p className="py-3 text-center text-[10px] font-sans text-white/40">
          Aucun inscrit pour l'instant. Les demandes des joueurs apparaitront ici.
        </p>
      ) : (
        <div className="space-y-1.5">
          {[...pending, ...confirmed, ...rejected].map((registration) => (
            <RegistrationRow key={registration.id} registration={registration} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Gestion admin des Soirees thematiques.
 *
 * Onglet par soiree : modification / suppression / inscription a la carte, plus
 * la liste complete des inscrits avec frais, montant regle et numero de
 * paiement. Le bouton "Confirmer ma presence" n'apparait jamais ici.
 */
export function EventManagerModal({ isOpen, onClose }: Props) {
  const { data: events = [], isLoading } = useCommunityEvents();
  const createEvent = useCreateCommunityEvent();
  const updateEvent = useUpdateCommunityEvent();
  const deleteEvent = useDeleteCommunityEvent();
  const { confirm, dialog } = useConfirm();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [creating, setCreating] = useState(false);

  // Onglet cree si la liste est vide.
  useEffect(() => {
    if (isLoading) return;
    if (events.length === 0) {
      setSelectedId(null);
      setDraft(null);
      setCreating(true);
      return;
    }
    setCreating(false);
    setSelectedId((current) => (current && events.some((e) => e.id === current) ? current : events[0].id));
  }, [events, isLoading]);

  const selected = events.find((e) => e.id === selectedId) || null;

  // Le brouillon suit la soiree selectionnee.
  useEffect(() => {
    setDraft(selected ? toDraft(selected) : null);
  }, [selectedId, selected?.updated_at]);

  const startCreating = () => {
    setCreating(true);
    setSelectedId(null);
    setDraft({ ...EMPTY_DRAFT });
  };

  const startEditing = (event: CommunityEventRow) => {
    setCreating(false);
    setSelectedId(event.id);
    setDraft(toDraft(event));
  };

  const handleSave = async () => {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error('Le titre est obligatoire.');
      return;
    }
    if (Number(draft.entry_fee) < 0) {
      toast.error('Les frais ne peuvent pas etre negatifs.');
      return;
    }

    const payload = {
      title: draft.title.trim(),
      category: draft.category.trim(),
      game: draft.game.trim(),
      date_str: draft.date_str.trim(),
      time_str: draft.time_str.trim(),
      image_url: draft.image_url.trim() || null,
      description: draft.description.trim(),
      reward_text: draft.reward_text.trim(),
      conditions: draft.conditions.trim(),
      entry_fee: Number(draft.entry_fee || 0),
      remote_payment_allowed: draft.remote_payment_allowed,
      max_slots: draft.max_slots ? Number(draft.max_slots) : null,
      is_active: draft.is_active,
    };

    try {
      if (creating) {
        const created = await createEvent.mutateAsync(payload);
        setCreating(false);
        setSelectedId(created.id);
        toast.success('Soiree creee.');
      } else if (selected) {
        await updateEvent.mutateAsync({ id: selected.id, payload });
        toast.success('Soiree mise a jour.');
      }
    } catch (error) {
      toast.error(describeEventError(error));
    }
  };

  const handleDelete = (event: CommunityEventRow) => {
    confirm({
      title: 'Supprimer la soiree',
      subject: event.title,
      message:
        "La soiree et toutes les demandes d'inscription liees seront definitivement supprimees. Cette action est irreversible.",
      confirmLabel: 'Supprimer',
      onConfirm: async () => {
        try {
          await deleteEvent.mutateAsync(event.id);
          toast.success('Soiree supprimee.');
        } catch (error) {
          toast.error(describeEventError(error));
        }
      },
    });
  };

  const handleToggleVisibility = async (event: CommunityEventRow) => {
    try {
      await updateEvent.mutateAsync({ id: event.id, payload: { is_active: !event.is_active } });
      toast.success(event.is_active ? 'Soiree masquee.' : 'Soiree publiee.');
    } catch (error) {
      toast.error(describeEventError(error));
    }
  };

  const saving = createEvent.isPending || updateEvent.isPending;

  return (
    <ModalShell isOpen={isOpen} onClose={onClose} title="Gestion des Soirees Thematiques" accent="violet">
      <div className="space-y-2.5 font-display">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-[10px] font-mono text-white/50">
            <Loader2 size={12} className="animate-spin" /> Chargement...
          </div>
        ) : (
          <>
            {/* Onglets des soirees */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
                {events.map((event) => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => startEditing(event)}
                    className={`shrink-0 px-2 py-1.5 rounded-lg border text-[9px] font-mono font-black uppercase transition-all cursor-pointer ${
                      !creating && selectedId === event.id
                        ? 'bg-primary/20 border-primary text-primary'
                        : 'bg-white/5 border-white/15 text-white/55 hover:bg-white/10'
                    }`}
                  >
                    {event.title}
                    {!event.is_active && <span className="ml-1 text-amber-400">*</span>}
                  </button>
                ))}
                {creating && (
                  <span className="shrink-0 px-2 py-1.5 rounded-lg border border-primary bg-primary/20 text-[9px] font-mono font-black uppercase text-primary">
                    Nouvelle
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={startCreating}
                className="shrink-0 w-7 h-7 rounded-lg border border-primary/40 bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-all active:scale-90 cursor-pointer"
                title="Ajouter une soiree"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* Champs de l'objectif / de la soiree */}
            {draft && (
              <div className="space-y-2">
                <EventForm draft={draft} setDraft={setDraft} />

                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 py-2 rounded-xl bg-primary/20 border border-primary text-[9px] font-mono uppercase font-black text-primary flex items-center justify-center gap-1.5 hover:bg-primary/30 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                    {creating ? 'Creer la soiree' : 'Enregistrer'}
                  </button>

                  {!creating && selected && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleToggleVisibility(selected)}
                        disabled={updateEvent.isPending}
                        className="px-2.5 rounded-xl border border-white/15 text-[9px] font-mono uppercase font-black text-white/60 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                      >
                        {selected.is_active ? 'Masquer' : 'Publier'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(selected)}
                        className="px-2.5 rounded-xl bg-red-500/15 border border-red-500 text-[9px] font-mono uppercase font-black text-red-300 flex items-center gap-1 hover:bg-red-500/25 transition-all cursor-pointer shrink-0"
                      >
                        <Trash2 size={11} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Inscrits de la soiree selectionnee */}
            {!creating && selected && (
              <div className="pt-2 border-t border-white/10 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Users size={12} className="text-secondary shrink-0" />
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-secondary">
                    Inscrits
                  </span>
                </div>
                <RegistrantsPanel event={selected} />
              </div>
            )}

            {creating && (
              <p className="p-2 rounded-lg bg-white/[0.03] border border-white/10 text-[9px] font-sans text-white/50 leading-relaxed">
                Renseigne les conditions d'inscription et les frais : le joueur les verra avant d'envoyer sa demande.
              </p>
            )}
          </>
        )}
      </div>
      {dialog}
    </ModalShell>
  );
}
