require('dotenv').config()

console.log('Testando variáveis de ambiente:')
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'DEFINIDA' : 'NÃO DEFINIDA')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA')
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'DEFINIDA' : 'NÃO DEFINIDA')

if (process.env.VITE_SUPABASE_URL) {
  console.log('URL completa:', process.env.VITE_SUPABASE_URL)
}