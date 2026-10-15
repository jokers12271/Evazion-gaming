import { createPortal } from 'react-dom'
import { ManiIcon } from '@/components/ui/ManiIcon';
import { X, QrCode, Smartphone, Award, Shield } from 'lucide-react'
import { CyberCard } from '@/components/ui/CyberCard'
import { NeonButton } from '@/components/ui/NeonButton'
import { getRank } from '@/lib/ranks'
import { toast } from 'react-hot-toast'

interface DigitalPassModalProps {
  displayName: string
  totalHours: number
  maniPoints: number
  isAdmin: boolean
  onClose: () => void
}

export function DigitalPassModal({ displayName, totalHours, maniPoints, isAdmin, onClose }: DigitalPassModalProps) {
  const rank = getRank(totalHours)

  const handleAddToWallet = () => {
    toast.success("Pass membre téléchargé ! Prêt pour Apple Wallet / Google Wallet.", {
      position: 'bottom-center',
      style: {
        background: '#040405',
        color: '#ffffff',
        border: '2px solid hsl(270, 90%, 60%)',
        borderRadius: '1rem',
        fontSize: '11px',
        fontWeight: '900',
        textTransform: 'uppercase',
      }
    })
  }

  return createPortal(
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-fade-in text-white font-display">
      <CyberCard
        accentColor="var(--primary)"
        hoverEffect={false}
        className="p-8 max-w-sm w-full text-center relative overflow-hidden"
        topRight={
          <button onClick={onClose} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <X size={20} />
          </button>
        }
      >
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-primary to-secondary" />

        <div className="flex items-center justify-between mb-6">
          <span className="text-[9px] font-mono font-black uppercase tracking-[0.2em] text-white/50">EVAZION PASS NFC</span>
          <span className="px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider border" style={{ color: rank.color, borderColor: rank.color, backgroundColor: `${rank.color}15` }}>
            {rank.name}
          </span>
        </div>

        <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 mx-auto mb-4 bg-background shadow-2xl relative" style={{ borderColor: rank.color }}>
          <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${displayName}`} alt={displayName} className="w-full h-full object-cover" />
        </div>

        <h3 className="text-xl font-black uppercase mb-1 flex items-center justify-center gap-1.5" translate="no">
          @{displayName}
          {isAdmin && <Shield size={14} className="text-amber-400" />}
        </h3>
        <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-6">
          {totalHours}H cumulées • <span className="inline-flex items-center gap-1">{maniPoints} <ManiIcon className="w-4 h-4" /></span>
        </p>

        {/* QR CODE SIMULATOR */}
        <div className="bg-white p-4 rounded-2xl w-44 h-44 mx-auto flex items-center justify-center mb-6 shadow-2xl relative group">
          <QrCode size={140} className="text-black" />
          <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl">
            <span className="text-[9px] font-black uppercase bg-black text-white px-2 py-1 rounded">ID SCANNABLE</span>
          </div>
        </div>

        <p className="text-[9px] text-white/40 uppercase tracking-wider mb-6 leading-relaxed">
          Présentez ce QR Code à l'accueil du Sanctuary pour badger instantanément.
        </p>

        <NeonButton
          variant="violet"
          onClick={handleAddToWallet}
          className="w-full py-3.5 text-xs font-black flex items-center justify-center gap-2"
        >
          <Smartphone size={16} />
          AJOUTER AU WALLET (NFC)
        </NeonButton>
      </CyberCard>
    </div>,
    document.body
  )
}
