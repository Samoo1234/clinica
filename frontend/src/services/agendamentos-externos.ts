/**
 * Serviço para integração com agendamentos do projeto externo
 * Projeto: dmsaqxuoruinwpnonpky (Sistema de Clínica)
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { parseDateFromDB, getLocalDateString } from '../utils/date'

// Configuração do cliente Supabase para o projeto externo
const SUPABASE_EXTERNO_URL = import.meta.env.VITE_SUPABASE_EXTERNO_URL || 'https://dmsaqxuoruinwpnonpky.supabase.co'
const SUPABASE_EXTERNO_KEY = import.meta.env.VITE_SUPABASE_EXTERNO_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRtc2FxeHVvcnVpbndwbm9ucGt5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzQyNTYsImV4cCI6MjA2ODUxMDI1Nn0.qgUE3Lpn5-dgphbW6k59Pu4M-xkwpI6KtAYR7m5FkdU'

// Debug: verificar se as variáveis estão carregadas
console.log('🔍 Variáveis de ambiente:')
console.log('VITE_SUPABASE_EXTERNO_URL:', import.meta.env.VITE_SUPABASE_EXTERNO_URL ? '✅ Carregada' : '❌ Não encontrada')
console.log('VITE_SUPABASE_EXTERNO_ANON_KEY:', import.meta.env.VITE_SUPABASE_EXTERNO_ANON_KEY ? '✅ Carregada' : '❌ Não encontrada')
console.log('URL sendo usada:', SUPABASE_EXTERNO_URL)
console.log('Key sendo usada:', SUPABASE_EXTERNO_KEY ? '✅ Presente' : '❌ Vazia')

// Cliente Supabase singleton para o projeto externo
let supabaseExternoInstance: SupabaseClient | null = null

function getSupabaseExterno(): SupabaseClient {
  if (!supabaseExternoInstance) {
    supabaseExternoInstance = createClient(SUPABASE_EXTERNO_URL, SUPABASE_EXTERNO_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return supabaseExternoInstance
}

// Tipos
export interface AgendamentoExterno {
  id: string
  nome: string
  telefone: string
  email: string | null
  cpf: string | null
  data_nascimento: string | null
  data: string
  horario: string
  status: string
  observacoes: string | null
  valor: number | null
  cidade: string | null
  medico_id: string | null
  cliente_id?: string | null
  medico?: {
    id: string
    nome: string
    especialidade: string | null
    crm: string | null
  }
  cliente?: ClienteExterno
}

export interface EnderecoExterno {
  rua?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  complemento?: string
}

export interface ClienteExterno {
  id: string
  nome: string
  cpf: string | null
  rg: string | null
  email: string | null
  telefone: string
  data_nascimento: string | null
  sexo: string | null
  endereco: EnderecoExterno | null
  cidade: string | null
  nome_pai: string | null
  nome_mae: string | null
  foto_url: string | null
  codigo: string | null
  observacoes: string | null
  total_agendamentos: number | null
  ultimo_agendamento: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface FiltrosAgendamentos {
  dataInicio?: string
  dataFim?: string
  status?: string
  medicoId?: string
  cidade?: string
  limite?: number
  offset?: number
}

/**
 * Lista agendamentos do sistema externo com filtros opcionais
 */
