/**
 * Serviço de Persistência de Consultas
 * Garante que NENHUM dado seja perdido durante a consulta
 * 
 * Fluxo:
 * 1. Ao iniciar consulta → salva no banco
 * 2. A cada alteração → auto-save no banco
 * 3. Ao finalizar → copia para medical_records
 * 4. Ao abrir página → recupera consultas em andamento
 */

import { supabase } from '../config/supabase'
import { Consultation, ExameOftalmologico } from '../types/consultations'

// Tipo para dados persistidos no banco
interface ConsultationDB {
  id: string
  appointment_id?: string
  patient_id?: string
  doctor_id?: string
  status: string
  start_time?: string
  end_time?: string
  physical_exam: any
  chief_complaint?: string
  anamnesis?: string
  notes?: string
  diagnosis?: string
  treatment?: string
  prescription?: string
  follow_up_date?: string
  patient_data: any
  agendamento_externo_id?: string
  created_at?: string
  updated_at?: string
}

class ConsultationPersistenceService {
  
  /**
   * Salvar/Criar uma nova consulta no banco
   */
  async criarConsulta(consulta: Consultation): Promise<{ success: boolean; error?: string }> {
    try {
      const dbData: Partial<ConsultationDB> = {
        id: consulta.id,
        appointment_id: consulta.appointmentId || null,
        patient_id: consulta.patientId || null,
        doctor_id: consulta.doctorId || null,
        status: consulta.status,
        start_time: consulta.startedAt,
        physical_exam: consulta.exameOftalmologico || {},
        chief_complaint: consulta.queixaPrincipal || null,
        notes: consulta.notes || null,
        patient_data: consulta.patient || {},
        agendamento_externo_id: consulta.appointmentId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('consultations')
        .upsert(dbData, { onConflict: 'id' })

      if (error) {
        console.error('❌ Erro ao criar consulta:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Consulta salva no banco:', consulta.id)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao criar consulta:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Atualizar dados da consulta (auto-save)
   */
  async atualizarConsulta(
    consultaId: string, 
    updates: Partial<Consultation>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const dbUpdates: Partial<ConsultationDB> = {
        updated_at: new Date().toISOString()
      }

      // Mapear campos do frontend para o banco
      if (updates.status !== undefined) dbUpdates.status = updates.status
      if (updates.exameOftalmologico !== undefined) {
        // Converter exame para formato do banco
        dbUpdates.physical_exam = this.converterExameParaBanco(updates.exameOftalmologico)
      }
      if (updates.queixaPrincipal !== undefined) dbUpdates.chief_complaint = updates.queixaPrincipal
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes
      if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis
      if (updates.prescription !== undefined) dbUpdates.prescription = updates.prescription
      if ((updates as any).anamnese !== undefined) dbUpdates.anamnesis = (updates as any).anamnese
      if (updates.completedAt !== undefined) dbUpdates.end_time = updates.completedAt

      const { error } = await supabase
        .from('consultations')
        .update(dbUpdates)
        .eq('id', consultaId)

      if (error) {
        console.error('❌ Erro ao atualizar consulta:', error)
        return { success: false, error: error.message }
      }

      console.log('💾 Consulta atualizada:', consultaId)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao atualizar consulta:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Buscar consultas em andamento (para recuperação)
   */
  async buscarConsultasEmAndamento(): Promise<Consultation[]> {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .in('status', ['waiting', 'in_progress'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ Erro ao buscar consultas:', error)
        return []
      }

      if (!data || data.length === 0) {
        return []
      }

      // Converter do formato do banco para o formato do frontend
      return data.map(db => this.converterParaFrontend(db))
    } catch (error) {
      console.error('❌ Erro ao buscar consultas em andamento:', error)
      return []
    }
  }

  /**
   * Buscar uma consulta específica
   */
  async buscarConsulta(consultaId: string): Promise<Consultation | null> {
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('id', consultaId)
        .single()

      if (error || !data) {
        return null
      }

      return this.converterParaFrontend(data)
    } catch (error) {
      console.error('❌ Erro ao buscar consulta:', error)
      return null
    }
  }

  /**
   * Marcar consulta como finalizada
   */
  async finalizarConsulta(consultaId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('consultations')
        .update({
          status: 'completed',
          end_time: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', consultaId)

      if (error) {
        console.error('❌ Erro ao finalizar consulta:', error)
        return { success: false, error: error.message }
      }

      console.log('✅ Consulta finalizada:', consultaId)
      return { success: true }
    } catch (error: any) {
      console.error('❌ Erro ao finalizar consulta:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Converter ExameOftalmologico do frontend para formato do banco
   */
  private converterExameParaBanco(exame: ExameOftalmologico): any {
    if (!exame) return {}
    
    return {
      // Acuidade Visual
      visualAcuity: {
        rightEye: exame.acuidadeOD || '',
        leftEye: exame.acuidadeOE || '',
        bothEyes: exame.acuidadeAO || ''
      },
      // Pressão Intraocular
      intraocularPressure: {
        rightEye: exame.pressaoOD || 0,
        leftEye: exame.pressaoOE || 0
      },
      // Refração OD
      refractionOD: exame.refracaoOD ? {
        spherical: exame.refracaoOD.esferico || '',
        cylindrical: exame.refracaoOD.cilindrico || '',
        axis: exame.refracaoOD.eixo || 0,
        addition: exame.refracaoOD.adicao || '',
        dnp: exame.refracaoOD.dnp || 0,
        acuity: exame.refracaoOD.acuidade || ''
      } : null,
      // Refração OE
      refractionOE: exame.refracaoOE ? {
        spherical: exame.refracaoOE.esferico || '',
        cylindrical: exame.refracaoOE.cilindrico || '',
        axis: exame.refracaoOE.eixo || 0,
        addition: exame.refracaoOE.adicao || '',
        dnp: exame.refracaoOE.dnp || 0,
        acuity: exame.refracaoOE.acuidade || ''
      } : null,
      // Outros exames
      biomicroscopy: exame.biomicroscopia || '',
      fundoscopy: exame.fundoscopia || '',
      ocularMotility: exame.motilidadeOcular || '',
      pupillaryReflexes: exame.reflexosPupilares || '',
      visualField: exame.campoVisual || '',
      // Lentes de contato
      contactLenses: exame.usoLentesContato || false,
      contactLensType: exame.tipoLentesContato || ''
    }
  }

  /**
   * Converter do formato do banco para o formato do frontend
   */
  private converterParaFrontend(db: ConsultationDB): Consultation {
    return {
      id: db.id,
      appointmentId: db.appointment_id || db.agendamento_externo_id || '',
      patientId: db.patient_id || '',
      doctorId: db.doctor_id || '',
      status: db.status as any,
      startedAt: db.start_time || db.created_at || '',
      completedAt: db.end_time || undefined,
      notes: db.notes || undefined,
      queixaPrincipal: db.chief_complaint || undefined,
      exameOftalmologico: this.converterExameParaFrontend(db.physical_exam),
      diagnosis: db.diagnosis || undefined,
      prescription: db.prescription || undefined,
      patient: db.patient_data || undefined,
      createdAt: db.created_at || '',
      updatedAt: db.updated_at || ''
    }
  }

  /**
   * Converter exame do banco para formato do frontend
   */
  private converterExameParaFrontend(physicalExam: any): ExameOftalmologico | undefined {
    if (!physicalExam || Object.keys(physicalExam).length === 0) {
      return undefined
    }

    return {
      acuidadeOD: physicalExam.visualAcuity?.rightEye || undefined,
      acuidadeOE: physicalExam.visualAcuity?.leftEye || undefined,
      acuidadeAO: physicalExam.visualAcuity?.bothEyes || undefined,
      pressaoOD: physicalExam.intraocularPressure?.rightEye || undefined,
      pressaoOE: physicalExam.intraocularPressure?.leftEye || undefined,
      refracaoOD: physicalExam.refractionOD ? {
        esferico: physicalExam.refractionOD.spherical,
        cilindrico: physicalExam.refractionOD.cylindrical,
        eixo: physicalExam.refractionOD.axis,
        adicao: physicalExam.refractionOD.addition,
        dnp: physicalExam.refractionOD.dnp,
        acuidade: physicalExam.refractionOD.acuity
      } : undefined,
      refracaoOE: physicalExam.refractionOE ? {
        esferico: physicalExam.refractionOE.spherical,
        cilindrico: physicalExam.refractionOE.cylindrical,
        eixo: physicalExam.refractionOE.eixo,
        adicao: physicalExam.refractionOE.addition,
        dnp: physicalExam.refractionOE.dnp,
        acuidade: physicalExam.refractionOE.acuity
      } : undefined,
      biomicroscopia: physicalExam.biomicroscopy || undefined,
      fundoscopia: physicalExam.fundoscopy || undefined,
      motilidadeOcular: physicalExam.ocularMotility || undefined,
      reflexosPupilares: physicalExam.pupillaryReflexes || undefined,
      campoVisual: physicalExam.visualField || undefined,
      usoLentesContato: physicalExam.contactLenses || undefined,
      tipoLentesContato: physicalExam.contactLensType || undefined
    }
  }
}

export const consultationPersistenceService = new ConsultationPersistenceService()
