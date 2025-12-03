import { MedicalRecord, PhysicalExam } from '../types/database'
import { supabase } from '../config/supabase'

export interface CreateMedicalRecordData {
  patient_id: string
  doctor_id: string
  consultation_date?: string
  chief_complaint?: string
  anamnesis?: string
  physical_exam?: PhysicalExam
  diagnosis?: string
  prescription?: string
  follow_up_date?: string
}

export interface UpdateMedicalRecordData {
  chief_complaint?: string
  anamnesis?: string
  physical_exam?: PhysicalExam
  diagnosis?: string
  prescription?: string
  follow_up_date?: string
}

class MedicalRecordsService {
  // Create a new medical record
  async createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        ...data,
        consultation_date: data.consultation_date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar prontuário:', error)
      throw new Error('Failed to create medical record')
    }

    return record
  }

  // Get medical record by ID
  async getMedicalRecordById(id: string): Promise<MedicalRecord> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar prontuário:', error)
      throw new Error('Failed to get medical record')
    }

    return data
  }

  // Get medical records by patient ID
  async getMedicalRecordsByPatientId(
    patientId: string,
    options: {
      limit?: number
      offset?: number
      orderBy?: 'asc' | 'desc'
    } = {}
  ): Promise<{ records: MedicalRecord[], total: number }> {
    const { limit = 50, offset = 0, orderBy = 'desc' } = options

    const { data, error, count } = await supabase
      .from('medical_records')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: orderBy === 'asc' })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar prontuários:', error)
      throw new Error('Failed to get medical records')
    }

    return {
      records: data || [],
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

    let query = supabase
      .from('medical_records')
      .select('*', { count: 'exact' })
      .eq('doctor_id', doctorId)

    if (startDate) query = query.gte('consultation_date', startDate)
    if (endDate) query = query.lte('consultation_date', endDate)

    const { data, error, count } = await query
      .order('consultation_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar prontuários:', error)
      throw new Error('Failed to get medical records')
    }

    return {
      records: data || [],
      total: count || 0
    }
  }

  // Update medical record
  async updateMedicalRecord(id: string, data: UpdateMedicalRecordData): Promise<MedicalRecord> {
    const { data: record, error } = await supabase
      .from('medical_records')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Erro ao atualizar prontuário:', error)
      throw new Error('Failed to update medical record')
    }

    return record
  }

  // Delete medical record
  async deleteMedicalRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('medical_records')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Erro ao deletar prontuário:', error)
      throw new Error('Failed to delete medical record')
    }
  }

  // Search medical records
  async searchMedicalRecords(
    query: string,
    options: {
      patientId?: string
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ records: MedicalRecord[], total: number }> {
    const { patientId, limit = 50, offset = 0 } = options

    let queryBuilder = supabase
      .from('medical_records')
      .select('*', { count: 'exact' })

    if (patientId) queryBuilder = queryBuilder.eq('patient_id', patientId)
    
    // Busca por diagnóstico ou queixa
    queryBuilder = queryBuilder.or(`diagnosis.ilike.%${query}%,chief_complaint.ilike.%${query}%`)

    const { data, error, count } = await queryBuilder
      .order('consultation_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Erro ao buscar prontuários:', error)
      return { records: [], total: 0 }
    }

    return {
      records: data || [],
      total: count || 0
    }
  }

  // Get patient medical statistics
  async getPatientMedicalStats(patientId: string): Promise<{
    totalRecords: number
    lastConsultation?: string
    commonDiagnoses: Array<{ diagnosis: string, count: number }>
  }> {
    const { data, error } = await supabase
      .from('medical_records')
      .select('consultation_date, diagnosis')
      .eq('patient_id', patientId)
      .order('consultation_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar estatísticas:', error)
      return { totalRecords: 0, commonDiagnoses: [] }
    }

    const records = data || []
    
    // Conta diagnósticos
    const diagnosisCount: Record<string, number> = {}
    records.forEach(r => {
      if (r.diagnosis) {
        diagnosisCount[r.diagnosis] = (diagnosisCount[r.diagnosis] || 0) + 1
      }
    })

    return {
      totalRecords: records.length,
      lastConsultation: records[0]?.consultation_date,
      commonDiagnoses: Object.entries(diagnosisCount)
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
  }

  // Helper method to create default ophthalmology physical exam structure
  createDefaultPhysicalExam(): PhysicalExam {
    return {
      visualAcuity: {
        rightEye: '',
        leftEye: ''
      },
      intraocularPressure: {
        rightEye: 0,
        leftEye: 0
      },
      fundoscopy: '',
      biomicroscopy: ''
    }
  }

  // Helper method to format consultation date for display
  formatConsultationDate(dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Helper method to format file size for display
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // ==================== MÉTODOS DE ANEXOS ====================

  // Get attachments by medical record ID
  async getAttachmentsByRecordId(recordId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('attachments')
      .select('*')
      .eq('record_id', recordId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao buscar anexos:', error)
      return []
    }

    return data || []
  }

  // Upload attachment to storage and create record
  async uploadAttachment(recordId: string, file: File): Promise<any> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${recordId}/${Date.now()}.${fileExt}`
    const filePath = `medical-records/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('attachments')
      .upload(filePath, file)

    if (uploadError) {
      console.error('Erro ao fazer upload:', uploadError)
      throw new Error('Failed to upload attachment')
    }

    // Create attachment record
    const { data, error } = await supabase
      .from('attachments')
      .insert({
        record_id: recordId,
        filename: file.name,
        file_path: filePath,
        mime_type: file.type,
        file_size: file.size
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao salvar anexo:', error)
      throw new Error('Failed to save attachment record')
    }

    return data
  }

  // Get download URL for attachment
  async getAttachmentDownloadUrl(filePath: string): Promise<string> {
    const { data } = await supabase.storage
      .from('attachments')
      .createSignedUrl(filePath, 3600) // 1 hour expiry

    return data?.signedUrl || ''
  }

  // Delete attachment
  async deleteAttachment(attachmentId: string, filePath: string): Promise<void> {
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('attachments')
      .remove([filePath])

    if (storageError) {
      console.error('Erro ao deletar arquivo:', storageError)
    }

    // Delete record
    const { error } = await supabase
      .from('attachments')
      .delete()
      .eq('id', attachmentId)

    if (error) {
      console.error('Erro ao deletar anexo:', error)
      throw new Error('Failed to delete attachment')
    }
  }
}

export const medicalRecordsService = new MedicalRecordsService()