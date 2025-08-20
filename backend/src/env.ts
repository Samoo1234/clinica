// Carrega as variáveis de ambiente ANTES de qualquer outra coisa
import dotenv from 'dotenv'
dotenv.config()

// Exporta as variáveis para uso em outros arquivos
export const env = {
  SUPABASE_URL: process.env.VITE_SUPABASE_URL!,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
  SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY!,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001'),
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000'
}

// Valida se todas as variáveis necessárias estão definidas
const requiredVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_KEY', 
  'SUPABASE_ANON_KEY'
]

for (const varName of requiredVars) {
  if (!env[varName as keyof typeof env]) {
    throw new Error(`Variável de ambiente obrigatória não encontrada: ${varName}`)
  }
}

console.log('✅ Variáveis de ambiente carregadas com sucesso')