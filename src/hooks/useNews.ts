import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface NewsItem {
  id: string
  title: string
  excerpt: string
  content?: string
  category: string
  image: string
  is_pinned?: boolean
  view_count?: number
  created_at: string
}

export const NEWS_CATEGORIES = ['Salle', 'Compétition', 'Communauté', 'Tournois', 'Privilèges']

export function isRagnarok(item: any): boolean {
  const cat = (item?.category || '').toLowerCase()
  const title = (item?.title || '').toLowerCase()
  return cat.includes('ragnarok') || title.includes('ragnarok')
}

export function newsImage(item: any): string {
  if (isRagnarok(item)) {
    return 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800'
  }
  return item?.image || item?.image_url || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=800'
}

export function newsSummary(item: any): string {
  return item?.excerpt || item?.content?.slice(0, 160) || ''
}

export function useNews() {
  const queryClient = useQueryClient()

  const newsQuery = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []) as NewsItem[]
    }
  })

  const addNews = useMutation({
    mutationFn: async (payload: Partial<NewsItem>) => {
      const { data, error } = await supabase
        .from('news')
        .insert({ ...payload, view_count: 1 })
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  const updateNews = useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & Partial<NewsItem>) => {
      const { data, error } = await supabase.from('news').update(payload).eq('id', id)
      if (error) throw error
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  const togglePin = useMutation({
    mutationFn: async ({ id, is_pinned }: { id: string; is_pinned: boolean }) => {
      const { error } = await supabase.from('news').update({ is_pinned }).eq('id', id)
      if (error) throw error
      return { id, is_pinned }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  const registerView = useMutation({
    mutationFn: async (id: string) => {
      const item = newsQuery.data?.find((n) => n.id === id)
      const newCount = (item?.view_count || 0) + 1
      const { error } = await supabase.from('news').update({ view_count: newCount }).eq('id', id)
      if (error) throw error
      return { id, newCount }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  return {
    news: newsQuery,
    addNews,
    updateNews,
    deleteNews,
    togglePin,
    registerView,
    withSchema: true
  }
}
