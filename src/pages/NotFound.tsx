import { Link } from '@tanstack/react-router'
import { Ghost, Home, ArrowLeft } from 'lucide-react'

/**
 * Ecran 404 : affiche quand aucune route ne correspond a l'URL demandee.
 *
 * Wirable via `notFoundComponent` sur la route racine, ce qui couvre aussi les
 * routes inconnues sur des pages qui ont leur propre layout.
 */
export function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-32 text-center text-white font-display animate-fade-in">
      <div className="relative mb-8">
        <div className="w-28 h-28 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Ghost size={52} className="text-primary opacity-70" />
        </div>
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl -z-10" />
      </div>

      <p className="text-5xl sm:text-6xl md:text-9xl font-black tracking-tighter text-glow-violet leading-none mb-2">
        404
      </p>
      <h1 className="text-lg md:text-xl font-black uppercase tracking-widest mb-4">
        Signal Perdu
      </h1>
      <p className="text-xs text-white/50 max-w-md leading-relaxed mb-10 uppercase tracking-wider">
        Cette zone n'existe pas dans le Sanctuary. Le lien est peut-etre obsolete,
        ou l'adresse a ete mal saisie.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Link
          to="/"
          className="px-8 py-4 bg-gradient-to-r from-purple-700 via-primary to-indigo-600 text-white border border-primary/60 rounded-xl text-xs font-black uppercase tracking-widest shadow-neon-violet hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Home size={16} /> Retour a l'accueil
        </Link>
        <button
          onClick={() => window.history.back()}
          className="px-8 py-4 bg-white/[0.04] backdrop-blur-md text-white/90 border border-white/15 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-white/[0.1] transition-all flex items-center gap-2"
        >
          <ArrowLeft size={16} /> Page precedente
        </button>
      </div>
    </div>
  )
}
