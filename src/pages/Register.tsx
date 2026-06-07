import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link, useNavigate } from '@tanstack/react-router'
import { UserPlus, Mail, Lock, User, ArrowRight, ImageIcon } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('') // Nouvel état
  const [loading, setLoading] = useState(false)

  // AJOUTÉ : Fonction de validation de la complexité du mot de passe
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // 1. Validation de la force du mot de passe
    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      toast.error(passwordError, { position: "bottom-center" });
      return;
    }

    setLoading(true)
    try {
      await signUp(email, password, displayName, avatarUrl)
      toast.success("Inscription confirmée pour le nouveau gamer !", {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(180, 100%, 50%)', // Bordure Néon Cyan
          borderRadius: '1rem',
          boxShadow: '0 0 15px hsl(180, 100%, 50%, 0.4)',
          fontSize: '11px',
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          padding: '12px 24px'
        }
      });
      navigate({ to: '/dashboard' });
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Erreur d'inscription")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-white/5 relative">
        
        <div className="text-center mb-10">
          {/* APERÇU DE L'AVATAR EN TEMPS RÉEL */}
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
            <input required className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mt-1" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Lien de ta photo (Avatar)</label>
            <div className="relative mt-1">
              <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                placeholder="https://..." 
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 text-white" 
                value={avatarUrl} 
                onChange={(e) => setAvatarUrl(e.target.value)} 
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Email</label>
            <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mt-1" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Mot de passe</label>
            <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white mt-1" value={password} onChange={(e) => setPassword(e.target.value)} />
            
            {/* AJOUTÉ : Consignes de sécurité du mot de passe visiblement détaillées */}
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

          <NeonButton disabled={loading} className="w-full py-4 mt-4">
            {loading ? "Chargement..." : "Créer ma carte de membre"}
          </NeonButton>
        </form>
      </div>
    </div>
  )
}