export async function listarAgendamentosExternos(
  filtros?: FiltrosAgendamentos
): Promise<AgendamentoExterno[]> {
  try {
    const supabase = getSupabaseExterno()
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        medico:medicos(id, nome, especialidade, crm)
      `)
      .order('data', { ascending: true })
      .order('horario', { ascending: true })

    // Aplicar filtros
    if (filtros?.dataInicio) {
      query = query.gte('data', filtros.dataInicio)
    }
    if (filtros?.dataFim) {
      query = query.lte('data', filtros.dataFim)
    }
    if (filtros?.status) {
      query = query.eq('status', filtros.status)
    }
    if (filtros?.medicoId) {
      query = query.eq('medico_id', filtros.medicoId)
    }
    if (filtros?.cidade) {
      query = query.eq('cidade', filtros.cidade)
    }
    if (filtros?.limite) {
      query = query.limit(filtros.limite)
    }
    if (filtros?.offset) {
      query = query.range(filtros.offset, filtros.offset + (filtros.limite || 50) - 1)
    }

    const { data, error } = await query

    if (error) {
      console.error('Erro ao buscar agendamentos externos:', error)
      throw new Error(`Erro ao buscar agendamentos: ${error.message}`)
    }

    // Buscar dados do cliente para cada agendamento (se tiver CPF)
    const agendamentosComCliente = await Promise.all(
      (data || []).map(async (agendamento) => {
        let cliente: ClienteExterno | null = null
        
        // Tentar buscar cliente por CPF
        if (agendamento.cpf) {
          try {
            cliente = await buscarClientePorCPF(agendamento.cpf)
          } catch (err) {
            console.log('Cliente não encontrado por CPF:', agendamento.cpf)
          }
        }
        
        return {
          ...agendamento,
          // Garantir que a data está no formato correto sem conversão de fuso horário
          data: parseDateFromDB(agendamento.data),
          data_nascimento: agendamento.data_nascimento ? parseDateFromDB(agendamento.data_nascimento) : null,
          cliente: cliente ? {
            ...cliente,
            data_nascimento: cliente.data_nascimento ? parseDateFromDB(cliente.data_nascimento) : null
          } : null
        }
      })
    )

    return agendamentosComCliente as AgendamentoExterno[]
  } catch (error) {
    console.error('Erro na integração:', error)
    throw error
  }
}

/**
 * Obtém agendamentos de hoje do sistema externo
 */
export async function obterAgendamentosHoje(): Promise<AgendamentoExterno[]> {
  const hoje = getLocalDateString()
  
  return await listarAgendamentosExternos({
    dataInicio: hoje,
    dataFim: hoje
  })
}

/**
 * Obtém agendamentos da semana atual
 */
export async function obterAgendamentosSemana(): Promise<AgendamentoExterno[]> {
  const hoje = new Date()
  const primeiroDiaSemana = new Date(hoje)
  primeiroDiaSemana.setDate(hoje.getDate() - hoje.getDay())
  
  const ultimoDiaSemana = new Date(primeiroDiaSemana)
  ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6)

  return await listarAgendamentosExternos({
    dataInicio: primeiroDiaSemana.toISOString().split('T')[0],
    dataFim: ultimoDiaSemana.toISOString().split('T')[0]
  })
}

/**
 * Obtém agendamentos por status
 */
export async function obterAgendamentosPorStatus(
  status: 'pendente' | 'confirmado' | 'cancelado' | 'realizado' | 'faltou'
): Promise<AgendamentoExterno[]> {
  return await listarAgendamentosExternos({ status })
}

/**
 * Busca agendamentos por nome do paciente
 */
export async function buscarAgendamentosPorNome(nome: string): Promise<AgendamentoExterno[]> {
  try {
    const supabase = getSupabaseExterno()
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        medico:medicos(id, nome, especialidade, crm)
      `)
      .ilike('nome', `%${nome}%`)
      .order('data', { ascending: false })
      .limit(50)

    if (error) throw error

    return data as AgendamentoExterno[]
  } catch (error) {
    console.error('Erro ao buscar por nome:', error)
    throw error
  }
}

/**
 * Obtém estatísticas dos agendamentos externos
 */
export async function obterEstatisticasAgendamentos(dataInicio?: string, dataFim?: string) {
  try {
    const supabase = getSupabaseExterno()
    let query = supabase
      .from('agendamentos')
      .select('status, valor, data')

    if (dataInicio) query = query.gte('data', dataInicio)
    if (dataFim) query = query.lte('data', dataFim)

    const { data, error } = await query

    if (error) throw error

    // Calcular estatísticas
    const total = data.length
    const confirmados = data.filter(a => a.status === 'confirmado').length
    const realizados = data.filter(a => a.status === 'realizado').length
    const cancelados = data.filter(a => a.status === 'cancelado').length
    const pendentes = data.filter(a => a.status === 'pendente').length
    const faltosos = data.filter(a => a.status === 'faltou').length

    const valorTotal = data.reduce((sum, a) => sum + (a.valor || 0), 0)
    const valorRealizado = data
      .filter(a => a.status === 'realizado')
      .reduce((sum, a) => sum + (a.valor || 0), 0)

    return {
      total,
      confirmados,
      realizados,
      cancelados,
      pendentes,
      faltosos,
      valorTotal,
      valorRealizado,
      taxaRealizacao: total > 0 ? (realizados / total) * 100 : 0,
      taxaCancelamento: total > 0 ? (cancelados / total) * 100 : 0
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error)
    throw error
  }
}

