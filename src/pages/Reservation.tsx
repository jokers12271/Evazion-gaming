import { useState } from 'react'
import { useReservations } from '@/hooks/useReservations'
import { useUserMetadata } from '@/hooks/useUserMetadata' 
import { NeonButton } from '@/components/ui/NeonButton'
import { useAuth } from '@/hooks/useAuth'
import { Clock, Monitor, AlertCircle, Power, PowerOff, CheckCircle2, Activity, Users } from 'lucide-react' // MODIFIÉ
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { useStationsStatus } from '@/hooks/useStationsStatus'
import { useStationManagement } from '@/hooks/useStationManagement'
import { useQuery } from '@tanstack/react-query' // AJOUTÉ
import { supabase } from '@/lib/supabase' // AJOUTÉ

const DURATIONS = [
  { label: '⚡ 15 min', value: 15, price: 500 },
  { label: '🔥 30 min', value: 30, price: 1000 },
  { label: '🎮 1h', value: 60, price: 1500 },
  { label: '🏆 1h30', value: 90, price: 2000 },
  { label: '📦 Pack 4h', value: 240, price: 5000 },
];

export function Reservation() {
  const { isAuthenticated, user } = useAuth()
  const { reservations, createReservation } = useReservations()
  const { data: metadata } = useUserMetadata() 
  const { data: occupiedStations } = useStationsStatus(); 
  const { manualStates, toggleStation } = useStationManagement();

  const stations = Array.from({ length: 10 }, (_, i) => ({
    id: `PS5_${i + 1}`,
    name: `Station ${i + 1}`,
  }))

  // AJOUTÉ : Calcul du taux d'occupation des consoles du Sanctuary (en direct)
  const totalOccupied = stations.filter(station => {
    const isManuallyOccupied = manualStates?.find(s => s.station_id === station.id)?.is_manual_occupied;
    const isAutoOccupied = occupiedStations?.includes(station.id);
    return isAutoOccupied || isManuallyOccupied;
  }).length;
  const occupancyRate = Math.round((totalOccupied / 10) * 100);

  // AJOUTÉ : Filtrer les réservations actuellement en cours (solo)
  const activeSessions = reservations?.filter((res: any) => res.status === 'en cours') || [];
  
  const [selectedStation, setSelectedStation] = useState<string | null>(null)
  const [selectedDuration, setSelectedDuration] = useState<number>(60)
  const [totalPrice, setTotalPrice] = useState<number>(1500)
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState<string>('14:00')
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false) // AJOUTÉ

  const isAdmin = (metadata as any)?.is_admin;

  const handleBooking = async () => {
    if (!isAuthenticated || !user) { 
      toast.error("Connexion requise pour réserver une session");
      window.location.href = '/login'; 
      return; 
    }
    if (!selectedStation) { toast.error('Choisissez un poste'); return; }

    const startTime = new Date(`${selectedDate}T${selectedTime}`)
    const endTime = new Date(startTime.getTime() + selectedDuration * 60000)

    const hasConflict = reservations?.some((res: any) => {
      if (res.station_id !== selectedStation || res.status === 'annulé') return false;
      const resStart = new Date(res.start_time);
      const resEnd = new Date(res.end_time);
      return (startTime < resEnd && endTime > resStart);
    });

    if (hasConflict) {
      toast.error("Ce créneau est déjà réservé sur ce poste.");
      return;
    }

    try {
      await createReservation.mutateAsync({
        station_id: selectedStation,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        display_name: metadata?.display_name || user?.email || 'Gamer',
        status: 'pending'
      })
      setShowSuccessModal(true); // MODIFIÉ : Ouvre la modale de réussite
    } catch (error: any) {
      console.error("Détails de l'erreur de réservation :", error);
      toast.error(`Erreur de réservation : ${error.message || error}`); // MODIFIÉ (Affiche l'erreur exacte)
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-screen bg-background text-center relative overflow-hidden animate-fade-in">
      {/* Fond d'écran immersif de la page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="reservation gaming backdrop"
        />
      </div>
      <div className="container mx-auto px-4 text-white relative z-20">
        <div className="max-w-6xl mx-auto">
          
          <header className="mb-16">
            <h1 className="text-5xl md:text-7xl font-display font-black uppercase tracking-tighter mb-4 text-white">
              {isAdmin ? 'GESTION DES' : 'RÉSERVER VOTRE'} <span className="text-primary italic">{isAdmin ? 'POSTES' : 'SESSION'}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto uppercase text-xs tracking-widest font-bold">
              {isAdmin ? 'Contrôlez l\'état des stations en temps réel' : 'Choisissez votre poste et votre temps de jeu.'}
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 text-white text-left">
            
            <div className="lg:col-span-2 space-y-12">
              
              {/* SECTION SÉLECTION POSTE (TOUJOURS VISIBLE) */}
              <section>
                <div className={cn("flex items-center mb-8", isAdmin ? "justify-center" : "justify-between")}>
                  <div className="flex items-center gap-3">
                    <Monitor className="text-primary" />
                    <h2 className="text-2xl font-display uppercase tracking-wider text-white text-center">
                      {isAdmin ? 'État des Stations du Hub' : 'Sélectionner un poste'}
                    </h2>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 animate-pulse">
                      Mode Administrateur
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {stations.map((station) => {
                    const isManuallyOccupied = manualStates?.find(s => s.station_id === station.id)?.is_manual_occupied;
                    const isAutoOccupied = occupiedStations?.includes(station.id);
                    const isOccupied = isAutoOccupied || isManuallyOccupied;

                    return (
                      <div key={station.id} className="flex flex-col gap-2">
                        <button
                          onClick={() => !isAdmin && !isOccupied && setSelectedStation(station.id)}
                          disabled={!isAdmin && isOccupied}
                          className={cn(
                            'w-full aspect-square rounded-xl glass border-white/5 p-4 flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden',
                            !isAdmin && selectedStation === station.id && 'border-primary bg-primary/10 shadow-neon-violet',
                            isOccupied && 'border-orange-500/50 bg-orange-500/5'
                          )}
                        >
                          <div className={cn(
                            "absolute top-3 right-3 w-2.5 h-2.5 rounded-full",
                            isOccupied ? "bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" : "bg-green-500 shadow-[0_0_8px_#22c55e]"
                          )} />

                          <div className={cn(
                            'w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center transition-colors',
                            !isAdmin && selectedStation === station.id && 'bg-primary/20 text-primary',
                            isOccupied && 'text-orange-500'
                          )}>
                            <Monitor size={24} />
                          </div>
                          <span className={cn(
                            "text-[10px] font-display font-black uppercase tracking-widest",
                            isOccupied ? "text-orange-500" : "text-white/60"
                          )}>
                            {isOccupied ? (isManuallyOccupied ? 'BLOQUÉ' : 'OCCUPÉ') : station.name}
                          </span>
                        </button>

                        {/* --- ACTIONS ADMIN (Affichées en dessous de chaque station) --- */}
                        {isAdmin && (
                          <div className="flex flex-col gap-1.5 mt-1 animate-fade-in">
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleStation.mutate({ id: station.id, status: true }) }}
                              className="w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-500 transition-all shadow-md"
                            >
                              <PowerOff size={10} /> Bloquer
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); toggleStation.mutate({ id: station.id, status: false }) }}
                              className="w-full flex items-center justify-center gap-2 text-[9px] font-black uppercase bg-green-600 text-white py-2 rounded-lg hover:bg-green-500 transition-all shadow-md"
                            >
                              <Power size={10} /> Libérer
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </section>

              {/* --- SECTION CACHÉE POUR L'ADMIN --- */}
              {!isAdmin && (
                <>
                  <section>
                    <div className="flex items-center gap-3 mb-8">
                      <Clock className="text-secondary" />
                      <h2 className="text-2xl font-display uppercase tracking-wider text-white">Durée & Tarif</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                      {DURATIONS.map((dur) => (
                        <button
                          key={dur.value}
                          onClick={() => { setSelectedDuration(dur.value); setTotalPrice(dur.price); }}
                          className={cn(
                            'py-4 px-2 rounded-xl glass border-white/5 flex flex-col items-center gap-2 transition-all',
                            selectedDuration === dur.value && 'border-secondary bg-secondary/10 shadow-neon-cyan'
                          )}
                        >
                          <span className="text-sm font-bold text-white uppercase">{dur.label}</span>
                          <span className="text-[9px] font-black uppercase text-muted-foreground">{dur.price} FCFA</span>
                        </button>
                      ))}
                    </div>
                  </section>

                  <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Heure de début</label>
                      <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary text-center font-bold" />
                    </div>
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase font-black text-primary tracking-widest ml-1">Date</label>
                      <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary text-center font-bold" />
                    </div>
                  </section>
                </>
              )}
            </div>

            {/* --- BARRE LATÉRALE CONDITIONNELLE (TICKET OU PANNEAU DE CONTRÔLE ADMIN) --- */}
            <div className="lg:col-span-1">
              {!isAdmin ? (
                // A. BARRE DU JOUEUR (TICKET)
                <div className="glass border-white/10 rounded-3xl p-8 sticky top-32 shadow-2xl">
                  <h3 className="text-xl font-display font-black uppercase tracking-widest mb-8 pb-4 border-b border-white/5 text-center text-white">VOTRE TICKET</h3>
                  <div className="space-y-6 mb-12">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Poste</span>
                      <span className="text-white font-black uppercase tracking-widest">{selectedStation || 'Non choisi'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground uppercase font-black tracking-widest text-[10px]">Temps</span>
                      <span className="text-white font-black uppercase tracking-widest">{selectedDuration} min</span>
                    </div>
                    <div className="flex justify-between items-center pt-6 border-t border-white/5">
                      <span className="text-primary font-display font-black uppercase tracking-widest">TOTAL</span>
                      {(() => {
                        const hasGlobalDiscount = (metadata as any)?.discount_perk_until && new Date((metadata as any).discount_perk_until) > new Date();
                        const realPrice = hasGlobalDiscount ? Math.round(totalPrice * 0.9) : totalPrice;

                        return (
                          <span className="text-3xl font-display font-black text-white">
                            {hasGlobalDiscount ? (
                              <span className="flex items-baseline gap-3 mr-1">
                                <span className="line-through opacity-30 text-sm">{totalPrice}</span>
                                <span className="text-secondary text-glow-cyan font-black">{realPrice}</span>
                              </span>
                            ) : totalPrice}
                            <span className="text-sm font-normal"> FCFA</span>
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                  <NeonButton onClick={handleBooking} className="w-full py-5 text-base font-black uppercase tracking-[0.2em]">Confirmer</NeonButton>
                </div>
              ) : (
                // B. BARRE DE L'ADMINISTRATEUR (PANNEAU DE CONTRÔLE LIVE)
                <div className="glass border-white/10 rounded-3xl p-8 sticky top-32 shadow-2xl text-left">
                  <h3 className="text-xl font-display font-black uppercase tracking-widest mb-8 pb-4 border-b border-white/5 text-center text-secondary text-glow-cyan flex items-center justify-center gap-2">
                    <Activity size={18} /> LIVE CONTROLE
                  </h3>
                  
                  {/* Taux d'occupation en direct du Hub */}
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-white/50">
                      <span>Occupation du Hub</span>
                      <span className="text-secondary text-glow-cyan">{occupancyRate}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-white/5 rounded-full p-0.5 border border-white/5 overflow-hidden">
                      <div className="h-full rounded-full bg-secondary shadow-neon-cyan transition-all duration-500" style={{ width: `${occupancyRate}%` }} />
                    </div>
                    <p className="text-[9px] uppercase font-bold text-white/20 tracking-wider text-center">{totalOccupied} / 10 consoles allumées</p>
                  </div>

                  {/* Liste des Sessions Solo en cours */}
                  <div className="space-y-3 mb-8 border-t border-white/5 pt-6">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Sessions en cours :</p>
                    <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                      {activeSessions && activeSessions.length > 0 ? (
                        activeSessions.map((res: any) => (
                          <div key={res.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between text-white">
                            <div>
                              <p className="text-xs font-black uppercase tracking-wider">{res.station_id}</p>
                              <p className="text-[9px] text-muted-foreground uppercase font-bold" translate="no">@{res.display_name}</p>
                            </div>
                            <span className="text-[8px] font-black uppercase px-2.5 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">Solo Active</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[10px] italic text-white/15 uppercase tracking-widest text-center py-4">Aucune session solo active</p>
                      )}
                    </div>
                  </div>

                  {/* Raccourcis Terminal Admin */}
                  <div className="space-y-3 border-t border-white/5 pt-6">
                    <p className="text-[10px] font-black uppercase text-white/40 tracking-widest">Raccourcis Terminal :</p>
                    <button 
                      onClick={() => window.location.href = '/salon'}
                      className="w-full py-3 bg-white/5 border border-white/10 hover:border-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center"
                    >
                      Consulter le Salon Live
                    </button>
                    <button 
                      onClick={() => window.location.href = '/scanner'}
                      className="w-full py-3 bg-primary/20 border border-primary/30 hover:border-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all text-center shadow-neon-violet"
                    >
                      Lancer le Scanner
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* AJOUTÉ : Pop-up centré de confirmation de réservation */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-primary shadow-neon-violet max-w-md w-full relative">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-primary animate-pulse" size={40} />
            </div>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-4">Réservation Enregistrée !</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Félicitations ! Votre créneau de jeu sur le poste <span className="text-primary font-bold">{selectedStation}</span> a bien été réservé. Retrouvez tous les détails sur votre espace de membre.
            </p>
            <div className="flex flex-col gap-4">
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="w-full py-4 bg-primary text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-neon-violet"
              >
                Accéder à mon espace
              </button>
              <button 
                onClick={() => { setShowSuccessModal(false); setSelectedStation(null); }}
                className="text-[10px] font-black uppercase text-white/40 tracking-widest hover:text-white transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}