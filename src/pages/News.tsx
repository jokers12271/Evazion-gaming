import { Newspaper, Rss, Pin, PinOff, Pencil, Trash2, Plus, X, Image as ImageIcon, Loader2, Search, Eye, EyeOff } from 'lucide-react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { useUserMetadata } from '@/hooks/useUserMetadata'
import { supabase } from '@/lib/supabase'
import {
  useNews,
  isRagnarok,
  newsImage,
  newsSummary,
  NEWS_CATEGORIES
} from '@/hooks/useNews'
import { NeonButton } from '@/components/ui/NeonButton'
import { CyberCard } from '@/components/ui/CyberCard'
import { OnboardingModal, OnboardingStep } from '@/components/ui/OnboardingModal'
import { AdminOnboardingModal, AdminOnboardingStep } from '@/components/ui/AdminOnboardingModal'
import { useConfirm } from '@/hooks/useConfirm'
import { useState, useMemo, useRef, type FormEvent } from 'react'

const EMPTY_DRAFT = {
  title: '',
  excerpt: '',
  content: '',
  category: 'Salle',
  image: '',
  is_pinned: false
}

export function News() {
  const { news, addNews, deleteNews, updateNews, togglePin, registerView, withSchema } = useNews()
  const { confirm, dialog: confirmDialog } = useConfirm()

  const { data: metadata } = useUserMetadata()
  const { user } = useAuth()
  const isAdmin = (metadata as any)?.is_admin

  const [showAddForm, setShowAddForm] = useState(false)
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditing = editingId !== null

  const resetDraft = () => {
    setDraft({ ...EMPTY_DRAFT })
    setEditingId(null)
  }

  const closeForm = () => {
    setShowAddForm(false)
    resetDraft()
  }

  const filtered = useMemo(() => {
    const list = news.data ?? []
    const term = search.trim().toLowerCase()

    return list.filter((item: any) => {
      if (activeCategory && item.category !== activeCategory) return false
      if (!term) return true
      return (
        (item.title ?? '').toLowerCase().includes(term) ||
        (item.excerpt ?? '').toLowerCase().includes(term) ||
        (item.content ?? '').toLowerCase().includes(term)
      )
    })
  }, [news.data, search, activeCategory])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const item of news.data ?? []) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1)
    }
    return map
  }, [news.data])

  const total = news.data?.length ?? 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!draft.title.trim()) return toast.error("Le titre est obligatoire.")
    if (!draft.excerpt.trim() && !draft.content.trim()) {
      return toast.error("Renseignez au moins un résumé ou un contenu.")
    }

    const payload = {
      title: draft.title.trim(),
      excerpt: draft.excerpt.trim() || draft.content.trim().slice(0, 220),
      content: draft.content.trim() || null,
      category: draft.category,
      image: draft.image.trim() || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800',
      is_pinned: draft.is_pinned
    }

    try {
      if (isEditing) {
        await updateNews.mutateAsync({ id: editingId, ...payload })
        toast.success("Article mis à jour.")
      } else {
        await addNews.mutateAsync(payload)
        toast.success("Article publié !")
      }
      closeForm()
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'enregistrement.", { position: "bottom-center" })
    }
  }

  const handleEdit = (item: any) => {
    setEditingId(item.id)
    setDraft({
      title: item.title ?? '',
      excerpt: item.excerpt ?? '',
      content: item.content ?? '',
      category: item.category ?? 'Salle',
      image: item.image ?? '',
      is_pinned: item.is_pinned ?? false
    })
    setShowAddForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (item: any) => {
    confirm({
      title: 'Supprimer cet article',
      subject: item.title,
      message: 'L\'article et son image seront definitivement retires.',
      isPending: deleteNews.isPending,
      onConfirm: async () => {
        try {
          await deleteNews.mutateAsync(item.id)
          toast.success("Article supprimé.")
        } catch (err: any) {
          toast.error(err?.message || "Suppression impossible.", { position: "bottom-center" })
        }
      }
    })
  }

  const handlePin = async (item: any) => {
    try {
      await togglePin.mutateAsync({ id: item.id, is_pinned: !item.is_pinned })
      toast.success(item.is_pinned ? 'Article désépinglé.' : 'Article épinglé en tête de liste.')
    } catch {
      toast.error("Impossible de modifier l'épinglage.", { position: 'bottom-center' })
    }
  }

  const handleRead = (item: any) => {
    setSelectedArticle(item)
    registerView.mutate(item.id)
  }

  const handleImageUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      return toast.error("L'image est trop lourde. Limite : 2 Mo maximum.")
    }

    setIsUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `news/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('news')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('news').getPublicUrl(filePath)
      setDraft(d => ({ ...d, image: data.publicUrl }))
      toast.success("Image importée.", { position: "top-center" })
    } catch (err: any) {
      toast.error(err?.message || "Échec de l'importation.", { position: "top-center" })
    } finally {
      setIsUploading(false)
    }
  }

  const onboardingSteps: OnboardingStep[] = [
    {
      title: "Le Fil des Actualités",
      desc: "Découvrez en temps réel les dernières annonces de la salle, les concours, les promos flash et les tournois organisés par Evazion.",
      icon: <Newspaper size={28} />
    },
    {
      title: "Intronisation des Champions",
      desc: "C'est ici que sont officiellement proclamés les Joueurs du Mois et que sont affichées les affiches de victoires de l'Arène Ragnarok.",
      icon: <Rss size={28} />
    }
  ]

  const adminOnboardingSteps: AdminOnboardingStep[] = [
    {
      title: "Rédacteur du Sanctuaire",
      desc: "Utilisez 'Rédiger' pour publier, 'Éditer' pour corriger un article existant, l'épingle pour garder une annonce en tête de liste, et la corbeille pour supprimer.",
      icon: <Newspaper size={28} />
    }
  ]

  return (
    <div className="pt-20 md:pt-32 pb-12 md:pb-16 min-h-screen bg-background relative overflow-hidden animate-fade-in">
      <OnboardingModal pageKey="news" steps={onboardingSteps} />
      {isAdmin && <AdminOnboardingModal pageKey="news" steps={adminOnboardingSteps} />}
      {confirmDialog}

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/80 to-background z-10" />
        <img
          src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=1600"
          className="w-full h-full object-cover opacity-20"
          alt="news backdrop"
        />
      </div>

      <div className="container mx-auto px-4 max-w-6xl relative z-20">

        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-black uppercase tracking-tighter text-white">
            ACTUALITÉS <span className="text-secondary italic">GAMING</span>
          </h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-[0.3em] font-bold mt-3">
            Suivez le flux du Hub en temps réel
          </p>

          {isAdmin && (
            <NeonButton
              onClick={() => (showAddForm ? closeForm() : setShowAddForm(true))}
              size="md"
              sweep
              cornerAccents
              className="mt-6 mx-auto"
            >
              {showAddForm ? <X size={18} className="mr-2" /> : <Plus size={18} className="mr-2" />}
              {showAddForm ? "Annuler" : "Rédiger un article"}
            </NeonButton>
          )}
        </header>

        {isAdmin && showAddForm && (
          <CyberCard variant="violet" hoverEffect={false} className="mb-8 p-4 md:p-6 text-left">
            <div className="flex items-center justify-between gap-4 mb-5">
              <h2 className="text-base md:text-lg font-display uppercase text-primary">
                {isEditing ? `Modifier « ${draft.title || 'sans titre'} »` : 'Nouvel Article'}
              </h2>
              {isEditing && (
                <NeonButton variant="ghost" size="sm" onClick={closeForm} className="text-[9px]">
                  <X size={14} className="mr-1" /> Annuler la modification
                </NeonButton>
              )}
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                placeholder="Titre de l'article"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                value={draft.title}
                onChange={e => setDraft(d => ({ ...d, title: e.target.value }))}
              />

              <select
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                value={draft.category}
                onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
              >
                {NEWS_CATEGORIES.map(c => (
                  <option key={c} value={c} className="bg-background">{c}</option>
                ))}
              </select>

              <div className="col-span-1 md:col-span-2 space-y-2">
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    placeholder="URL de l'image"
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl p-3 text-white"
                    value={draft.image}
                    onChange={e => setDraft(d => ({ ...d, image: e.target.value }))}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) handleImageUpload(f)
                      e.target.value = ''
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:border-secondary rounded-xl py-2 px-4 text-white text-[11px] font-black uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? <Loader2 className="animate-spin" size={14} /> : <ImageIcon size={14} />}
                    {isUploading ? 'Import...' : 'Importer'}
                  </button>
                </div>
              </div>

              <textarea
                placeholder="Résumé affiché sur la carte (2 à 3 lignes)"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white h-20 resize-y"
                value={draft.excerpt}
                onChange={e => setDraft(d => ({ ...d, excerpt: e.target.value }))}
              />

              <textarea
                placeholder="Contenu complet de l'article"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white h-20 resize-y"
                value={draft.content}
                onChange={e => setDraft(d => ({ ...d, content: e.target.value }))}
              />

              <label className="col-span-1 md:col-span-2 flex items-center gap-3 cursor-pointer select-none bg-white/[0.02] border border-white/5 rounded-xl p-3 hover:border-white/15 transition-colors">
                <input
                  type="checkbox"
                  checked={draft.is_pinned}
                  onChange={e => setDraft(d => ({ ...d, is_pinned: e.target.checked }))}
                  className="w-4 h-4 accent-secondary"
                />
                <span className="text-[10px] uppercase font-black tracking-widest text-white/70">
                  Épingler en tête de liste
                </span>
              </label>

              <NeonButton
                disabled={addNews.isPending || updateNews.isPending || isUploading}
                className="col-span-1 md:col-span-2 py-3"
              >
                {(addNews.isPending || updateNews.isPending)
                  ? "Enregistrement..."
                  : isEditing ? "ENREGISTRER LES MODIFICATIONS" : "PUBLIER SUR LE HUB"}
              </NeonButton>
            </form>
          </CyberCard>
        )}

        {total > 0 && (
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher dans les actualités..."
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-3 text-[11px] text-white placeholder:text-white/25 focus:outline-none focus:border-secondary transition-colors"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setActiveCategory(null)}
                className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                  activeCategory === null
                    ? 'border-secondary bg-secondary/15 text-secondary'
                    : 'border-white/5 text-white/40 hover:text-white'
                }`}
              >
                Tout ({total})
              </button>
              {NEWS_CATEGORIES.filter(c => counts.get(c)).map(c => (
                <button
                  key={c}
                  onClick={() => setActiveCategory(activeCategory === c ? null : c)}
                  className={`px-2.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all cursor-pointer ${
                    activeCategory === c
                      ? 'border-secondary bg-secondary/15 text-secondary'
                      : 'border-white/5 text-white/40 hover:text-white'
                  }`}
                >
                  {c} ({counts.get(c)})
                </button>
              ))}
            </div>
          </div>
        )}

        {news.isLoading ? (
            <div className="flex justify-center py-14"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 md:gap-5">
            {filtered.map((item: any) => (
              <CyberCard
                key={item.id}
                variant="cyan"
                className={`p-0 flex flex-col aspect-square md:aspect-auto ${item.is_pinned ? 'border-secondary/60' : ''}`}
                headerBadge={item.is_pinned ? 'À la une' : undefined}
              >
                <div className="relative flex-1 min-h-0 md:flex-none md:aspect-[16/10] overflow-hidden bg-black/60">
                  <img
                    src={newsImage(item)}
                    alt={item.title}
                    className="w-full h-full object-contain md:object-cover scale-110 md:scale-100 group-hover:scale-110 transition-transform duration-700 opacity-70 group-hover:opacity-100"
                  />
                  <div className="absolute top-3 left-3 bg-secondary text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                    {item.category}
                  </div>

                  {isAdmin && (
                    <div className="absolute top-3 right-3 flex gap-1.5 z-30">
                      <button
                        onClick={() => handlePin(item)}
                        title={item.is_pinned ? 'Désépingler' : 'Épingler'}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          item.is_pinned
                            ? 'bg-secondary text-black'
                            : 'bg-black/60 text-white/70 hover:text-secondary border border-white/10'
                        }`}
                      >
                        {item.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
                      </button>
                      <button
                        onClick={() => handleEdit(item)}
                        className="p-1.5 rounded-lg bg-black/60 text-white/70 hover:text-secondary border border-white/10 transition-all cursor-pointer"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(item)}
                        className="p-1.5 rounded-lg bg-red-500 text-white hover:scale-110 transition-all cursor-pointer"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-2 md:p-5 flex-none md:flex-1 flex flex-col text-left">
                  <div className="flex items-center gap-2 text-[8px] md:text-[9px] uppercase font-bold text-muted-foreground mb-1 md:mb-2">
                    <span>{format(new Date(item.created_at), "d MMMM yyyy", { locale: fr })}</span>
                    {(item.view_count ?? 0) > 0 && (
                      <>
                        <span className="text-white/20">•</span>
                        <span className="flex items-center gap-1">
                          <Eye size={10} className="text-secondary" /> {item.view_count}
                        </span>
                      </>
                    )}
                  </div>

                  <h3 className="text-[10px] md:text-lg font-display font-black uppercase text-white mb-1 md:mb-2 leading-tight line-clamp-2 group-hover:text-secondary transition-colors">
                    {item.title}
                  </h3>

                  <p className="hidden text-[11px] text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                    {newsSummary(item)}
                  </p>

                  <div className="mt-auto pt-1.5 md:pt-3 border-t border-white/5">
                    <button
                      onClick={() => handleRead(item)}
                      className="text-[9px] font-black uppercase tracking-widest text-white hover:text-secondary transition-colors focus:outline-none cursor-pointer"
                    >
                      Lire l'article
                    </button>
                  </div>
                </div>
              </CyberCard>
            ))}
          </div>
        )}
      </div>

      {selectedArticle && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in text-left text-white font-display"
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedArticle(null) }}
        >
          <CyberCard
            variant="violet"
            hoverEffect={false}
            className="p-5 md:p-7 max-w-xl w-full flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
            topRight={
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors z-30 focus:outline-none cursor-pointer"
              >
                <X size={20} />
              </button>
            }
          >
            <div className="aspect-[16/10] sm:aspect-[16/9] w-full rounded-xl overflow-hidden relative border border-white/10 shrink-0">
              <img
                src={newsImage(selectedArticle)}
                alt={selectedArticle.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 bg-secondary text-black text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg">
                {selectedArticle.category}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-[9px] uppercase font-bold text-white/40">
                <span>{format(new Date(selectedArticle.created_at), "d MMMM yyyy", { locale: fr })}</span>
                <span className="text-white/20">•</span>
                <span className="flex items-center gap-1">
                  <Eye size={10} className="text-secondary" /> {selectedArticle.view_count || 1} lecture(s)
                </span>
              </div>
              <h3 className="text-lg md:text-2xl font-black uppercase text-white tracking-tight leading-tight">
                {selectedArticle.title}
              </h3>
            </div>

            {selectedArticle.excerpt && (
              <p className="text-[11px] sm:text-xs text-white/60 leading-relaxed border-l-2 border-primary/40 pl-3">
                {selectedArticle.excerpt}
              </p>
            )}

            <div className="text-[11px] sm:text-xs text-white/80 leading-relaxed font-medium whitespace-pre-line border-t border-white/5 pt-4">
              {selectedArticle.content || selectedArticle.excerpt}
            </div>

            <div className="border-t border-white/5 pt-4 shrink-0">
              <NeonButton
                variant="ghost"
                className="w-full py-3 text-[11px] font-black"
                onClick={() => setSelectedArticle(null)}
              >
                Retour aux actualités
              </NeonButton>
            </div>
          </CyberCard>
        </div>
      )}
    </div>
  )
}
