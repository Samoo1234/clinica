import { supabaseAdmin } from '../config/supabase'
import { 
  MedicalRecord, 
  CreateMedicalRecordData, 
  UpdateMedicalRecordData,
  Attachment,
  CreateAttachmentData,
  PhysicalExam
} from '../types/database'

export class MedicalRecordsService {
  // Create a new medical record
  async createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    // Set default physical exam structure for ophthalmology
    const defaultPhysicalExam: PhysicalExam = {
      visualAcuity: {
        rightEye: '',
        leftEye: ''
      },
      intraocularPressure: {
        rightEye: 0,
        leftEye: 0
      },
      fundoscopy: '',
      biomicroscopy: '',
      ...data.physical_exam
    }

    const { data: record, error } = await supabaseAdmin
      .from('medical_records')
      .insert({
        ...data,
        physical_exam: defaultPhysicalExam,
        consultation_date: data.consultation_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create medical record: ${error.message}`)
    }

    return record
  }

  // Get medical record by ID
  async getMedicalRecordById(id: string): Promise<MedicalRecord | null> {
    const { data: record, error } = await supabaseAdmin
      .from('medical_records')
      .select(`
        *,
        patient:patients(id, name, cpf),
        doctor:users(id, name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get medical record: ${error.message}`)
    }

    return record
  }

  // Get medical records for a patient with chronological ordering
  async getMedicalRecordsByPatientId(
    patientId: string, 
    options: {
      limit?: number
      offset?: number
      orderBy?: 'asc' | 'desc'
    } = {}
  ): Promise<{ records: MedicalRecord[], total: number }> {
    const { limit = 50, offset = 0, orderBy = 'desc' } = options

    // Get total count
    const { count } = await supabaseAdmin
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)

    // Get records with pagination and ordering
    const { data: records, error } = await supabaseAdmin
      .from('medical_records')
      .select(`
        *,
        doctor:users(id, name, email)
      `)
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: orderBy === 'asc' })
      .order('created_at', { ascending: orderBy === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to get medical records: ${error.message}`)
    }

    return {
      records: records || [],
      total: count || 0
    }
  }

  // Get medical records by doctor ID
  async getMedicalRecordsByDoctorId(
    doctorId: string,
    options: {
      limit?: number
      offset?: number
      startDate?: string
      endDate?: string
    } = {}
  ): Promise<{ records: MedicalRecord[], total: number }> {
    const { limit = 50, offset = 0, startDate, endDate } = options

    let query = supabaseAdmin
      .from('medical_records')
      .select(`
        *,
        patient:patients(id, name, cpf),
        doctor:users(id, name, email)
      `, { count: 'exact' })
      .eq('doctor_id', doctorId)

    if (startDate) {
      query = query.gte('consultation_date', startDate)
    }
    if (endDate) {
      query = query.lte('consultation_date', endDate)
    }

    const { data: records, error, count } = await query
      .order('consultation_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to get medical records: ${error.message}`)
    }

    return {
      records: records || [],
      total: count || 0
    }
  }

