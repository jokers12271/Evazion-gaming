import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { User, Image as ImageIcon, Lock, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { cn } from '@blinkdotnew/ui' // <-- AJOUTÉ

interface Props {
  metadata: any
  onClose?: () => void
}

export function ProfileSettings({ metadata, onClose }: Props) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [displayName, setDisplayName] = useState(metadata?.display_name || '')
  const [avatarUrl, setAvatarUrl] = useState(metadata?.avatar_url || '')
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  // NOUVEAUX ÉTATS : Options d'image de profil (AJOUTÉ)
  const [avatarOption, setAvatarOption] = useState<'upload' | 'url'>('upload')
  const [isUploading, setIsUploading] = useState(false)

  // AJOUTÉ : Fonction de validation globale de force du mot de passe
  const validatePasswordStrength = (pass: string): string | null => {
    const hasUppercase = /[A-Z]/.test(pass);
    const hasLowercase = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const isAtLeast6Char = pass.length >= 6;

    if (!isAtLeast6Char) return "Le mot de passe doit faire au moins 6 caractères.";
    if (!hasUppercase) return "Le mot de passe doit contenir au moins une lettre majuscule (A-Z).";
    if (!hasLowercase) return "Le mot de passe doit contenir au moins une lettre minuscule (a-z).";
    if (!hasDigit) return "Le mot de passe doit contenir au moins un chiffre (0-9).";
    if (!hasSpecial) return "Le mot de passe doit contenir au moins un caractère spécial (ex: @, $, !, %).";

    return null; // Mot de passe conforme !
  }

  // GESTION DU TÉLÉCHARGEMENT DIRECT DE PHOTO EN BASE (AJOUTÉ)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("L'image est trop lourde. Limite fixée à 2 Mo maximum.")
    }

    setIsUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
      toast.success("Image importée avec succès !", { position: "top-center" })
    } catch (err: any) {
      console.error(err)
      toast.error("Échec de l'importation de l'image.")
    } finally {
      setIsUploading(false)
    }
  }

  // 1. Mise à jour du profil (Pseudo & Avatar)
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const cleanName = displayName.trim()
    if (!cleanName) return toast.error("Le nom de gamer ne peut pas être vide.")

    setIsUpdatingProfile(true)
    try {
      if (cleanName !== metadata?.display_name) {
        const { data: existing, error: checkErr } = await supabase
          .from('users_metadata')
          .select('user_id')
          .eq('display_name', cleanName)
          .neq('user_id', user.id)
          .maybeSingle()

        if (checkErr) throw checkErr
        if (existing) {
          throw new Error(`Le nom de gamer "${cleanName}" est déjà pris.`);
        }
      }

      const { error: metaErr } = await supabase
        .from('users_metadata')
        .update({ display_name: cleanName, avatar_url: avatarUrl })
        .eq('user_id', user.id)

      if (metaErr) throw metaErr

      const { error: loyaltyErr } = await supabase
        .from('loyalty_points')
        .update({ display_name: cleanName })
        .eq('user_id', user.id)

      if (loyaltyErr) throw loyaltyErr

      toast.success("Profil mis à jour avec succès !", {
        position: "bottom-center"
      })

      queryClient.invalidateQueries({ queryKey: ['user_metadata', user.id] })
      queryClient.invalidateQueries({ queryKey: ['loyalty_points', user.id] })
      if (onClose) onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur de mise à jour du profil.")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  // 2. Mise à jour du mot de passe avec validation forte
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation renforcée
    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return toast.error(passwordError, { position: "bottom-center" })
    }

    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success("Votre mot de passe a été modifié !", {
        position: "bottom-center"
      })
      setNewPassword('')
      if (onClose) onClose()
    } catch (err: any) {
      toast.error(err.message || "Erreur lors du changement de mot de passe.")
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  return (
    <div className="space-y-8 animate-fade-in text-left text-white font-display">
      
      {/* FORMULAIRE INFORMATIONS */}
      <form onSubmit={handleUpdateProfile} className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
        <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-4 flex items-center gap-2">
          <User size={14} /> Informations du compte
        </h4>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-black text-white/40 tracking-wider">Nom de Gamer (Unique)</label>
          <input
            required
            type="text"
            translate="no"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-secondary"
          />
        </div>

        {/* SECTEUR DOUBLE OPTION D'IMAGE DE PROFIL (AJOUTÉ) */}
        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-black text-white/40 tracking-wider">Photo de profil (Avatar)</label>
          
          <div className="flex gap-2 mt-1 mb-2.5">
            <button
              type="button"
              onClick={() => { setAvatarOption('upload'); setAvatarUrl(''); }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider border transition-all",
                avatarOption === 'upload' ? "border-secondary bg-secondary/15 text-secondary" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
              )}
            >
              📁 Importer de la galerie
            </button>
            <button
              type="button"
              onClick={() => { setAvatarOption('url'); setAvatarUrl(''); }}
              className={cn(
                "flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider border transition-all",
                avatarOption === 'url' ? "border-secondary bg-secondary/15 text-secondary" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
              )}
            >
              🔗 Saisir un lien URL
            </button>
          </div>

          {avatarOption === 'url' ? (
            <div className="relative animate-fade-in">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input
                type="text"
                placeholder="https://..."
                value={avatarUrl}
                onChange={e => setAvatarUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-secondary"
              />
            </div>
          ) : (
            <div className="relative animate-fade-in">
              <input 
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                id="profile-avatar-upload-input"
                className="hidden"
                disabled={isUploading}
              />
              <label
                htmlFor="profile-avatar-upload-input"
                className="w-full bg-white/5 border border-white/10 hover:border-secondary rounded-xl py-3 px-4 text-white text-xs flex items-center justify-center gap-2 cursor-pointer transition-all uppercase font-black text-[9px] tracking-wider"
              >
                {isUploading ? <Loader2 className="animate-spin text-secondary" size={14} /> : <ImageIcon size={14} />}
                {isUploading ? "IMPORTATION..." : (avatarUrl ? "IMAGE ENREGISTRÉE (MODIFIER)" : "CHOISIR DEPUIS L'APPAREIL")}
              </label>
            </div>
          )}
        </div>

        <div className="pt-2">
          <NeonButton
            type="submit"
            variant="cyan"
            disabled={isUpdatingProfile}
            className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
          >
            {isUpdatingProfile ? <Loader2 className="animate-spin" size={12} /> : <CheckCircle2 size={12} />}
            {isUpdatingProfile ? "ENREGISTREMENT..." : "Mettre à jour le profil"}
          </NeonButton>
        </div>
      </form>

      {/* FORMULAIRE SÉCURITÉ */}
      <form onSubmit={handleUpdatePassword} className="space-y-4 bg-white/[0.02] border border-white/5 p-6 rounded-3xl">
        <h4 className="text-xs font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
          <Lock size={14} /> Sécurité & Mot de passe
        </h4>

        <div className="space-y-1.5">
          <label className="text-[9px] uppercase font-black text-white/40 tracking-wider">Nouveau mot de passe</label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={14} />
            <input
              required
              type="password"
              placeholder="Saisir nouveau mot de passe"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-primary"
            />
          </div>
          
          {/* Encart visuel des critères requis (AJOUTÉ) */}
          <div className="mt-3 ml-1 space-y-1 text-[8px] uppercase font-black text-white/40 tracking-wider">
            <span className="text-primary font-black block mb-1">Critères de sécurité requis :</span>
            <ul className="list-disc pl-3.5 space-y-1">
              <li>Au moins 6 caractères</li>
              <li>Au moins une lettre majuscule (A-Z)</li>
              <li>Au moins une lettre minuscule (a-z)</li>
              <li>Au moins un chiffre (0-9)</li>
              <li>Au moins un caractère spécial (ex: @, $, !, %)</li>
            </ul>
          </div>
        </div>

        <div className="pt-2">
          <NeonButton
            type="submit"
            variant="violet"
            disabled={isUpdatingPassword}
            className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
          >
            {isUpdatingPassword ? <Loader2 className="animate-spin" size={12} /> : <Lock size={12} />}
            {isUpdatingPassword ? "MODIFICATION..." : "Changer de mot de passe"}
          </NeonButton>
        </div>
      </form>

    </div>
  )
}