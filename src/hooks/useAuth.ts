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

  // 1. Vérification préventive d'unicité de pseudo (Gamer Name)
  const checkDisplayNameUniqueness = async (displayName: string) => {
    const { data: existingUser, error: checkError } = await supabase
      .from('users_metadata')
      .select('display_name')
      .eq('display_name', displayName)
      .maybeSingle()

    if (checkError) throw checkError
    if (existingUser) {
      throw new Error(`Le nom de gamer "${displayName}" est déjà utilisé. Veuillez en choisir un autre.`);
    }
  }

  // 2. Déclenchement de l'inscription avec transmission des métadonnées (display_name, etc.)
  const signUp = async (email: string, pass: string, metadata?: Record<string, any>) => {
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password: pass,
      options: {
        data: metadata
      }
    })
    if (error) throw error
    return data
  }

  // 3. Validation de l'OTP et création du profil final
  const verifyOtpAndCreateProfile = async (
    email: string,
    token: string,
    displayName: string,
    avatarUrl: string
  ) => {
    // Valider le code OTP auprès de Supabase
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'signup'
    })
    if (error) throw error

    // Une fois la session de l'utilisateur ouverte et validée, on écrit son profil
    if (data.user) {
      const { data: existingMeta } = await supabase
        .from('users_metadata')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (!existingMeta) {
        // Insérer le profil d'utilisateur
        const { error: metaErr } = await supabase.from('users_metadata').insert({
          user_id: data.user.id,
          display_name: displayName,
          avatar_url: avatarUrl,
          membership_type: 'standard'
        })
        if (metaErr) throw metaErr

        // Insérer la fiche de points de fidélité
        const { error: loyaltyErr } = await supabase.from('loyalty_points').insert({
          user_id: data.user.id,
          display_name: displayName,
          points: 0,
          total_hours: 0,
          total_minutes: 0,
          time_credit_minutes: 0
        })
        if (loyaltyErr) throw loyaltyErr
      }
    }
    return data
  }

  // 4. Renvoyer le code de validation
  const resendVerificationCode = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })
    if (error) throw error
  }

  const logout = () => supabase.auth.signOut()

  return { 
    user, 
    isLoading, 
    isAuthenticated: !!user, 
    login, 
    checkDisplayNameUniqueness,
    signUp, 
    verifyOtpAndCreateProfile,
    resendVerificationCode,
    logout 
  }
}