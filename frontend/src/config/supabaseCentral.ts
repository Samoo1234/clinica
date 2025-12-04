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
// NOTA: Telefone pode ter duplicatas, então usa limit(1) em vez de maybeSingle
export const buscarClientePorTelefone = async (telefone: string): Promise<ClienteCentral | null> => {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .eq('telefone', telefoneLimpo)
    .order('created_at', { ascending: false }) // Pega o mais recente em caso de duplicatas
    .limit(1);

  if (error) {
    console.error('Erro ao buscar cliente por telefone:', error);
    throw error;
  }

  return data && data.length > 0 ? data[0] : null;
};

// Buscar cliente por telefone E nome (mais preciso para evitar duplicatas)
export const buscarClientePorTelefoneENome = async (telefone: string, nome: string): Promise<ClienteCentral | null> => {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  const nomeLimpo = nome.trim().toLowerCase();
  
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .eq('telefone', telefoneLimpo);

  if (error) {
    console.error('Erro ao buscar cliente por telefone e nome:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Se só tem um resultado, retorna ele
  if (data.length === 1) {
    return data[0];
  }

  // Se tem múltiplos, busca o que tem nome mais similar
  const clienteExato = data.find(c => c.nome.toLowerCase() === nomeLimpo);
  if (clienteExato) {
    return clienteExato;
  }

  // Busca por nome parcial (contém)
  const clienteParcial = data.find(c => 
    c.nome.toLowerCase().includes(nomeLimpo) || 
    nomeLimpo.includes(c.nome.toLowerCase())
  );
  if (clienteParcial) {
    return clienteParcial;
  }

  // Se não encontrou match por nome, retorna o mais recente
  console.warn(`⚠️ Múltiplos clientes com telefone ${telefoneLimpo}, nenhum com nome "${nome}". Usando o mais recente.`);
  return data.sort((a, b) => 
    new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  )[0];
};

// Buscar cliente por código (ex: SJM-0002)
export const buscarClientePorCodigo = async (codigo: string): Promise<ClienteCentral | null> => {
  const { data, error } = await supabaseCentral
    .from('clientes')
    .select('*')
    .eq('codigo', codigo)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar cliente por código:', error);
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
// Verifica duplicatas por CPF ou telefone antes de criar
export const criarClienteCentral = async (dados: CriarClienteCentralDTO): Promise<ClienteCentral> => {
  const telefoneLimpo = dados.telefone.replace(/\D/g, '');
  const cpfLimpo = dados.cpf?.replace(/\D/g, '');

  // Verificar se já existe cliente com este CPF
  if (cpfLimpo) {
    const clienteExistenteCPF = await buscarClientePorCPF(cpfLimpo);
    if (clienteExistenteCPF) {
      console.log('Cliente já existe com este CPF, atualizando...', clienteExistenteCPF.id);
      return atualizarClienteCentral(clienteExistenteCPF.id, {
        nome: dados.nome,
        telefone: telefoneLimpo,
        cpf: cpfLimpo,
        rg: dados.rg,
        email: dados.email,
        data_nascimento: dados.data_nascimento,
        sexo: dados.sexo,
        endereco: dados.endereco,
        cidade: dados.cidade,
        nome_pai: dados.nome_pai,
        nome_mae: dados.nome_mae,
        observacoes: dados.observacoes,
        cadastro_completo: dados.cadastro_completo
      });
    }
  }

  // Verificar se já existe cliente com este telefone
  const clienteExistenteTelefone = await buscarClientePorTelefone(telefoneLimpo);
  if (clienteExistenteTelefone) {
    console.log('Cliente já existe com este telefone, atualizando...', clienteExistenteTelefone.id);
    return atualizarClienteCentral(clienteExistenteTelefone.id, {
      nome: dados.nome,
      telefone: telefoneLimpo,
      cpf: cpfLimpo,
      rg: dados.rg,
      email: dados.email,
      data_nascimento: dados.data_nascimento,
      sexo: dados.sexo,
      endereco: dados.endereco,
      cidade: dados.cidade,
      nome_pai: dados.nome_pai,
      nome_mae: dados.nome_mae,
      observacoes: dados.observacoes,
      cadastro_completo: dados.cadastro_completo
    });
  }

  // Cliente não existe, criar novo
  const clienteData: any = {
    nome: dados.nome,
    telefone: telefoneLimpo,
    cadastro_completo: dados.cadastro_completo ?? false,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Adicionar campos opcionais se fornecidos
  if (cpfLimpo) clienteData.cpf = cpfLimpo;
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

// ========================================
// PRONTUÁRIOS MÉDICOS (medical_records)
// ========================================

// Interface do prontuário médico
export interface ProntuarioMedico {
  id: string;
  patient_id: string;
  doctor_id: string;
  consultation_date: string;
  chief_complaint?: string;       // Queixa principal
  anamnesis?: string;             // Anamnese
  physical_exam?: {               // Exame oftalmológico
    acuidadeOD?: string;
    acuidadeOE?: string;
    acuidadeAO?: string;
    pressaoOD?: number;
    pressaoOE?: number;
    refracaoOD?: {
      esferico?: string;
      cilindrico?: string;
      eixo?: number;
      adicao?: string;
      dnp?: number;
    };
    refracaoOE?: {
      esferico?: string;
      cilindrico?: string;
      eixo?: number;
      adicao?: string;
      dnp?: number;
    };
    biomicroscopia?: string;
    fundoscopia?: string;
    motilidadeOcular?: string;
    reflexosPupilares?: string;
  };
  diagnosis?: string;
  prescription?: string;
  follow_up_date?: string;
  created_at?: string;
  updated_at?: string;
}

// Interface para criar prontuário
export interface CriarProntuarioDTO {
  patient_id: string;
  doctor_id: string;
  consultation_date?: string;
  chief_complaint?: string;
  anamnesis?: string;
  physical_exam?: ProntuarioMedico['physical_exam'];
  diagnosis?: string;
  prescription?: string;
  follow_up_date?: string;
}

// Criar prontuário médico
export const criarProntuario = async (dados: CriarProntuarioDTO): Promise<ProntuarioMedico> => {
  const { data, error } = await supabaseCentral
    .from('medical_records')
    .insert({
      ...dados,
      consultation_date: dados.consultation_date || new Date().toISOString().split('T')[0]
    })
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar prontuário:', error);
    throw error;
  }

  return data;
};

// Atualizar prontuário médico
export const atualizarProntuario = async (id: string, dados: Partial<CriarProntuarioDTO>): Promise<ProntuarioMedico> => {
  const { data, error } = await supabaseCentral
    .from('medical_records')
    .update({
      ...dados,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erro ao atualizar prontuário:', error);
    throw error;
  }

  return data;
};

// Buscar prontuário por ID
export const buscarProntuarioPorId = async (id: string): Promise<ProntuarioMedico | null> => {
  const { data, error } = await supabaseCentral
    .from('medical_records')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('Erro ao buscar prontuário:', error);
    throw error;
  }

  return data;
};

// Buscar prontuários do paciente
export const buscarProntuariosPaciente = async (patientId: string): Promise<ProntuarioMedico[]> => {
  const { data, error } = await supabaseCentral
    .from('medical_records')
    .select('*')
    .eq('patient_id', patientId)
    .order('consultation_date', { ascending: false });

  if (error) {
    console.error('Erro ao buscar prontuários do paciente:', error);
    throw error;
  }

  return data || [];
};

// Buscar prontuários por data
export const buscarProntuariosPorData = async (data: string): Promise<ProntuarioMedico[]> => {
  const { data: prontuarios, error } = await supabaseCentral
    .from('medical_records')
    .select('*')
    .eq('consultation_date', data)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar prontuários por data:', error);
    throw error;
  }

  return prontuarios || [];
};

export default supabaseCentral
