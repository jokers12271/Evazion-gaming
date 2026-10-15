import React, { useEffect, useRef, useState } from 'react';
import { X, Shield, Crown, Users, Trophy, Flame, Swords, Calendar, ImagePlus, Save } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { supabase } from '@/lib/supabase';
import { saveTeamConfig } from '@/lib/teamConfigSaver';
import { useTeamMetas, useSaveTeamMeta } from '@/hooks/useTeamMeta';
import { toast } from 'react-hot-toast';

interface TeamHqModalProps {
  team: any;
  members: any[];
  config?: any;
  onClose: () => void;
  onJoin?: () => void;
  isMember?: boolean;
  isAdmin?: boolean;
  onSaved?: () => void;
}

const DEFAULT_PERKS = [
  "Sessions d'entraînement réservées le mardi et jeudi soir au Sanctuary.",
  "Partage des victoires en tournoi et bonus de jetons de groupe.",
  "Accès prioritaire aux consoles PS5 Pro lors des gros tournois de clan.",
].join('\n');

const STATUS_OPTIONS = ['Actif · Top Tier', 'Actif', 'Recrutement ouvert', 'En repos', 'Inactif'];

const inputClass =
  'w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] md:text-xs text-white focus:outline-none focus:border-secondary font-mono';

export function TeamHqModal({ team, members, config, onClose, onJoin, isMember, isAdmin = false, onSaved }: TeamHqModalProps) {
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: teamMetas } = useTeamMetas();
  const saveMeta = useSaveTeamMeta();
  const meta = (teamMetas || {})[team?.id] || {};

  const [image, setImage] = useState<string>(team?.image || '');
  const [monthlyFee, setMonthlyFee] = useState<number>(config?.monthly_fee ?? 2000);
  const [joinFee, setJoinFee] = useState<number>(config?.join_fee ?? 5000);
  const [status, setStatus] = useState<string>(config?.status || meta.status || STATUS_OPTIONS[0]);
  const [perks, setPerks] = useState<string>(config?.perks || meta.perks || DEFAULT_PERKS);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);
  const edited = useRef(false);

  // Les metas (community_settings) arrivent en asynchrone : on remplit les
  // champs tant que l'admin n'a rien modifie, pour ne pas ecraser sa saisie.
  useEffect(() => {
    if (edited.current) return;
    if (config?.status) setStatus(config.status);
    else if (meta.status) setStatus(meta.status);
    if (config?.perks) setPerks(config.perks);
    else if (meta.perks) setPerks(meta.perks);
  }, [config?.status, config?.perks, meta.status, meta.perks]);

  // Fermure animee : on laisse le panneau jouer son animation de sortie
  // avant de prevenir le parent (qui unmount le composant).
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onClose();
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  if (!team) return null;

  const perkList = perks.split('\n').map((p) => p.trim()).filter(Boolean);

  /** Import de l'image de la team : bucket Supabase "teams" sinon data URL. */
  const handleImagePick = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde. Limite : 2 Mo maximum.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `teams/${team.id}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('teams').upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('teams').getPublicUrl(path);
      setImage(data.publicUrl);
      toast.success("Image importée. Validez pour enregistrer.");
    } catch {
      // Repli : le fichier est stocke directement en base (colonne texte).
      const reader = new FileReader();
      reader.onload = () => {
        setImage(String(reader.result || ''));
        toast.success("Image importée (stockage interne). Validez pour enregistrer.");
      };
      reader.onerror = () => toast.error("Lecture du fichier impossible.");
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (image && image !== team.image) {
        const { error: teamErr } = await supabase.from('teams').update({ image }).eq('id', team.id);
        if (teamErr) throw teamErr;
      }

      const target = await saveTeamConfig(team.id, {
        monthly_fee: Number(monthlyFee) || 0,
        join_fee: Number(joinFee) || 0,
        payment_phone: config?.payment_phone || '+242 06 612 34 56',
        updated_at: new Date().toISOString(),
        status,
        perks,
      });

      // Statut + avantages : table dediee (community_settings) si les colonnes
      // team_configs.status / perks n'existent pas encore, ou si l'ecriture
      // y est refusee par les policies RLS.
      if (target === 'community_settings') {
        await saveMeta.mutateAsync({ teamId: team.id, meta: { status, perks } });
      }

      toast.success("Quartier Général mis à jour.");
      onSaved?.();
      requestClose();
    } catch (err: any) {
      toast.error(err?.message || "Enregistrement impossible.", { duration: 6000 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-2 md:p-4 font-display ${closing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`}>
      <CyberCard
        variant="cyan"
        hoverEffect={false}
        className={`w-full max-w-2xl max-h-[94vh] md:max-h-[90vh] overflow-y-auto custom-scrollbar p-3.5 md:p-8 relative text-left ${closing ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
        overlay={
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-25">
            <img src={image || team.image} alt={team.name} className="w-full h-full object-cover scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-background/50" />
          </div>
        }
      >
        <button
          onClick={requestClose}
          className="absolute top-3 right-3 md:top-5 md:right-5 p-1.5 md:p-2 rounded-xl bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer z-20"
        >
          <X size={16} className="md:h-[18px] md:w-[18px]" />
        </button>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2 md:gap-3 md:mb-3">
            <span
              className="w-3 h-3 md:w-4 md:h-4 rounded-full shadow-lg"
              style={{ backgroundColor: team.color }}
            />
            <span className="px-2 py-0.5 md:px-3 md:py-1 rounded-full bg-white/10 border border-white/20 text-[8px] md:text-[9px] font-mono font-black uppercase tracking-widest text-secondary">
              {isAdmin ? 'Quartier Général · Administration' : 'Quartier Général de Clan'}
            </span>
          </div>

          <h2 className="text-xl md:text-4xl font-black uppercase text-white tracking-tight">
            {team.name}
          </h2>
          <p className="text-[10px] md:text-sm text-white/70 italic font-sans mt-1">
            "{team.tagline}"
          </p>

          {/* Image de la team : lecture seule ou import admin */}
          {isAdmin && (
            <div className="mt-3 mb-1.5 p-2.5 md:p-3 rounded-xl bg-black/50 border border-white/10">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={image || team.image}
                    alt={team.name}
                    className="w-10 h-10 md:w-12 md:h-12 rounded-lg object-cover border border-white/20 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Image de la Team</div>
                    <div className="text-[9px] md:text-[10px] text-white/60 font-sans truncate">
                      {uploading ? 'Import en cours...' : (image || 'Aucune image')}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => fileInput.current?.click()}
                  disabled={uploading}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-[9px] font-mono font-black uppercase flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                >
                  <ImagePlus size={12} /> Importer
                </button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleImagePick(f);
                    e.target.value = '';
                  }}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 md:gap-3 my-3.5 md:my-6">
            {/* Effectif : compile depuis les membres valides (non editable) */}
            <div className="p-2 md:p-3 rounded-xl bg-black/50 border border-white/10 text-center">
              <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Effectif</div>
              <div className="text-sm md:text-lg font-black text-white">{members.length} Gamers</div>
            </div>

            {/* Cotisation mensuelle */}
            <div className="p-2 md:p-3 rounded-xl bg-black/50 border border-white/10 text-center">
              <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Cotisation</div>
              {isAdmin ? (
                <input
                  type="number"
                  min={0}
                  value={monthlyFee}
                  onChange={(e) => setMonthlyFee(Number(e.target.value))}
                  className={`${inputClass} text-center mt-0.5`}
                />
              ) : (
                <div className="text-sm md:text-lg font-black text-secondary">{config?.monthly_fee || 2000} FCFA</div>
              )}
            </div>

            {/* Frais d'adhesion */}
            <div className="p-2 md:p-3 rounded-xl bg-black/50 border border-white/10 text-center">
              <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Adhésion</div>
              {isAdmin ? (
                <input
                  type="number"
                  min={0}
                  value={joinFee}
                  onChange={(e) => setJoinFee(Number(e.target.value))}
                  className={`${inputClass} text-center mt-0.5`}
                />
              ) : (
                <div className="text-sm md:text-lg font-black text-amber-400">{config?.join_fee || 5000} FCFA</div>
              )}
            </div>

            {/* Statut du clan */}
            <div className="p-2 md:p-3 rounded-xl bg-black/50 border border-white/10 text-center">
              <div className="text-[8px] md:text-[9px] font-mono uppercase text-white/40">Statut Clan</div>
              {isAdmin ? (
                <select
                  value={status}
                  onChange={(e) => { edited.current = true; setStatus(e.target.value); }}
                  className={`${inputClass} mt-0.5 appearance-none`}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s} className="bg-black">{s}</option>
                  ))}
                </select>
              ) : (
                <div className="text-[10px] md:text-lg font-black text-emerald-400">{config?.status || meta.status || STATUS_OPTIONS[0]}</div>
              )}
            </div>
          </div>

          {/* Roster & Capitaine */}
          <div className="space-y-2.5 md:space-y-4 mb-3.5 md:mb-6">
            <div className="flex items-center justify-between pb-1.5 md:pb-2 border-b border-white/10">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5 md:gap-2">
                <Users size={13} className="text-secondary md:h-4 md:w-4" /> Roster Officiel ({members.length})
              </span>
              <span className="text-[8px] md:text-[9px] font-mono text-white/40 uppercase">
                Salle The Sanctuary
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-2.5 max-h-36 md:max-h-48 overflow-y-auto pr-1">
              {members.length === 0 ? (
                <p className="text-[10px] md:text-xs text-white/40 italic p-2 md:p-3">Aucun membre validé pour le moment.</p>
              ) : (
                members.map((m: any, idx: number) => {
                  const profile = Array.isArray(m.users_metadata) ? m.users_metadata[0] : m.users_metadata;
                  const isCapitaine = idx === 0;

                  return (
                    <div
                      key={m.user_id || idx}
                      className="p-2 md:p-2.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={profile?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile?.display_name || idx}`}
                          alt=""
                          className="w-6 h-6 md:w-8 md:h-8 rounded-lg object-cover border border-white/20"
                        />
                        <div>
                          <div className="text-[10px] md:text-xs font-bold text-white flex items-center gap-1">
                            {profile?.display_name || 'Gamer'}
                            {isCapitaine && (
                              <Crown size={10} className="text-amber-400 fill-amber-400 shrink-0 md:h-3 md:w-3" />
                            )}
                          </div>
                          <div className="text-[8px] md:text-[9px] font-mono text-white/40">
                            {isCapitaine ? 'Capitaine de Clan' : 'Membre Titulaire'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[7px] md:text-[8px] font-mono uppercase px-1.5 md:px-2 py-0.5 rounded bg-white/10 text-white/60">
                        {isCapitaine ? 'LEADER' : 'JOUEUR'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Avantages de Clan : liste lecture seule ou saisie admin */}
          <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-secondary/10 to-primary/10 border border-secondary/30 mb-3.5 md:mb-6">
            <div className="text-[10px] md:text-xs font-black uppercase text-secondary mb-1 flex items-center gap-1.5">
              <Trophy size={12} className="md:h-3.5 md:w-3.5" /> Avantages Membres du Clan
            </div>

            {isAdmin ? (
              <>
                <textarea
                  value={perks}
                  onChange={(e) => { edited.current = true; setPerks(e.target.value); }}
                  rows={4}
                  placeholder="Un avantage par ligne..."
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] md:text-[11px] text-white/80 focus:outline-none focus:border-secondary font-sans resize-y"
                />
                <p className="text-[8px] font-mono text-white/35 mt-1">Un avantage par ligne.</p>
              </>
            ) : (
              <ul className="text-[9.5px] md:text-[11px] font-sans text-white/70 space-y-0.5 md:space-y-1 list-disc list-inside">
                {perkList.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 md:gap-3">
            <NeonButton variant="ghost" onClick={requestClose} className="flex-1 py-2 md:py-3 text-[10px] md:text-xs">
              Fermer
            </NeonButton>
            {isAdmin && (
              <NeonButton variant="violet" sweep cornerAccents disabled={saving} onClick={handleSave} className="flex-1 py-2 md:py-3 text-[10px] md:text-xs bg-primary/30">
                <Save size={12} className="mr-1.5" /> {saving ? 'Enregistrement...' : 'Enregistrer'}
              </NeonButton>
            )}
          </div>
        </div>
      </CyberCard>
    </div>
  );
}