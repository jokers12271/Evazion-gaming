import React, { useState } from 'react';
import { NeonButton } from '@/components/ui/NeonButton';
import { supabase } from '@/lib/supabase';
import { toast } from 'react-hot-toast';
import { useQueryClient } from '@tanstack/react-query';
import { ImageUploadInput } from '@/components/ui/ImageUploadInput';
import { Lock, User } from 'lucide-react';

export function ProfileSettings({ metadata, onClose }: { metadata: any; onClose: () => void }) {
  const [displayName, setDisplayName] = useState(metadata?.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(metadata?.avatar_url || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword !== confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      await supabase.from('users_metadata').update({
        display_name: displayName,
        avatar_url: avatarUrl
      }).eq('user_id', metadata.user_id);

      const updateData: any = {
        display_name: displayName,
        avatar_url: avatarUrl
      };

      if (newPassword) {
        updateData.password = newPassword;
      }

      await supabase.auth.updateUser(updateData);

      queryClient.invalidateQueries({ queryKey: ['user_metadata'] });
      toast.success("Profil mis à jour avec succès !");
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erreur de sauvegarde");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-3 text-left text-[11px]">
      <div className="text-center pb-2 border-b border-white/10">
        <h3 className="text-xs font-display font-black uppercase text-white">Paramètres du Compte</h3>
        <p className="text-[8px] text-white/50">Modifiez votre profil et votre mot de passe</p>
      </div>

      <div>
        <label className="text-[9px] uppercase font-black text-secondary tracking-widest block mb-1">
          Nom de Gamer (Pseudo)
        </label>
        <div className="relative">
          <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            required
            type="text"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div>
        <ImageUploadInput
          value={avatarUrl}
          onChange={setAvatarUrl}
          label="Avatar (Stockage local / Fichier ou URL)"
        />
      </div>

      <div className="pt-2 border-t border-white/10 space-y-2.5">
        <span className="text-[9px] uppercase font-black text-amber-400 tracking-widest block">
          Sécurité (Modifier le mot de passe)
        </span>
        
        <div>
          <label className="text-[8.5px] uppercase font-bold text-white/60 tracking-wider block mb-0.5">
            Nouveau Mot de Passe (optionnel)
          </label>
          <div className="relative">
            <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {newPassword && (
          <div>
            <label className="text-[8.5px] uppercase font-bold text-white/60 tracking-wider block mb-0.5">
              Confirmer le Mot de Passe
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-[11px] text-white focus:outline-none focus:border-primary"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-3">
        <NeonButton variant="cyan" size="sm" disabled={loading} className="w-full py-2.5 text-[11px] font-mono font-black">
          {loading ? "Sauvegarde..." : "Enregistrer les modifications"}
        </NeonButton>
      </div>
    </form>
  );
}
