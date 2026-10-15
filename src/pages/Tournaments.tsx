import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useTournaments, Tournament } from '@/hooks/useTournaments'
import { useTournamentParticipation, useMyTournamentRequest } from '@/hooks/useTournamentParticipation'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { CyberCard } from '@/components/ui/CyberCard'
import { 
  Trophy, 
  Calendar, 
  Gamepad2, 
  Users, 
  ShieldAlert, 
  Plus, 
  X, 
  Trash2, 
  Edit2, 
  Loader2, 
  Image as ImageIcon, 
  CheckCircle2, 
  QrCode, 
  Swords, 
  Coins, 
  FileText,
  Flame,
  Clock,
  Sparkles
} from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { ModalShell } from '@/components/ui/ModalShell'
import { TournamentRequestsAdmin } from '@/components/community/TournamentRequestsAdmin'
import { useLoyalty } from '@/hooks/useLoyalty'
import { getRank } from '@/lib/ranks'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { Award, CheckCircle } from 'lucide-react'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { useConfirm } from '@/hooks/useConfirm'

// New Tournament Proposal Components
import { TournamentBracket } from '@/components/tournaments/TournamentBracket'
import { deleteBracketData } from '@/hooks/useTournamentBracket'
import { TournamentPredictions } from '@/components/tournaments/TournamentPredictions'
import { TournamentRulesModal } from '@/components/tournaments/TournamentRulesModal'
import { TournamentCheckinPassModal } from '@/components/tournaments/TournamentCheckinPassModal'
import { TournamentRegisterModal } from '@/components/tournaments/TournamentRegisterModal'
import { ManiIcon } from '@/components/ui/ManiIcon';
import { PrizePoolBreakdown } from '@/components/tournaments/PrizePoolBreakdown'
import { AdminMasterControlModal } from '@/components/admin/AdminMasterControlModal'
import { Sliders } from 'lucide-react'

type TournamentTab = 'all' | 'bracket' | 'predictions' | 'prizepool';

