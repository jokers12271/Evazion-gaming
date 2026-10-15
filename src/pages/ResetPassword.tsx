import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { NeonButton } from '@/components/ui/NeonButton'
import { CyberCard } from '@/components/ui/CyberCard'
import { useNavigate } from '@tanstack/react-router'
import { Lock, Loader2, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function ResetPassword() {
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const validatePasswordStrength = (pass: string): string | null => {
    const isAtLeast6Char = pass.length >= 6;
    if (!isAtLeast6Char) return "Le mot de passe doit faire au moins 6 caractères.";
    return null;
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    const passwordError = validatePasswordStrength(newPassword)
    if (passwordError) {
      return toast.error(passwordError, { position: "bottom-center" })
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error

      toast.success("Nouveau mot de passe enregistré avec succès !", {
        position: "bottom-center"
      })
      navigate({ to: '/dashboard' })
    } catch (err: any) {
      toast.error(err.message || "Échec de l'enregistrement.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-screen flex items-center justify-center bg-background px-4">
      <CyberCard hoverEffect={false} className="max-w-md w-full p-10">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/50">
            <Lock className="text-primary animate-pulse" size={32} />
          </div>
          <h1 className="text-3xl font-display uppercase tracking-tighter text-white">Nouveau Mot de passe</h1>
          <p className="text-white/40 text-[9px] font-black uppercase mt-2 tracking-[0.2em]">Enregistrez vos nouveaux accès de sécurité</p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-6 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Nouveau mot de passe</label>
            <div className="relative mt-1">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <input 
                required 
                type="password" 
                placeholder="Nouveau mot de passe"
                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 text-white focus:outline-none focus:border-primary text-xs" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
              />
            </div>
          </div>
          
          <NeonButton disabled={loading} className="w-full py-4 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
            {loading ? "Mise à jour..." : "Enregistrer le mot de passe"}
          </NeonButton>
        </form>
      </CyberCard>
    </div>
  )
}
