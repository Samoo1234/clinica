/**
 * Serviço de Sincronização de Pacientes
 * 
 * Gerencia a sincronização entre:
 * - Banco CENTRAL (clientes compartilhados)
 * - Banco LOCAL (patients para prontuários)
 * - Banco EXTERNO (agendamentos)
 * 
 * O CPF é a chave universal de sincronização!
 */

import { supabase } from '../config/supabase' // Banco LOCAL
import { supabaseCentral, buscarClientePorCPF, type ClienteCentral } from '../config/supabaseCentral'
import { supabaseExterno } from '../services/agendamentos-externos'

// Tipo do paciente no banco LOCAL
export interface PatientLocal {
  id: string
  cpf: string
  name: string
  birth_date?: string
  phone?: string
  email?: string
  address?: any
  nome_pai?: string
  nome_mae?: string
  created_at?: string
  updated_at?: string
}

// Dados mínimos para criar um paciente local
export interface DadosPacienteMinimo {
  cpf: string
  nome: string
  telefone?: string
  email?: string
  data_nascimento?: string
}

class PatientSyncService {
  /**
   * Busca ou cria um paciente no banco LOCAL a partir do CPF
   * Esta é a função principal de sincronização!
   */
  async sincronizarPacienteLocal(dados: DadosPacienteMinimo): Promise<PatientLocal> {
    if (!dados.cpf) {
      throw new Error('CPF é obrigatório para sincronização')
    }

    const cpfLimpo = dados.cpf.replace(/\D/g, '')
    
    // 1. Verificar se já existe no banco LOCAL
    const pacienteExistente = await this.buscarPacienteLocalPorCPF(cpfLimpo)
    
    if (pacienteExistente) {
      console.log('✅ Paciente já existe no banco LOCAL:', pacienteExistente.name)
      return pacienteExistente
    }

    // 2. Não existe, criar novo paciente no banco LOCAL
    console.log('📝 Criando paciente no banco LOCAL:', dados.nome)
    
    const novoPaciente = await this.criarPacienteLocal({
      cpf: cpfLimpo,
      nome: dados.nome,
      telefone: dados.telefone,
      email: dados.email,
      data_nascimento: dados.data_nascimento
    })

    return novoPaciente
  }

  /**
   * Busca paciente no banco LOCAL por CPF
   */
  async buscarPacienteLocalPorCPF(cpf: string): Promise<PatientLocal | null> {
    const cpfLimpo = cpf.replace(/\D/g, '')

    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('cpf', cpfLimpo)
      .maybeSingle()

    if (error) {
      console.error('Erro ao buscar paciente local por CPF:', error)
      return null
    }

    return data
  }

  /**
   * Busca paciente no banco LOCAL por ID
   */
  async buscarPacienteLocalPorId(id: string): Promise<PatientLocal | null> {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('Erro ao buscar paciente local por ID:', error)
      return null
    }

    return data
  }

  /**
   * Cria um novo paciente no banco LOCAL
   */
  async criarPacienteLocal(dados: DadosPacienteMinimo): Promise<PatientLocal> {
    const cpfLimpo = dados.cpf.replace(/\D/g, '')

    const { data, error } = await supabase
      .from('patients')
      .insert({
        cpf: cpfLimpo,
        name: dados.nome,
        phone: dados.telefone || '',
        email: dados.email || null,
        birth_date: dados.data_nascimento || null,
        address: {},
        insurance_info: {},
        emergency_contact: {}
      })
      .select()
      .single()

    if (error) {
      console.error('Erro ao criar paciente local:', error)
      throw new Error(`Erro ao criar paciente: ${error.message}`)
    }

    console.log('✅ Paciente criado no banco LOCAL:', data.name, data.id)
    return data
  }

  /**
   * Busca histórico médico completo de um paciente por CPF
   * Útil quando o paciente retorna para nova consulta
   */
  async buscarHistoricoMedicoPorCPF(cpf: string): Promise<{
    paciente: PatientLocal | null
    prontuarios: any[]
    totalConsultas: number
    ultimaConsulta?: string
  }> {
    const cpfLimpo = cpf.replace(/\D/g, '')

    // 1. Buscar paciente local
    const paciente = await this.buscarPacienteLocalPorCPF(cpfLimpo)

    if (!paciente) {
      return {
        paciente: null,
        prontuarios: [],
        totalConsultas: 0
      }
    }

    // 2. Buscar prontuários do paciente
    const { data: prontuarios, error } = await supabase
      .from('medical_records')
      .select('*')
      .eq('patient_id', paciente.id)
      .order('consultation_date', { ascending: false })

    if (error) {
      console.error('Erro ao buscar prontuários:', error)
      return {
        paciente,
        prontuarios: [],
        totalConsultas: 0
      }
    }

    return {
      paciente,
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
   * 1. Sincroniza paciente no banco LOCAL
   * 2. Salva prontuário no banco LOCAL
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
    paciente?: PatientLocal
    prontuario?: any
    error?: string
  }> {
    try {
      console.log('🏥 Iniciando finalização de consulta...')

      // 1. Sincronizar paciente no banco LOCAL
      console.log('1️⃣ Sincronizando paciente...')
      const paciente = await this.sincronizarPacienteLocal(dados.paciente)

      // 2. Criar prontuário no banco LOCAL
      console.log('2️⃣ Salvando prontuário...')
      const { data: prontuario, error: prontuarioError } = await supabase
        .from('medical_records')
        .insert({
          patient_id: paciente.id,
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
        paciente,
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
