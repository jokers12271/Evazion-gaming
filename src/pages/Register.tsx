import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus, Mail, Lock, User, KeyRound, Loader2, ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { cn } from '@blinkdotnew/ui'

export function Register() {
  const { signUp, checkDisplayNameUniqueness, verifyOtpAndCreateProfile, resendVerificationCode } = useAuth()
  const navigate = useNavigate()
  
  // États du formulaire principal
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  
  // NOUVEAUX ÉTATS : Options d'image de profil (URL ou Fichier local)
  const [avatarOption, setAvatarOption] = useState<'upload' | 'url'>('upload')
  const [isUploading, setIsUploading] = useState(false)

  // États de l'écran OTP
  const [step, setStep] = useState<'form' | 'verify'>('form')
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

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

    return null;
  }

  // GESTION DU TÉLÉCHARGEMENT DE PHOTO DIRECTEMENT DEPUIS LE SMARTPHONE (AJOUTÉ)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limiter la taille de l'image d'un joueur à 2 Mo pour économiser la base de données
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("L'image est trop lourde. Limite fixée à 2 Mo maximum.")
    }

    setIsUploading(true)
    try {
      // Générer un nom de fichier unique sécurisé
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${fileName}`

      // Télécharger le fichier dans le dossier 'avatars' public de Supabase
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // Récupérer l'URL publique finale de la photo
      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      setAvatarUrl(data.publicUrl)
      toast.success("Image importée avec succès !", { position: "bottom-center" })
    } catch (err: any) {
      console.error(err)
      toast.error("Échec de l'importation. Assurez-vous d'avoir bien créé le dossier 'avatars' en public dans Supabase.")
    } finally {
      setIsUploading(false)
    }
  }

  // Étape 1 : Soumission initiale (Création de compte temporaire + Envoi OTP)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePasswordStrength(password)
    if (passwordError) {
      return toast.error(passwordError, { position: "bottom-center" })
    }

    setLoading(true)
    try {
      // Vérifier le pseudo en premier
      await checkDisplayNameUniqueness(displayName)
      
      // Lancer la création du compte (déclenche l'envoi de l'OTP par e-mail)
      await signUp(email, password)
      
      toast.success("Code de vérification envoyé à votre adresse e-mail !", {
        position: "bottom-center",
        duration: 5000
      })
      
      setStep('verify') // Passer à l'écran de vérification OTP
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erreur d'inscription")
    } finally {
      setLoading(false)
    }
  }

  // Étape 2 : Validation de l'OTP à 6 chiffres
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (verificationCode.length < 6) {
      return toast.error("Le code de vérification doit comporter 6 chiffres.")
    }

    setLoading(true)
    try {
      await verifyOtpAndCreateProfile(email, verificationCode, displayName, avatarUrl)
      
      toast.success("E-mail vérifié ! Votre compte est officiellement actif.", {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(180, 100%, 50%)',
          borderRadius: '1rem',
          boxShadow: '0 0 15px hsl(180, 100%, 50%, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      })
      navigate({ to: '/dashboard' })
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Code incorrect ou expiré. Réessayez.")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setResending(true)
    try {
      await resendVerificationCode(email)
      toast.success("Un nouveau code a été envoyé sur votre e-mail.")
    } catch (err: any) {
      toast.error(err.message || "Impossible de renvoyer le code.")
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-white/5 relative">
        
        {step === 'form' ? (
          /* FORMULAIRE D'INSCRIPTION STANDARD */
          <>
            <div className="text-center mb-10">
              <div className="w-24 h-24 rounded-full mx-auto mb-6 border-2 border-primary shadow-neon-violet overflow-hidden bg-white/5 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
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

              {/* SECTEUR CHOIX DE PHOTO DE PROFIL DOUBLE OPTION (AJOUTÉ) */}
              <div>
                <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Photo de profil (Avatar)</label>
                
                {/* Sélecteur d'option de photo */}
                <div className="flex gap-2 mt-1.5 mb-3">
                  <button
                    type="button"
                    onClick={() => { setAvatarOption('upload'); setAvatarUrl(''); }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                      avatarOption === 'upload' ? "border-primary bg-primary/10 text-primary shadow-neon-violet" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    📁 Importer de la galerie
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAvatarOption('url'); setAvatarUrl(''); }}
                    className={cn(
                      "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-all",
                      avatarOption === 'url' ? "border-primary bg-primary/10 text-primary shadow-neon-violet" : "border-white/5 bg-white/5 text-white/40 hover:text-white"
                    )}
                  >
                    🔗 Saisir un lien URL
                  </button>
                </div>

                {/* Saisie d'URL ou Fichier local selon l'onglet */}
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
                      disabled={isUploading}
                    />
                    <label
                      htmlFor="avatar-upload-input"
                      className="w-full bg-white/5 border border-white/10 hover:border-primary rounded-xl py-3 px-4 text-white text-xs flex items-center justify-center gap-2 cursor-pointer transition-all uppercase font-black text-[10px] tracking-wider"
                    >
                      {isUploading ? <Loader2 className="animate-spin text-primary" size={16} /> : <ImageIcon size={16} />}
                      {isUploading ? "IMPORTATION EN COURS..." : (avatarUrl ? "IMAGE ENREGISTRÉE (MODIFIER)" : "SÉLECTIONNER DEPUIS L'APPAREIL")}
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

              <NeonButton disabled={loading || isUploading} className="w-full py-4 mt-4">
                {loading ? <Loader2 className="animate-spin" size={16} /> : "Créer ma carte de membre"}
              </NeonButton>
            </form>
          </>
        ) : (
          /* ÉCRAN DE VALIDATION DU CODE DE VÉRIFICATION (OTP) */
          <>
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-secondary/50">
                <KeyRound className="text-secondary animate-pulse" size={32} />
              </div>
              <h1 className="text-3xl font-display uppercase tracking-tighter text-white">Vérifier l'E-mail</h1>
              <p className="text-white/40 text-[9px] font-black uppercase mt-2 tracking-[0.2em] leading-relaxed">
                Saisissez le code de validation à 6 chiffres envoyé à l'adresse <br />
                <span className="text-secondary font-black block mt-1 lowercase tracking-normal">{email}</span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-6 text-left">
              <div>
                <label className="text-[10px] uppercase font-black text-secondary tracking-widest ml-1">Code de confirmation (6 chiffres)</label>
                <div className="relative mt-2">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                  <input 
                    required 
                    type="text" 
                    maxLength={6}
                    placeholder="Ex: 123456" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 text-white focus:outline-none focus:border-secondary text-center font-black tracking-[0.5em] text-lg" 
                    value={verificationCode} 
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))} 
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <NeonButton variant="cyan" disabled={loading} className="w-full py-4 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="animate-spin" size={16} /> : "Confirmer mon compte"}
                </NeonButton>
                
                <button
                  type="button"
                  disabled={resending}
                  onClick={handleResendCode}
                  className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors text-center"
                >
                  {resending ? "Renvoi en cours..." : "Renvoyer un nouveau code"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}