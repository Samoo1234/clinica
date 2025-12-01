/**
 * Serviço de Pacientes integrado com o Banco Central
 * Adaptador que converte entre o formato local (Patient) e o formato central (ClienteCentral)
 */

import { 
  listarClientesCentral, 
  buscarClientePorId, 
  buscarClientePorCPF, 
  buscarClientePorTelefone,
  criarClienteCentral,
  atualizarClienteCentral,
  desativarClienteCentral,
  type ClienteCentral
} from '../config/supabaseCentral'

// Interface de filtros (compatível com o serviço antigo)
interface FiltroClientes {
  search?: string
  limit?: number
  offset?: number
}

// Interface compatível com o formato esperado pelos componentes existentes
export interface Patient {
  id: string
  name: string
  cpf: string
  birth_date: string
  phone: string
  email?: string
  address?: {
    street?: string
    number?: string
    complement?: string
    neighborhood?: string
    city?: string
    state?: string
    zipCode?: string
  }
  insurance_info?: {
    provider?: string
    planNumber?: string
    validUntil?: string
  }
  emergency_contact?: {
    name?: string
    phone?: string
    relationship?: string
  }
  nome_pai?: string
  nome_mae?: string
  observacoes?: string
  cadastro_completo: boolean
  active: boolean
  created_at: string
  updated_at: string
}

export interface PaginationOptions {
  page?: number
  limit?: number
}

