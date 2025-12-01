import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase para o banco de dados CENTRAL de clientes
 * Este banco é compartilhado entre os 3 sistemas:
 * - Agendamento (gestão ótica) - cria cliente com dados mínimos (nome, telefone)
 * - VisionCare - completa cadastro do cliente
 * - ERP - consome dados dos clientes
 */

const supabaseCentralUrl = import.meta.env.VITE_SUPABASE_CENTRAL_URL
const supabaseCentralAnonKey = import.meta.env.VITE_SUPABASE_CENTRAL_ANON_KEY

if (!supabaseCentralUrl || !supabaseCentralAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase Central não encontradas. ' +
    'Verifique se VITE_SUPABASE_CENTRAL_URL e VITE_SUPABASE_CENTRAL_ANON_KEY estão definidas no arquivo .env'
  )
}

export const supabaseCentral = createClient(supabaseCentralUrl, supabaseCentralAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false // Desabilitar para evitar conflito com o supabase local
  }
})

// Interface do cliente central
export interface ClienteCentral {
  id: string;
  codigo?: string;
  nome: string;
  telefone: string;
  cpf?: string;
  rg?: string;
  email?: string;
  data_nascimento?: string;
  sexo?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    complemento?: string;
  };
  cidade?: string;
  nome_pai?: string;
  nome_mae?: string;
  foto_url?: string;
  observacoes?: string;
  erp_cliente_id?: string;
  total_compras?: number;
  ultima_compra?: string;
  cadastro_completo: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

// Interface para criar cliente (dados mínimos do agendamento)
export interface CriarClienteCentralDTO {
  nome: string;
  telefone: string;
  cidade?: string;
  cadastro_completo?: boolean;
}

// Interface para atualizar cliente
export interface AtualizarClienteCentralDTO {
  nome?: string;
  telefone?: string;
  cpf?: string;
  rg?: string;
  email?: string;
  data_nascimento?: string;
  sexo?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
    complemento?: string;
  };
  cidade?: string;
  nome_pai?: string;
  nome_mae?: string;
  foto_url?: string;
  observacoes?: string;
  cadastro_completo?: boolean;
}

/**
 * Funções helper para operações com clientes centrais
 */

// Buscar cliente por telefone
export const buscarClientePorTelefone = async (telefone: string): Promise<ClienteCentral | null> => {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .eq('telefone', telefoneLimpo)
    .maybeSingle(); // maybeSingle não lança erro se não encontrar

  if (error) {
    throw error;
  }

  return data;
};

// Buscar cliente por ID
export const buscarClientePorId = async (id: string): Promise<ClienteCentral | null> => {
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Erro ao buscar cliente por ID:', error);
    throw error;
  }

  return data;
};

// Criar cliente (cadastro mínimo)
export const criarClienteCentral = async (dados: CriarClienteCentralDTO): Promise<ClienteCentral> => {
  const clienteData = {
    nome: dados.nome,
    telefone: dados.telefone.replace(/\D/g, ''), // Limpar telefone
    cidade: dados.cidade || null,
    cadastro_completo: dados.cadastro_completo ?? false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabaseCentral
    .from('clientes')
    .insert([clienteData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// Atualizar cliente
export const atualizarClienteCentral = async (id: string, dados: AtualizarClienteCentralDTO): Promise<ClienteCentral> => {
  const { data, error } = await supabaseCentral
    .from('clientes')
    .update({
      ...dados,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar cliente central:', error);
    throw error;
  }

  return data;
};

// Listar todos os clientes
export const listarClientesCentral = async (): Promise<ClienteCentral[]> => {
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    console.error('Erro ao listar clientes centrais:', error);
    throw error;
  }

  return data || [];
};

// Excluir cliente
export const excluirClienteCentral = async (id: string): Promise<void> => {
  const { error } = await supabaseCentral
    .from('clientes')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir cliente central:', error);
    throw error;
  }
};

// Gerar código único do cliente baseado na cidade
export const gerarCodigoCliente = async (cidade: string): Promise<string> => {
  // Mapeamento de cidades para iniciais
  const cidadeParaIniciais: { [key: string]: string } = {
    'Mantena': 'MAN',
    'Mantenópolis': 'MTP',
    'Central de Minas': 'CDM',
    'Alto Rio Novo': 'ARN',
    'São João do Manteninha': 'SJM'
  };

  const iniciaisCidade = cidadeParaIniciais[cidade] || 'CLI';

  // Buscar o último código da cidade para incrementar
  const { data: ultimoCliente, error } = await supabaseCentral
    .from('clientes')
    .select('codigo')
    .like('codigo', `${iniciaisCidade}-%`)
    .order('codigo', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Erro ao buscar último código:', error);
    throw error;
  }

  let numeroSequencial = 1;
  if (ultimoCliente && ultimoCliente.length > 0 && ultimoCliente[0].codigo) {
    const ultimoCodigo = ultimoCliente[0].codigo;
    if (ultimoCodigo.includes('-')) {
      const ultimoNumero = parseInt(ultimoCodigo.split('-')[1]);
      if (!isNaN(ultimoNumero)) {
        numeroSequencial = ultimoNumero + 1;
      }
    }
  }

  return `${iniciaisCidade}-${numeroSequencial.toString().padStart(4, '0')}`;
};

export default supabaseCentral
