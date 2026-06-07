import { useState } from 'react'
import { useNews } from '@/hooks/useNews'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { NeonButton } from '@/components/ui/NeonButton'
import { Calendar, Tag, Trash2, Plus, X, Image as ImageIcon, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { cn } from '@blinkdotnew/ui'
import { toast } from 'react-hot-toast'

export function News() {
  const { news, addNews, deleteNews } = useNews()
  const { data: metadata } = useUserMetadata()
  const isAdmin = (metadata as any)?.is_admin

  // États pour le formulaire d'ajout
  const [showAddForm, setShowAddForm] = useState(false)
  const [title, setTitle] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [category, setCategory] = useState('Salle')
  const [imageUrl, setImageUrl] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await addNews.mutateAsync({
        title,
        excerpt,
        category,
        image: imageUrl || 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?q=80&w=800'
      })
      toast.success("Article publié !")
      setShowAddForm(false)
      setTitle(''); setExcerpt(''); setImageUrl('')
    } catch (err) {
      toast.error("Erreur lors de la publication")
    }
  }

  return (
    <div className="pt-40 pb-24 min-h-screen bg-background relative overflow-hidden animate-fade-in">
      {/* Fond d'écran immersif de la page */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img 
          src="https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1600" 
          className="w-full h-full object-cover opacity-20" 
          alt="news backdrop"
        />
      </div>
      <div className="container mx-auto px-4 max-w-6xl relative z-20">
        
        <header className="mb-20 text-center">
          <h1 className="text-6xl md:text-8xl font-display font-black uppercase tracking-tighter text-white">
            ACTUALITÉS <span className="text-secondary italic">GAMING</span>
          </h1>
          <p className="text-muted-foreground uppercase text-xs tracking-[0.3em] font-bold mt-4">
            Suivez le flux du Hub en temps réel
          </p>

          {/* Bouton pour ouvrir le formulaire (Visible uniquement Admin) */}
          {isAdmin && (
            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="mt-10 flex items-center gap-2 mx-auto bg-primary text-black px-6 py-3 rounded-full font-black uppercase text-xs hover:scale-105 transition-all shadow-neon-violet"
            >
              {showAddForm ? <X size={18}/> : <Plus size={18}/>}
              {showAddForm ? "Annuler" : "Rédiger un article"}
            </button>
          )}
        </header>

        {/* FORMULAIRE ADMIN (DYNAMIQUE) */}
        {isAdmin && showAddForm && (
          <div className="mb-20 glass p-8 rounded-[2rem] border-primary/20 animate-fade-in">
            <h2 className="text-xl font-display uppercase mb-8 text-primary">Nouvel Article</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input required placeholder="Titre de l'article" className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" value={title} onChange={(e) => setTitle(e.target.value)} />
              <select className="bg-white/5 border border-white/10 rounded-xl p-4 text-white" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Salle">Salle</option>
                <option value="Tournois">Tournois</option>
                <option value="Global">Global</option>
                <option value="Promo">Promo</option>
              </select>
              <input placeholder="URL de l'image (Lien Unsplash par ex.)" className="bg-white/5 border border-white/10 rounded-xl p-4 text-white col-span-1 md:col-span-2" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              <textarea required placeholder="Contenu court de l'article..." className="bg-white/5 border border-white/10 rounded-xl p-4 text-white col-span-1 md:col-span-2 h-32" value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
              <NeonButton disabled={addNews.isPending} className="col-span-1 md:col-span-2 py-4">
                {addNews.isPending ? "Publication..." : "PUBLIER SUR LE HUB"}
              </NeonButton>
            </form>
          </div>
        )}

        {/* LISTE DES ARTICLES */}
        {news.isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={40}/></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {news.data?.map((item) => (
              <article key={item.id} className="group glass border-white/5 rounded-[2rem] overflow-hidden flex flex-col hover:border-secondary/30 transition-all duration-500">
                <div className="aspect-[16/10] overflow-hidden relative">
                   <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" />
                   <div className="absolute top-4 left-4 bg-secondary text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg">
                     {item.category}
                   </div>
                   
                   {/* BOUTON SUPPRIMER (Admin seulement) */}
                   {isAdmin && (
                     <button 
                      onClick={() => { if(confirm("Supprimer cet article ?")) deleteNews.mutate(item.id) }}
                      className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-lg hover:scale-110 transition-all"
                     >
                       <Trash2 size={16} />
                     </button>
                   )}
                </div>

                <div className="p-8 flex-1 flex flex-col">
                   <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-muted-foreground mb-4">
                     <Calendar size={12} className="text-secondary" />
                     {format(new Date(item.created_at), "d MMMM yyyy", { locale: fr })}
                   </div>
                   <h3 className="text-2xl font-display font-black uppercase text-white mb-4 leading-tight group-hover:text-secondary transition-colors">
                     {item.title}
                   </h3>
                   <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-6">
                     {item.excerpt}
                   </p>
                   <div className="mt-auto pt-6 border-t border-white/5">
                      <button className="text-[10px] font-black uppercase tracking-widest text-white hover:text-secondary transition-colors">
                        Lire l'article
                      </button>
                   </div>
                </div>
              </article>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}