import { useState } from 'react'
import { useTournaments, Tournament } from '@/hooks/useTournaments'
import { useTournamentParticipation, useMyTournamentRequest } from '@/hooks/useTournamentParticipation' // MODIFIÉ
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { useAuth } from '@/hooks/useAuth'
import { NeonButton } from '@/components/ui/NeonButton'
import { Trophy, Calendar, Gamepad2, Users, ShieldAlert, Plus, X, Trash2, Edit2, Loader2, Image as ImageIcon, CheckCircle, CheckCircle2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'
import { TournamentRegisterModal } from '@/components/community/TournamentRegisterModal' // AJOUTÉ
import { TournamentRequestsAdmin } from '@/components/community/TournamentRequestsAdmin' // AJOUTÉ

// --- COMPOSANT CARTE DE TOURNOI ---
function TournamentCard({ tourney, isAdmin, onDelete, onEdit }: { 
  tourney: Tournament, 
  isAdmin: boolean, 
  onDelete: (id: string) => void, 
  onEdit: (t: Tournament) => void 
}) {
  const { user } = useAuth();
  const [showConditions, setShowConditions] = useState(false);
  const [showRegModal, setShowRegModal] = useState(false); // Pop-up de réussite
  const [showPayModal, setShowPayModal] = useState(false); // Modale de règlement d'entrée
  const { participants, register } = useTournamentParticipation(tourney.id);
  const { data: myRequest } = useMyTournamentRequest(tourney.id); // État de ma demande d'inscription

  // --- LOGIQUE : VÉRIFIER SI LE USER EST DÉJÀ DANS LA LISTE ---
  const isAlreadyRegistered = participants?.some((p: any) => p.user_id === user?.id);

  const { data: metadata } = useUserMetadata(); 

  const handleRegister = async () => {
    if (!user) return toast.error("Connectez-vous pour vous inscrire");
    
    try {
      await register.mutateAsync({ 
        userId: user.id, 
        displayName: metadata?.display_name || user.email || 'Gamer' 
      });
      setShowRegModal(true); // Ouvre la modale de réussite
      setShowPayModal(false);
    } catch (e: any) {
      console.error("Erreur d'inscription au tournoi :", e);
      toast.error(`Erreur d'inscription : ${e.message || e}`, { position: "bottom-center" });
    }
  };

  return (
    <div className="glass border-white/5 p-8 rounded-[2.5rem] text-left relative overflow-hidden group transition-all duration-500 hover:border-primary/30 min-h-[400px] flex flex-col justify-end">
      
      {/* 1. IMAGE DE FOND DU TOURNOI */}
      <div className="absolute inset-0 z-0">
        <img 
          src={tourney.image_url || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=800'} 
          className="w-full h-full object-cover opacity-30 group-hover:opacity-50 transition-opacity duration-700"
          alt={tourney.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
      </div>

      {/* 2. ACTIONS ADMIN */}
      {isAdmin && !showConditions && (
        <div className="absolute top-6 right-6 flex gap-2 z-20">
          <button onClick={() => onEdit(tourney)} className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500 hover:text-white transition-all backdrop-blur-md border border-blue-500/20 shadow-lg">
            <Edit2 size={16}/>
          </button>
          <button onClick={() => { if(confirm("Supprimer ce tournoi ?")) onDelete(tourney.id) }} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all backdrop-blur-md border border-red-500/20 shadow-lg">
            <Trash2 size={16}/>
          </button>
        </div>
      )}

      {/* 3. CONTENU DE LA CARTE */}
      {!showConditions ? (
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-xl bg-primary text-black flex items-center justify-center shadow-neon-violet">
              <Gamepad2 size={24} />
            </div>
            <span className="text-[10px] font-black border border-primary/50 bg-primary/10 text-primary px-3 py-1 rounded-full uppercase tracking-[0.2em]">
              {tourney.status}
            </span>
          </div>

          <h3 className="text-3xl font-display font-black uppercase mb-2 leading-none text-white drop-shadow-md">
            {tourney.title}
          </h3>
          <p className="text-secondary font-black text-xs uppercase tracking-[0.2em] mb-6">
            Discipline : {tourney.game}
          </p>

          <div className="flex flex-wrap gap-6 mb-8 text-[10px] uppercase font-black text-white/70 tracking-widest">
            <span className="flex items-center gap-2">
              <Calendar size={14} className="text-primary"/> 
              {tourney.date ? format(new Date(tourney.date), 'dd MMMM yyyy', { locale: fr }) : 'À CONFIRMER'}
            </span>
            <span className="flex items-center gap-2">
              <Users size={14} className="text-primary"/> 
              {participants?.length || 0} JOUEURS
            </span>
          </div>

          {/* Affichage dynamique des frais de tournoi sur chaque carte */}
          <div className="relative z-10 mb-6 flex justify-between items-center text-[9px] font-black uppercase text-white/40 tracking-wider">
            <span>Type : {(tourney as any).is_paid ? 'Payant' : 'Gratuit'}</span>
            {(tourney as any).is_paid && <span>Frais : {(tourney as any).fee_amount} FCFA</span>}
          </div>

          {/* --- BOUTON DYNAMIQUE SELON INSCRIPTION (Intégration du consensus de validation) --- */}
          {!isAdmin && (
            <NeonButton 
              className={cn(
                "w-full py-4 transition-all duration-500",
                user && myRequest?.status === 'approved' && "opacity-50 pointer-events-none grayscale"
              )} 
              onClick={() => {
                if (!user) {
                  window.location.href = '/login';
                } else {
                  setShowConditions(true); // Ouvre d'abord le règlement
                }
              }}
              variant={user && myRequest?.status === 'approved' ? "ghost" : "violet"}
            >
              {!user ? (
                <span>Se connecter pour s'inscrire</span>
              ) : myRequest?.status === 'pending' ? (
                <span className="text-yellow-500 animate-pulse">Demande en attente</span>
              ) : myRequest?.status === 'approved' ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle size={18} /> Déjà Inscrit
                </span>
              ) : (
                <span translate="no">S'inscrire au tournoi</span>
              )}
            </NeonButton>
          )}

          {isAdmin && (
            <div className="w-full py-3 text-center border border-white/10 rounded-xl bg-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
              Mode Gestion Admin
            </div>
          )}
        </div>
      ) : (
        /* 4. VUE INSCRIPTION (RÈGLEMENT DE LA SALLE) */
        <div className="relative z-10 animate-fade-in h-full flex flex-col">
          <button onClick={() => setShowConditions(false)} className="absolute -top-2 -right-2 text-white/50 hover:text-white transition-colors">
            <X size={28}/>
          </button>
          
          <h4 className="font-display text-primary text-xl mb-6 uppercase font-black tracking-tighter text-glow-violet">Arène d'inscription</h4>
          
          <div className="mb-6 flex-1">
            <p className="text-[10px] uppercase font-black text-white/40 mb-3 tracking-widest">Compétiteurs confirmés :</p>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
              {participants?.map((p: any, i: number) => (
                <span key={i} translate="no" className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 text-white uppercase tracking-widest">
                  @{p.display_name || 'Gamer'}
                </span>
              ))}
              {participants?.length === 0 && (
                <p className="text-[10px] italic text-white/40 uppercase tracking-widest">Ouverture de la liste...</p>
              )}
            </div>
          </div>

          <div className="bg-black/60 border border-primary/30 p-5 rounded-2xl mb-8 backdrop-blur-md">
            <p className="text-[10px] uppercase text-primary font-black mb-3 flex items-center gap-2 tracking-widest">
              <ShieldAlert size={14}/> Règlement du Hub :
            </p>
            <ul className="text-[9px] text-white/80 space-y-2 font-bold uppercase tracking-tighter">
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary"/> Fair-play et respect strict</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-primary"/> Présence physique 15 min avant</li>
            </ul>
          </div>

          <NeonButton 
            className="w-full py-5 text-base font-black" 
            variant="violet" 
            onClick={() => {
              if ((tourney as any).is_paid) {
                setShowPayModal(true); // Si payant, ouvre la modale de paiement
              } else {
                handleRegister(); // Si gratuit, s'inscrit directement
              }
            }} 
            disabled={register.isPending || isAlreadyRegistered}
          >
            {register.isPending ? "TRANSMISSION..." : isAlreadyRegistered ? "INSCRIPTION EFFECTUÉE" : "VALIDER MON ENTRÉE (GO)"}
          </NeonButton>
        </div>
      )}

      {/* AJOUTÉ : Pop-up centré de confirmation d'inscription au tournoi (Réussite) */}
      {showRegModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-center">
          <div className="glass p-10 rounded-[2.5rem] border-2 border-primary shadow-neon-violet max-w-md w-full relative">
            <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="text-primary animate-pulse" size={40} />
            </div>
            <h3 className="text-2xl font-display font-black uppercase text-white mb-4">Inscription Soumise !</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-8">
              Félicitations ! Votre demande d'inscription pour le tournoi <span className="text-primary font-bold">{tourney.title}</span> a bien été envoyée. Attendez la validation de l'administration.
            </p>
            <NeonButton 
              variant="violet"
              className="w-full py-4 text-xs font-black tracking-widest"
              onClick={() => { setShowRegModal(false); setShowConditions(false); }}
            >
              Fermer
            </NeonButton>
          </div>
        </div>
      )}

      {/* AJOUTÉ : Modale de règlement d'inscription de tournoi payant */}
      {showPayModal && (
        <TournamentRegisterModal 
          tourney={tourney}
          onClose={() => setShowPayModal(false)}
          onConfirm={handleRegister}
          isPending={register.isPending}
        />
      )}

    </div>
  );
}

// --- COMPOSANT PAGE PRINCIPALE ---
export function Tournaments() {
  const { tournaments, addTournament, updateTournament, deleteTournament, isLoading } = useTournaments();
  const { data: metadata } = useUserMetadata();
  const isAdmin = (metadata as any)?.is_admin;

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '', game: '', date: '', status: 'Upcoming', description: '', image_url: '',
    is_paid: false, fee_amount: 0, payment_phone: '+242 06 000 00 00'
  });

  const handleEdit = (t: Tournament) => {
    setFormData({
      ...t,
      date: t.date ? t.date.split('T')[0] : '',
      is_paid: (t as any).is_paid ?? false,
      fee_amount: (t as any).fee_amount ?? 0,
      payment_phone: (t as any).payment_phone ?? '+242 06 000 00 00'
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
        is_paid: false, fee_amount: 0, payment_phone: '+242 06 000 00 00'
      });
    } catch (err) {
      toast.error("Erreur de sauvegarde");
    }
  };

  return (
    <div className="pt-40 pb-24 min-h-screen bg-background text-center relative overflow-hidden animate-fade-in">
       {/* Fond d'écran immersif de la page */}
       <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
         <img 
           src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1600" 
           className="w-full h-full object-cover opacity-25" 
           alt="tournaments esports backdrop"
         />
       </div>
       <div className="container mx-auto px-4 max-w-7xl relative z-20">
          
          <header className="mb-20 text-center">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass border-white/10 mb-6">
                <Trophy className="text-primary" size={14} />
                <span className="text-[10px] uppercase tracking-[0.3em] font-black text-white">Esports Hub Brazzaville</span>
             </div>
             <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter text-white leading-none" translate="no">
               Tournois <span className="text-primary italic">& Events</span>
             </h1>
             
             {isAdmin && (
               <button 
                 onClick={() => { setShowForm(!showForm); setEditingId(null); }} 
                 className="mt-12 flex items-center gap-2 mx-auto bg-white text-black px-8 py-4 rounded-full font-black uppercase text-xs hover:bg-primary transition-all shadow-xl"
               >
                 {showForm ? <X size={18}/> : <Plus size={18}/>}
                 {showForm ? "Fermer l'éditeur" : "Créer un événement"}
               </button>
             )}
          </header>

          {/* AJOUTÉ : Panneau de validation des inscriptions aux tournois (Visible uniquement Admin) */}
          {isAdmin && <TournamentRequestsAdmin />}

          {isAdmin && showForm && (
            <div className="mb-20 glass p-10 rounded-[3rem] border-primary/20 text-left animate-fade-in max-w-4xl mx-auto shadow-2xl">
              <h2 className="text-2xl font-black uppercase mb-8 text-primary flex items-center gap-3">
                <ImageIcon size={24}/> {editingId ? 'Modifier les données' : 'Configuration Événement'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Titre de la compétition</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Jeu / Catégorie</label>
                  <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.game} onChange={e => setFormData({...formData, game: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Date</label>
                  <input required type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all text-center" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Statut</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Upcoming">À Venir</option>
                    <option value="Active">En cours</option>
                    <option value="Finished">Terminé</option>
                  </select>
                </div>
                
                {/* AJOUTÉ : Configuration de paiement de tournoi */}
                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1 text-primary">Type d'entrée</label>
                  <select 
                    className="w-full bg-white/5 border border-primary/20 rounded-2xl p-4 text-white focus:border-primary focus:outline-none"
                    value={formData.is_paid ? 'true' : 'false'}
                    onChange={e => setFormData({...formData, is_paid: e.target.value === 'true', fee_amount: e.target.value === 'true' ? 1000 : 0})}
                  >
                    <option value="false" className="bg-background">Entrée Gratuite (Consensus requis)</option>
                    <option value="true" className="bg-background">Entrée Payante ( validation sous condition de règlement )</option>
                  </select>
                </div>

                {formData.is_paid && (
                  <>
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Frais d'inscription (FCFA)</label>
                      <input 
                        required 
                        type="number" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white" 
                        value={formData.fee_amount} 
                        onChange={e => setFormData({...formData, fee_amount: parseInt(e.target.value) || 0})} 
                      />
                    </div>
                    <div className="space-y-2 animate-fade-in">
                      <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">Téléphone de Paiement</label>
                      <input 
                        required 
                        type="text" 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white" 
                        value={formData.payment_phone || '+242 06 000 00 00'} 
                        onChange={e => setFormData({...formData, payment_phone: e.target.value})} 
                      />
                    </div>
                  </>
                )}

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-black text-muted-foreground ml-1">URL de l'image</label>
                  <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:border-primary transition-all" placeholder="https://..." value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                </div>
                <textarea placeholder="Description..." className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white col-span-1 md:col-span-2 h-32" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                <NeonButton className="col-span-1 md:col-span-2 py-5 text-base font-black" disabled={addTournament.isPending || updateTournament.isPending}>
                  {editingId ? 'METTRE À JOUR' : 'PUBLIER LE TOURNOI'}
                </NeonButton>
              </form>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32 text-primary">
              <Loader2 className="w-16 h-16 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {tournaments.map((t) => (
                <TournamentCard 
                  key={t.id} 
                  tourney={t} 
                  isAdmin={!!isAdmin} 
                  onDelete={(id) => deleteTournament.mutate(id)} 
                  onEdit={handleEdit} 
                />
              ))}
            </div>
          )}
       </div>
    </div>
  );
}