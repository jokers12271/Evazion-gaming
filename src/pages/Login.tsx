import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { Link, useNavigate } from '@tanstack/react-router'
import { LogIn, Mail, Lock } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
          border: '2px solid hsl(270, 90%, 60%)', // Bordure Néon Violet
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
      toast.error("Identifiants incorrects")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full glass p-10 rounded-[2.5rem] border-white/5">
        <h1 className="text-3xl font-display uppercase text-center mb-8">Connexion</h1>
        <form onSubmit={handleLogin} className="space-y-6 text-left">
          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Email</label>
            <div className="relative mt-2">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input required type="email" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 text-white" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Mot de passe</label>
            <div className="relative mt-2">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input required type="password" className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 text-white" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          </div>
          <NeonButton disabled={loading} className="w-full py-4">{loading ? "Identification..." : "Accéder au Hub"}</NeonButton>
        </form>
        <p className="mt-8 text-center text-xs text-muted-foreground uppercase">Nouveau ? <Link to="/register" className="text-primary font-bold">Créer un compte</Link></p>
      </div>
    </div>
  )
}