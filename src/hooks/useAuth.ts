import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { User } from '@supabase/supabase-js'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setIsLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) throw error
    return data
  }

  // --- INSCRIPTION MISE À JOUR (Avec vérification préventive d'unicité de pseudo) ---
  const signUp = async (email: string, pass: string, displayName: string, avatarUrl: string) => {
    // 1. Vérifier en amont si le nom de gamer est disponible
    const { data: existingUser, error: checkError } = await supabase
      .from('users_metadata')
      .select('display_name')
      .eq('display_name', displayName)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existingUser) {
      throw new Error(`Le nom de gamer "${displayName}" est déjà utilisé. Veuillez en choisir un autre.`);
    }

    // 2. Si le pseudo est libre, procéder à la création du compte d'authentification
    const { data, error } = await supabase.auth.signUp({ email, password: pass })
    
    if (error) throw error
    
    if (data.user) {
      // 3. Créer le profil avec l'avatar
      const { error: metaErr } = await supabase.from('users_metadata').insert({
        user_id: data.user.id,
        display_name: displayName,
        avatar_url: avatarUrl, // On enregistre l'image ici
        membership_type: 'standard'
      })
      if (metaErr) throw metaErr

      // 4. Créer l'entrée fidélité
      const { error: loyaltyErr } = await supabase.from('loyalty_points').insert({
        user_id: data.user.id,
        display_name: displayName,
        points: 0
      })
      if (loyaltyErr) throw loyaltyErr
    }
    return data
  }

  const logout = () => supabase.auth.signOut()

  return { user, isLoading, isAuthenticated: !!user, login, signUp, logout }
}