/**
 * Script para testar conexão com o Banco Central de Clientes
 * Execute: node test-banco-central.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuração do Banco Central
const SUPABASE_CENTRAL_URL = 'https://egyirufudbococcgdidj.supabase.co';
const SUPABASE_CENTRAL_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVneWlydWZ1ZGJvY29jY2dkaWRqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NzQ4OCwiZXhwIjoyMDc4MzYzNDg4fQ.DSMJvdPakYk9tfAxqxo_J5gSc-LISpcRHYaqjNeZmwA';

const supabase = createClient(SUPABASE_CENTRAL_URL, SUPABASE_CENTRAL_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

async function testarConexao() {
  console.log('🔄 Testando conexão com o Banco Central...\n');
  console.log('📍 URL:', SUPABASE_CENTRAL_URL);
  
  try {
    // 1. Testar se a tabela 'clientes' existe
    console.log('\n1️⃣ Verificando tabela "clientes"...');
    const { data: clientes, error: clientesError } = await supabase
      .from('clientes')
      .select('*')
      .limit(5);

    if (clientesError) {
      if (clientesError.code === '42P01') {
        console.log('❌ Tabela "clientes" NÃO EXISTE!');
        console.log('   → Você precisa criar a tabela no Supabase Central');
        await criarTabela();
      } else {
        console.log('❌ Erro ao acessar tabela:', clientesError.message);
      }
    } else {
      console.log('✅ Tabela "clientes" existe!');
      console.log(`   → ${clientes?.length || 0} clientes encontrados`);
      
      if (clientes && clientes.length > 0) {
        console.log('\n📋 Primeiros clientes:');
        clientes.forEach(c => {
          console.log(`   - ${c.nome} (${c.telefone}) ${c.cadastro_completo ? '✓ Completo' : '○ Parcial'}`);
        });
      }
    }

    // 2. Testar inserção
    console.log('\n2️⃣ Testando permissões de escrita...');
    const testData = {
      nome: 'Cliente Teste Automático',
      telefone: '99999999999',
      cadastro_completo: false,
      active: true
    };

    const { data: inserted, error: insertError } = await supabase
      .from('clientes')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.log('❌ Erro ao inserir:', insertError.message);
    } else {
      console.log('✅ Inserção funcionando!');
      console.log('   → Cliente teste criado com ID:', inserted.id);
      
      // Remover cliente teste
      await supabase.from('clientes').delete().eq('id', inserted.id);
      console.log('   → Cliente teste removido');
    }

    console.log('\n✅ CONEXÃO COM BANCO CENTRAL OK!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('O VisionCare está pronto para usar o Banco Central!');

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
}

async function criarTabela() {
  console.log('\n🔧 Criando tabela "clientes"...');
  
  // SQL para criar a tabela
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS clientes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      codigo VARCHAR(50),
      nome VARCHAR(255) NOT NULL,
      telefone VARCHAR(20) NOT NULL,
      cpf VARCHAR(14),
      rg VARCHAR(20),
      email VARCHAR(255),
      data_nascimento DATE,
      sexo VARCHAR(1),
      endereco JSONB DEFAULT '{}',
      cidade VARCHAR(100),
      nome_pai VARCHAR(255),
      nome_mae VARCHAR(255),
      foto_url TEXT,
      observacoes TEXT,
      erp_cliente_id VARCHAR(50),
      total_compras DECIMAL(10,2) DEFAULT 0,
      ultima_compra TIMESTAMP WITH TIME ZONE,
      cadastro_completo BOOLEAN DEFAULT false,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Índices para performance
    CREATE INDEX IF NOT EXISTS idx_clientes_cpf ON clientes(cpf);
    CREATE INDEX IF NOT EXISTS idx_clientes_telefone ON clientes(telefone);
    CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
    CREATE INDEX IF NOT EXISTS idx_clientes_active ON clientes(active);
  `;

  console.log('\n📝 Execute este SQL no Supabase Central (SQL Editor):');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(createTableSQL);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

// Executar
testarConexao();
