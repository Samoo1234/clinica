// Script para debugar variáveis de ambiente na Vercel
console.log('🔍 DEBUGGING VERCEL ENVIRONMENT VARIABLES');
console.log('='.repeat(50));

// Verificar variáveis do frontend (VITE_)
console.log('📱 FRONTEND VARIABLES (VITE_):');
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ FOUND' : '❌ MISSING');
console.log('VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ FOUND' : '❌ MISSING');

// Verificar variáveis do backend
console.log('\n🔧 BACKEND VARIABLES:');
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ FOUND' : '❌ MISSING');
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ FOUND' : '❌ MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ FOUND' : '❌ MISSING');

// Listar todas as variáveis disponíveis
console.log('\n📋 ALL AVAILABLE ENVIRONMENT VARIABLES:');
const envVars = Object.keys(process.env).filter(key => 
  key.includes('SUPABASE') || key.includes('VITE')
);
envVars.forEach(key => {
  console.log(`${key}: ${process.env[key] ? 'SET' : 'NOT SET'}`);
});

if (envVars.length === 0) {
  console.log('❌ NO SUPABASE OR VITE VARIABLES FOUND!');
}

console.log('\n🎯 NEXT STEPS:');
console.log('1. Go to Vercel Dashboard');
console.log('2. Settings > Environment Variables');
console.log('3. Add these variables:');
console.log('   - VITE_SUPABASE_URL');
console.log('   - VITE_SUPABASE_ANON_KEY');
console.log('   - SUPABASE_URL');
console.log('   - SUPABASE_ANON_KEY');
console.log('   - SUPABASE_SERVICE_ROLE_KEY');
console.log('4. Redeploy the application');