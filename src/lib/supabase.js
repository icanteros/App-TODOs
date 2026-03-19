import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Exportamos si faltan las variables para que App.jsx muestre un banner
export const missingEnvVars = !supabaseUrl || !supabaseAnonKey

export const supabase = missingEnvVars
  ? null
  : createClient(supabaseUrl, supabaseAnonKey)

