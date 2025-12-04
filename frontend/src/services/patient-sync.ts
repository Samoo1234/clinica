/**
 * Serviço de Integração de Pacientes
 * 
 * ARQUITETURA:
 * - Banco CENTRAL: Fonte ÚNICA de dados de clientes (nome, CPF, telefone, etc.)
 * - Banco LOCAL: Apenas dados operacionais (medical_records, sem FK para patients)
 * - Banco EXTERNO: Agendamentos
 * 
 * O CPF é a chave universal de identificação!
 */

import { supabase } from '../config/supabase' // Banco LOCAL (apenas para medical_records)
import { buscarClientePorCPF, type ClienteCentral } from '../config/supabaseCentral'
import { supabaseExterno } from '../services/agendamentos-externos'

class PatientSyncService {
  /**
   * Busca histórico médico completo de um paciente por CPF
   * 1. Busca cliente no banco CENTRAL
   * 2. Busca prontuários no banco LOCAL pelo ID do cliente central
   */
  async buscarHistoricoMedicoPorCPF(cpf: string): Promise<{
    cliente: ClienteCentral | null
    prontuarios: any[]
    totalConsultas: number
    ultimaConsulta?: string
  }> {
    const cpfLimpo = cpf.replace(/\D/g, '')

    // 1. Buscar cliente no banco CENTRAL
    const cliente = await buscarClientePorCPF(cpfLimpo)

    if (!cliente) {
      console.log('⚠️ Cliente não encontrado no banco central para CPF:', cpfLimpo)
      return {
        cliente: null,
        prontuarios: [],
        totalConsultas: 0
      }
    }

    console.log('✅ Cliente encontrado no banco central:', cliente.nome)

    // 2. Buscar prontuários do paciente no banco LOCAL
    const { data: prontuarios, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', cliente.id)
      .order('consultation_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar prontuários:', error)
      return {
        cliente,
        prontuarios: [],
        totalConsultas: 0
      }
    }

    return {
      cliente,
      prontuarios: prontuarios || [],
      totalConsultas: prontuarios?.length || 0,
      ultimaConsulta: prontuarios?.[0]?.consultation_date
    }
  }

  /**
   * Atualiza o status de um agendamento no banco EXTERNO
   */
  async atualizarStatusAgendamentoExterno(
    agendamentoId: string, 
    novoStatus: 'pendente' | 'confirmado' | 'realizado' | 'cancelado' | 'faltou'
  ): Promise<boolean> {
    try {
      const { error } = await supabaseExterno
        .from('agendamentos')
        .update({ 
          status: novoStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', agendamentoId)

      if (error) {
        console.error('Erro ao atualizar status do agendamento:', error)
        return false
      }

      console.log('✅ Status do agendamento atualizado para:', novoStatus)
      return true
    } catch (err) {
      console.error('Erro ao atualizar agendamento externo:', err)
      return false
    }
  }

  /**
   * Fluxo completo de finalização de consulta
   * 1. Busca cliente no banco CENTRAL pelo CPF
   * 2. Salva prontuário no banco LOCAL (medical_records não tem FK)
   * 3. Atualiza status no banco EXTERNO
   */
  async finalizarConsulta(dados: {
    // Dados do paciente (do agendamento externo)
    paciente: {
      cpf: string
      nome: string
      telefone?: string
      email?: string
      data_nascimento?: string
    }
    // Dados da consulta
    doctor_id: string
    agendamento_id?: string
    // Dados do prontuário
    chief_complaint?: string
    anamnesis?: string
    physical_exam?: any // Exame oftalmológico
    diagnosis?: string
    prescription?: string
    follow_up_date?: string
  }): Promise<{
    success: boolean
    paciente?: ClienteCentral | null
    prontuario?: any
    error?: string
  }> {
    try {
      console.log('🏥 Iniciando finalização de consulta...')

      // 1. Buscar cliente no banco CENTRAL pelo CPF
      console.log('1️⃣ Buscando cliente no banco central...')
      let clienteCentral: ClienteCentral | null = null
      let patientId: string
      
      if (dados.paciente.cpf) {
        const cpfLimpo = dados.paciente.cpf.replace(/\D/g, '')
        clienteCentral = await buscarClientePorCPF(cpfLimpo)
        
        if (clienteCentral) {
          patientId = clienteCentral.id
          console.log('✅ Cliente encontrado no banco central:', clienteCentral.nome)
        } else {
          // Cliente não existe no central - usar ID do agendamento (que é UUID)
          if (dados.agendamento_id) {
            patientId = dados.agendamento_id
            console.warn('⚠️ Cliente não encontrado no banco central, usando ID do agendamento')
          } else {
            throw new Error('Cliente não encontrado no banco central e sem ID de agendamento')
          }
        }
      } else {
        // Sem CPF - usar ID do agendamento (que é UUID)
        if (dados.agendamento_id) {
          patientId = dados.agendamento_id
          console.warn('⚠️ Sem CPF, usando ID do agendamento como patient_id')
        } else {
          throw new Error('CPF não fornecido e sem ID de agendamento')
        }
      }

      // 2. Criar prontuário no banco LOCAL
      // Nota: FK foi removida, podemos usar qualquer ID como patient_id
      console.log('2️⃣ Salvando prontuário...')
      const { data: prontuario, error: prontuarioError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: patientId,
          doctor_id: dados.doctor_id,
          consultation_date: new Date().toISOString().split('T')[0],
          chief_complaint: dados.chief_complaint || null,
          anamnesis: dados.anamnesis || null,
          physical_exam: dados.physical_exam || {},
          diagnosis: dados.diagnosis || null,
          prescription: dados.prescription || null,
          follow_up_date: dados.follow_up_date || null
        })
        .select()
        .single()

      if (prontuarioError) {
        throw new Error(`Erro ao salvar prontuário: ${prontuarioError.message}`)
      }

      console.log('✅ Prontuário salvo:', prontuario.id)

      // 3. Atualizar status do agendamento no banco EXTERNO
      if (dados.agendamento_id) {
        console.log('3️⃣ Atualizando status do agendamento...')
        await this.atualizarStatusAgendamentoExterno(dados.agendamento_id, 'realizado')
      }

      console.log('🎉 Consulta finalizada com sucesso!')

      return {
        success: true,
        paciente: clienteCentral,
        prontuario
      }

    } catch (error: any) {
      console.error('❌ Erro ao finalizar consulta:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

export const patientSyncService = new PatientSyncService()
