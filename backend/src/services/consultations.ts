import { supabaseAdmin } from '../config/supabase'

interface ConsultationFilters {
  status?: string
  doctorId?: string
  patientName?: string
  dateFrom?: string
  dateTo?: string
}

interface ConsultationStats {
  today: number
  inProgress: number
  completed: number
  pending: number
}

interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  status: 'waiting' | 'in_progress' | 'completed' | 'cancelled'
  startTime: string
  endTime?: string
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
  }
  notes?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
  createdAt: string
  updatedAt: string
  // Relations
  patient?: any
  doctor?: any
  appointment?: any
}

class ConsultationsService {
  async getConsultations(filters: ConsultationFilters = {}): Promise<Consultation[]> {
    let query = supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.doctorId) {
      query = query.eq('doctor_id', filters.doctorId)
    }

    if (filters.dateFrom) {
      query = query.gte('created_at', filters.dateFrom)
    }

    if (filters.dateTo) {
      query = query.lte('created_at', filters.dateTo)
    }

    if (filters.patientName) {
      // This would require a more complex query with joins
      // For now, we'll fetch all and filter in memory
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Error fetching consultations: ${error.message}`)
    }

    let consultations = data || []

    // Filter by patient name if provided
    if (filters.patientName) {
      consultations = consultations.filter((consultation: any) => 
        consultation.patient?.name?.toLowerCase().includes(filters.patientName!.toLowerCase())
      )
    }

    return consultations
  }

  async getConsultation(id: string): Promise<Consultation> {
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Error fetching consultation: ${error.message}`)
    }

    return data
  }

  async getConsultationStats(): Promise<ConsultationStats> {
    const today = new Date().toISOString().split('T')[0]

    // Get today's consultations
    const { data: todayData } = await supabaseAdmin
      .from('consultations')
      .select('id')
      .gte('created_at', today)

    // Get in progress consultations
    const { data: inProgressData } = await supabaseAdmin
      .from('consultations')
      .select('id')
      .eq('status', 'in_progress')

    // Get completed consultations
    const { data: completedData } = await supabaseAdmin
      .from('consultations')
      .select('id')
      .eq('status', 'completed')

    // Get pending consultations
    const { data: pendingData } = await supabaseAdmin
      .from('consultations')
      .select('id')
      .eq('status', 'waiting')

    return {
      today: todayData?.length || 0,
      inProgress: inProgressData?.length || 0,
      completed: completedData?.length || 0,
      pending: pendingData?.length || 0
    }
  }

  async startConsultation(appointmentId: string, data: any = {}): Promise<Consultation> {
    // First, get the appointment details
    const { data: appointment, error: appointmentError } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single()

    if (appointmentError) {
      throw new Error(`Error fetching appointment: ${appointmentError.message}`)
    }

    // Create the consultation
    const consultationData = {
      appointment_id: appointmentId,
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      status: 'in_progress',
      start_time: new Date().toISOString(),
      vital_signs: data.vitalSigns || {},
      notes: data.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .insert(consultationData)
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .single()

    if (error) {
      throw new Error(`Error creating consultation: ${error.message}`)
    }

    // Update appointment status
    await supabaseAdmin
      .from('appointments')
      .update({ status: 'in_progress' })
      .eq('id', appointmentId)

    return consultation
  }

  async updateConsultation(id: string, data: any): Promise<Consultation> {
    const updateData = {
      ...data,
      updated_at: new Date().toISOString()
    }

    const { data: consultation, error } = await supabaseAdmin
      .from('consultations')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .single()

    if (error) {
      throw new Error(`Error updating consultation: ${error.message}`)
    }

    return consultation
  }

  async completeConsultation(id: string, medicalRecordData: any): Promise<void> {
    // Update consultation status
    const { error: consultationError } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'completed',
        end_time: new Date().toISOString(),
        diagnosis: medicalRecordData.diagnosis,
        treatment: medicalRecordData.treatment,
        prescription: medicalRecordData.prescription,
        notes: medicalRecordData.notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (consultationError) {
      throw new Error(`Error completing consultation: ${consultationError.message}`)
    }

    // Get consultation details for medical record
    const { data: consultation } = await supabaseAdmin
      .from('consultations')
      .select('*')
      .eq('id', id)
      .single()

    if (consultation) {
      // Create medical record entry
      const medicalRecordEntry = {
        patient_id: consultation.patient_id,
        doctor_id: consultation.doctor_id,
        consultation_id: id,
        diagnosis: medicalRecordData.diagnosis,
        treatment: medicalRecordData.treatment,
        prescription: medicalRecordData.prescription,
        notes: medicalRecordData.notes,
        follow_up_date: medicalRecordData.followUpDate,
        created_at: new Date().toISOString()
      }

      await supabaseAdmin
        .from('medical_records')
        .insert(medicalRecordEntry)

      // Update appointment status
      await supabaseAdmin
        .from('appointments')
        .update({ status: 'completed' })
        .eq('id', consultation.appointment_id)
    }
  }

  async cancelConsultation(id: string, reason?: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('consultations')
      .update({
        status: 'cancelled',
        notes: reason ? `Cancelado: ${reason}` : 'Cancelado',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) {
      throw new Error(`Error cancelling consultation: ${error.message}`)
    }
  }

  async getAvailableAppointments(): Promise<any[]> {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_at', new Date().toISOString())
      .order('scheduled_at', { ascending: true })

    if (error) {
      throw new Error(`Error fetching available appointments: ${error.message}`)
    }

    return data || []
  }

  async getPatientConsultations(patientId: string): Promise<Consultation[]> {
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching patient consultations: ${error.message}`)
    }

    return data || []
  }

  async getDoctorConsultations(doctorId: string): Promise<Consultation[]> {
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .eq('doctor_id', doctorId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Error fetching doctor consultations: ${error.message}`)
    }

    return data || []
  }

  async updateVitalSigns(id: string, vitalSigns: any): Promise<Consultation> {
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .update({
        vital_signs: vitalSigns,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .single()

    if (error) {
      throw new Error(`Error updating vital signs: ${error.message}`)
    }

    return data
  }

  async addNotes(id: string, notes: string): Promise<Consultation> {
    const { data, error } = await supabaseAdmin
      .from('consultations')
      .update({
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select(`
        *,
        patient:patients(*),
        doctor:users(*),
        appointment:appointments(*)
      `)
      .single()

    if (error) {
      throw new Error(`Error adding notes: ${error.message}`)
    }

    return data
  }
}

export const consultationsService = new ConsultationsService()