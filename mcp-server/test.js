#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🧪 Testando conexão com Supabase...');
console.log('URL:', supabaseUrl ? '✅ Configurada' : '❌ Não encontrada');
console.log('Key:', supabaseKey ? '✅ Configurada' : '❌ Não encontrada');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Teste básico de conexão
    const { data, error } = await supabase
      .from('patients')
      .select('count')
      .limit(1);

    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      return false;
    }

    console.log('✅ Conexão com Supabase funcionando!');
    
    // Teste de contagem de pacientes
    const { count } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total de pacientes no banco: ${count || 0}`);
    
    return true;
  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 MCP Server pronto para uso!');
  } else {
    console.log('❌ Problemas na configuração');
  }
  process.exit(success ? 0 : 1);
});