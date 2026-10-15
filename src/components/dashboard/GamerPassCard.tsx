import React from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { NeonButton } from '../ui/NeonButton'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { Camera, LogOut, Coins, Clock, Shield, Cpu, Settings } from 'lucide-react'
import type { Rank } from '@/lib/ranks'

export interface GamerPassCardProps {
  userId: string
  displayName: string
  avatarUrl: string
  isPresent?: boolean
  currentRank: Rank
  loyaltyPoints?: number
  totalHours?: number
  onPresenceUpdate: (action: 'entree' | 'sortie') => Promise<void>
  isUpdatingPresence?: boolean
  onOpenScanner: () => void
  onEditProfile?: () => void
}

export function GamerPassCard({
  userId,
  displayName,
  avatarUrl,
  isPresent = false,
  currentRank,
  loyaltyPoints = 0,
  totalHours = 0,
  onPresenceUpdate,
  isUpdatingPresence = false,
  onOpenScanner,
  onEditProfile
}: GamerPassCardProps) {

  const handlePresence = async (action: 'entree' | 'sortie') => {
    try {
      await onPresenceUpdate(action)

      if (action === 'entree') {
        toast.success("Présence validée au Sanctuary ! Bienvenue.", {
          position: "bottom-center",
          style: {
            background: '#040405',
            color: '#ffffff',
            border: '2px solid #22c55e',
            borderRadius: '1rem',
            boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '12px 24px'
          }
        })
      } else {
        toast.success("Mission accomplie ! À bientôt au Sanctuary.", {
          position: "bottom-center",
          style: {
            background: '#040405',
            color: '#ffffff',
            border: '2px solid #ef4444',
            borderRadius: '1rem',
            boxShadow: '0 0 20px rgba(239, 68, 68, 0.4)',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '12px 24px'
          }
        })
      }
    } catch (e: any) {
      console.error(e)
      toast.error(`Erreur : ${e.message || e}`, { position: "bottom-center" })
    }
  }

  return (
    <div className="relative group rounded-[1.75rem] md:rounded-[2.5rem] p-4 md:p-8 overflow-hidden glass-card border border-white/15 transition-all duration-500 hover:border-primary/50 shadow-glass">

      {/* 1. LUEURS D'AMBIANCE HOLOGRAPHIQUES */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-25 group-hover:opacity-40 transition-opacity duration-700"
        style={{ backgroundColor: currentRank.color }}
      />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none opacity-20 bg-secondary group-hover:opacity-35 transition-opacity duration-700" />
      
      {/* 2. FILIGRANE HOLOGRAPHIQUE & REFLET DE SURFACE */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />

      {/* 3. EN-TÊTE DU PASS GAMER (Format Carte VIP) */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4 relative z-10">
        <div className="flex items-center gap-2.5">
          {/* Puce électronique dorée façon carte de membre d'élite */}
          <div className="w-8 h-6 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 p-0.5 flex items-center justify-center shadow-md relative overflow-hidden shrink-0">
            <Cpu className="text-amber-950 w-full h-full opacity-80" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[9px] md:text-xs font-mono font-black uppercase tracking-[0.2em] text-white">
              EVAZION // PASS
            </span>
            <span className="text-[8px] font-mono text-white/40 tracking-wider">
              ID: {userId.slice(0, 6)}...{userId.slice(-4)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bouton Modifier profil (intérieur du Pass) */}
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="group/edit inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[8.5px] font-mono font-black uppercase tracking-widest text-white/50 hover:text-white border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
            >
              <Settings size={10} className="group-hover/edit:rotate-90 transition-transform duration-500" />
              Profil
            </button>
          )}

          {/* Badge Présence en salle en direct */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono font-black uppercase tracking-widest border transition-all",
            isPresent 
              ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_10px_-2px_rgba(34,197,94,0.3)]"
              : "border-white/10 bg-white/5 text-white/50"
          )}>
            <span className="relative flex h-1.5 w-1.5">
              {isPresent && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={cn(
                "relative inline-flex rounded-full h-1.5 w-1.5",
                isPresent ? "bg-emerald-500" : "bg-white/30"
              )} />
            </span>
            <span>{isPresent ? "EN SALLE" : "HORS"}</span>
          </div>
        </div>
      </div>

      {/* 4. CORPS PRINCIPAL : PROFIL & QR CODE SUR LA MÊME LIGNE */}
      <div className="flex items-center justify-between gap-3 mb-4 relative z-10">
        
        {/* Avatar & Infos (Pseudo, Rang, Stats) */}
        <div className="flex items-center gap-3 flex-1 min-w-0 text-left">
          
          {/* Avatar avec bague néon dynamique de rang */}
          <div className="relative shrink-0">
            <div 
              className="w-14 h-14 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 shadow-xl relative z-10 bg-background"
              style={{ borderColor: currentRank.color, boxShadow: `0 0 15px ${currentRank.color}30` }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/5">
                  <Shield size={24} style={{ color: currentRank.color }} />
                </div>
              )}
            </div>
            <div 
              className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded text-[8px] font-mono font-black uppercase border z-20"
              style={{ backgroundColor: '#090a10', color: currentRank.color, borderColor: currentRank.color }}
            >
              {currentRank.name}
            </div>
          </div>

          {/* Pseudo & Badges sur la même ligne que le QR code */}
          <div className="flex-1 min-w-0 flex flex-col items-start">
            <div className="flex items-center justify-between w-full gap-2">
              <h4 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white tracking-tight truncate" translate="no">
                @{displayName}
              </h4>
            </div>

            {/* Rang & Privilège & Stats (taille réduite) */}
            <div className="flex flex-wrap items-center gap-1 mt-1 mb-1">
              <span 
                className="px-2 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border"
                style={{ 
                  backgroundColor: `${currentRank.color}15`, 
                  borderColor: `${currentRank.color}40`,
                  color: currentRank.color 
                }}
              >
                {currentRank.name}
              </span>
              
              <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[8px] font-mono font-black">
                <Coins size={9} className="text-amber-400" />
                <span>{loyaltyPoints}</span>
              </div>

              <div className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-white/[0.04] border border-white/10 text-white/70 text-[8px] font-mono font-semibold">
                <Clock size={9} className="text-secondary" />
                <span>{totalHours.toFixed(1)}H</span>
              </div>
            </div>
          </div>

        </div>

        {/* QR Code agrandi sur la même ligne */}
        <div className="flex flex-col items-center justify-center shrink-0">
          <div className="relative rounded-2xl bg-white p-2.5 shadow-[0_0_25px_rgba(255,255,255,0.2)]">
            <QRCodeSVG 
              value={userId} 
              size={95} 
              bgColor={"#ffffff"} 
              fgColor={"#05060a"} 
              level={"M"} 
              includeMargin={false} 
            />
          </div>
        </div>

      </div>

      {/* 5. PANNEAU DE CONTRÔLE D'ACCÈS RAPIDE */}
      <div className="border-t border-white/10 pt-3 relative z-10 space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          <NeonButton
            variant="danger"
            size="sm"
            cornerAccents
            disabled={!isPresent || isUpdatingPresence}
            onClick={() => handlePresence('sortie')}
            className={cn("w-full py-2 font-black text-[11px]", !isPresent && "opacity-40 cursor-not-allowed")}
          >
            <LogOut size={13} />
            Mission Accomplie (Sortie)
          </NeonButton>
        </div>

        <NeonButton
          variant="cyan"
          size="sm"
          sweep
          onClick={onOpenScanner}
          className="w-full py-2 font-black text-[11px] shadow-neon-cyan"
        >
          <Camera size={13} />
          {isPresent ? "Scanner la Salle (Départ)" : "Scanner la Salle (Arrivée)"}
        </NeonButton>
      </div>

    </div>
  )
}
