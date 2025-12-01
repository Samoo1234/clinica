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
  console.error(
    '⚠️ Variáveis de ambiente do Supabase Central não encontradas. ' +
    'Verifique se VITE_SUPABASE_CENTRAL_URL e VITE_SUPABASE_CENTRAL_ANON_KEY estão definidas no arquivo .env'
  )
}

export const supabaseCentral = createClient(
  supabaseCentralUrl || '', 
  supabaseCentralAnonKey || '', 
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false // Desabilitar para evitar conflito com o supabase local
    }
  }
)

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

// Interface para criar cliente (pode ser completo ou parcial)
export interface CriarClienteCentralDTO {
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
  observacoes?: string;
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
    console.error('Erro ao buscar cliente por telefone:', error);
    throw error;
  }

  return data;
};

// Buscar cliente por CPF
export const buscarClientePorCPF = async (cpf: string): Promise<ClienteCentral | null> => {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .eq('cpf', cpfLimpo)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar cliente por CPF:', error);
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

// Criar cliente (pode ser parcial ou completo)
export const criarClienteCentral = async (dados: CriarClienteCentralDTO): Promise<ClienteCentral> => {
  const clienteData: any = {
    nome: dados.nome,
    telefone: dados.telefone.replace(/\D/g, ''), // Limpar telefone
    cadastro_completo: dados.cadastro_completo ?? false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Adicionar campos opcionais se fornecidos
  if (dados.cpf) clienteData.cpf = dados.cpf.replace(/\D/g, '');
  if (dados.rg) clienteData.rg = dados.rg;
  if (dados.email) clienteData.email = dados.email;
  if (dados.data_nascimento) clienteData.data_nascimento = dados.data_nascimento;
  if (dados.sexo) clienteData.sexo = dados.sexo;
  if (dados.endereco) clienteData.endereco = dados.endereco;
  if (dados.cidade) clienteData.cidade = dados.cidade;
  if (dados.nome_pai) clienteData.nome_pai = dados.nome_pai;
  if (dados.nome_mae) clienteData.nome_mae = dados.nome_mae;
  if (dados.observacoes) clienteData.observacoes = dados.observacoes;

  const { data, error } = await supabaseCentral
    .from('clientes')
    .insert([clienteData])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar cliente central:', error);
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

// Listar todos os clientes (com paginação)
export const listarClientesCentral = async (options?: {
  limit?: number;
  offset?: number;
  search?: string;
  orderBy?: string;
  orderAsc?: boolean;
}): Promise<{ data: ClienteCentral[]; total: number }> => {
  const { limit = 50, offset = 0, search, orderBy = 'nome', orderAsc = true } = options || {};
  
  let query = supabaseCentral
    .from('clientes')
    .select('*', { count: 'exact' })
    .eq('active', true);

  // Busca por nome, telefone ou CPF
  if (search) {
    const searchLimpo = search.replace(/\D/g, '');
    query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${searchLimpo}%,cpf.ilike.%${searchLimpo}%`);
  }

  query = query
    .order(orderBy, { ascending: orderAsc })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Erro ao listar clientes centrais:', error);
    throw error;
  }

  return { data: data || [], total: count || 0 };
};

// Desativar cliente (soft delete)
export const desativarClienteCentral = async (id: string): Promise<void> => {
  const { error } = await supabaseCentral
    .from('clientes')
    .update({ active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao desativar cliente central:', error);
    throw error;
  }
};

// Excluir cliente (hard delete - usar com cuidado!)
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
