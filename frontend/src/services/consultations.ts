import { api } from '../utils/api'
import { 
  Consultation, 
  ConsultationFilters, 
  ConsultationStats, 
  StartConsultationData,
  UpdateConsultationData,
  CompleteConsultationData,
  ExameOftalmologico
} from '../types/consultations'
import { medicalRecordsService } from './medical-records'
import { buscarClientePorCPF, buscarClientePorTelefone } from '../config/supabaseCentral'

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

  /**
   * Normaliza telefone removendo caracteres não numéricos
   */
  private normalizePhone(phone: string): string {
    return phone.replace(/\D/g, '')
  }

  /**
   * Start consultation from external appointment
   * Busca cliente no banco CENTRAL e cria prontuário
   */
  async startFromExternalAppointment(agendamentoExterno: {
    id: string
    nome: string
    telefone: string
    cpf?: string
    data: string
    horario: string
    medico?: { id: string; nome: string; especialidade?: string }
  }): Promise<Consultation & { prontuarioId?: string }> {
    // Médico vem do agendamento externo
    const doctorId = agendamentoExterno.medico?.id
    console.log('👨‍⚕️ Médico do agendamento:', agendamentoExterno.medico?.nome, '| ID:', doctorId)
    
    // Buscar cliente no banco CENTRAL pelo CPF primeiro, depois telefone
    let patientId: string | undefined
    let clienteNome: string = agendamentoExterno.nome
    
    try {
      // Primeiro tenta por CPF (mais confiável)
      if (agendamentoExterno.cpf) {
        const cpfNormalizado = agendamentoExterno.cpf.replace(/\D/g, '')
        const clientePorCpf = await buscarClientePorCPF(cpfNormalizado)
        if (clientePorCpf) {
          patientId = clientePorCpf.id
          clienteNome = clientePorCpf.nome
          console.log('✅ Cliente encontrado no banco CENTRAL por CPF:', clientePorCpf.nome)
        }
      }
      
      // Se não encontrou por CPF, tenta por telefone
      if (!patientId && agendamentoExterno.telefone) {
        const telefoneNormalizado = this.normalizePhone(agendamentoExterno.telefone)
        const clientePorTel = await buscarClientePorTelefone(telefoneNormalizado)
        if (clientePorTel) {
          patientId = clientePorTel.id
          clienteNome = clientePorTel.nome
          console.log('✅ Cliente encontrado no banco CENTRAL por telefone:', clientePorTel.nome)
        }
      }
      
      // Se não encontrou, usar ID do agendamento como fallback
      if (!patientId) {
        patientId = agendamentoExterno.id
        console.warn('⚠️ Cliente não encontrado no banco CENTRAL, usando ID do agendamento')
      }
    } catch (error) {
      console.error('❌ Erro ao buscar cliente no banco CENTRAL:', error)
      patientId = agendamentoExterno.id
    }

    // Criar prontuário no banco LOCAL (medical_records)
    let prontuarioId: string | undefined
    if (patientId && doctorId) {
      try {
        const prontuario = await medicalRecordsService.createMedicalRecord({
          patient_id: patientId,
          doctor_id: doctorId,
          consultation_date: agendamentoExterno.data
        })
        prontuarioId = prontuario.id
        console.log('✅ Prontuário criado:', prontuarioId)
      } catch (error) {
        console.error('❌ Erro ao criar prontuário:', error)
      }
    } else {
      if (!doctorId) console.warn('⚠️ Médico não definido no agendamento')
    }

    // Criar objeto de consulta
    const consultation: Consultation & { prontuarioId?: string } = {
      id: prontuarioId || `local-${Date.now()}`,
      prontuarioId,
      appointmentId: agendamentoExterno.id,
      patientId: patientId || agendamentoExterno.telefone,
      doctorId: doctorId || 'default',
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      patient: {
        id: patientId || agendamentoExterno.telefone,
        name: agendamentoExterno.nome,
        cpf: agendamentoExterno.cpf || '',
        birthDate: '',
        phone: agendamentoExterno.telefone
      },
      doctor: agendamentoExterno.medico ? {
        id: doctorId || agendamentoExterno.medico.id,
        name: agendamentoExterno.medico.nome
      } : undefined,
      appointment: {
        id: agendamentoExterno.id,
        scheduledAt: `${agendamentoExterno.data}T${agendamentoExterno.horario}`,
        duration: 30
      }
    }
    
    return consultation
  }

  /**
   * Atualizar exame oftalmológico no prontuário
   */
  async updateExameOftalmologico(prontuarioId: string, exame: ExameOftalmologico): Promise<void> {
    try {
      await medicalRecordsService.updateMedicalRecord(prontuarioId, {
        physical_exam: exame
      })
      console.log('✅ Exame oftalmológico salvo no prontuário')
    } catch (error) {
      console.error('Erro ao salvar exame:', error)
      throw error
    }
  }

  /**
   * Finalizar consulta e salvar diagnóstico/prescrição no prontuário
   */
  async finalizarConsulta(
    prontuarioId: string, 
    dados: {
      diagnosis: string
      prescription?: string
      notes?: string
      followUpDate?: string
      exame?: ExameOftalmologico
    }
  ): Promise<void> {
    try {
      await medicalRecordsService.updateMedicalRecord(prontuarioId, {
        diagnosis: dados.diagnosis,
        prescription: dados.prescription,
        chief_complaint: dados.notes,
        follow_up_date: dados.followUpDate,
        physical_exam: dados.exame
      })
      console.log('✅ Consulta finalizada e prontuário salvo')
    } catch (error) {
      console.error('Erro ao finalizar consulta:', error)
      throw error
    }
  }

  /**
   * Buscar histórico de prontuários do paciente
   */
  async getHistoricoPaciente(patientId: string): Promise<any[]> {
    const { records } = await medicalRecordsService.getMedicalRecordsByPatientId(patientId)
    return records
  }
}

export const consultationsService = new ConsultationsService()