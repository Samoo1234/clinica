import { api } from '../utils/api'
import { 
  Consultation, 
  ConsultationFilters, 
  ConsultationStats, 
  StartConsultationData,
  UpdateConsultationData,
  CompleteConsultationData
} from '../types/consultations'

class ConsultationsService {
  /**
   * Get consultations with optional filters
   */
  async getConsultations(filters: Partial<ConsultationFilters> = {}): Promise<Consultation[]> {
    try {
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status)
      if (filters.doctorId) params.append('doctorId', filters.doctorId)
      if (filters.patientName) params.append('patientName', filters.patientName)
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom)
      if (filters.dateTo) params.append('dateTo', filters.dateTo)

      const response = await api.get(`/api/consultations?${params.toString()}`) as { data: Consultation[] }
      return response.data || []
    } catch (error) {
      // Return empty array if API fails
      return []
    }
  }

  /**
   * Get consultation by ID
   */
  async getConsultation(id: string): Promise<Consultation> {
    const response = await api.get(`/api/consultations/${id}`) as { data: { consultation: Consultation } }
    return response.data.consultation
  }

  /**
   * Get consultation statistics
   */
  async getConsultationStats(): Promise<ConsultationStats> {
    try {
      const response = await api.get('/api/consultations/stats') as { data: ConsultationStats }
      return response.data
    } catch (error) {
      // Return default stats if API fails
      return {
        today: 0,
        inProgress: 0,
        completed: 0,
        pending: 0
      }
    }
  }

  /**
   * Start a new consultation from an appointment
   */
  async startConsultation(appointmentId: string, data: Partial<StartConsultationData> = {}): Promise<Consultation> {
    const response = await api.post('/consultations/start', {
      appointmentId,
      ...data
    }) as { data: { consultation: Consultation } }
    return response.data.consultation
  }

  /**
   * Update consultation data
   */
  async updateConsultation(id: string, data: UpdateConsultationData): Promise<Consultation> {
    const response = await api.put(`/api/consultations/${id}`, data) as { data: { consultation: Consultation } }
    return response.data.consultation
  }

  /**
   * Complete a consultation and create medical record
   */
  async completeConsultation(id: string, data: CompleteConsultationData): Promise<void> {
    await api.post(`/api/consultations/${id}/complete`, data)
  }

  /**
   * Cancel a consultation
   */
  async cancelConsultation(id: string, reason?: string): Promise<void> {
    await api.post(`/api/consultations/${id}/cancel`, { reason })
  }

  /**
   * Get available appointments for starting consultations
   */
  async getAvailableAppointments(): Promise<any[]> {
    const response = await api.get('/consultations/available-appointments') as { data: { appointments: any[] } }
    return response.data.appointments
  }

  /**
   * Get consultation history for a patient
   */
  async getPatientConsultations(patientId: string): Promise<Consultation[]> {
    const response = await api.get(`/api/consultations/patient/${patientId}`) as { data: { consultations: Consultation[] } }
    return response.data.consultations
  }

  /**
   * Get consultation history for a doctor
   */
  async getDoctorConsultations(doctorId: string): Promise<Consultation[]> {
    const response = await api.get(`/api/consultations/doctor/${doctorId}`) as { data: { consultations: Consultation[] } }
    return response.data.consultations
  }

  /**
   * Update vital signs during consultation
   */
  async updateVitalSigns(id: string, vitalSigns: Consultation['vitalSigns']): Promise<Consultation> {
    const response = await api.put(`/api/consultations/${id}/vital-signs`, { vitalSigns }) as { data: { consultation: Consultation } }
    return response.data.consultation
  }

  /**
   * Add notes to consultation
   */
  async addNotes(id: string, notes: string): Promise<Consultation> {
    const response = await api.put(`/api/consultations/${id}/notes`, { notes }) as { data: { consultation: Consultation } }
    return response.data.consultation
  }
}

export const consultationsService = new ConsultationsService()