function TournamentCard({ 
  tourney, 
  isAdmin, 
  onDelete, 
  onEdit, 
  userRank,
  onOpenPass 
}: { 
  tourney: Tournament, 
  isAdmin: boolean, 
  onDelete: (id: string) => void, 
  onEdit: (t: Tournament) => void,
  userRank: any,
  onOpenPass: (t: Tournament) => void
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showConditions, setShowConditions] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false);
  const { participants, register } = useTournamentParticipation(tourney.id);
  const { data: myRequest } = useMyTournamentRequest(tourney.id);
  const { data: metadata } = useUserMetadata(); 

  const isApproved = participants?.some((p: any) => p.user_id === user?.id) || myRequest?.status === 'approved';
  const isPending = myRequest?.status === 'pending';
  // Une demande rejetee ne bloque plus l'inscription : le joueur peut renvoyer sa demande.
  const wasRejected = myRequest?.status === 'rejected';
  const maxPlaces = tourney.max_places || 20;
  const takenPlaces = participants?.length || 0;
  const isFull = takenPlaces >= maxPlaces;

  const fee = (() => {
    const baseFee = tourney.fee_amount || 0;
    let finalFee = baseFee;
    let isDiscounted = false;
    if (userRank.name === 'Pro') {
      finalFee = Math.round(baseFee * 0.85); isDiscounted = true;
    } else if (userRank.name === 'Elite' || userRank.name === 'Légende') {
      finalFee = Math.round(baseFee * 0.75); isDiscounted = true;
    } else if (userRank.name === 'Iconique') {
      finalFee = Math.round(baseFee * 0.50); isDiscounted = true;
    } else if (userRank.name === 'Divin') {
      finalFee = 0; isDiscounted = true;
    }
    return { baseFee, finalFee, isDiscounted };
  })();

  // La modale "Inscription Validee" ne s'affiche QUE quand l'admin a valide,
  // et UNE seule fois par inscription (memo en localStorage : sinon elle
  // reapparait a chaque rechargement de page car le useRef est reinitialise).
  useEffect(() => {
    if (!user || !myRequest || myRequest.status !== 'approved') return;

    const storeKey = `evazion_reg_announced_${user.id}_${tourney.id}`;
    let announced: string[] = [];
    try {
      announced = JSON.parse(localStorage.getItem(storeKey) || '[]');
    } catch {
      announced = [];
    }
    if (announced.includes(myRequest.created_at)) return;

    setShowRegModal(true);
    try {
      localStorage.setItem(storeKey, JSON.stringify([...announced, myRequest.created_at]));
    } catch {
      /* stockage indisponible : la modale peut se rejouer */
    }
  }, [myRequest, user, tourney.id]);

  const handleRegister = async () => {
    if (!user) return toast.error("Connectez-vous pour vous inscrire");
    try {
      await register.mutateAsync({ 
        userId: user.id, 
        displayName: metadata?.display_name || user.email || 'Gamer' 
      });
      setShowConditions(false);
      toast.success("Demande transmise au staff du hub !");
    } catch (e: any) {
      toast.error(`Erreur d'inscription : ${e.message || e}`);
    }
  };

  return (
    <>
      <div className="border border-white/10 bg-background/6 backdrop-blur-md p-3 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2.5rem] text-left relative overflow-hidden group transition-all duration-500 hover:border-primary/30 min-h-[280px] sm:min-h-[410px] flex flex-col justify-end">
        {/* Image de fond */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src={tourney.image_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800'}
            className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-700"
            alt={tourney.title}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/85 to-transparent" />
        </div>
        {isAdmin && !showConditions && (
          <div className="absolute top-4 right-4 flex gap-1.5 z-20">
            <button onClick={() => onEdit(tourney)} className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all border border-blue-500/20 shadow-lg cursor-pointer"><Edit2 size={12}/></button>
            <button onClick={() => onDelete(tourney.id)} className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-lg cursor-pointer"><Trash2 size={12}/></button>
          </div>
        )}

        {!showConditions ? (
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary text-black flex items-center justify-center shadow-neon-violet">
                <Gamepad2 size={24} />
              </div>
              <span className="text-[8px] md:text-[10px] font-black border border-primary/50 bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-[0.2em]">
                {tourney.status}
              </span>
            </div>

            <h3 className="text-xl md:text-2xl font-display font-black uppercase mb-1 leading-tight text-white drop-shadow-md">
              {tourney.title}
            </h3>
            
            <p className="text-secondary font-black text-[10px] md:text-xs uppercase tracking-[0.2em] mb-4">
              Discipline : {tourney.game}
            </p>

            <div className="flex flex-wrap gap-3 md:gap-6 mb-4 text-[9px] md:text-[10px] uppercase font-black text-white/70 tracking-widest">
              <span className="flex items-center gap-1.5"><Calendar size={12}/> {tourney.date ? format(new Date(tourney.date), 'dd MMMM yyyy', { locale: fr }) : 'À CONFIRMER'}</span>
              <span className="flex items-center gap-1.5"><Users size={12}/> {takenPlaces}/{maxPlaces} JOUEURS</span>
            </div>

            <div className="relative z-10 mb-4 bg-black/50 p-3.5 rounded-xl border border-white/5 backdrop-blur-sm">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-wider mb-2">Compétiteurs confirmés ({takenPlaces}/{maxPlaces}) :</p>
              <div className="flex flex-wrap gap-1.5 max-h-[60px] overflow-y-auto pr-1 custom-scrollbar">
                {participants?.map((p: any, i: number) => (
                  <span 
                    key={i} 
                    className={cn(
                      'text-[9px] font-bold px-2.5 py-1 rounded-lg border animate-fade-in flex items-center gap-1',
                      p.checked_in_at
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-white/5 border-white/5 text-white/80'
                    )}
                    translate="no"
                    title={p.checked_in_at ? `Present (check-in ${format(new Date(p.checked_in_at), 'dd/MM HH:mm', { locale: fr })})` : 'Pas encore check-in'}
                  >
                    @{p.display_name}
                    {p.checked_in_at && <CheckCircle2 size={9} className="text-emerald-400 shrink-0" />}
                  </span>
                ))}
                {(!participants || participants.length === 0) && (
                  <p className="text-[9px] italic text-white/20 uppercase tracking-widest">Ouverture des inscriptions</p>
                )}
              </div>
            </div>

            <div className="relative z-10 mb-4 flex justify-between items-center text-[9px] font-black uppercase tracking-wider">
              <span className="text-white/40">Type : {tourney.is_paid ? 'Payant' : 'Gratuit'}</span>
              {tourney.is_paid && (() => {
                const baseFee = tourney.fee_amount || 0;
                let finalFee = baseFee;
                let isDiscounted = false;

                if (userRank.name === 'Pro') {
                  finalFee = Math.round(baseFee * 0.85);
                  isDiscounted = true;
                } else if (userRank.name === 'Elite' || userRank.name === 'Légende') {
                  finalFee = Math.round(baseFee * 0.75);
                  isDiscounted = true;
                } else if (userRank.name === 'Iconique') {
                  finalFee = Math.round(baseFee * 0.50);
                  isDiscounted = true;
                } else if (userRank.name === 'Divin') {
                  finalFee = 0;
                  isDiscounted = true;
                }

                return (
                  <span className="text-white/40 flex items-center gap-1.5">
                    Frais :{' '}
                    {isDiscounted ? (
                      finalFee === 0 ? (
                        <span className="text-emerald-400 font-black animate-pulse">GRATUIT (PRIVILÈGE)</span>
                      ) : (
                        <>
                          <span className="line-through opacity-30">{baseFee}</span>
                          <span className="text-yellow-400 font-black">{finalFee} FCFA</span>
                        </>
                      )
                    ) : (
                      <span className="text-white">{baseFee} FCFA</span>
                    )}
                  </span>
                );
              })()}
            </div>

            {isAdmin ? (
              <NeonButton 
                disabled
                variant="violet"
                className="w-full py-3 text-[10px] md:text-xs font-black tracking-widest opacity-85 cursor-default shadow-neon-violet"
              >
                Mode Gestion Admin
              </NeonButton>
            ) : isApproved ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onOpenPass(tourney)}
                  className="flex-1 py-3 rounded-xl border border-secondary/50 bg-secondary/20 hover:bg-secondary/30 text-white text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-neon-cyan transition-all"
                >
                  <QrCode size={14} className="text-secondary" /> Pass Check-in QR
                </button>
              </div>
            ) : isFull ? (
              <button
                type="button"
                disabled
                className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-[10px] md:text-xs font-mono font-black uppercase tracking-widest cursor-not-allowed"
              >
                Complet ({takenPlaces}/{maxPlaces})
              </button>
            ) : (
              <NeonButton 
                className="w-full py-3 md:py-4 transition-all duration-500 text-[10px] md:text-xs font-black tracking-widest" 
                onClick={() => { if (!user) { navigate({ to: '/login' }); } else { setShowConditions(true); } }}
                variant="violet"
              >
                {!user ? (
                  <span>Se connecter pour s'inscrire</span>
                ) : isPending ? (
                  <span className="text-yellow-500 animate-pulse">Demande en attente</span>
                ) : wasRejected ? (
                  <span>Re-soumettre ma demande</span>
                ) : (
                  <span translate="no">S'inscrire au tournoi</span>
                )}
              </NeonButton>
            )}
          </div>
        ) : (
          <div className="relative z-10 animate-fade-in flex flex-col">
            <button onClick={() => setShowConditions(false)} className="absolute -top-2 -right-2 text-white/50 hover:text-white transition-colors cursor-pointer"><X size={24}/></button>
            <h4 className="font-display text-primary text-lg mb-3 uppercase font-black tracking-tighter text-glow-violet">Arène d'inscription</h4>

            <div className="mb-3 p-3 rounded-xl bg-black/50 border border-white/10 space-y-1.5 text-left">
              <p className="text-[9px] uppercase font-black text-white/40 tracking-widest">Conditions du tournoi</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] font-mono">
                <span className="text-white/50">Discipline</span>
                <span className="text-white font-bold text-right truncate">{tourney.game}</span>
                <span className="text-white/50">Format</span>
                <span className="text-white font-bold text-right">{tourney.system === 'championnat' ? 'Championnat' : 'Coupe'} · {tourney.format === 'aller_retour' ? 'Aller-retour' : 'Élimination directe'}</span>
                <span className="text-white/50">Places</span>
                <span className="text-white font-bold text-right">{takenPlaces}/{maxPlaces}</span>
                <span className="text-white/50">Cashprize</span>
                <span className="text-amber-400 font-bold text-right">{(tourney.cashprize_fcfa || 0).toLocaleString('fr-FR')} FCFA</span>
              </div>
              {tourney.description && (
                <p className="text-[10px] font-sans text-white/60 leading-relaxed pt-1.5 border-t border-white/10">{tourney.description}</p>
              )}
            </div>

            {tourney.is_paid ? (
              <div className="mb-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-left">
                <p className="text-[9px] uppercase font-black text-amber-400/80 tracking-widest">Frais d'inscription</p>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-white/50">Montant</span>
                  {fee.isDiscounted ? (
                    fee.finalFee === 0 ? (
                      <span className="text-emerald-400 font-black animate-pulse">GRATUIT (Privilège {userRank.name})</span>
                    ) : (
                      <span className="font-black">
                        <span className="line-through opacity-40 text-white/40 mr-1">{fee.baseFee}</span>
                        <span className="text-yellow-400">{fee.finalFee} FCFA</span>
                      </span>
                    )
                  ) : (
                    <span className="text-white font-bold">{fee.baseFee} FCFA</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono pt-1.5 border-t border-white/10">
                  <span className="text-white/50">N° de transfert</span>
                  <span className="text-secondary font-black tracking-wider select-all" translate="no">{tourney.payment_phone || '+242 06 612 34 56'}</span>
                </div>
                <p className="text-[9px] font-sans text-white/50 leading-relaxed">Effectuez le transfert du montant puis validez ; le staff confirmera votre paiement.</p>
              </div>
            ) : (
              <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-left">
                <p className="text-[10px] font-mono text-emerald-300 font-black uppercase tracking-widest">Entrée gratuite — aucun frais</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-[9px] uppercase font-black text-white/40 mb-2 tracking-widest">Compétiteurs confirmés :</p>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
                {participants?.map((p: any, i: number) => (
                  <span key={i} className="text-[9px] font-bold bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-white/80 animate-fade-in" translate="no">
                    @{p.display_name}
                  </span>
                ))}
                {(!participants || participants.length === 0) && (
                  <p className="text-[9px] italic text-white/20 uppercase tracking-widest">Ouverture des inscriptions</p>
                )}
              </div>
            </div>

            <div className="space-y-2 mt-auto">
              <NeonButton 
                onClick={handleRegister} 
                disabled={register.isPending}
                className="w-full py-3.5 text-xs font-black tracking-widest shadow-neon-violet"
              >
                {register.isPending ? "Transmission..." : "Valider mon Inscription"}
              </NeonButton>
              <button 
                onClick={() => setShowConditions(false)} 
                className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {showRegModal && (
        <TournamentRegisterModal
          tourney={tourney}
          onClose={() => setShowRegModal(false)}
          onConfirm={() => {
            setShowRegModal(false);
            onOpenPass(tourney);
          }}
        />
      )}
    </>
  );
}

export function Tournaments() {
  const { tournaments = [], isLoading, addTournament, updateTournament, deleteTournament } = useTournaments();
  const { user } = useAuth();
  const { data: metadata } = useUserMetadata();
  const { data: loyalty } = useLoyalty();
  const userRank = getRank(loyalty?.total_hours || 0);
  const isAdmin = metadata?.is_admin || user?.user_metadata?.is_admin || false;
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TournamentTab>('all');
  const [prizeTourneyId, setPrizeTourneyId] = useState('');
  const [bracketTourneyId, setBracketTourneyId] = useState('');

  // L'evenement phare est desormais un tournoi marque is_spotlight
  // (plus de table spotlight_event separee).
  const spotlight = tournaments.find((t) => t.is_spotlight) || null;
  const spotlightId = spotlight?.id ?? '';
  const prizeTournamentId = prizeTourneyId || spotlightId || tournaments[0]?.id || '';
  const bracketTournamentId = bracketTourneyId || spotlightId || tournaments[0]?.id || '';
  const spotlightParticipation = useTournamentParticipation(spotlightId);
  const { data: mySpotlightRequest } = useMyTournamentRequest(spotlightId);

  const spotPlaces = spotlight?.max_places || 20;
  const spotTaken = spotlightParticipation.participants?.length || 0;
  const spotRemaining = Math.max(0, spotPlaces - spotTaken);
  const isSpotlightFull = spotRemaining <= 0;
  const iAmInSpotlight = spotlightParticipation.participants?.some((p: any) => p.user_id === user?.id);
  const spotlightStatus = mySpotlightRequest?.status;

  const handleSpotlightRegister = async () => {
    if (!user || !spotlight) {
      navigate({ to: '/login' });
      return;
    }
    try {
      await spotlightParticipation.register.mutateAsync({
        userId: user.id,
        displayName: metadata?.display_name || user.email || 'Gamer',
      });
      toast.success("Demande transmise au staff du hub !");
    } catch (e: any) {
      toast.error(`Erreur d'inscription : ${e.message || e}`);
    }
  };

  const handleDeleteSpotlight = () => {
    if (!spotlight) return;
    confirm({
      title: 'Supprimer cet événement phare',
      subject: spotlight.title,
      message: 'Le tournoi phare et ses inscriptions seront supprimés.',
      isPending: deleteTournament.isPending,
      onConfirm: async () => {
        await deleteBracketData(spotlight.id);
        deleteTournament.mutate(spotlight.id);
      },
    });
  };

  const [selectedPassTourney, setSelectedPassTourney] = useState<Tournament | null>(null);
  const [isRulesOpen, setIsRulesOpen] = useState(false);
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({
    title: '', game: '', date: '', status: 'Upcoming', description: '', image_url: '',
    is_paid: false, fee_amount: 0, payment_phone: '+242 06 612 34 56',
    max_places: 20, cashprize_fcfa: 0, system: 'coupe', format: 'elimination', is_spotlight: false
  });

  const { confirm, dialog } = useConfirm();

  const handleEdit = (t: Tournament) => {
    setFormData({
      ...t,
      date: t.date ? t.date.split('T')[0] : '',
      is_paid: t.is_paid ?? false,
      fee_amount: t.fee_amount ?? 0,
      payment_phone: t.payment_phone ?? '+242 06 612 34 56',
      max_places: t.max_places ?? 20,
      cashprize_fcfa: t.cashprize_fcfa ?? 0,
      system: t.system ?? 'coupe',
      format: t.format ?? 'elimination',
      is_spotlight: t.is_spotlight ?? false
    });
    setEditingId(t.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateTournament.mutateAsync({ ...formData, id: editingId });
        toast.success("Tournoi mis à jour");
      } else {
        await addTournament.mutateAsync(formData);
        toast.success("Tournoi publié");
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({
        title: '', game: '', date: '', status: 'Upcoming', description: '', image_url: '',
        is_paid: false, fee_amount: 0, payment_phone: '+242 06 612 34 56',
        max_places: 20, cashprize_fcfa: 0, system: 'coupe', format: 'elimination', is_spotlight: false
      });
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Arène des Tournois",
      desc: "Inscrivez-vous aux tournois de la salle, suivez l'arbre éliminatoire et préparez-vous à affronter les meilleurs joueurs.",
      icon: <Trophy size={28} />
    },
    {
      title: "Remises de Rang automatiques",
      desc: "Grâce à votre Rang d'heures accumulé (Pro, Elite, Légende, etc.), bénéficiez de réductions automatiques allant jusqu'à la gratuité totale sur les frais d'inscription !",
      icon: <Award size={28} />
    }
  ];

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Gestion des Tournois & Scores",
      desc: "Créez de nouvelles compétitions officielles, saisissez les scores en direct sur l'arbre de tournoi et validez les inscriptions des compétiteurs.",
      icon: <Trophy size={28} />
    }
  ];

  return (
    <div className="pt-24 md:pt-40 pb-16 md:pb-24 min-h-screen bg-background text-center relative overflow-hidden animate-fade-in font-display">
      <OnboardingModal pageKey="tournaments" steps={onboardingSteps} />
      {isAdmin && <AdminOnboardingModal pageKey="tournaments" steps={adminOnboardingSteps} />}
      {dialog}

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img src="https://shadow.tech/app/uploads/2025/05/Hero_HP_Gaming-1.jpg" className="w-full h-full object-cover scale-100 opacity-25" alt="tournaments" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-20">
        
        {/* HEADER */}
        <header className="mb-10 text-center">
          <div className="px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.25em] border border-white/10 bg-background/60 backdrop-blur-md inline-flex items-center gap-2 shadow-lg mb-5 relative z-10">
            <Trophy className="text-primary" size={14} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white">Esports Hub Brazzaville</span>
          </div>
          <h2 className={cn("font-black uppercase tracking-tighter text-white leading-none", isAdmin ? "text-3xl md:text-6xl" : "text-3xl md:text-7xl")} translate="no">
            Tournois <span className="text-primary italic">& Events</span>
          </h2>
          <p className="text-xs md:text-sm text-white/60 font-sans max-w-xl mx-auto mt-3">
            Compétitions sur PS5 Pro, Cashprizes en FCFA, arbres éliminatoires en direct et pronostics spectateurs.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs text-white/80 hover:text-white font-mono uppercase font-black flex items-center gap-2 cursor-pointer transition-all"
            >
              <FileText size={14} className="text-secondary" /> Règlement Officiel E-Sport
            </button>

            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => setIsMasterModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 text-black text-xs font-mono font-black uppercase flex items-center gap-2 cursor-pointer hover:bg-amber-300 shadow-neon-orange transition-all"
                >
                  <Sliders size={14} /> Gestion Globale & Paramètres
                </button>

                <NeonButton
                  onClick={() => { setShowForm(!showForm); setEditingId(null); }}
                  size="sm"
                  sweep
                  variant="violet"
                  className="text-xs py-2 px-4"
                >
                  {showForm ? <X size={16} className="mr-1.5" /> : <Plus size={16} className="mr-1.5" />}
                  {showForm ? "Fermer l'éditeur" : "Créer un événement"}
                </NeonButton>
              </>
            )}
          </div>
        </header>

        {/* 1. HERO SPOTLIGHT : TOURNOI ÉVÉNEMENT PHARE */}
        {spotlight && (
          <CyberCard
            variant="violet"
            hoverEffect={false}
            className="p-4 md:p-10 mb-6 md:mb-12 text-left relative overflow-hidden"
            overlay={
              <div className="absolute inset-0 z-0 pointer-events-none">
                <img
                  src={spotlight.image_url || "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=1200"}
                  alt=""
                  className="w-full h-full object-cover opacity-30"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/40" />
              </div>
            }
          >
            {isAdmin && (
              <div className="absolute top-4 right-4 z-30 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(spotlight)}
                  className="px-3 py-1.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-xl hover:bg-amber-500 hover:text-black transition-all shadow-lg cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-black uppercase"
                >
                  <Edit2 size={12} /> Modifier
                </button>
                <button
                  type="button"
                  onClick={handleDeleteSpotlight}
                  className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/40 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-lg cursor-pointer flex items-center gap-1.5 text-[10px] font-mono font-black uppercase"
                >
                  <Trash2 size={12} /> Supprimer
                </button>
              </div>
            )}

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8 items-center">
              <div className="lg:col-span-7 space-y-2.5 md:space-y-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 md:px-3 md:py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[8px] md:text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1.5 animate-pulse">
                    <Flame size={12} /> ÉVÉNEMENT PHARE
                  </span>
                  <span className="text-[9px] md:text-[10px] font-mono text-white/50 uppercase">
                    {spotlight.date ? format(new Date(spotlight.date), 'dd MMMM yyyy', { locale: fr }) : ''}
                  </span>
                </div>

                <h3 className="text-xl md:text-5xl font-black uppercase text-white tracking-tight leading-none">
                  {spotlight.game} : <br /><span className="text-amber-400">{spotlight.title}</span>
                </h3>

                <p className="text-[11px] md:text-sm text-white/70 font-sans max-w-xl">
                  {spotlight.description}
                </p>

                <div className="grid grid-cols-2 md:flex md:flex-wrap md:items-center gap-x-3 gap-y-1.5 md:gap-4 text-[10px] md:text-xs font-mono pt-1 md:pt-2">
                  <span className="text-amber-400 font-black flex items-center gap-1.5 col-span-2 md:col-auto">
                    <Trophy size={14} className="shrink-0" /> CASHPRIZE : {(spotlight.cashprize_fcfa || 0).toLocaleString('fr-FR')} FCFA
                  </span>
                  <span className="hidden md:inline text-white/40">·</span>
                  <span className="text-emerald-400 font-bold">
                    {spotTaken}/{spotPlaces} Places ({spotRemaining} restantes)
                  </span>
                  <span className="hidden md:inline text-white/40">·</span>
                  <span className="text-secondary font-black flex items-center gap-1.5 min-w-0 md:col-auto">
                    <Coins size={14} className="shrink-0" /> <span className="min-w-0">{spotlight.system === 'championnat' ? 'Championnat' : 'Coupe'} · {spotlight.format === 'aller_retour' ? 'Aller-retour' : 'Élimination directe'}</span>
                  </span>
                </div>
              </div>

            <div className="lg:col-span-5 p-3 md:p-6 rounded-xl md:rounded-2xl bg-black/60 border border-white/10 space-y-2.5 md:space-y-4 backdrop-blur-md">
              <div className="pt-1 md:pt-2 flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => { if (spotlight) setBracketTourneyId(spotlight.id); setActiveTab('bracket'); }}
                    className="flex-1 py-2 md:py-3 rounded-xl bg-primary text-black font-mono font-black text-[10px] md:text-xs uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-neon-violet"
                  >
                    Voir l'Arbre Live
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('predictions')}
                    className="flex-1 py-2 md:py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/20 text-white font-mono font-black text-[10px] md:text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {isAdmin ? "Voir les Pronostics" : <>Parier en <ManiIcon className="w-3.5 h-3.5" /></>}
                  </button>
                </div>

                {!isAdmin && (
                  (iAmInSpotlight || spotlightStatus === 'approved') ? (
                    <button
                      type="button"
                      onClick={() => setSelectedPassTourney(spotlight)}
                      className="w-full py-2 md:py-3 rounded-xl border border-secondary/50 bg-secondary/20 hover:bg-secondary/30 text-white text-[10px] font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-neon-cyan transition-all"
                    >
                      <QrCode size={14} className="text-secondary" /> Mon Pass Check-in
                    </button>
                  ) : isSpotlightFull ? (
                    <button
                      type="button"
                      disabled
                      className="w-full py-2 md:py-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-[10px] font-mono font-black uppercase tracking-widest cursor-not-allowed"
                    >
                      Complet ({spotTaken}/{spotPlaces})
                    </button>
                  ) : (
                    <NeonButton
                      type="button"
                      onClick={() => { if (!user) { navigate({ to: '/login' }); } else { handleSpotlightRegister(); } }}
                      disabled={spotlightParticipation.register.isPending}
                      variant="violet"
                      className="w-full py-2 md:py-3 text-[10px] md:text-xs font-black tracking-widest"
                    >
                      {!user ? "Se connecter pour s'inscrire" : spotlightStatus === 'pending' ? "Demande en attente" : spotlightStatus === 'rejected' ? "Re-soumettre ma demande" : "S'inscrire au tournoi"}
                    </NeonButton>
                  )
                )}
              </div>
            </div>
          </div>
        </CyberCard>
        )}

        {/* ONGLETS DE NAVIGATION */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'all'
                ? "bg-primary text-black shadow-neon-violet"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Trophy size={14} /> Tous les Tournois ({tournaments.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bracket')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'bracket'
                ? "bg-secondary text-black shadow-neon-cyan"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Swords size={14} /> Arbre Éliminatoire (Live)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('predictions')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'predictions'
                ? "bg-amber-400 text-black shadow-neon-orange"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <ManiIcon className="w-3.5 h-3.5" /> Pronostics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('prizepool')}
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer select-none",
              activeTab === 'prizepool'
                ? "bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Award size={14} /> Dotations
          </button>
        </div>

        {/* SECTIONS ADMIN (Requêtes compétiteurs & Formulaire de création) */}
        {isAdmin && <TournamentRequestsAdmin />}

        {isAdmin && showForm && (
          <CyberCard variant="violet" hoverEffect={false} className="mb-16 p-8 md:p-10 text-left max-w-4xl mx-auto">
            <h2 className="text-2xl font-black uppercase mb-8 text-primary flex items-center gap-3">
              <ImageIcon size={24}/> {editingId ? 'Modifier les données du Tournoi' : 'Configuration Nouvel Événement E-Sport'}
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3 col-span-1 md:col-span-2 p-4 rounded-2xl bg-black/40 border border-amber-500/20">
                <span className="text-[10px] uppercase font-black text-white/50 ml-1">Type d'événement</span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_spotlight: false })}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer",
                      !formData.is_spotlight
                        ? "bg-primary text-black border-primary shadow-neon-violet"
                        : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                    )}
                  >
                    Tournoi Normal
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, is_spotlight: true })}
                    className={cn(
                      "py-3 rounded-xl border text-[10px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2",
                      formData.is_spotlight
                        ? "bg-amber-400 text-black border-amber-400 shadow-neon-orange"
                        : "bg-white/5 text-white/60 border-white/10 hover:text-white"
                    )}
                  >
                    <Flame size={14} /> Événement Phare
                  </button>
                </div>
                <p className="text-[9px] text-white/40 font-sans">
                  Un seul événement phare à la fois : il s'affiche en haut de la page et remplace le précédent.
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Titre de la compétition</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Jeu / Catégorie</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" value={formData.game} onChange={e => setFormData({...formData, game: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Date</label>
                <input required type="date" className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Statut</label>
                <select className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                  <option value="Upcoming">À Venir</option>
                  <option value="Active">En cours</option>
                  <option value="Finished">Terminé</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Nombre de places (2 à 20)</label>
                <input required type="number" min={2} max={20} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-mono" value={formData.max_places} onChange={e => setFormData({...formData, max_places: Math.max(2, Math.min(20, parseInt(e.target.value) || 2))})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Cashprize (FCFA)</label>
                <input required type="number" min={0} className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-mono" value={formData.cashprize_fcfa} onChange={e => setFormData({...formData, cashprize_fcfa: parseInt(e.target.value) || 0})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Système</label>
                <select className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" value={formData.system} onChange={e => setFormData({...formData, system: e.target.value})}>
                  <option value="coupe">Coupe</option>
                  <option value="championnat">Championnat</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Élimination</label>
                <select className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" value={formData.format} onChange={e => setFormData({...formData, format: e.target.value})}>
                  <option value="elimination">Élimination directe</option>
                  <option value="aller_retour">Aller-retour</option>
                </select>
              </div>
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">Type d'entrée</label>
                <select className="w-full bg-black/60 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" value={formData.is_paid ? 'true' : 'false'} onChange={e => setFormData({...formData, is_paid: e.target.value === 'true', fee_amount: e.target.value === 'true' ? 5000 : 0})}>
                  <option value="false">Entrée Gratuite</option>
                  <option value="true">Entrée Payante</option>
                </select>
              </div>
              {formData.is_paid && (
                <>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-white/50 ml-1">Frais d'inscription (FCFA)</label>
                    <input required type="number" className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-mono" value={formData.fee_amount} onChange={e => setFormData({...formData, fee_amount: parseInt(e.target.value) || 0})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-white/50 ml-1">Téléphone de Paiement</label>
                    <input required type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white text-xs font-mono" value={formData.payment_phone || '+242 06 612 34 56'} onChange={e => setFormData({...formData, payment_phone: e.target.value})} />
                  </div>
                </>
              )}
              <div className="space-y-2 col-span-1 md:col-span-2">
                <label className="text-[10px] uppercase font-black text-white/50 ml-1">URL de l'image de couverture</label>
                <input className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white focus:border-primary text-xs" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
              </div>
              <textarea placeholder="Description du tournoi, règles particulières..." className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-white col-span-1 md:col-span-2 h-28 text-xs font-sans" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
              <NeonButton className="col-span-1 md:col-span-2 py-4 text-xs font-black" disabled={addTournament.isPending || updateTournament.isPending}>
                {"PUBLIER LE TOURNOI"}
              </NeonButton>
            </form>
          </CyberCard>
        )}

        {/* CONTENU SELON L'ONGLET ACTIF */}
        {activeTab === 'all' && (
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-32 text-primary">
                <Loader2 className="w-12 h-12 animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {tournaments.map((t) => (
                  <TournamentCard 
                    key={t.id} 
                    tourney={t} 
                    isAdmin={!!isAdmin} 
                    onDelete={(id) => { confirm({ title: 'Supprimer ce tournoi', subject: t.title, message: 'Les inscriptions et l\'arbre associés seront perdus.', isPending: deleteTournament.isPending, onConfirm: async () => { await deleteBracketData(id); deleteTournament.mutate(id); } }) }} 
                    onEdit={handleEdit} 
                    userRank={userRank} 
                    onOpenPass={(selected: Tournament) => setSelectedPassTourney(selected)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'bracket' && (
          <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
            {tournaments.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left">
                <label className="text-[10px] uppercase font-black text-white/50">Arbre du tournoi :</label>
                <select
                  value={bracketTournamentId}
                  onChange={(e) => setBracketTourneyId(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}{t.is_spotlight ? ' (Phare)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <TournamentBracket key={bracketTournamentId} isAdmin={!!isAdmin} tournamentId={bracketTournamentId} />
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10">
            <TournamentPredictions />
          </div>
        )}

        {activeTab === 'prizepool' && (
          <div className="p-6 md:p-8 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6">
            {tournaments.length > 1 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-left">
                <label className="text-[10px] uppercase font-black text-white/50">Dotations du tournoi :</label>
                <select
                  value={prizeTournamentId}
                  onChange={(e) => setPrizeTourneyId(e.target.value)}
                  className="bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:border-primary outline-none"
                >
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}{t.is_spotlight ? ' (Phare)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <PrizePoolBreakdown tournamentId={prizeTournamentId} />
          </div>
        )}

      </div>

      {/* Modale Règlement Officiel */}
      <TournamentRulesModal
        isOpen={isRulesOpen}
        onClose={() => setIsRulesOpen(false)}
      />

      {/* Modale Pass Joueur Check-in QR */}
      {selectedPassTourney && (
        <TournamentCheckinPassModal
          isOpen={!!selectedPassTourney}
          onClose={() => setSelectedPassTourney(null)}
          tournament={selectedPassTourney}
          user={user}
          rankName={userRank.name}
        />
      )}

      {isAdmin && (
        <AdminMasterControlModal
          isOpen={isMasterModalOpen}
          onClose={() => setIsMasterModalOpen(false)}
        />
      )}

    </div>
  );
}
