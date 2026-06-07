export const RANKS = [
  { 
    name: "Test", min: 0, max: 4, color: "#94a3b8", label: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", reward: "Mot de bienvenue",
    image: "https://img.freepik.com/free-vector/check-mark-cross-buttons-sticker-style-design_1017-36611.jpg" 
  },
  { 
    name: "Régulier", min: 5, max: 15, color: "#22c55e", label: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", reward: "1 bouteille d'eau offerte <span class='text-secondary font-black text-glow-cyan animate-pulse'>+ 15 min offertes sur la première session de chaque semaine !</span>",
    image: "https://northernirelandscreen.co.uk/wp-content/uploads/2020/10/Restart.jpg"
  },
  { 
    name: "Fidèle", min: 16, max: 30, color: "#3b82f6", label: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", reward: "Priorité de réservation les week-ends <span class='text-secondary font-black text-glow-cyan animate-pulse'>+ 30 min offertes sur la première session de chaque semaine !</span>",
    image: "https://img.magnific.com/vecteurs-premium/symbole-marque-controle-verte-dans-cercle-indiquant-confirmation-validation-homologation_1256898-1434.jpg?semt=ais_hybrid&w=740&q=80"
  },
  { 
    name: "Pro", min: 31, max: 80, color: "#a855f7", label: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", reward: "Privilèges du rang Fidèle + réduction de 25% aux tournois/events <span class='text-secondary font-black text-glow-cyan'>+ 15 min offertes sur toutes les sessions !</span>",
    image: "https://www.metrofamilymagazine.com/wp-content/uploads/2022/10/uco-gaming-arena.jpg"
  },
  { 
    name: "Légende", min: 81, max: 110, color: "#eab308", label: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", reward: "Priorité de réservation tous les jours + réduction 50% tournois/events + accès Salle des Légendes + 25% réduction frais de communauté <span class='text-secondary font-black text-glow-cyan'>+ Pack Légende 5h = 5000 FCFA</span> + gâteau offert une fois",
    image: "https://cdn.shopify.com/s/files/1/0269/0868/8432/files/Qu_est-ce_qu_un_Dragon_3.jpg?v=1726514354"
  },
  { 
    name: "Iconique", min: 111, max: 160, color: "#06b6d4", label: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", reward: "Privilèges du rang Légende + réduction 50% frais de communauté + photo sur Hall of Fame + inscription gratuite tournois/events + gâteau et yaourt offerts une fois <span class='text-secondary font-black text-glow-cyan'>+ 1h de session offerte chaque semaine !</span>",
    image: "https://static.wikia.nocookie.net/ssb/images/3/3e/MPSS_Mario.png/revision/latest?cb=20220113043843"
  },
  { 
    name: "Divin", min: 161, max: 250, color: "#f43f5e", label: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20", reward: "Privilèges du rang Icône <span class='text-secondary font-black text-glow-cyan'>+ 5h de session offertes chaque mois</span> <span class='text-secondary font-black text-glow-cyan'>+ 1 Session Divin de jeu offerte !</span>",
    image: "https://www.prime1studio.com/on/demandware.static/-/Sites-p1s-master-catalog/default/dw6b72e950/images/TLCGOW-02S/media/10_TLCGOW-02_670x804_PLP_thumbnail.jpg"
  },
  { 
    name: "Mystère", min: 251, max: 0, color: "#202020", label: "text-white", bg: "bg-white/10", border: "border-white/40", reward: "??? (Secret d'État)",
    image: "https://thumbs.dreamstime.com/b/silhouette-hacker-isloated-black-background-93196585.jpg" 
  },
];

// Prise en charge de la borne infinie du rang Mystère (max = 0)
export function getRank(hours: number) {
  return RANKS.find(r => hours >= r.min && (r.max === 0 || hours <= r.max)) || RANKS[0];
}

export function getNextRank(hours: number) {
  const currentIndex = RANKS.findIndex(r => hours >= r.min && (r.max === 0 || hours <= r.max));
  if (currentIndex === -1 || currentIndex === RANKS.length - 1) return null;
  return RANKS[currentIndex + 1];
}