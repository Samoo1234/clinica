// Script para verificar variáveis de ambiente
console.log('=== VERIFICAÇÃO DE VARIÁVEIS DE AMBIENTE ===')
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL ? '✅ OK' : '❌ NÃO ENCONTRADA')
console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ OK' : '❌ NÃO ENCONTRADA')
console.log('VITE_SUPABASE_EXTERNO_URL:', import.meta.env.VITE_SUPABASE_EXTERNO_URL ? '✅ OK' : '❌ NÃO ENCONTRADA')
console.log('VITE_SUPABASE_EXTERNO_ANON_KEY:', import.meta.env.VITE_SUPABASE_EXTERNO_ANON_KEY ? '✅ OK' : '❌ NÃO ENCONTRADA')
console.log('==========================================')
