// Script para verificar variáveis de ambiente
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Carregar .env
config({ path: join(__dirname, '.env') })

console.log('🔍 Verificando variáveis de ambiente...\n')

const vars = {
  'VITE_SUPABASE_URL': process.env.VITE_SUPABASE_URL,
  'VITE_SUPABASE_ANON_KEY': process.env.VITE_SUPABASE_ANON_KEY,
  'VITE_SUPABASE_EXTERNO_URL': process.env.VITE_SUPABASE_EXTERNO_URL,
  'VITE_SUPABASE_EXTERNO_ANON_KEY': process.env.VITE_SUPABASE_EXTERNO_ANON_KEY,
}

let hasErrors = false

for (const [key, value] of Object.entries(vars)) {
  if (value) {
    console.log(`✅ ${key}: ${value.substring(0, 30)}...`)
  } else {
    console.log(`❌ ${key}: NÃO ENCONTRADA`)
    hasErrors = true
  }
}

console.log('\n' + '='.repeat(50))

if (hasErrors) {
  console.log('❌ ERRO: Algumas variáveis não foram encontradas!')
  console.log('\nVerifique se o arquivo .env existe em:')
  console.log(join(__dirname, '.env'))
  console.log('\nE contém todas as variáveis necessárias.')
} else {
  console.log('✅ Todas as variáveis estão configuradas!')
  console.log('\nSe ainda tiver erro, reinicie o servidor:')
  console.log('1. Ctrl+C para parar')
  console.log('2. npm run dev para iniciar')
}
