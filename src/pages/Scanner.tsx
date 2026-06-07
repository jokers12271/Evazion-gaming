import { useState } from 'react'
import BarcodeScannerComponent from 'react-qr-barcode-scanner'
import { useNavigate } from '@tanstack/react-router'
import { X, Camera, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth' // AJOUTÉ
import { useUserMetadata, useUpdatePresence } from '@/hooks/useUserMetadata' // AJOUTÉ
import { toast } from 'react-hot-toast' // AJOUTÉ

export function Scanner() {
  const navigate = useNavigate()
  const { user } = useAuth() // AJOUTÉ
  const { data: metadata } = useUserMetadata() // AJOUTÉ
  const updatePresenceMutation = useUpdatePresence() // AJOUTÉ
  const [stopStream, setStopStream] = useState(false)

  const isAdmin = metadata?.is_admin || false;

  // AJOUTÉ : Logique de routage dynamique du scan
  const handleScanUpdate = async (scannedText: string) => {
    setStopStream(true);

    if (scannedText === 'EVAZION_ENTREE') {
      // 1. SCAN D'ENTRÉE SALLE PAR LE JOUEUR
      if (!user) {
        toast.error("Veuillez vous connecter pour valider votre entrée", { position: "bottom-center" });
        navigate({ to: '/login' });
        return;
      }

      try {
        await updatePresenceMutation.mutateAsync('entree');
        toast.success("Présence validée ! Bienvenue au Sanctuary.", {
          position: "bottom-center",
          style: {
            background: '#040405',
            color: '#ffffff',
            border: '2px solid #22c55e', // Bordure verte
            borderRadius: '1rem',
            boxShadow: '0 0 15px rgba(34, 197, 94, 0.4)',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '12px 24px'
          }
        });
        navigate({ to: '/dashboard' });
      } catch (err) {
        toast.error("Erreur de validation de présence", { position: "bottom-center" });
        setStopStream(false);
      }

    } else if (scannedText === 'EVAZION_SORTIE') {
      // 2. SCAN DE SORTIE SALLE PAR LE JOUEUR
      if (!user) {
        toast.error("Veuillez vous connecter", { position: "bottom-center" });
        navigate({ to: '/login' });
        return;
      }

      try {
        await updatePresenceMutation.mutateAsync('sortie');
        toast.success("Départ validé ! À bientôt au Sanctuary.", {
          position: "bottom-center",
          style: {
            background: '#040405',
            color: '#ffffff',
            border: '2px solid #ef4444', // Bordure rouge
            borderRadius: '1rem',
            boxShadow: '0 0 15px rgba(239, 68, 68, 0.4)',
            fontSize: '11px',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            padding: '12px 24px'
          }
        });
        navigate({ to: '/dashboard' });
      } catch (err) {
        toast.error("Erreur de validation de départ", { position: "bottom-center" });
        setStopStream(false);
      }

    } else {
      // 3. SCAN DE CARTES DE MEMBRES (ADMIN SEULEMENT)
      if (isAdmin) {
        window.location.href = `/dashboard/player/${scannedText}`;
      } else {
        toast.error("Code QR non reconnu ou réservé à l'administration", { position: "bottom-center" });
        setStopStream(false);
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Bouton pour fermer et revenir au Dashboard */}
      <button 
        onClick={() => navigate({ to: '/dashboard' })} 
        className="absolute top-10 right-10 text-white/50 hover:text-white transition-colors"
      >
        <X size={40} />
      </button>

      <div className="text-center mb-10">
        <div className="w-16 h-16 bg-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/50">
          <Camera className="text-cyan-400 animate-pulse" size={32} />
        </div>
        <h2 className="text-3xl font-display font-black uppercase text-white tracking-widest">Scanner de Pass</h2>
        <p className="text-cyan-500/60 text-[10px] font-black uppercase mt-2 tracking-[0.2em]">Pointez l'objectif vers un QR code d'accès ou de salle</p>
      </div>

      {/* ZONE DE LA CAMÉRA */}
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
        
        {/* Viseur décoratif "Cyber" */}
        <div className="absolute inset-12 border-2 border-cyan-500/30 rounded-3xl border-dashed animate-pulse" />
        <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50 shadow-neon-cyan animate-[scan_2s_linear_infinite]" />
      </div>

      <div className="mt-12 flex items-center gap-3 text-white/20 uppercase font-black text-[10px] tracking-[0.3em]">
        <ShieldCheck size={14} />
        Terminal Sécurisé Evazion
      </div>

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  )
}