import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from '../utils/env-check';

const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();

export const supabase = createClient(supabaseUrl, supabaseAnonKey);