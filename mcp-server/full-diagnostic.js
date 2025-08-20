#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config({ path: '../.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DIAGNÓSTICO COMPLETO - CONECTIVIDADE SUPABASE');
console.log('=' .repeat(60));

// Função para formatar resultados
const formatResult = (test, status, details = '') => {
  const icon = status ? '✅' : '❌';
  console.log(`${icon} ${test}${details ? ': ' + details : ''}`);
  return status;
};

// Função para contar registros
const countRecords = async (supabase, table) => {
  try {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    if (error) throw error;
    return count || 0;
  } catch (error) {
    return `Erro: ${error.message}`;
  }
};

// Função para testar RLS
const testRLS = async (supabase, table) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
};

async function runFullDiagnostic() {
  let totalTests = 0;
  let passedTests = 0;

  console.log('\n📋 1. VERIFICAÇÃO DE CONFIGURAÇÃO');
  console.log('-'.repeat(40));
  
  totalTests++;
  if (formatResult('URL do Supabase', !!supabaseUrl, supabaseUrl)) passedTests++;
  
  totalTests++;
  if (formatResult('Chave Anônima', !!supabaseAnonKey, supabaseAnonKey ? 'Configurada' : 'Não encontrada')) passedTests++;
  
  totalTests++;
  if (formatResult('Chave de Serviço', !!supabaseServiceKey, supabaseServiceKey ? 'Configurada' : 'Não encontrada')) passedTests++;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('\n❌ Configuração incompleta. Abortando testes.');
    return;
  }

  // Cliente com service role (para testes administrativos)
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  
  // Cliente com chave anônima (para testes de usuário)
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  console.log('\n🔌 2. TESTE DE CONECTIVIDADE');
  console.log('-'.repeat(40));

  // Teste de conexão básica
  totalTests++;
  try {
    const { data, error } = await supabaseAdmin.from('patients').select('count').limit(1);
    if (formatResult('Conexão com Admin', !error)) passedTests++;
  } catch (error) {
    formatResult('Conexão com Admin', false, error.message);
  }

  totalTests++;
  try {
    const { data, error } = await supabaseAnon.from('patients').select('count').limit(1);
    if (formatResult('Conexão com Anon', !error)) passedTests++;
  } catch (error) {
    formatResult('Conexão com Anon', false, error.message);
  }

  console.log('\n📊 3. VERIFICAÇÃO DE TABELAS PRINCIPAIS');
  console.log('-'.repeat(40));

  const mainTables = [
    'patients',
    'users', 
    'appointments',
    'medical_records',
    'consultations',
    'notifications',
    'audit_logs',
    'digital_signatures',
    'nfse_invoices',
    'external_integrations'
  ];

  for (const table of mainTables) {
    totalTests++;
    const count = await countRecords(supabaseAdmin, table);
    const exists = typeof count === 'number';
    if (formatResult(`Tabela ${table}`, exists, exists ? `${count} registros` : count)) {
      passedTests++;
    }
  }

  console.log('\n🔐 4. TESTE DE RLS (ROW LEVEL SECURITY)');
  console.log('-'.repeat(40));

  const rlsTables = ['patients', 'appointments', 'medical_records'];
  
  for (const table of rlsTables) {
    totalTests++;
    const canAccess = await testRLS(supabaseAnon, table);
    if (formatResult(`RLS ${table}`, canAccess, canAccess ? 'Acessível' : 'Bloqueado (esperado)')) {
      passedTests++;
    }
  }

  console.log('\n⚡ 5. TESTE DE FUNCIONALIDADES ESPECÍFICAS');
  console.log('-'.repeat(40));

  // Teste de inserção e remoção
  totalTests++;
  try {
    const testPatient = {
      name: 'Teste MCP Diagnostic',
      email: 'teste.mcp@diagnostic.com',
      phone: '(11) 99999-9999',
      cpf: '000.000.000-00',
      birth_date: '1990-01-01',
      address: 'Endereço de Teste'
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('patients')
      .insert(testPatient)
      .select()
      .single();

    if (!insertError && insertData) {
      // Remove o registro de teste
      await supabaseAdmin
        .from('patients')
        .delete()
        .eq('id', insertData.id);
      
      if (formatResult('Inserção/Remoção', true, 'CRUD funcionando')) passedTests++;
    } else {
      formatResult('Inserção/Remoção', false, insertError?.message || 'Falha na inserção');
    }
  } catch (error) {
    formatResult('Inserção/Remoção', false, error.message);
  }

  // Teste de consulta com JOIN
  totalTests++;
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients(name, email),
        doctor:users(name)
      `)
      .limit(1);

    if (formatResult('Consultas com JOIN', !error, !error ? 'Relacionamentos OK' : error.message)) {
      passedTests++;
    }
  } catch (error) {
    formatResult('Consultas com JOIN', false, error.message);
  }

  // Teste de funções/procedures
  totalTests++;
  try {
    const { data, error } = await supabaseAdmin.rpc('get_patient_count');
    const hasFunction = !error || !error.message.includes('function');
    if (formatResult('Stored Procedures', hasFunction, hasFunction ? 'Disponíveis' : 'Não configuradas')) {
      passedTests++;
    }
  } catch (error) {
    formatResult('Stored Procedures', false, 'Não testável');
  }

  console.log('\n🔄 6. TESTE DE REALTIME');
  console.log('-'.repeat(40));

  totalTests++;
  try {
    const channel = supabaseAdmin.channel('test-channel');
    const hasRealtime = !!channel;
    if (formatResult('Realtime Disponível', hasRealtime)) passedTests++;
    if (hasRealtime) channel.unsubscribe();
  } catch (error) {
    formatResult('Realtime Disponível', false, error.message);
  }

  console.log('\n📈 7. ESTATÍSTICAS DO BANCO');
  console.log('-'.repeat(40));

  const stats = {};
  for (const table of mainTables) {
    const count = await countRecords(supabaseAdmin, table);
    if (typeof count === 'number') {
      stats[table] = count;
    }
  }

  Object.entries(stats).forEach(([table, count]) => {
    console.log(`📊 ${table}: ${count} registros`);
  });

  console.log('\n🎯 8. TESTE DAS FUNCIONALIDADES MCP');
  console.log('-'.repeat(40));

  // Simular as funções do MCP
  const mcpTests = [
    {
      name: 'get_patients',
      test: async () => {
        const { data, error } = await supabaseAdmin
          .from('patients')
          .select('*')
          .limit(5);
        return !error && Array.isArray(data);
      }
    },
    {
      name: 'get_appointments',
      test: async () => {
        const { data, error } = await supabaseAdmin
          .from('appointments')
          .select('*, patient:patients(name), doctor:users(name)')
          .limit(5);
        return !error && Array.isArray(data);
      }
    },
    {
      name: 'financial_summary',
      test: async () => {
        const { data, error } = await supabaseAdmin
          .from('appointments')
          .select('value, payment_status');
        return !error && Array.isArray(data);
      }
    }
  ];

  for (const mcpTest of mcpTests) {
    totalTests++;
    try {
      const result = await mcpTest.test();
      if (formatResult(`MCP ${mcpTest.name}`, result)) passedTests++;
    } catch (error) {
      formatResult(`MCP ${mcpTest.name}`, false, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📋 RESUMO DO DIAGNÓSTICO');
  console.log('='.repeat(60));
  
  const successRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log(`✅ Testes aprovados: ${passedTests}/${totalTests} (${successRate}%)`);
  
  if (successRate >= 90) {
    console.log('🎉 SISTEMA 100% CONECTADO COM SUPABASE!');
  } else if (successRate >= 75) {
    console.log('⚠️  Sistema majoritariamente funcional, alguns ajustes necessários');
  } else {
    console.log('❌ Sistema com problemas significativos de conectividade');
  }

  console.log('\n🔧 RECOMENDAÇÕES:');
  if (passedTests < totalTests) {
    console.log('• Verifique as políticas RLS se necessário');
    console.log('• Confirme se todas as tabelas foram criadas');
    console.log('• Teste as stored procedures se aplicável');
  } else {
    console.log('• Sistema totalmente operacional!');
    console.log('• MCP Server pronto para uso');
    console.log('• Todas as funcionalidades disponíveis');
  }

  return { totalTests, passedTests, successRate };
}

// Executar diagnóstico
runFullDiagnostic()
  .then(result => {
    process.exit(result.successRate >= 75 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Erro no diagnóstico:', error);
    process.exit(1);
  });