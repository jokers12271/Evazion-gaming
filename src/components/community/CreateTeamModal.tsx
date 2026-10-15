import React, { useEffect, useRef, useState } from 'react';
import { X, Shield, Sparkles, ImagePlus } from 'lucide-react';
import { CyberCard } from '@/components/ui/CyberCard';
import { NeonButton } from '@/components/ui/NeonButton';
import { supabase } from '@/lib/supabase';
import { saveTeamConfig } from '@/lib/teamConfigSaver';
import { useSaveTeamMeta } from '@/hooks/useTeamMeta';
import { toast } from 'react-hot-toast';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS = ['Actif · Top Tier', 'Actif', 'Recrutement ouvert', 'En repos', 'Inactif'];

const DEFAULT_PERKS = [
  "Sessions d'entraînement réservées le mardi et jeudi soir au Sanctuary.",
  "Partage des victoires en tournoi et bonus de jetons de groupe.",
  "Accès prioritaire aux consoles PS5 Pro lors des gros tournois de clan.",
].join('\n');

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800';

export function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [color, setColor] = useState('#06b6d4');
  const [image, setImage] = useState(DEFAULT_IMAGE);
  const [joinFee, setJoinFee] = useState(5000);
  const [monthlyFee, setMonthlyFee] = useState(2000);
  const [status, setStatus] = useState(STATUS_OPTIONS[0]);
  const [perks, setPerks] = useState(DEFAULT_PERKS);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const saveMeta = useSaveTeamMeta();

  // Fermure animee : on joue l'animation de sortie avant de fermer reellement.
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
        closeTimer.current = null;
      }
      setMounted(true);
      setClosing(false);
      return;
    }

    if (!mounted) return;

    setClosing(true);
    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      setMounted(false);
      setClosing(false);
    }, 220);
  }, [isOpen, mounted]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  const requestClose = () => {
    if (closing || loading) return;
    onClose();
  };

  const handleImagePick = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image trop lourde. Limite : 2 Mo maximum.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'png';
      const path = `teams/new-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage.from('teams').upload(path, file);
      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('teams').getPublicUrl(path);
      setImage(data.publicUrl);
      toast.success("Image importée.");
    } catch {
      // Repli : stockage direct en base (colonne texte).
      const reader = new FileReader();
      reader.onload = () => setImage(String(reader.result || ''));
      reader.onerror = () => toast.error("Lecture du fichier impossible.");
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  if (!mounted) return null;

  const colorOptions = [
    { label: 'Cyan Néon', value: '#06b6d4' },
    { label: 'Violet Sanctuary', value: '#a855f7' },
    { label: 'Or Ragnarök', value: '#eab308' },
    { label: 'Vert Brazza', value: '#10b981' },
    { label: 'Rouge Fatal', value: '#ef4444' },
    { label: 'Orange Sunset', value: '#f97316' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const id = name.trim().toLowerCase().replace(/\s+/g, '_');
      const { error: teamErr } = await supabase.from('teams').insert([{
        id,
        name: name.toUpperCase().trim(),
        tagline: tagline.trim(),
        color,
        image
      }]);
      if (teamErr) throw teamErr;

      const target = await saveTeamConfig(id, {
        monthly_fee: Number(monthlyFee),
        join_fee: Number(joinFee),
        payment_phone: '+242 06 612 34 56',
        updated_at: new Date().toISOString(),
        status,
        perks,
      });

      if (target === 'community_settings') {
        await saveMeta.mutateAsync({ teamId: id, meta: { status, perks } });
      }

      toast.success(`Team ${name.toUpperCase()} créée avec succès !`);
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la création de la team", { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-black/50 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-secondary font-bold';

  return (
    <div className={`fixed inset-0 z-[9999] bg-black/85 backdrop-blur-xl flex items-center justify-center p-3 md:p-4 font-display ${closing ? 'animate-modal-backdrop-out' : 'animate-modal-backdrop-in'}`}>
      <CyberCard
        variant="cyan"
        hoverEffect={false}
        className={`w-full max-w-lg max-h-[92vh] overflow-y-auto custom-scrollbar p-5 md:p-8 relative text-left ${closing ? 'animate-modal-panel-out' : 'animate-modal-panel-in'}`}
      >
        <button
          onClick={requestClose}
          className="absolute top-4 right-4 md:top-5 md:right-5 text-white/50 hover:text-white transition-all cursor-pointer z-20"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Shield size={18} className="text-secondary" />
          <span className="text-[10px] font-mono uppercase text-secondary font-black tracking-widest">
            Administration des Clans
          </span>
        </div>

        <h3 className="text-lg md:text-2xl font-black uppercase text-white mb-4 md:mb-5">
          Créer une Nouvelle Team Officielle
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
          <div>
            <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Nom de la Team</label>
            <input
              required
              type="text"
              placeholder="Ex: APEX PREDATORS"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${inputClass} uppercase`}
            />
          </div>

          <div>
            <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Devise ou Cri de ralliement</label>
            <input
              type="text"
              placeholder="Ex: Les maîtres de la vitesse et de la précision."
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className={`${inputClass} font-sans`}
            />
          </div>

          {/* Image de la team */}
          <div>
            <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Image de la Team</label>
            <div className="flex items-center gap-3 p-2 rounded-xl bg-black/50 border border-white/10">
              <img src={image} alt="Aperçu" className="w-12 h-12 rounded-lg object-cover border border-white/20 shrink-0" />
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={uploading}
                className="flex-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white/90 text-[10px] font-mono font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
              >
                <ImagePlus size={13} /> {uploading ? 'Import...' : 'Importer une image'}
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

          <div>
            <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Couleur Néon du Clan</label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-mono uppercase flex items-center gap-2 cursor-pointer transition-all ${
                    color === c.value
                      ? 'border-white bg-white/20 text-white shadow-md'
                      : 'border-white/10 bg-white/5 text-white/60'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.value }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Frais d'Adhésion (FCFA)</label>
              <input
                type="number"
                min={0}
                value={joinFee}
                onChange={(e) => setJoinFee(Number(e.target.value))}
                className={`${inputClass} font-mono font-bold`}
              />
            </div>
            <div>
              <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Cotisation Mensuelle (FCFA)</label>
              <input
                type="number"
                min={0}
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(Number(e.target.value))}
                className={`${inputClass} font-mono font-bold`}
              />
            </div>
          </div>

          <div>
            <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Statut du Clan</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={`${inputClass} font-mono uppercase`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s} className="bg-black">{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[9px] font-mono uppercase text-white/50 block mb-1">Avantages Membres du Clan</label>
            <textarea
              value={perks}
              onChange={(e) => setPerks(e.target.value)}
              rows={4}
              placeholder="Un avantage par ligne..."
              className={`${inputClass} font-sans resize-y`}
            />
            <p className="text-[8px] font-mono text-white/35 mt-1">Un avantage par ligne.</p>
          </div>

          <div className="flex gap-3 pt-3">
            <NeonButton type="button" variant="ghost" onClick={requestClose} className="flex-1 py-3 text-xs">
              Annuler
            </NeonButton>
            <NeonButton type="submit" variant="violet" sweep disabled={loading} className="flex-1 py-3 text-xs bg-primary/30">
              {loading ? "Création..." : "Enregistrer la Team"}
            </NeonButton>
          </div>
        </form>
      </CyberCard>
    </div>
  );
}