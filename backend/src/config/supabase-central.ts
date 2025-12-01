/**
 * Cliente Supabase para o Banco Central de Clientes
 * Compartilhado entre: Agendamento, Clínica (VisionCare) e ERP
 */

import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

// Cliente com service_role_key (privilegiado - bypass RLS)
export const supabaseCentralAdmin = createClient(
  env.SUPABASE_CENTRAL_URL || 'https://egyirufudbococcgdidj.supabase.co',
  env.SUPABASE_CENTRAL_SERVICE_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

// Cliente com anon key (para uso no frontend via API)
export const supabaseCentralAnon = createClient(
  env.SUPABASE_CENTRAL_URL || 'https://egyirufudbococcgdidj.supabase.co',
  env.SUPABASE_CENTRAL_ANON_KEY || '',
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

console.log('✅ Cliente Supabase Central configurado')










