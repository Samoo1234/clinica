import { createClient } from '@supabase/supabase-js'
import { env } from '../env'

console.log('🔧 Configurando clientes Supabase...')

// Cliente com role de serviço para operações administrativas (Supabase principal)
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Cliente regular para operações de usuário (Supabase principal)
export const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY)

// Cliente com role de serviço para Supabase externo (integração)
export const supabaseExternoAdmin = env.SUPABASE_EXTERNO_URL && env.SUPABASE_EXTERNO_SERVICE_KEY
  ? createClient(env.SUPABASE_EXTERNO_URL, env.SUPABASE_EXTERNO_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null

console.log('✅ Clientes Supabase configurados com sucesso')
if (supabaseExternoAdmin) {
  console.log('✅ Cliente Supabase Externo configurado')
}