export interface SearchOptions extends PaginationOptions {
  query?: string
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// Converte ClienteCentral para Patient (formato local)
function centralToLocal(cliente: ClienteCentral): Patient {
  return {
    id: cliente.id,
    name: cliente.nome,
    cpf: cliente.cpf || '',
    birth_date: cliente.data_nascimento || '',
    phone: cliente.telefone,
    email: cliente.email,
    address: cliente.endereco ? {
      street: cliente.endereco.rua,
      number: cliente.endereco.numero,
      complement: cliente.endereco.complemento,
      neighborhood: cliente.endereco.bairro,
      city: cliente.endereco.cidade || cliente.cidade,
      state: cliente.endereco.estado,
      zipCode: cliente.endereco.cep
    } : cliente.cidade ? {
      city: cliente.cidade
    } : undefined,
    nome_pai: cliente.nome_pai,
    nome_mae: cliente.nome_mae,
    observacoes: cliente.observacoes,
    cadastro_completo: cliente.cadastro_completo,
    active: cliente.active,
    created_at: cliente.created_at,
    updated_at: cliente.updated_at
  }
}

// Converte Patient (formato local) para ClienteCentral
function localToCentral(patient: Partial<Patient>): Partial<ClienteCentral> {
  const endereco = patient.address ? {
    rua: patient.address.street,
    numero: patient.address.number,
    complemento: patient.address.complement,
    bairro: patient.address.neighborhood,
    cidade: patient.address.city,
    estado: patient.address.state,
    cep: patient.address.zipCode
  } : undefined

  return {
    nome: patient.name,
    cpf: patient.cpf,
    data_nascimento: patient.birth_date,
    telefone: patient.phone,
    email: patient.email,
    endereco,
    cidade: patient.address?.city,
    nome_pai: patient.nome_pai,
    nome_mae: patient.nome_mae,
    observacoes: patient.observacoes
  }
}

/**
 * Serviço de Pacientes usando Banco Central
 */
export class PatientCentralService {
  /**
   * Validate CPF format and check digit
   */
  static validateCPF(cpf: string): boolean {
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return false
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    let sum = 0
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (10 - i)
    }
    let remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(9))) return false
    
    sum = 0
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cleanCPF.charAt(i)) * (11 - i)
    }
    remainder = (sum * 10) % 11
    if (remainder === 10 || remainder === 11) remainder = 0
    if (remainder !== parseInt(cleanCPF.charAt(10))) return false
    
    return true
  }

  /**
   * Format CPF for display
   */
  static formatCPF(cpf: string): string {
    if (!cpf) return ''
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return cpf
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Format phone for display
   */
  static formatPhone(phone: string): string {
    if (!phone) return ''
    const cleanPhone = phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      return cleanPhone.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
    } else if (cleanPhone.length === 11) {
      return cleanPhone.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
    return phone
  }

  /**
   * Format ZIP code for display
   */
  static formatZipCode(zipCode: string): string {
    if (!zipCode) return ''
    const cleanZip = zipCode.replace(/\D/g, '')
    if (cleanZip.length === 8) {
      return cleanZip.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return zipCode
  }

  /**
   * Get all patients with pagination
   */
  static async getAllPatients(options: PaginationOptions = {}): Promise<PaginatedResult<Patient>> {
    try {
      const page = options.page || 1
      const limit = options.limit || 20
      const offset = (page - 1) * limit

      const result = await listarClientesCentral({
        limit,
        offset
      })
      
      const totalPages = Math.ceil(result.total / limit)
      
      return {
        data: result.data.map(centralToLocal),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error: any) {
      console.error('Erro ao carregar pacientes:', error)
      throw new Error(error.message || 'Erro ao carregar pacientes do banco central')
    }
  }

  /**
   * Search patients
   */
  static async searchPatients(options: SearchOptions = {}): Promise<PaginatedResult<Patient>> {
    try {
      const page = options.page || 1
      const limit = options.limit || 20
      const offset = (page - 1) * limit

      const result = await listarClientesCentral({
        limit,
        offset,
        search: options.query
      })
      
      const totalPages = Math.ceil(result.total / limit)
      
      return {
        data: result.data.map(centralToLocal),
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error: any) {
      console.error('Erro ao buscar pacientes:', error)
      throw new Error(error.message || 'Erro ao buscar pacientes')
    }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(id: string): Promise<Patient> {
    try {
      const cliente = await buscarClientePorId(id)
      return centralToLocal(cliente)
    } catch (error: any) {
      console.error('Erro ao buscar paciente:', error)
      throw new Error(error.message || 'Paciente não encontrado')
    }
  }

  /**
   * Get patient by CPF
   */
  static async getPatientByCpf(cpf: string): Promise<Patient | null> {
    try {
      const cleanCPF = cpf.replace(/\D/g, '')
      const cliente = await buscarClientePorCPF(cleanCPF)
      return cliente ? centralToLocal(cliente) : null
    } catch (error: any) {
      console.error('Erro ao buscar paciente por CPF:', error)
      return null
    }
  }

  /**
   * Get patient by phone
   */
  static async getPatientByPhone(phone: string): Promise<Patient | null> {
    try {
      const cleanPhone = phone.replace(/\D/g, '')
      const cliente = await buscarClientePorTelefone(cleanPhone)
      return cliente ? centralToLocal(cliente) : null
    } catch (error: any) {
      console.error('Erro ao buscar paciente por telefone:', error)
      return null
    }
  }

  /**
   * Create new patient
   */
  static async createPatient(patientData: Partial<Patient>): Promise<Patient> {
    try {
      // Converter para formato central
      const centralData = localToCentral(patientData)
      
      // Limpar CPF e telefone
      if (centralData.cpf) {
        centralData.cpf = centralData.cpf.replace(/\D/g, '')
      }
      if (centralData.telefone) {
        centralData.telefone = centralData.telefone.replace(/\D/g, '')
      }

      // Determinar se cadastro está completo
      const cadastroCompleto = !!(
        centralData.cpf && 
        centralData.email && 
        centralData.data_nascimento &&
        centralData.endereco?.rua
      )

      const cliente = await criarClienteCentral({
        ...centralData,
        cadastro_completo: cadastroCompleto
      } as any)

      return centralToLocal(cliente)
    } catch (error: any) {
      console.error('Erro ao criar paciente:', error)
      throw new Error(error.message || 'Erro ao criar paciente')
    }
  }

  /**
   * Update patient
   */
  static async updatePatient(id: string, patientData: Partial<Patient>): Promise<Patient> {
    try {
      // Converter para formato central
      const centralData = localToCentral(patientData)
      
      // Limpar CPF e telefone
      if (centralData.cpf) {
        centralData.cpf = centralData.cpf.replace(/\D/g, '')
      }
      if (centralData.telefone) {
        centralData.telefone = centralData.telefone.replace(/\D/g, '')
      }

      // Determinar se cadastro está completo
      const cadastroCompleto = !!(
        centralData.cpf && 
        centralData.email && 
        centralData.data_nascimento &&
        centralData.endereco?.rua
      )

      const cliente = await atualizarClienteCentral(id, {
        ...centralData,
        cadastro_completo: cadastroCompleto
      } as any)

      return centralToLocal(cliente)
    } catch (error: any) {
      console.error('Erro ao atualizar paciente:', error)
      throw new Error(error.message || 'Erro ao atualizar paciente')
    }
  }

  /**
   * Delete patient (soft delete)
   */
  static async deletePatient(id: string): Promise<void> {
    try {
      await desativarClienteCentral(id)
    } catch (error: any) {
      console.error('Erro ao excluir paciente:', error)
      throw new Error(error.message || 'Erro ao excluir paciente')
    }
  }

  /**
   * Validate patient data on frontend
   */
  static validatePatientData(data: Partial<Patient>): string[] {
    const errors: string[] = []
    
    // Nome é obrigatório
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres')
    }

    // Telefone é obrigatório
    if (!data.phone) {
      errors.push('Telefone é obrigatório')
    } else {
      const cleanPhone = data.phone.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.push('Telefone deve ter 10 ou 11 dígitos')
      }
    }
    
    // CPF é opcional, mas se fornecido deve ser válido
    if (data.cpf && data.cpf.trim() !== '') {
      if (!this.validateCPF(data.cpf)) {
        errors.push('CPF inválido')
      }
    }
    
    if (data.birth_date) {
      const birthDate = new Date(data.birth_date)
      const today = new Date()
      if (birthDate > today) {
        errors.push('Data de nascimento não pode ser futura')
      }
      if (today.getFullYear() - birthDate.getFullYear() > 150) {
        errors.push('Data de nascimento inválida')
      }
    }
    
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Email inválido')
      }
    }
    
    return errors
  }
}

// Export para uso nos componentes
export const patientCentralService = {
  getPatients: PatientCentralService.getAllPatients,
  searchPatients: PatientCentralService.searchPatients,
  getPatientById: PatientCentralService.getPatientById,
  getPatientByCPF: PatientCentralService.getPatientByCpf,
  getPatientByPhone: PatientCentralService.getPatientByPhone,
  createPatient: PatientCentralService.createPatient,
  updatePatient: PatientCentralService.updatePatient,
  deletePatient: PatientCentralService.deletePatient,
  validatePatientData: PatientCentralService.validatePatientData,
  formatCPF: PatientCentralService.formatCPF,
  formatPhone: PatientCentralService.formatPhone,
  formatZipCode: PatientCentralService.formatZipCode,
  validateCPF: PatientCentralService.validateCPF
}
