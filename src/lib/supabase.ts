import { createClient } from '@supabase/supabase-js'

// On force TypeScript à comprendre que ce sont des chaînes de caractères
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Vérification de sécurité pour le développeur
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "ERREUR : Les variables VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY sont manquantes dans .env.local. " +
    "Vérifie ton fichier et REDÉMARRE le terminal (npm run dev)."
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)