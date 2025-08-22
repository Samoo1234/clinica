import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log('Environment check:', {
  supabaseUrl,
  supabaseAnonKey: supabaseAnonKey ? '***' + supabaseAnonKey.slice(-10) : 'undefined',
  allEnv: import.meta.env
})

if (!supabaseUrl) {
  console.error('❌ Missing VITE_SUPABASE_URL environment variable')
  console.error('Available env vars:', Object.keys(import.meta.env))
  console.error('Please configure environment variables in Vercel dashboard')
  throw new Error('Missing VITE_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  console.error('❌ Missing VITE_SUPABASE_ANON_KEY environment variable')
  console.error('Available env vars:', Object.keys(import.meta.env))
  console.error('Please configure environment variables in Vercel dashboard')
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)