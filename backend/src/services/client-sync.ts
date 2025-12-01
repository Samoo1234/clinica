/**
 * Serviço de Sincronização de Clientes entre Sistemas
 * 
 * Este serviço gerencia a sincronização de clientes entre:
 * 1. Sistema de Agendamento (Supabase Externo)
 * 2. VisionCare (Sistema principal)
 * 3. ERP (Sistema de vendas)
 */

import { supabaseAdmin, supabaseExternoAdmin } from '../config/supabase'
import { PatientService } from './patients'
import type { CreatePatientData, Patient } from '../types/database'

export interface ClienteSincronizado {
  visioncare_id: string
  agendamento_id?: string
  erp_id?: string
  nome: string
  telefone: string
  cpf?: string
  email?: string
}

export class ClientSyncService {
  /**
   * Busca cliente em todos os sistemas por CPF
   */
  static async buscarClientePorCPF(cpf: string): Promise<ClienteSincronizado | null> {
    const cleanCPF = cpf.replace(/\D/g, '')
    
    // Busca no VisionCare (sistema principal)
    const patientVisionCare = await PatientService.getPatientByCpf(cleanCPF)
    
    if (patientVisionCare) {
      return {
        visioncare_id: patientVisionCare.id,
        agendamento_id: patientVisionCare.agendamento_cliente_id,
        erp_id: patientVisionCare.erp_cliente_id,
        nome: patientVisionCare.name,
        telefone: patientVisionCare.phone,
        cpf: patientVisionCare.cpf,
        email: patientVisionCare.email
      }
    }
    
    // Se não encontrou no VisionCare, busca no sistema de agendamento
    if (supabaseExternoAdmin) {
      const { data: clienteAgendamento } = await supabaseExternoAdmin
        .from('clientes')
        .select('*')
        .eq('cpf', cleanCPF)
        .single()
      
      if (clienteAgendamento) {
        return {
          visioncare_id: '',
          agendamento_id: clienteAgendamento.id,
          nome: clienteAgendamento.nome,
          telefone: clienteAgendamento.telefone,
          cpf: clienteAgendamento.cpf,
          email: clienteAgendamento.email
        }
      }
    }
    
    return null
  }
  
  /**
   * Busca cliente em todos os sistemas por telefone
   */
  static async buscarClientePorTelefone(telefone: string): Promise<ClienteSincronizado | null> {
    const cleanPhone = telefone.replace(/\D/g, '')
    
    // Busca no VisionCare
    const { data: patientVisionCare } = await supabaseAdmin
      .from('patients')
      .select('*')
      .eq('phone', cleanPhone)
      .single()
    
    if (patientVisionCare) {
      return {
        visioncare_id: patientVisionCare.id,
        agendamento_id: patientVisionCare.agendamento_cliente_id,
        erp_id: patientVisionCare.erp_cliente_id,
        nome: patientVisionCare.name,
        telefone: patientVisionCare.phone,
        cpf: patientVisionCare.cpf,
        email: patientVisionCare.email
      }
    }
    
    // Se não encontrou no VisionCare, busca no agendamento
    if (supabaseExternoAdmin) {
      const { data: clienteAgendamento } = await supabaseExternoAdmin
        .from('clientes')
        .select('*')
        .eq('telefone', cleanPhone)
        .single()
      
      if (clienteAgendamento) {
        return {
          visioncare_id: '',
          agendamento_id: clienteAgendamento.id,
          nome: clienteAgendamento.nome,
          telefone: clienteAgendamento.telefone,
          cpf: clienteAgendamento.cpf,
          email: clienteAgendamento.email
        }
      }
    }
    
    return null
  }
  
