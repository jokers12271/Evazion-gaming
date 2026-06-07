import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface NewsItem {
  id: string
  title: string
  excerpt: string
  category: string
  image: string
  created_at: string
}

export function useNews() {
  const queryClient = useQueryClient()

  // 1. Lire les news
  const news = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as NewsItem[]
    }
  })

  // 2. Ajouter une news
  const addNews = useMutation({
    mutationFn: async (newItem: Omit<NewsItem, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('news').insert([newItem])
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  // 3. Supprimer une news
  const deleteNews = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('news').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['news'] })
  })

  return { news, addNews, deleteNews }
}