  // Update medical record
  async updateMedicalRecord(id: string, data: UpdateMedicalRecordData): Promise<MedicalRecord> {
    const { data: record, error } = await supabaseAdmin
      .from('medical_records')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update medical record: ${error.message}`)
    }

    return record
  }

  // Delete medical record
  async deleteMedicalRecord(id: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('medical_records')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete medical record: ${error.message}`)
    }
  }

  // Upload attachment to Supabase Storage
  async uploadAttachment(
    recordId: string, 
    file: Buffer, 
    filename: string, 
    mimeType: string
  ): Promise<Attachment> {
    // Create unique file path
    const fileExtension = filename.split('.').pop()
    const uniqueFilename = `${recordId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`
    const filePath = `medical-records/${uniqueFilename}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('attachments')
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false
      })

    if (uploadError) {
      throw new Error(`Failed to upload file: ${uploadError.message}`)
    }

    // Create attachment record in database
    const attachmentData: CreateAttachmentData = {
      record_id: recordId,
      filename,
      file_path: uploadData.path,
      mime_type: mimeType,
      file_size: file.length
    }

    const { data: attachment, error: dbError } = await supabaseAdmin
      .from('attachments')
      .insert(attachmentData)
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabaseAdmin.storage
        .from('attachments')
        .remove([uploadData.path])
      
      throw new Error(`Failed to create attachment record: ${dbError.message}`)
    }

    return attachment
  }

  // Get attachments for a medical record
  async getAttachmentsByRecordId(recordId: string): Promise<Attachment[]> {
    const { data: attachments, error } = await supabaseAdmin
      .from('attachments')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get attachments: ${error.message}`)
    }

    return attachments || []
  }

  // Get attachment download URL
  async getAttachmentUrl(filePath: string): Promise<string> {
    const { data, error } = await supabaseAdmin.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    if (error) {
      throw new Error(`Failed to get attachment URL: ${error.message}`)
    }

    return data.signedUrl
  }

  // Delete attachment
  async deleteAttachment(attachmentId: string): Promise<void> {
    // Get attachment info first
    const { data: attachment, error: getError } = await supabaseAdmin
      .from('attachments')
      .select('file_path')
      .eq('id', attachmentId)
      .single()

    if (getError) {
      throw new Error(`Failed to get attachment: ${getError.message}`)
    }

    // Delete from storage
    const { error: storageError } = await supabaseAdmin.storage
      .from('attachments')
      .remove([attachment.file_path])

    if (storageError) {
      throw new Error(`Failed to delete file from storage: ${storageError.message}`)
    }

    // Delete from database
    const { error: dbError } = await supabaseAdmin
      .from('attachments')
      .delete()
      .eq('id', attachmentId)

    if (dbError) {
      throw new Error(`Failed to delete attachment record: ${dbError.message}`)
    }
  }

  // Search medical records by diagnosis or prescription
  async searchMedicalRecords(
    query: string,
    options: {
      patientId?: string
      doctorId?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ records: MedicalRecord[], total: number }> {
    const { patientId, doctorId, limit = 50, offset = 0 } = options

    let supabaseQuery = supabaseAdmin
      .from('medical_records')
      .select(`
        *,
        patient:patients(id, name, cpf),
        doctor:users(id, name, email)
      `, { count: 'exact' })

    // Add text search on diagnosis and prescription
    if (query.trim()) {
      supabaseQuery = supabaseQuery.or(
        `diagnosis.ilike.%${query}%,prescription.ilike.%${query}%,chief_complaint.ilike.%${query}%`
      )
    }

    if (patientId) {
      supabaseQuery = supabaseQuery.eq('patient_id', patientId)
    }

    if (doctorId) {
      supabaseQuery = supabaseQuery.eq('doctor_id', doctorId)
    }

    const { data: records, error, count } = await supabaseQuery
      .order('consultation_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      throw new Error(`Failed to search medical records: ${error.message}`)
    }

    return {
      records: records || [],
      total: count || 0
    }
  }

  // Get medical record statistics for a patient
  async getPatientMedicalStats(patientId: string): Promise<{
    totalRecords: number
    lastConsultation?: string
    commonDiagnoses: Array<{ diagnosis: string, count: number }>
  }> {
    // Get total records count
    const { count: totalRecords } = await supabaseAdmin
      .from('medical_records')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)

    // Get last consultation date
    const { data: lastRecord } = await supabaseAdmin
      .from('medical_records')
      .select('consultation_date')
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: false })
      .limit(1)
      .single()

    // Get common diagnoses (simplified - in production you might want to use a more sophisticated approach)
    const { data: records } = await supabaseAdmin
      .from('medical_records')
      .select('diagnosis')
      .eq('patient_id', patientId)
      .not('diagnosis', 'is', null)
      .not('diagnosis', 'eq', '')

    // Count diagnoses
    const diagnosisCount: Record<string, number> = {}
    records?.forEach(record => {
      if (record.diagnosis) {
        diagnosisCount[record.diagnosis] = (diagnosisCount[record.diagnosis] || 0) + 1
      }
    })

    const commonDiagnoses = Object.entries(diagnosisCount)
      .map(([diagnosis, count]) => ({ diagnosis, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5) // Top 5 diagnoses

    return {
      totalRecords: totalRecords || 0,
      lastConsultation: lastRecord?.consultation_date,
      commonDiagnoses
    }
  }
}

export const medicalRecordsService = new MedicalRecordsService()