import { supabaseAdmin } from '../config/supabase'
import type { 
  User, 
  Patient, 
  MedicalRecord, 
  Appointment, 
  Attachment, 
  Invoice, 
  IntegrationLog 
} from '../types/database'

// Generic error handler for Supabase operations
export function handleSupabaseError(error: any, operation: string) {
  console.error(`Supabase ${operation} error:`, error)
  
  if (error.code === 'PGRST116') {
    throw new Error('Record not found')
  }
  
  if (error.code === '23505') {
    throw new Error('Record already exists')
  }
  
  if (error.code === '23503') {
    throw new Error('Referenced record not found')
  }
  
  throw new Error(error.message || `Failed to ${operation}`)
}

// User operations
export async function getUserById(id: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      handleSupabaseError(error, 'get user')
    }
    
    return data
  } catch (error) {
    handleSupabaseError(error, 'get user')
    return null
  }
}

export async function getAllUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('name')
    
    if (error) handleSupabaseError(error, 'get users')
    
    return data || []
  } catch (error) {
    handleSupabaseError(error, 'get users')
    return []
  }
}

// Patient operations
export async function getPatientById(id: string): Promise<Patient | null> {
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

export async function getPatientByCpf(cpf: string): Promise<Patient | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('cpf', cpf)
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

export async function searchPatients(query: string): Promise<Patient[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('patients')
      .select('*')
      .or(`name.ilike.%${query}%,cpf.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name')
      .limit(50)
    
    if (error) handleSupabaseError(error, 'search patients')
    
    return data || []
  } catch (error) {
    handleSupabaseError(error, 'search patients')
    return []
  }
}

// Medical record operations
export async function getMedicalRecordsByPatientId(patientId: string): Promise<MedicalRecord[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('medical_records')
      .select('*')
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: false })
    
    if (error) handleSupabaseError(error, 'get medical records')
    
    return data || []
  } catch (error) {
    handleSupabaseError(error, 'get medical records')
    return []
  }
}

// Appointment operations
export async function getAppointmentsByDateRange(startDate: string, endDate: string): Promise<Appointment[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .gte('scheduled_at', startDate)
      .lte('scheduled_at', endDate)
      .order('scheduled_at')
    
    if (error) handleSupabaseError(error, 'get appointments')
    
    return data || []
  } catch (error) {
    handleSupabaseError(error, 'get appointments')
    return []
  }
}

export async function getAppointmentsByDoctorId(doctorId: string, date?: string): Promise<Appointment[]> {
  try {
    let query = supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('doctor_id', doctorId)
    
    if (date) {
      const startOfDay = `${date}T00:00:00.000Z`
      const endOfDay = `${date}T23:59:59.999Z`
      query = query.gte('scheduled_at', startOfDay).lte('scheduled_at', endOfDay)
    }
    
    const { data, error } = await query.order('scheduled_at')
    
    if (error) handleSupabaseError(error, 'get doctor appointments')
    
    return data || []
  } catch (error) {
    handleSupabaseError(error, 'get doctor appointments')
    return []
  }
}

// Check for appointment conflicts
export async function checkAppointmentConflict(
  doctorId: string, 
  scheduledAt: string, 
  durationMinutes: number,
  excludeAppointmentId?: string
): Promise<boolean> {
  try {
    const appointmentStart = new Date(scheduledAt)
    const appointmentEnd = new Date(appointmentStart.getTime() + durationMinutes * 60000)
    
    let query = supabaseAdmin
      .from('appointments')
      .select('id, scheduled_at, duration_minutes')
      .eq('doctor_id', doctorId)
      .neq('status', 'cancelled')
      .gte('scheduled_at', appointmentStart.toISOString())
      .lt('scheduled_at', appointmentEnd.toISOString())
    
    if (excludeAppointmentId) {
      query = query.neq('id', excludeAppointmentId)
    }
    
    const { data, error } = await query
    
    if (error) handleSupabaseError(error, 'check appointment conflict')
    
    return (data && data.length > 0) || false
  } catch (error) {
    handleSupabaseError(error, 'check appointment conflict')
    return false
  }
}

// Log integration operations
export async function logIntegration(logData: Omit<IntegrationLog, 'id' | 'created_at'>): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('integration_logs')
      .insert(logData)
    
    if (error) handleSupabaseError(error, 'log integration')
  } catch (error) {
    // Don't throw on logging errors, just log them
    console.error('Failed to log integration:', error)
  }
}