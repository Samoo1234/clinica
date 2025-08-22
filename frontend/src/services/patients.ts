import { supabase } from '../lib/supabase'
import type { Patient, CreatePatientData, UpdatePatientData } from '../types/database'

// Re-export Patient type for components
export type { Patient }

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

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export class PatientService {
  private static readonly API_BASE = 'http://localhost:3001/api/patients'

  /**
   * Validate CPF format and check digit
   */
  static validateCPF(cpf: string): boolean {
    // Remove non-numeric characters
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Check if has 11 digits
    if (cleanCPF.length !== 11) return false
    
    // Check if all digits are the same
    if (/^(\d)\1{10}$/.test(cleanCPF)) return false
    
    // Validate check digits
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
    const cleanCPF = cpf.replace(/\D/g, '')
    if (cleanCPF.length !== 11) return cpf
    return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  /**
   * Format phone for display
   */
  static formatPhone(phone: string): string {
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
    const cleanZip = zipCode.replace(/\D/g, '')
    if (cleanZip.length === 8) {
      return cleanZip.replace(/(\d{5})(\d{3})/, '$1-$2')
    }
    return zipCode
  }

  /**
   * Get authentication headers
   */
  private static async getAuthHeaders(): Promise<Record<string, string>> {
    const token = localStorage.getItem('token')
    
    if (!token) {
      throw new Error('Usuário não autenticado')
    }
    
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  /**
   * Make authenticated API request
   */
  private static async apiRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T> & PaginatedResult<T>> {
    try {
      const headers = await this.getAuthHeaders()
      
      const response = await fetch(`${this.API_BASE}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}`)
      }
      
      return await response.json()
    } catch (error: any) {
      console.error('API request error:', error)
      throw error
    }
  }

  /**
   * Get all patients with pagination
   */
  static async getAllPatients(options: PaginationOptions = {}): Promise<PaginatedResult<Patient>> {
    const params = new URLSearchParams()
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    
    const endpoint = params.toString() ? `?${params.toString()}` : ''
    const response = await PatientService.apiRequest<Patient[]>(endpoint)
    
    return {
      data: response.data || [],
      pagination: response.pagination
    }
  }

  /**
   * Search patients
   */
  static async searchPatients(options: SearchOptions = {}): Promise<PaginatedResult<Patient>> {
    const params = new URLSearchParams()
    if (options.query) params.append('q', options.query)
    if (options.page) params.append('page', options.page.toString())
    if (options.limit) params.append('limit', options.limit.toString())
    
    const endpoint = params.toString() ? `?${params.toString()}` : ''
    const response = await PatientService.apiRequest<Patient[]>(endpoint)
    
    return {
      data: response.data || [],
      pagination: response.pagination
    }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(id: string): Promise<Patient> {
    const response = await PatientService.apiRequest<Patient>(`/${id}`)
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Paciente não encontrado')
    }
    
    return response.data
  }

  /**
   * Get patient by CPF
   */
  static async getPatientByCpf(cpf: string): Promise<Patient> {
    const cleanCPF = cpf.replace(/\D/g, '')
    const response = await PatientService.apiRequest<Patient>(`/cpf/${cleanCPF}`)
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Paciente não encontrado')
    }
    
    return response.data
  }

  /**
   * Create new patient
   */
  static async createPatient(patientData: CreatePatientData): Promise<Patient> {
    // Clean data before sending
    const cleanData = {
      ...patientData,
      cpf: patientData.cpf.replace(/\D/g, ''),
      phone: patientData.phone.replace(/\D/g, ''),
      address: {
        ...patientData.address,
        zipCode: patientData.address.zipCode.replace(/\D/g, '')
      }
    }
    
    const response = await PatientService.apiRequest<Patient>('', {
      method: 'POST',
      body: JSON.stringify(cleanData)
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erro ao criar paciente')
    }
    
    return response.data
  }

  /**
   * Update patient
   */
  static async updatePatient(id: string, patientData: UpdatePatientData): Promise<Patient> {
    // Clean data before sending
    const cleanData = { ...patientData }
    if (cleanData.cpf) {
      cleanData.cpf = cleanData.cpf.replace(/\D/g, '')
    }
    if (cleanData.phone) {
      cleanData.phone = cleanData.phone.replace(/\D/g, '')
    }
    if (cleanData.address?.zipCode) {
      cleanData.address.zipCode = cleanData.address.zipCode.replace(/\D/g, '')
    }
    
    const response = await PatientService.apiRequest<Patient>(`/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cleanData)
    })
    
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Erro ao atualizar paciente')
    }
    
    return response.data
  }

  /**
   * Delete patient
   */
  static async deletePatient(id: string): Promise<void> {
    const response = await PatientService.apiRequest<void>(`/${id}`, {
      method: 'DELETE'
    })
    
    if (!response.success) {
      throw new Error(response.error || 'Erro ao excluir paciente')
    }
  }

  /**
   * Validate patient data on frontend
   */
  static validatePatientData(data: Partial<CreatePatientData | UpdatePatientData>): string[] {
    const errors: string[] = []
    
    if ('cpf' in data && data.cpf) {
      if (!this.validateCPF(data.cpf)) {
        errors.push('CPF inválido')
      }
    }
    
    if ('name' in data && data.name) {
      if (data.name.trim().length < 2) {
        errors.push('Nome deve ter pelo menos 2 caracteres')
      }
    }
    
    if ('birth_date' in data && data.birth_date) {
      const birthDate = new Date(data.birth_date)
      const today = new Date()
      if (birthDate > today) {
        errors.push('Data de nascimento não pode ser futura')
      }
      if (today.getFullYear() - birthDate.getFullYear() > 150) {
        errors.push('Data de nascimento inválida')
      }
    }
    
    if ('phone' in data && data.phone) {
      const cleanPhone = data.phone.replace(/\D/g, '')
      if (cleanPhone.length < 10 || cleanPhone.length > 11) {
        errors.push('Telefone deve ter 10 ou 11 dígitos')
      }
    }
    
    if ('email' in data && data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Email inválido')
      }
    }
    
    if ('address' in data && data.address) {
      const { address } = data
      if (!address.street || address.street.trim().length < 3) {
        errors.push('Endereço deve ter pelo menos 3 caracteres')
      }
      if (!address.number || address.number.trim().length < 1) {
        errors.push('Número do endereço é obrigatório')
      }
      if (!address.neighborhood || address.neighborhood.trim().length < 2) {
        errors.push('Bairro deve ter pelo menos 2 caracteres')
      }
      if (!address.city || address.city.trim().length < 2) {
        errors.push('Cidade deve ter pelo menos 2 caracteres')
      }
      if (!address.state || address.state.trim().length !== 2) {
        errors.push('Estado deve ter 2 caracteres (UF)')
      }
      if (!address.zipCode) {
        errors.push('CEP é obrigatório')
      } else {
        const cleanZip = address.zipCode.replace(/\D/g, '')
        if (cleanZip.length !== 8) {
          errors.push('CEP deve ter 8 dígitos')
        }
      }
    }
    
    return errors
  }
}

// Export convenience methods
export const patientService = {
  getPatients: PatientService.getAllPatients,
  getPatientById: PatientService.getPatientById,
  getPatientByCPF: PatientService.getPatientByCpf,
  createPatient: PatientService.createPatient,
  updatePatient: PatientService.updatePatient,
  deletePatient: PatientService.deletePatient,
  validatePatientData: PatientService.validatePatientData
}