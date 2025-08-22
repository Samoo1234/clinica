// Utilitário para verificar variáveis de ambiente
export const checkEnvironmentVariables = () => {
  const requiredVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
  }

  console.log('🔍 Verificando variáveis de ambiente:')
  console.log('Todas as variáveis disponíveis:', Object.keys(import.meta.env))
  
  Object.entries(requiredVars).forEach(([key, value]) => {
    if (value) {
      console.log(`✅ ${key}: ${value.substring(0, 20)}...`)
    } else {
      console.error(`❌ ${key}: NÃO ENCONTRADA`)
    }
  })

  const missing = Object.entries(requiredVars)
    .filter(([, value]) => !value)
    .map(([key]) => key)

  if (missing.length > 0) {
    console.error('\n🚨 VARIÁVEIS FALTANDO:')
    console.error('Configure na Vercel com os nomes:', missing)
    console.error('\n📋 INSTRUÇÕES:')
    console.error('1. Vá em Settings > Environment Variables')
    console.error('2. Adicione as variáveis com prefixo VITE_')
    console.error('3. Faça redeploy do projeto')
    return false
  }

  console.log('\n✅ Todas as variáveis estão configuradas!')
  return true
}

export const getSupabaseConfig = () => {
  const isConfigured = checkEnvironmentVariables()
  
  if (!isConfigured) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas')
  }

  return {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY
  }
}