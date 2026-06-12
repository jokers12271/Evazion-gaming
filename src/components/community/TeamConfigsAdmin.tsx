import { useState, useEffect } from 'react'
import { useTeamConfigs, useTeamMembershipActions } from '@/hooks/useTeamMembership'
import { NeonButton } from '@/components/ui/NeonButton'
import { Landmark, Check, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'

export function TeamConfigsAdmin() {
  const [selectedTeam, setSelectedTeam] = useState('FC 26')
  const [joinFee, setJoinFee] = useState<number | ''>('')
  const [monthlyFee, setMonthlyFee] = useState<number | ''>('')
  const [paymentPhone, setPaymentPhone] = useState('')

  const { data: configs, isLoading } = useTeamConfigs()
  const { updateConfig } = useTeamMembershipActions()

  useEffect(() => {
    if (configs) {
      const config = configs.find(c => c.team_id === selectedTeam)
      if (config) {
        setJoinFee(config.join_fee)
        setMonthlyFee(config.monthly_fee)
        setPaymentPhone(config.payment_phone)
      }
    }
  }, [selectedTeam, configs])

  const handleConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (joinFee === '' || monthlyFee === '') return

    try {
      await updateConfig.mutateAsync({ teamId: selectedTeam, joinFee, monthlyFee, paymentPhone })
      toast.success("Frais de team mis à jour avec succès !", { position: "bottom-center" })
    } catch (err) {
      toast.error("Erreur de mise à jour", { position: "bottom-center" })
    }
  }

  return (
    <div className="glass p-8 rounded-[2.5rem] border-secondary/20 text-left mb-16 animate-fade-in shadow-2xl">
      <h3 className="text-xl font-display font-black uppercase mb-6 text-secondary flex items-center gap-3">
        <Landmark size={22} className="text-secondary" />
        Frais d'Adhésion & Cotisations de Teams (Admin)
      </h3>

      {isLoading ? (
        <div className="py-6 flex justify-center"><Loader2 className="animate-spin text-secondary" size={24} /></div>
      ) : (
        <form onSubmit={handleConfigSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Sélectionner la Team</label>
            <select 
              value={selectedTeam} 
              onChange={e => setSelectedTeam(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
            >
              <option value="FC 26" className="bg-background">Team - FC26</option>
              <option value="Tekken" className="bg-background">Team - Tekken</option>
              <option value="GTA" className="bg-background">Team - GTA</option>
              <option value="Naruto" className="bg-background">Team - Naruto</option>
              <option value="Fortnite" className="bg-background">Team - Fortnite</option>
              <option value="2K NBA" className="bg-background">Team - 2K NBA</option>
              <option value="Mortal Kombat" className="bg-background">Team - Mortal Kombat</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Frais d'Intégration (FCFA)</label>
            <input
              required
              type="number"
              value={joinFee}
              onChange={e => setJoinFee(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Cotisation Mensuelle (FCFA)</label>
            <input
              required
              type="number"
              value={monthlyFee}
              onChange={e => setMonthlyFee(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[8px] uppercase font-black text-white/40">Téléphone de Paiement</label>
            <input
              required
              type="text"
              value={paymentPhone}
              onChange={e => setPaymentPhone(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white"
            />
          </div>

          <NeonButton type="submit" variant="cyan" disabled={updateConfig.isPending} className="w-full py-3 text-[10px] font-black md:col-span-4 flex items-center justify-center gap-2">
            <Check size={14} /> Enregistrer la Configuration Financière
          </NeonButton>
        </form>
      )}
    </div>
  )
}