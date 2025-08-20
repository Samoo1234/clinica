import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

console.log('🔧 Configurando clientes Supabase...')

// Cliente com role de serviço para operações administrativas
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cliente regular para operações de usuário
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

console.log('✅ Clientes Supabase configurados com sucesso')