import { useState } from 'react'
import BarcodeScannerComponent from 'react-qr-barcode-scanner'
import { useNavigate } from '@tanstack/react-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import {
  X, Camera, ShieldCheck, CheckCircle2, User, KeyRound,
  AlertTriangle, Clock, Gamepad2, Loader2, RotateCcw, Coins
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata, useUpdatePresence } from '@/hooks/useUserMetadata'
import {
  useTournamentCheckin,
  parseTournamentPass,
  isTournamentPass,
  type CheckinResult
} from '@/hooks/useTournamentParticipation'
import { toast } from 'react-hot-toast'
import { NeonButton } from '@/components/ui/NeonButton'
import { cn } from '@blinkdotnew/ui'

export function Scanner() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: metadata } = useUserMetadata()
  const updatePresenceMutation = useUpdatePresence()
  const [stopStream, setStopStream] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [checkinBusy, setCheckinBusy] = useState(false)
  const [checkinResult, setCheckinResult] = useState<CheckinResult | null>(null)
  const checkin = useTournamentCheckin()

  const isAdmin = metadata?.is_admin || false;

  const resetScanner = () => {
    setStopStream(false)
    setCheckinResult(null)
    setCheckinBusy(false)
  }

  /**
   * Check-in d'un competiteur via son Pass tournoi.
   * Renvoie true si un panneau de resultat est affiche (le scan est consomme).
   */
  const handleTournamentPass = async (scannedText: string): Promise<boolean> => {
    const pass = parseTournamentPass(scannedText)

    if (!isAdmin) {
      toast.error("Seul un administrateur peut scanner un Pass de tournoi.", { position: "bottom-center" })
      setTimeout(resetScanner, 2000)
      return true
    }

    if (!pass) {
      setCheckinResult({
        ok: false,
        reason: 'not_registered'
      })
      return true
    }

    setCheckinBusy(true)
    try {
      const result = await checkin.mutateAsync({
        tournamentId: pass.tournamentId,
        userId: pass.userId
      })
      setCheckinResult(result)
      if (result.ok && result.reason === 'ok') {
        toast.success(`Presence enregistree : @${result.display_name}`, { position: "bottom-center" })
      }
    } catch (err: any) {
      setCheckinResult({ ok: false, reason: 'not_registered' })
      toast.error(err?.message || "Erreur de check-in", { position: "bottom-center" })
    } finally {
      setCheckinBusy(false)
    }
    return true
  }

  const handleScanUpdate = async (scannedText: string) => {
    setStopStream(true);

    // 0. Pass de tournoi (check-in d'un competiteur) : traite en priorite
    if (isTournamentPass(scannedText)) {
      await handleTournamentPass(scannedText);
      return;
    }

    const cleanText = scannedText
      .trim()
      .toUpperCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[\s-]/g, "_");

    const isEntryCode = 
      cleanText === 'EVAZION_ENTREE' || 
      cleanText === 'EVASION_ENTREE' || 
      cleanText === 'EVACUATION_ENTREE' ||
      scannedText.includes('n2sjq4wt') ||
      scannedText.toLowerCase().includes('entree') || 
      scannedText.toLowerCase().includes('entry');

    const isExitCode = 
      cleanText === 'EVAZION_SORTIE' || 
      cleanText === 'EVASION_SORTIE' || 
      cleanText === 'EVACUATION_SORTIE' ||
      scannedText.toLowerCase().includes('sortie') || 
      scannedText.toLowerCase().includes('exit');

    if (isEntryCode) {
      if (!user) {
        toast.error("Veuillez vous connecter pour valider votre entrée", { position: "bottom-center" });
        navigate({ to: '/login' });
        return;
      }

      try {
        await updatePresenceMutation.mutateAsync('entree');
        toast.success("Présence validée ! Bienvenue au Sanctuary.", {
          position: "bottom-center"
        });
        navigate({ to: '/dashboard' });
      } catch (err: any) {
        toast.error(err?.message || "Erreur de validation de présence", {
          position: "bottom-center",
        });
        setStopStream(false);
      }

    } else if (isExitCode) {
      if (!user) {
        toast.error("Veuillez vous connecter", { position: "bottom-center" });
        navigate({ to: '/login' });
        return;
      }

      try {
        await updatePresenceMutation.mutateAsync('sortie');
        toast.success("Départ validé ! À bientôt au Sanctuary.", {
          position: "bottom-center"
        });
        navigate({ to: '/dashboard' });
      } catch (err: any) {
        toast.error(err?.message || "Erreur de validation de départ", {
          position: "bottom-center",
        });
        setStopStream(false);
      }

    } else {
      if (isAdmin) {
        // Un user_id brut (carte de membre) reste analyse comme avant
        const looksLikeUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(scannedText.trim());
        if (looksLikeUuid) {
          toast.success("Carte de membre détectée. Redirection...");
          navigate({ to: `/dashboard/player/${scannedText.trim()}` as any });
        } else {
          toast.error("Code non reconnu. Scannez un Pass de tournoi, un QR d'entrée ou une carte de membre.", { position: "bottom-center" });
          setTimeout(() => setStopStream(false), 2500);
        }
      } else {
        toast.error("Code non reconnu ou réservé à l'administration.", { position: "bottom-center" });
        setTimeout(() => setStopStream(false), 2000);
      }
    }
  }

  // --- Panneau de resultat du check-in tournoi ---
  const CHECKIN_MESSAGES: Record<string, { tone: string; icon: any; title: string; body: string }> = {
    ok: {
      tone: 'border-emerald-500/50 bg-emerald-500/10',
      icon: CheckCircle2,
      title: 'Presence Enregistree',
      body: "Le competiteur est desormais coche sur l'arbre du tournoi."
    },
    already: {
      tone: 'border-cyan-500/50 bg-cyan-500/10',
      icon: Clock,
      title: 'Deja Check-in',
      body: "Ce competiteur avait deja fait son check-in. Aucun double enregistrement."
    },
    pending: {
      tone: 'border-amber-500/50 bg-amber-500/10',
      icon: Clock,
      title: 'Inscription Non Validee',
      body: "Sa demande d'inscription est encore en attente. Validez-la dans les demandes d'inscription avant le check-in."
    },
    rejected: {
      tone: 'border-red-500/50 bg-red-500/10',
      icon: AlertTriangle,
      title: 'Inscription Rejetee',
      body: "Sa demande d'inscription a ete rejetee. Le joueur doit se reinscrire et attendre la validation."
    },
    not_registered: {
      tone: 'border-red-500/50 bg-red-500/10',
      icon: AlertTriangle,
      title: 'Joueur Introuvable',
      body: "Aucune demande d'inscription ne correspond a ce Pass pour ce tournoi. Verifiez le QR ou le tournoi."
    }
  }

  const renderCheckinPanel = () => {
    if (checkinBusy) {
      return (
        <div className="w-full max-w-md rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-8 text-center">
          <Loader2 size={34} className="mx-auto animate-spin text-cyan-400 mb-3" />
          <p className="text-xs font-black uppercase tracking-widest text-cyan-300">Verification du pass...</p>
        </div>
      )
    }
    if (!checkinResult) return null

    const cfg = CHECKIN_MESSAGES[checkinResult.reason] || CHECKIN_MESSAGES.not_registered
    const Icon = cfg.icon
    const t = checkinResult.tournament

    return (
      <div className={cn('w-full max-w-md rounded-2xl border p-5 md:p-6 text-left', cfg.tone)}>
        <div className="flex items-start gap-3 mb-3">
          <div className="w-11 h-11 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center shrink-0">
            <Icon size={22} className={checkinResult.ok ? 'text-emerald-400' : 'text-white'} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm md:text-base font-black uppercase text-white leading-tight">{cfg.title}</h3>
            {checkinResult.display_name && (
              <p className="text-[11px] font-mono text-white/70 mt-0.5 truncate">@{checkinResult.display_name}</p>
            )}
          </div>
        </div>

        {t && (
          <div className="p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 mb-3">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
              <User size={11} className="text-primary shrink-0" />
              <span className="text-white/40 uppercase">Tournoi</span>
              <span className="text-white font-bold ml-auto truncate text-right">{t.title}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
              <Gamepad2 size={11} className="text-primary shrink-0" />
              <span className="text-white/40 uppercase">Discipline</span>
              <span className="text-white font-bold ml-auto truncate text-right">{t.game}</span>
            </div>
            {t.date && (
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
                <Clock size={11} className="text-primary shrink-0" />
                <span className="text-white/40 uppercase">Horaire</span>
                <span className="text-white font-bold ml-auto text-right">
                  {format(new Date(t.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/60">
              <Coins size={11} className="text-primary shrink-0" />
              <span className="text-white/40 uppercase">Cashprize</span>
              <span className="text-amber-400 font-bold ml-auto text-right">{(t.cashprize_fcfa || 0).toLocaleString('fr-FR')} FCFA</span>
            </div>
          </div>
        )}

        {checkinResult.checked_in_at && (
          <p className="text-[10px] font-mono text-white/40 mb-3">
            Check-in : {format(new Date(checkinResult.checked_in_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
          </p>
        )}

        <p className="text-[10px] font-sans text-white/60 leading-relaxed mb-4">{cfg.body}</p>

        <button
          type="button"
          onClick={resetScanner}
          className="w-full py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 transition-colors cursor-pointer"
        >
          <RotateCcw size={13} /> Scanner le pass suivant
        </button>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 animate-fade-in font-display">
      <button 
        onClick={() => navigate({ to: '/dashboard' })} 
        className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors cursor-pointer"
      >
        <X size={40} />
      </button>

      {checkinResult || checkinBusy ? (
        renderCheckinPanel()
      ) : (
        <>
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/50">
          <Camera className="text-cyan-400 animate-pulse" size={32} />
        </div>
        <h2 className="text-3xl font-display font-black uppercase text-white tracking-widest">Scanner de Pass</h2>
        <p className="text-cyan-500/60 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">Pointez l'objectif vers un QR code d'accès ou de salle</p>
      </div>

      <div className="relative w-full max-w-sm aspect-square rounded-[3rem] overflow-hidden border-4 border-cyan-500 shadow-[0_0_50px_rgba(6,182,212,0.3)] bg-black">
        <BarcodeScannerComponent
          width="100%"
          height="100%"
          stopStream={stopStream}
          onUpdate={(err, result) => {
            if (result) {
              handleScanUpdate(result.getText());
            }
          }}
        />
        
        <div className="absolute inset-12 border-2 border-cyan-500/30 rounded-3xl border-dashed animate-pulse pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-neon-cyan animate-[scan_2s_linear_infinite] pointer-events-none" />
      </div>

      {/* Raccourcis de simulation de scan pour test rapide */}
      <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-md">
        <button
          onClick={() => handleScanUpdate('EVAZION_ENTREE')}
          className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-black uppercase hover:bg-emerald-500/30 cursor-pointer"
        >
          Tester QR Entrée
        </button>
        <button
          onClick={() => handleScanUpdate('EVAZION_SORTIE')}
          className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-[10px] font-mono font-black uppercase hover:bg-red-500/30 cursor-pointer"
        >
          Tester QR Sortie
        </button>
        {isAdmin && (
          <button
            onClick={() => handleScanUpdate('EVZ-PASS|__TID__|__UID__')}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-black uppercase hover:bg-emerald-500/30 cursor-pointer"
          >
            Tester Pass Tournoi
          </button>
        )}
      </div>

      <div className="mt-8 flex items-center gap-3 text-white/20 uppercase font-black text-[10px] tracking-[0.3em]">
        <ShieldCheck size={14} />
        Terminal Sécurisé Evazion
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
        </>
      )}
    </div>
  )
}
