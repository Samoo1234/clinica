import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'
import { getSupabaseConfig } from '../utils/env-check'

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig()

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)