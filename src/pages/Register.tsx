import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus, Mail, Lock, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@blinkdotnew/ui'

export function Register() {
  const { signUp, checkDisplayNameUniqueness } = useAuth()
  const navigate = useNavigate()
  
  // États du formulaire principal
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('') // URL si l'utilisateur saisit un lien direct
  
  // États de l'image importée localement
  const [avatarOption, setAvatarOption] = useState<'upload' | 'url'>('upload')
  const [avatarFile, setAvatarFile] = useState<File | null>(null) // Fichier physique stocké temporairement
  const [avatarPreview, setAvatarPreview] = useState<string>('') // Aperçu instantané local (URL locale)
  
  const [isUploading, setIsUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Validation de la force du mot de passe
  const validatePasswordStrength = (pass: string): string | null => {
    const hasUppercase = /[A-Z]/.test(pass);
    const hasLowercase = /[a-z]/.test(pass);
    const hasDigit = /[0-9]/.test(pass);
    const hasSpecial = /[^A-Za-z0-9]/.test(pass);
    const isAtLeast6Char = pass.length >= 6; // CORRIGÉ : Aucun espace ici

    if (!isAtLeast6Char) return "Le mot de passe doit faire au moins 6 caractères."; // CORRIGÉ : Aucun espace ici
    if (!hasUppercase) return "Le mot de passe doit contenir au moins une lettre majuscule (A-Z).";
    if (!hasLowercase) return "Le mot de passe doit contenir au moins une lettre minuscule (a-z).";
    if (!hasDigit) return "Le mot de passe doit contenir au moins un chiffre (0-9).";
    if (!hasSpecial) return "Le mot de passe doit contenir au moins un caractère spécial (ex: @, $, !, %).";

    return null;
  }

  // Sélection de la photo locale (Génère un aperçu immédiat sans upload)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("L'image est trop lourde. Limite fixée à 2 Mo maximum.")
    }

    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file)) // Crée un aperçu instantané hors-ligne sur l'écran
    toast.success("Photo sélectionnée avec succès !", { position: "bottom-center" })
  }

  // Soumission du formulaire d'inscription (Bypass des conflits de concurrence et RLS)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return toast.error(passwordError, { position: "bottom-center" })
    }

    setLoading(true)
    try {
      // 1. Vérifier que le pseudo de gamer est disponible
      await checkDisplayNameUniqueness(displayName)
      
      // 2. Créer le compte dans l'authentification Supabase avec le pseudo en métadonnée
      const signUpData = await signUp(email, password, { display_name: displayName })
      
      if (signUpData.user) {
        let finalAvatarUrl = avatarUrl

        // 3. Traiter l'upload de photo si nécessaire après la création du compte
        if (avatarOption === 'upload' && avatarFile) {
          setIsUploading(true)
          const fileExt = avatarFile.name.split('.').pop()
          const filePath = `${signUpData.user.id}.${fileExt}`

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, { upsert: true })

          if (!uploadError) {
            const { data } = supabase.storage
              .from('avatars')
              .getPublicUrl(filePath)
            finalAvatarUrl = data.publicUrl
            
            // Mettre à jour l'avatar dans les métadonnées d'authentification
            await supabase.auth.updateUser({
              data: { avatar_url: finalAvatarUrl }
            })
          } else {
            console.error("Erreur d'envoi d'avatar :", uploadError)
          }
          setIsUploading(false)
        } else if (avatarOption === 'url' && avatarUrl) {
          // Associer l'URL directe aux métadonnées d'authentification
          await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl }
          })
        }
      }

      toast.success("Bienvenue au Sanctuary ! Votre compte a été créé avec succès.", {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(180, 100%, 50%)',
          borderRadius: '1rem',
          boxShadow: '0 0 15px rgba(6, 182, 212, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      })

      // Redirection immédiate vers le Dashboard où les fiches se créeront automatiquement
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erreur d'inscription")
    } finally {
      setLoading(false)
      setIsUploading(false)
    }
  }

  // Déterminer quelle source d'image utiliser pour l'affichage de l'aperçu rond
  const currentPreviewSource = avatarOption === 'url' ? avatarUrl : avatarPreview

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-white/5 relative">
        
        <div className="text-center mb-10">
          <div className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-primary shadow-neon-violet overflow-hidden bg-white/5 flex items-center justify-center">
            {currentPreviewSource ? (
              <img src={currentPreviewSource} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <UserPlus className="text-primary/40" size={40} />
            )}
          </div>
          <h1 className="text-3xl font-display uppercase tracking-tighter text-white">Rejoindre l'Elite</h1>
        </div>

        <form onSubmit={handleRegister} className="space-y-5 text-left">
          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Nom de Gamer</label>
            <input required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mt-1 focus:outline-none focus:border-primary text-xs" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          {/* SÉLECTEUR D'IMAGE DE PROFIL */}
          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Photo de profil (Avatar)</label>
            
            <div className="flex gap-2 mt-1.5 mb-3">
              <button
                type="button"
                onClick={() => { setAvatarOption('upload'); setAvatarUrl(''); setAvatarPreview(''); setAvatarFile(null); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                  avatarOption === 'upload' ? "border-primary bg-primary/10 text-primary shadow-neon-violet" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                )}
              >
                📁 Galerie locale
              </button>
              <button
                type="button"
                onClick={() => { setAvatarOption('url'); setAvatarUrl(''); setAvatarPreview(''); setAvatarFile(null); }}
                className={cn(
                  "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                  avatarOption === 'url' ? "border-primary bg-primary/10 text-primary shadow-neon-violet" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                )}
              >
                🔗 Lien URL externe
              </button>
            </div>

            {avatarOption === 'url' ? (
              <div className="relative animate-fade-in">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <input 
                  placeholder="https://..." 
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-white focus:outline-none focus:border-primary text-xs" 
                  value={avatarUrl} 
                  onChange={(e) => setAvatarUrl(e.target.value)} 
                />
              </div>
            ) : (
              <div className="relative animate-fade-in">
                <input 
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  id="avatar-upload-input"
                  className="hidden"
                  disabled={loading}
                />
                <label
                  htmlFor="avatar-upload-input"
                  className="w-full bg-white/5 border border-white/10 hover:border-primary rounded-xl py-3 px-4 text-white text-xs flex items-center justify-center gap-2 cursor-pointer transition-all uppercase font-black text-[10px] tracking-wider"
                >
                  <ImageIcon size={16} />
                  {avatarFile ? "CHANGER LA PHOTO IMPORTEE" : "CHOISIR DEPUIS L'APPAREIL"}
                </label>
              </div>
            )}
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Email</label>
            <input required type="email" placeholder="Saisir votre adresse Gmail" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mt-1 focus:outline-none focus:border-primary text-xs" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Mot de passe</label>
            <input required type="password" placeholder="Mot de passe fort requis" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mt-1 focus:outline-none focus:border-primary text-xs" value={password} onChange={(e) => setPassword(e.target.value)} />
            
            <div className="mt-2.5 ml-1 space-y-1 text-[8px] uppercase font-black text-white/40 tracking-wider">
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

          <NeonButton type="submit" disabled={loading || isUploading} className="w-full py-4 mt-4">
            {loading || isUploading ? <Loader2 className="animate-spin" size={16} /> : "Créer ma carte de membre"}
          </NeonButton>
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground uppercase">Déjà inscrit ? <Link to="/login" className="text-primary font-bold">Se connecter</Link></p>
      </div>
    </div>
  )
}