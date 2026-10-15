import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { CyberCard } from '@/components/ui/CyberCard'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn, Mail, Lock, X, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function Login() {
  const { login, verifyOtpAndCreateProfile, resendVerificationCode } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const [isForgotOpen, setIsForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [confirmCode, setConfirmCode] = useState('')
  const [confirmLoading, setConfirmLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      toast.success("Connexion confirmée au compte !", {
        position: "bottom-center",
        style: {
          background: '#040405',
          color: '#ffffff',
          border: '2px solid hsl(270, 90%, 60%)',
          borderRadius: '1rem',
          boxShadow: '0 0 15px hsl(270, 90%, 60%, 0.4)',
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
      if (error.message?.includes("Email not confirmed") || error.message?.includes("not confirmed")) {
        toast.error("Votre adresse e-mail n'a pas encore été vérifiée.", { duration: 5000 })
        setIsConfirmModalOpen(true)
      } else {
        toast.error("Identifiants de connexion incorrects")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmCode.length < 6) return

    setConfirmLoading(true)
    try {
      await verifyOtpAndCreateProfile(email, confirmCode, email.split('@')[0], '')
      toast.success("E-mail validé avec succès ! Connexion en cours...", { position: "bottom-center" })
      setIsConfirmModalOpen(false)
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      toast.error(err.message || "Code incorrect ou expiré.")
    } finally {
      setConfirmLoading(false)
    }
  }

  const handleResendConfirmCode = async () => {
    try {
      await resendVerificationCode(email)
      toast.success("Un nouveau code a été envoyé sur votre e-mail.")
    } catch (err: any) {
      toast.error(err.message || "Erreur d'envoi du code.")
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail.trim()) return

    setForgotLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin + '/reset-password',
      })
      if (error) throw error

      toast.success("E-mail de récupération envoyé ! Vérifiez votre boîte de réception.", {
        position: "bottom-center",
        duration: 6000
      })
      setIsForgotOpen(false)
      setForgotEmail('')
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de l'envoi de l'e-mail.")
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen flex items-center justify-center bg-background px-4 relative">
      <CyberCard hoverEffect={false} className="max-w-md w-full p-8 sm:p-10 font-display">
        <h1 className="text-3xl font-display uppercase text-center mb-2">Connexion</h1>
        <p className="text-xs text-white/50 text-center font-sans mb-6">
          Accédez à votre terminal membre The Sanctuary
        </p>

        <form onSubmit={handleLogin} className="space-y-5 text-left">
          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Email</label>
            <div className="relative mt-1.5">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input required type="email" placeholder="nom@sanctuary.cg" className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 text-white focus:outline-none focus:border-primary text-xs font-mono" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center ml-1">
              <label className="text-[10px] uppercase font-black text-primary tracking-widest">Mot de passe</label>
              <button 
                type="button" 
                onClick={() => setIsForgotOpen(true)}
                className="text-[8px] font-black uppercase text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                Mot de passe oublié ?
              </button>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input required type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white focus:outline-none focus:border-primary text-xs font-mono" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-white/40 hover:text-primary hover:bg-white/5 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <NeonButton disabled={loading} className="w-full py-4 text-xs font-black tracking-widest shadow-neon-violet">
            {loading ? "Identification..." : "Accéder au Hub"}
          </NeonButton>
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground uppercase">Nouveau ? <Link to="/register" className="text-primary font-bold">Créer un compte</Link></p>
      </CyberCard>

      {/* POP-UP : MOT DE PASSE OUBLIÉ */}
      {isForgotOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <CyberCard variant="violet" hoverEffect={false} className="p-8 md:p-10 max-w-sm w-full text-center">
            <button 
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-primary/30">
              <Mail className="text-primary animate-pulse" size={24} />
            </div>

            <h3 className="text-xl font-black uppercase text-primary mb-2">Récupération de compte</h3>
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-6">Un e-mail de réinitialisation vous sera envoyé</p>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-white/40 tracking-wider">Saisissez votre e-mail d'inscription</label>
                <input
                  required
                  type="email"
                  placeholder="nom@exemple.com"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-primary"
                />
              </div>

              <div className="pt-2">
                <NeonButton 
                  type="submit" 
                  variant="violet" 
                  disabled={forgotLoading}
                  className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
                >
                  {forgotLoading && <Loader2 className="animate-spin" size={12} />}
                  {forgotLoading ? "ENVOI EN COURS..." : "RÉINITIALISER MON MOT DE PASSE"}
                </NeonButton>
              </div>
            </form>
          </CyberCard>
        </div>
      )}

      {/* POP-UP : ADRESSE E-MAIL NON CONFIRMÉE */}
      {isConfirmModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-center text-white font-display">
          <CyberCard variant="cyan" hoverEffect={false} className="p-8 md:p-10 max-w-sm w-full text-center">
            <button 
              onClick={() => setIsConfirmModalOpen(false)}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors focus:outline-none cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4 border border-secondary/30">
              <KeyRound className="text-secondary animate-pulse" size={24} />
            </div>

            <h3 className="text-xl font-black uppercase text-secondary mb-2">Compte non validé</h3>
            <p className="text-[9px] uppercase tracking-widest text-white/40 font-black mb-6">Saisissez le code reçu sur {email}</p>

            <form onSubmit={handleConfirmEmailOtp} className="space-y-4 text-left">
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase font-black text-white/40 tracking-wider">Code à 6 chiffres</label>
                <input
                  required
                  type="text"
                  maxLength={6}
                  placeholder="Ex: 123456"
                  value={confirmCode}
                  onChange={e => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white text-center font-black tracking-[0.25em]"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <NeonButton 
                  type="submit" 
                  variant="cyan" 
                  disabled={confirmLoading}
                  className="w-full py-3 text-[10px] font-black flex items-center justify-center gap-2"
                >
                  {confirmLoading && <Loader2 className="animate-spin" size={12} />}
                  {confirmLoading ? "VALIDATION..." : "ACTIVER MON COMPTE"}
                </NeonButton>
                
                <button
                  type="button"
                  onClick={handleResendConfirmCode}
                  className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors text-center cursor-pointer"
                >
                  Renvoyer un code de validation
                </button>
              </div>
            </form>
          </CyberCard>
        </div>
      )}
    </div>
  )
}
