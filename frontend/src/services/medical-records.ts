import { MedicalRecord, PhysicalExam, Attachment } from '../types/database'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

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

export interface MedicalRecordsResponse {
  success: boolean
  data: MedicalRecord[]
  pagination?: {
    total: number
    limit: number
    offset: number
  }
}

export interface MedicalRecordResponse {
  success: boolean
  data: MedicalRecord
}

export interface AttachmentsResponse {
  success: boolean
  data: Attachment[]
}

export interface AttachmentResponse {
  success: boolean
  data: Attachment
}

export interface PatientStatsResponse {
  success: boolean
  data: {
    totalRecords: number
    lastConsultation?: string
    commonDiagnoses: Array<{ diagnosis: string, count: number }>
  }
}

class MedicalRecordsService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  private async getAuthHeadersForUpload(): Promise<HeadersInit> {
    const token = localStorage.getItem('token')
    return {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // Create a new medical record
  async createMedicalRecord(data: CreateMedicalRecordData): Promise<MedicalRecord> {
    const response = await fetch(`${API_BASE_URL}/api/medical-records`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create medical record')
    }

    const result: MedicalRecordResponse = await response.json()
    return result.data
  }

  // Get medical record by ID
  async getMedicalRecordById(id: string): Promise<MedicalRecord> {
    const response = await fetch(`${API_BASE_URL}/api/medical-records/${id}`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get medical record')
    }

    const result: MedicalRecordResponse = await response.json()
    return result.data
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
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
      orderBy
    })

    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/patient/${patientId}?${params}`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get medical records')
    }

    const result: MedicalRecordsResponse = await response.json()
    return {
      records: result.data,
      total: result.pagination?.total || 0
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
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })

    if (startDate) params.append('startDate', startDate)
    if (endDate) params.append('endDate', endDate)

    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/doctor/${doctorId}?${params}`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get medical records')
    }

    const result: MedicalRecordsResponse = await response.json()
    return {
      records: result.data,
      total: result.pagination?.total || 0
    }
  }

  // Update medical record
  async updateMedicalRecord(id: string, data: UpdateMedicalRecordData): Promise<MedicalRecord> {
    const response = await fetch(`${API_BASE_URL}/api/medical-records/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update medical record')
    }

    const result: MedicalRecordResponse = await response.json()
    return result.data
  }

  // Delete medical record
  async deleteMedicalRecord(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/medical-records/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete medical record')
    }
  }

  // Upload attachment to medical record
  async uploadAttachment(recordId: string, file: File): Promise<Attachment> {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/${recordId}/attachments`,
      {
        method: 'POST',
        headers: await this.getAuthHeadersForUpload(),
        body: formData
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to upload attachment')
    }

    const result: AttachmentResponse = await response.json()
    return result.data
  }

  // Get attachments for medical record
  async getAttachmentsByRecordId(recordId: string): Promise<Attachment[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/${recordId}/attachments`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get attachments')
    }

    const result: AttachmentsResponse = await response.json()
    return result.data
  }

  // Get attachment download URL
  async getAttachmentDownloadUrl(attachmentId: string): Promise<{
    downloadUrl: string
    filename: string
    mimeType: string
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/attachments/${attachmentId}/download`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get download URL')
    }

    const result = await response.json()
    return result.data
  }

  // Delete attachment
  async deleteAttachment(attachmentId: string): Promise<void> {
    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/attachments/${attachmentId}`,
      {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to delete attachment')
    }
  }

  // Search medical records
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
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })

    if (patientId) params.append('patientId', patientId)
    if (doctorId) params.append('doctorId', doctorId)

    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/search/${encodeURIComponent(query)}?${params}`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to search medical records')
    }

    const result: MedicalRecordsResponse = await response.json()
    return {
      records: result.data,
      total: result.pagination?.total || 0
    }
  }

  // Get patient medical statistics
  async getPatientMedicalStats(patientId: string): Promise<{
    totalRecords: number
    lastConsultation?: string
    commonDiagnoses: Array<{ diagnosis: string, count: number }>
  }> {
    const response = await fetch(
      `${API_BASE_URL}/api/medical-records/patient/${patientId}/stats`,
      {
        method: 'GET',
        headers: await this.getAuthHeaders()
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get patient statistics')
    }

    const result: PatientStatsResponse = await response.json()
    return result.data
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
}

export const medicalRecordsService = new MedicalRecordsService()