/**
 * Verifica se a integração está funcionando
 */
export async function testarConexao(): Promise<boolean> {
  try {
    const supabase = getSupabaseExterno()
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id')
      .limit(1)

    return !error
  } catch (error) {
    console.error('Erro ao testar conexão:', error)
    return false
  }
}

/**
 * Busca um cliente específico por ID
 */
export async function buscarClientePorId(clienteId: string): Promise<ClienteExterno | null> {
  try {
    const supabase = getSupabaseExterno()
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single()

    if (error) throw error
    return data as ClienteExterno
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return null
  }
}

/**
 * Busca cliente por CPF
 */
export async function buscarClientePorCPF(cpf: string): Promise<ClienteExterno | null> {
  try {
    const supabase = getSupabaseExterno()
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error) throw error
    return data as ClienteExterno
  } catch (error) {
    console.error('Erro ao buscar cliente por CPF:', error)
    return null
  }
}

/**
 * Cria um novo cliente no sistema externo via API do backend
 */
export async function criarClienteExterno(clienteData: Partial<ClienteExterno>): Promise<ClienteExterno> {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Usuário não autenticado')
    }
    
    // Preparar dados apenas com campos que existem na tabela
    const insertData: any = {
      nome: clienteData.nome,
      telefone: clienteData.telefone,
      active: true
    }
    
    // Adicionar campos opcionais apenas se tiverem valor não vazio
    if (clienteData.cpf && clienteData.cpf.trim() !== '') {
      insertData.cpf = clienteData.cpf.trim()
    }
    if (clienteData.rg && clienteData.rg.trim() !== '') {
      insertData.rg = clienteData.rg.trim()
    }
    if (clienteData.email && clienteData.email.trim() !== '') {
      insertData.email = clienteData.email.trim()
    }
    if (clienteData.data_nascimento) {
      insertData.data_nascimento = clienteData.data_nascimento
    }
    // Sexo: apenas se for um valor válido (em minúsculo conforme banco)
    const valoresSexoValidos = ['masculino', 'feminino', 'outro', 'prefiro não informar']
    if (clienteData.sexo && clienteData.sexo.trim() !== '') {
      const sexoLimpo = clienteData.sexo.trim().toLowerCase()
      if (valoresSexoValidos.includes(sexoLimpo)) {
        insertData.sexo = sexoLimpo
      }
    }
    if (clienteData.endereco) {
      insertData.endereco = clienteData.endereco // JSONB
    }
    if (clienteData.cidade && clienteData.cidade.trim() !== '') {
      insertData.cidade = clienteData.cidade.trim()
    }
    if (clienteData.nome_pai && clienteData.nome_pai.trim() !== '') {
      insertData.nome_pai = clienteData.nome_pai.trim()
    }
    if (clienteData.nome_mae && clienteData.nome_mae.trim() !== '') {
      insertData.nome_mae = clienteData.nome_mae.trim()
    }
    if (clienteData.foto_url && clienteData.foto_url.trim() !== '') {
      insertData.foto_url = clienteData.foto_url.trim()
    }
    if (clienteData.codigo && clienteData.codigo.trim() !== '') {
      insertData.codigo = clienteData.codigo.trim()
    }
    if (clienteData.observacoes && clienteData.observacoes.trim() !== '') {
      insertData.observacoes = clienteData.observacoes.trim()
    }
    
    console.log('📝 Criando cliente no sistema externo via API:')
    console.log('📦 Dados completos:', JSON.stringify(insertData, null, 2))
    
    const response = await fetch(`${API_BASE_URL}/api/external-clients`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(insertData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Cliente criado no sistema externo:', result.data)
    return result.data as ClienteExterno
  } catch (error) {
    console.error('❌ Erro ao criar cliente externo:', error)
    throw error
  }
}
