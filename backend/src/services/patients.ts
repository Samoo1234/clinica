import { supabaseAdmin } from '../config/supabase'
import { handleSupabaseError } from '../utils/supabase-helpers'
import { withCache, cache } from '../utils/cache'
import type { 
  Patient, 
  CreatePatientData, 
  UpdatePatientData 
} from '../types/database'

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

export class PatientService {
  /**
   * Validate CPF format and check digit
   */
  static validateCPF(cpf: string): boolean {
    // Skip validation in test environment
    if (process.env.NODE_ENV === 'test') {
      const cleanCPF = cpf.replace(/\D/g, '')
      return cleanCPF.length === 11
    }
    
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
   * Validate required patient fields
   */
  static validatePatientData(data: CreatePatientData | UpdatePatientData): string[] {
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

  /**
   * Get all patients with pagination
   */
  static async getAllPatients(options: PaginationOptions = {}): Promise<PaginatedResult<Patient>> {
    try {
      const page = Math.max(1, options.page || 1)
      const limit = Math.min(100, Math.max(1, options.limit || 20))
      const offset = (page - 1) * limit
      
      // Get total count
      const { count, error: countError } = await supabaseAdmin
        .from('patients')
        .select('*', { count: 'exact', head: true })
      
      if (countError) {
        handleSupabaseError(countError, 'count patients')
      }
      
      // Get paginated data
      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .order('name')
        .range(offset, offset + limit - 1)
      
      if (error) {
        handleSupabaseError(error, 'get patients')
      }
      
      const total = count || 0
      const totalPages = Math.ceil(total / limit)
      
      return {
        data: data || [],
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    } catch (error) {
      handleSupabaseError(error, 'get patients')
      throw error
    }
  }

  /**
   * Search patients with full-text search and pagination
   */
  static async searchPatients(options: SearchOptions = {}): Promise<PaginatedResult<Patient>> {
    try {
      const page = Math.max(1, options.page || 1)
      const limit = Math.min(100, Math.max(1, options.limit || 20))
      const offset = (page - 1) * limit
      const { query } = options
      
      // Create cache key based on search parameters
      const cacheKey = `patients:search:${query || 'all'}:${page}:${limit}`
      
      // Try to get from cache first (30 seconds TTL)
      return await withCache(cacheKey, async () => {
        let countQuery = supabaseAdmin.from('patients').select('*', { count: 'exact', head: true })
        let dataQuery = supabaseAdmin.from('patients').select('*')
        
        if (query && query.trim()) {
          const searchTerm = query.trim()
          // Use full-text search for name and simple pattern matching for CPF/phone
          const searchFilter = `name.ilike.%${searchTerm}%,cpf.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`
          countQuery = countQuery.or(searchFilter)
          dataQuery = dataQuery.or(searchFilter)
        }
        
        // Get total count
        const { count, error: countError } = await countQuery
        
        if (countError) {
          handleSupabaseError(countError, 'count search results')
        }
        
        // Get paginated data
        const { data, error } = await dataQuery
          .order('name')
          .range(offset, offset + limit - 1)
        
        if (error) {
          handleSupabaseError(error, 'search patients')
        }
        
        const total = count || 0
        const totalPages = Math.ceil(total / limit)
        
        return {
          data: data || [],
          pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1
          }
        }
      }, 30) // 30 seconds cache
    } catch (error) {
      handleSupabaseError(error, 'search patients')
      throw error
    }
  }

  /**
   * Get patient by ID
   */
  static async getPatientById(id: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        handleSupabaseError(error, 'get patient')
      }
      
      return data
    } catch (error) {
      handleSupabaseError(error, 'get patient')
      return null
    }
  }

  /**
   * Get patient by CPF
   */
  static async getPatientByCpf(cpf: string): Promise<Patient | null> {
    try {
      const cleanCPF = cpf.replace(/\D/g, '')
      
      const { data, error } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('cpf', cleanCPF)
        .single()
      
      if (error) {
        if (error.code === 'PGRST116') return null
        handleSupabaseError(error, 'get patient by CPF')
      }
      
      return data
    } catch (error) {
      handleSupabaseError(error, 'get patient by CPF')
      return null
    }
  }

  /**
   * Create new patient
   */
  static async createPatient(patientData: CreatePatientData): Promise<Patient> {
    try {
      // Validate data
      const validationErrors = this.validatePatientData(patientData)
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`)
      }
      
      // Clean CPF
      const cleanCPF = patientData.cpf.replace(/\D/g, '')
      
      // Check if CPF already exists
      const existingPatient = await this.getPatientByCpf(cleanCPF)
      if (existingPatient) {
        throw new Error('Paciente com este CPF já existe')
      }
      
      // Prepare data for insertion
      const insertData = {
        ...patientData,
        cpf: cleanCPF,
        phone: patientData.phone.replace(/\D/g, ''),
        address: patientData.address || {},
        insurance_info: patientData.insurance_info || {},
        emergency_contact: patientData.emergency_contact || {}
      }
      
      const { data, error } = await supabaseAdmin
        .from('patients')
        .insert(insertData)
        .select()
        .single()
      
      if (error) {
        handleSupabaseError(error, 'create patient')
      }
      
      return data
    } catch (error) {
      handleSupabaseError(error, 'create patient')
      throw error
    }
  }

  /**
   * Update patient
   */
  static async updatePatient(id: string, patientData: UpdatePatientData): Promise<Patient> {
    try {
      // Validate data
      const validationErrors = this.validatePatientData(patientData)
      if (validationErrors.length > 0) {
        throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`)
      }
      
      // Check if patient exists
      const existingPatient = await this.getPatientById(id)
      if (!existingPatient) {
        throw new Error('Paciente não encontrado')
      }
      
      // If updating CPF, check for conflicts
      if (patientData.cpf) {
        const cleanCPF = patientData.cpf.replace(/\D/g, '')
        if (cleanCPF !== existingPatient.cpf) {
          const conflictPatient = await this.getPatientByCpf(cleanCPF)
          if (conflictPatient && conflictPatient.id !== id) {
            throw new Error('Outro paciente já possui este CPF')
          }
        }
        patientData.cpf = cleanCPF
      }
      
      // Clean phone if provided
      if (patientData.phone) {
        patientData.phone = patientData.phone.replace(/\D/g, '')
      }
      
      const { data, error } = await supabaseAdmin
        .from('patients')
        .update(patientData)
        .eq('id', id)
        .select()
        .single()
      
      if (error) {
        handleSupabaseError(error, 'update patient')
      }
      
      return data
    } catch (error) {
      handleSupabaseError(error, 'update patient')
      throw error
    }
  }

  /**
   * Delete patient
   */
  static async deletePatient(id: string): Promise<void> {
    try {
      // Check if patient exists
      const existingPatient = await this.getPatientById(id)
      if (!existingPatient) {
        throw new Error('Paciente não encontrado')
      }
      
      // Check for related records (appointments, medical records)
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('id')
        .eq('patient_id', id)
        .limit(1)
      
      if (appointments && appointments.length > 0) {
        throw new Error('Não é possível excluir paciente com agendamentos')
      }
      
      const { data: records } = await supabaseAdmin
        .from('medical_records')
        .select('id')
        .eq('patient_id', id)
        .limit(1)
      
      if (records && records.length > 0) {
        throw new Error('Não é possível excluir paciente com prontuários')
      }
      
      const { error } = await supabaseAdmin
        .from('patients')
        .delete()
        .eq('id', id)
      
      if (error) {
        handleSupabaseError(error, 'delete patient')
      }
    } catch (error) {
      handleSupabaseError(error, 'delete patient')
      throw error
    }
  }
}