  /**
   * Cria cliente no sistema de agendamento E no VisionCare (sincronizado)
   */
  static async criarClienteSincronizado(dadosCliente: any): Promise<ClienteSincronizado> {
    let agendamentoId: string | undefined
    let visioncareId: string
    
    // 1. Cria no sistema de agendamento primeiro (se configurado)
    if (supabaseExternoAdmin && dadosCliente.criar_no_agendamento !== false) {
      const dadosAgendamento = {
        nome: dadosCliente.nome || dadosCliente.name,
        telefone: dadosCliente.telefone || dadosCliente.phone,
        cpf: dadosCliente.cpf,
        email: dadosCliente.email,
        active: true
      }
      
      const { data: clienteAgendamento, error } = await supabaseExternoAdmin
        .from('clientes')
        .insert([dadosAgendamento])
        .select()
        .single()
      
      if (error) {
        console.error('Erro ao criar cliente no agendamento:', error)
        throw new Error(`Erro ao criar no sistema de agendamento: ${error.message}`)
      }
      
      agendamentoId = clienteAgendamento.id
      console.log('✅ Cliente criado no agendamento:', agendamentoId)
    }
    
    // 2. Cria no VisionCare com referência ao agendamento
    const dadosVisionCare: CreatePatientData = {
      name: dadosCliente.nome || dadosCliente.name,
      phone: dadosCliente.telefone || dadosCliente.phone,
      cpf: dadosCliente.cpf,
      email: dadosCliente.email,
      birth_date: dadosCliente.data_nascimento || dadosCliente.birth_date,
      address: dadosCliente.address || dadosCliente.endereco,
      agendamento_cliente_id: agendamentoId
    }
    
    const patientVisionCare = await PatientService.createPatient(dadosVisionCare)
    visioncareId = patientVisionCare.id
    console.log('✅ Cliente criado no VisionCare:', visioncareId)
    
    // 3. Atualiza o sistema de agendamento com referência ao VisionCare
    if (agendamentoId && supabaseExternoAdmin) {
      await supabaseExternoAdmin
        .from('clientes')
        .update({ visioncare_patient_id: visioncareId })
        .eq('id', agendamentoId)
      
      console.log('✅ Referência cruzada atualizada')
    }
    
    return {
      visioncare_id: visioncareId,
      agendamento_id: agendamentoId,
      nome: dadosCliente.nome || dadosCliente.name,
      telefone: dadosCliente.telefone || dadosCliente.phone,
      cpf: dadosCliente.cpf,
      email: dadosCliente.email
    }
  }
  
  /**
   * Atualiza cliente no VisionCare e sincroniza com agendamento
   */
  static async atualizarClienteSincronizado(
    visioncareId: string, 
    dadosAtualizacao: any
  ): Promise<void> {
    // 1. Atualiza no VisionCare
    await PatientService.updatePatient(visioncareId, dadosAtualizacao)
    console.log('✅ Cliente atualizado no VisionCare:', visioncareId)
    
    // 2. Busca dados atualizados
    const patient = await PatientService.getPatientById(visioncareId)
    
    // 3. Se tem referência ao agendamento, atualiza lá também
    if (patient && patient.agendamento_cliente_id && supabaseExternoAdmin) {
      const dadosAgendamento: any = {}
      
      if (dadosAtualizacao.name) dadosAgendamento.nome = dadosAtualizacao.name
      if (dadosAtualizacao.phone) dadosAgendamento.telefone = dadosAtualizacao.phone
      if (dadosAtualizacao.cpf) dadosAgendamento.cpf = dadosAtualizacao.cpf
      if (dadosAtualizacao.email) dadosAgendamento.email = dadosAtualizacao.email
      
      if (Object.keys(dadosAgendamento).length > 0) {
        await supabaseExternoAdmin
          .from('clientes')
          .update(dadosAgendamento)
          .eq('id', patient.agendamento_cliente_id)
        
        console.log('✅ Cliente atualizado no agendamento:', patient.agendamento_cliente_id)
      }
    }
  }
  
  /**
   * Vincula cliente do VisionCare ao ERP
   */
  static async vincularClienteAoERP(visioncareId: string, erpClienteId: string): Promise<void> {
    await supabaseAdmin
      .from('patients')
      .update({ erp_cliente_id: erpClienteId })
      .eq('id', visioncareId)
    
    console.log('✅ Cliente vinculado ao ERP:', { visioncareId, erpClienteId })
  }
  
  /**
   * Lista todos os clientes do agendamento que ainda não estão no VisionCare
   */
  static async listarClientesNaoSincronizados(): Promise<any[]> {
    if (!supabaseExternoAdmin) {
      return []
    }
    
    const { data: clientesAgendamento } = await supabaseExternoAdmin
      .from('clientes')
      .select('*')
      .is('visioncare_patient_id', null)
      .order('created_at', { ascending: false })
    
    return clientesAgendamento || []
  }
}












