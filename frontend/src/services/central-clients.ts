/**
 * Serviço para gerenciar clientes no Banco Central
 * Compartilhado entre: Agendamento, Clínica (VisionCare) e ERP
 */

import { api } from '../utils/api'

export interface EnderecoCliente {
  rua?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  complemento?: string
}

export interface ClienteCentral {
  id: string
  codigo?: string
  nome: string
  telefone: string
  cpf?: string
  rg?: string
  email?: string
  data_nascimento?: string
  sexo?: string
  endereco?: EnderecoCliente
  cidade?: string
  nome_pai?: string
  nome_mae?: string
  foto_url?: string
  observacoes?: string
  erp_cliente_id?: string
  total_compras?: number
  ultima_compra?: string
  cadastro_completo: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface FiltroClientes {
  page?: number
  limit?: number
  search?: string
  cadastro_completo?: boolean
  active?: boolean
}

export interface PaginacaoClientes {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ResponseListaClientes {
  data: ClienteCentral[]
  pagination: PaginacaoClientes
}

/**
 * Lista todos os clientes do banco central
 */
export async function listarClientesCentral(
  filtros?: FiltroClientes
): Promise<ResponseListaClientes> {
  const params = new URLSearchParams()
  
  if (filtros?.page) params.append('page', filtros.page.toString())
  if (filtros?.limit) params.append('limit', filtros.limit.toString())
  if (filtros?.search) params.append('search', filtros.search)
  if (filtros?.cadastro_completo !== undefined) {
    params.append('cadastro_completo', filtros.cadastro_completo.toString())
  }
  if (filtros?.active !== undefined) {
    params.append('active', filtros.active.toString())
  }

  const response = await api.get<{ data: ClienteCentral[], pagination: any }>(`/api/central-clients?${params.toString()}`)
  return response
}

/**
 * Busca cliente por ID
 */
export async function buscarClientePorId(id: string): Promise<ClienteCentral> {
  const response = await api.get<{ data: ClienteCentral }>(`/api/central-clients/${id}`)
  return response.data
}

/**
 * Busca cliente por CPF
 */
export async function buscarClientePorCPF(cpf: string): Promise<ClienteCentral | null> {
  try {
    const response = await api.get<{ data: ClienteCentral }>(`/api/central-clients/cpf/${cpf}`)
    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Busca cliente por telefone
 */
export async function buscarClientePorTelefone(telefone: string): Promise<ClienteCentral | null> {
  try {
    const response = await api.get<{ data: ClienteCentral }>(`/api/central-clients/telefone/${telefone}`)
    return response.data
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Cria novo cliente (cadastro inicial - agendamento)
 */
export async function criarClienteCentral(
  clienteData: Partial<ClienteCentral>
): Promise<ClienteCentral> {
  const response = await api.post<{ data: ClienteCentral }>('/api/central-clients', clienteData)
  return response.data
}

/**
 * Atualiza cliente (completar cadastro na clínica)
 */
export async function atualizarClienteCentral(
  id: string,
  clienteData: Partial<ClienteCentral>
): Promise<ClienteCentral> {
  const response = await api.put<{ data: ClienteCentral }>(`/api/central-clients/${id}`, clienteData)
  return response.data
}

/**
 * Desativa cliente (soft delete)
 */
export async function desativarClienteCentral(id: string): Promise<ClienteCentral> {
  const response = await api.delete<{ data: ClienteCentral }>(`/api/central-clients/${id}`)
  return response.data
}

/**
 * Cadastro rápido (apenas nome e telefone) para agendamento
 */
export async function cadastroRapidoCliente(
  nome: string,
  telefone: string
): Promise<ClienteCentral> {
  return await criarClienteCentral({
    nome,
    telefone,
    cadastro_completo: false,
    active: true
  })
}

/**
 * Completar cadastro na clínica
 */
export async function completarCadastroCliente(
  id: string,
  dadosCompletos: {
    cpf?: string
    rg?: string
    email?: string
    data_nascimento?: string
    sexo?: string
    endereco?: EnderecoCliente
    cidade?: string
    nome_pai?: string
    nome_mae?: string
    observacoes?: string
  }
): Promise<ClienteCentral> {
  return await atualizarClienteCentral(id, {
    ...dadosCompletos,
    cadastro_completo: true
  })
}










