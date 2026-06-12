export const RANKS = [
  { 
    name: "Test", min: 0, max: 4.99, color: "#94a3b8", label: "text-slate-400", bg: "bg-slate-400/10", border: "border-slate-400/20", 
    reward: "Message de Bienvenue personnalisé dans votre espace.",
    image: "https://eveks.eu/4432-large_default/test.jpg" 
  },
  { 
    name: "Débutant", min: 5, max: 19.99, color: "#22c55e", label: "text-green-500", bg: "bg-green-500/10", border: "border-green-500/20", 
    reward: "🥤 1 Boisson offerte à récupérer à l'accueil (Canette ou eau, une seule fois à vie).",
    image: "https://www.shutterstock.com/image-vector/beginner-stamp-icon-grunge-distressed-600nw-2603588521.jpg" 
  },
  { 
    name: "Novice", min: 20, max: 44.99, color: "#3b82f6", label: "text-blue-500", bg: "bg-blue-500/10", border: "border-blue-500/20", 
    reward: "⚡ <span class='text-secondary font-black text-glow-cyan animate-pulse'>+15 min offertes</span> sur la première session de chaque semaine.",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop" 
  },
  { 
    name: "Amateur", min: 45, max: 79.99, color: "#a855f7", label: "text-purple-500", bg: "bg-purple-500/10", border: "border-purple-500/20", 
    reward: "🗓️ Priorité de réservation les week-ends + ⚡ <span class='text-secondary font-black text-glow-cyan'>+15 min offertes</span> sur la première session de chaque semaine.",
    image: "https://static.wikia.nocookie.net/naruto/images/a/a2/Boruto_Uzumaki.png/revision/latest?cb=20211026120402&path-prefix=fr" 
  },
  { 
    name: "Semi-Pro", min: 80, max: 129.99, color: "#f97316", label: "text-orange-500", bg: "bg-orange-500/10", border: "border-orange-500/20", 
    reward: "🗓️ Priorité de réservation les week-ends + ⚡ <span class='text-secondary font-black text-glow-cyan animate-pulse'>+30 min offertes</span> sur la première session de chaque semaine.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQD80SgTYVmTrmlGB793oOFIRRy-ekrwqmdqekSRhdgGHNJpt9NL7MtKUP4&s=10" 
  },
  { 
    name: "Pro", min: 130, max: 194.99, color: "#38bdf8", label: "text-sky-400", bg: "bg-sky-400/10", border: "border-sky-400/20", 
    reward: "🎟️ -15% sur les tournois + ⚡ <span class='text-secondary font-black text-glow-cyan'>+15 min offertes</span> sur TOUTES vos sessions d'une heure minimum.",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS66OnT1uHOplFkUnpLX8pST6mWNKfOqxX8hSlA4jLzMJ3E9avc_QeCXzs&s=10" 
  },
  { 
    name: "Elite", min: 195, max: 279.99, color: "#f43f84ea", label: "text-rose-500", bg: "bg-rose-500/10", border: "border-rose-500/20", 
    reward: "👑 Réservations de consoles prioritaires + 🎟️ -25% sur les tournois + 🏆 -15% sur les cotisations de Teams + ⚡ <span class='text-secondary font-black text-glow-cyan'>+30 min offertes</span> sur TOUTES vos sessions d'une heure 30 min minimum.",
    image: "https://preview.redd.it/if-ayanokoji-was-in-classroom-of-the-elite-what-class-would-v0-l0icr6tpqo2f1.jpeg?auto=webp&s=835eeafee9f17172b8131cbe572a8544149b20bb" 
  },
  { 
    name: "Légende", min: 280, max: 379.99, color: "#eab308", label: "text-yellow-500", bg: "bg-yellow-500/10", border: "border-yellow-500/20", 
    reward: "🍰 1 Gâteau d'accueil offert + 🎟️ -25% sur les tournois + 🏆 -25% sur les cotisations de Teams + 📦 Accès Pack Légende + ⚡ <span class='text-secondary font-black text-glow-cyan'>+30 min offertes</span> sur TOUTES vos sessions d'une heure 30 min minimum.",
    image: "https://cdn.shopify.com/s/files/1/0269/0868/8432/files/Qu_est-ce_qu_un_Dragon_3.jpg?v=1726514354" 
  },
  { 
    name: "Iconique", min: 380, max: 499.99, color: "#06b6d4", label: "text-cyan-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", 
    reward: "🌟 Portrait au Hall of Fame + 📦 Accès Pack Légende + 🎟️ -50% sur les tournois + 🏆 -50% sur les cotisations de Teams + 🍰🥤 Goûter offert + ⚡ <span class='text-secondary font-black text-glow-cyan animate-pulse'>4h offertes CHAQUE 1er DU MOIS</span> + ⚡ <span class='text-secondary font-black text-glow-cyan'>+1h de bonus</span> sur TOUTES vos sessions de 2 heures minimum.",
    image: "https://static.wikia.nocookie.net/ssb/images/3/3e/MPSS_Mario.png/revision/latest?cb=20220113043843" 
  },
  { 
    name: "Divin", min: 500, max: 999999, color: "#e71212", label: "text-pink-500", bg: "bg-pink-500/10", border: "border-pink-500/20", 
    reward: "🌟 Portrait au Hall of Fame + 📦 Accès Pack Légende + 🎟️ Tournois GRATUITS + 🏆 -50% sur les cotisations de Teams + 🍰🥤 Goûter offert + ⚡ <span class='text-secondary font-black text-glow-cyan animate-pulse'>5h offertes CHAQUE 1er DU MOIS</span> + 👑 1 Session d'Honneur (3h) offerte chaque mois + ⚡ <span class='text-secondary font-black text-glow-cyan'>+1h de bonus</span> sur TOUTES vos sessions sur le Pack Légende uniquement.",
    image: "https://i.etsystatic.com/15552571/r/il/0cb884/7392120604/il_fullxfull.7392120604_gru5.jpg" 
  },
  { 
    name: "Mystère", min: 1000000, max: 0, color: "#202020", label: "text-white", bg: "bg-white/10", border: "border-white/40", 
    reward: "??? (Secret d'État)",
    image: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop" 
  }
];

export function getRank(hours: number) {
  return RANKS.find(r => hours >= r.min && (r.max === 0 || hours <= r.max)) || RANKS[0];
}

export function getNextRank(hours: number) {
  const currentIndex = RANKS.findIndex(r => hours >= r.min && (r.max === 0 || hours <= r.max));
  if (currentIndex === -1 || currentIndex === RANKS.length - 1) return null;
  return RANKS[currentIndex + 1];
}