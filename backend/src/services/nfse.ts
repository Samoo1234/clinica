import { supabase } from '../config/supabase';
import axios, { AxiosResponse } from 'axios';

// Interfaces para dados da NFS-e
export interface NFSeConfig {
  id: string;
  provider_name: string;
  api_url: string;
  api_key: string;
  certificate_path?: string;
  certificate_password?: string;
  city_code: string;
  cnpj: string;
  municipal_inscription?: string;
  service_code: string;
  tax_rate: number;
  active: boolean;
}

export interface Invoice {
  id: string;
  appointment_id: string;
  nfse_number?: string;
  nfse_verification_code?: string;
  nfse_url?: string;
  amount: number;
  service_description: string;
  tax_amount: number;
  net_amount: number;
  issue_date?: Date;
  due_date?: Date;
  status: 'pending' | 'processing' | 'issued' | 'error' | 'cancelled';
  error_message?: string;
  retry_count: number;
  nfse_data?: any;
}

export interface NFSeRequest {
  appointment_id: string;
  amount: number;
  service_description: string;
  patient_data: {
    name: string;
    cpf: string;
    email?: string;
    address?: any;
  };
  doctor_data: {
    name: string;
    cpf: string;
  };
}

export interface NFSeResponse {
  success: boolean;
  nfse_number?: string;
  verification_code?: string;
  url?: string;
  error_message?: string;
  raw_data?: any;
}

export class NFSeService {
  private config: NFSeConfig | null = null;

  // Carregar configuração ativa
  private async loadConfig(): Promise<NFSeConfig> {
    if (this.config) {
      return this.config;
    }

    const { data, error } = await supabase
      .from('nfse_config')
      .select('*')
      .eq('active', true)
      .single();

    if (error || !data) {
      // Retornar configuração mock para desenvolvimento
      const mockConfig: NFSeConfig = {
        id: 'mock-config',
        provider_name: 'Mock Provider',
        api_url: 'https://api.mock-nfse.com',
        api_key: 'mock-api-key',
        city_code: '3550308',
        cnpj: '00.000.000/0001-00',
        municipal_inscription: '123456789',
        service_code: '14.01',
        tax_rate: 5.0,
        active: true
      };
      
      this.config = mockConfig;
      return mockConfig;
    }

    this.config = data;
    return data;
  }

  // Emitir nota fiscal
  async issueInvoice(request: NFSeRequest): Promise<Invoice> {
    const config = await this.loadConfig();
    
    // Calcular impostos
    const taxCalculation = await this.calculateTaxes(request.amount);
    
    // Criar registro da invoice no banco
    const invoice = await this.createInvoiceRecord({
      appointment_id: request.appointment_id,
      amount: request.amount,
      service_description: request.service_description,
      tax_amount: taxCalculation.tax_amount,
      net_amount: taxCalculation.net_amount,
      status: 'processing'
    });

    try {
      // Chamar API do emissor
      const nfseResponse = await this.callNFSeAPI(config, request, invoice);
      
      if (nfseResponse.success) {
        // Atualizar invoice com dados da NFS-e emitida
        const updatedInvoice = await this.updateInvoiceSuccess(invoice.id, nfseResponse);
        
        // Log da operação bem-sucedida
        await this.logOperation(invoice.id, 'issue', request, nfseResponse, 'success');
        
        return updatedInvoice;
      } else {
        // Atualizar invoice com erro
        await this.updateInvoiceError(invoice.id, nfseResponse.error_message || 'Erro desconhecido');
        
        // Log da operação com erro
        await this.logOperation(invoice.id, 'issue', request, nfseResponse, 'error', nfseResponse.error_message);
        
        throw new Error(nfseResponse.error_message || 'Erro ao emitir NFS-e');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      // Atualizar invoice com erro
      await this.updateInvoiceError(invoice.id, errorMessage);
      
      // Log da operação com erro
      await this.logOperation(invoice.id, 'issue', request, null, 'error', errorMessage);
      
      throw error;
    }
  }

  // Calcular impostos
  private async calculateTaxes(amount: number): Promise<{ tax_amount: number; net_amount: number }> {
    const { data, error } = await supabase
      .rpc('calculate_invoice_taxes', { gross_amount: amount });

    if (error || !data || data.length === 0) {
      // Fallback: calcular com taxa padrão de 5%
      const tax_amount = Math.round(amount * 0.05 * 100) / 100;
      const net_amount = amount - tax_amount;
      return { tax_amount, net_amount };
    }

    return data[0];
  }

  // Criar registro da invoice no banco
  private async createInvoiceRecord(invoiceData: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoiceData])
      .select()
      .single();

    if (error || !data) {
      throw new Error('Erro ao criar registro da nota fiscal');
    }

    return data;
  }

  // Chamar API do emissor de NFS-e
  private async callNFSeAPI(
    config: NFSeConfig, 
    request: NFSeRequest, 
    invoice: Invoice
  ): Promise<NFSeResponse> {
    const startTime = Date.now();
    
    try {
      // Preparar dados para a API do emissor
      const apiPayload = {
        prestador: {
          cnpj: config.cnpj,
          inscricao_municipal: config.municipal_inscription
        },
        tomador: {
          nome: request.patient_data.name,
          cpf: request.patient_data.cpf,
          email: request.patient_data.email
        },
        servico: {
          codigo: config.service_code,
          descricao: request.service_description,
          valor: request.amount,
          aliquota_iss: config.tax_rate
        },
        numero_rps: invoice.id,
        data_emissao: new Date().toISOString()
      };

      // Fazer chamada para API
      const response: AxiosResponse = await axios.post(
        `${config.api_url}/nfse/emitir`,
        apiPayload,
        {
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 segundos
        }
      );

      const processingTime = Date.now() - startTime;

      if (response.status === 200 && response.data.sucesso) {
        return {
          success: true,
          nfse_number: response.data.numero_nfse,
          verification_code: response.data.codigo_verificacao,
          url: response.data.url_visualizacao,
          raw_data: response.data
        };
      } else {
        return {
          success: false,
          error_message: response.data.erro || 'Erro na emissão da NFS-e',
          raw_data: response.data
        };
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const errorMessage = error.response?.data?.erro || error.message;
        return {
          success: false,
          error_message: `Erro na API: ${errorMessage}`,
          raw_data: error.response?.data
        };
      }
      
      return {
        success: false,
        error_message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  // Atualizar invoice com sucesso
  private async updateInvoiceSuccess(invoiceId: string, response: NFSeResponse): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update({
        nfse_number: response.nfse_number,
        nfse_verification_code: response.verification_code,
        nfse_url: response.url,
        status: 'issued',
        issue_date: new Date().toISOString(),
        nfse_data: response.raw_data,
        error_message: null
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Erro ao atualizar registro da nota fiscal');
    }

    return data;
  }

  // Atualizar invoice com erro
  private async updateInvoiceError(invoiceId: string, errorMessage: string): Promise<void> {
    const { error } = await supabase
      .from('invoices')
      .update({
        status: 'error',
        error_message: errorMessage,
        retry_count: 1 // Will be incremented by trigger or function
      })
      .eq('id', invoiceId);

    if (error) {
      console.error('Erro ao atualizar invoice com erro:', error);
    }
  }

  // Registrar log da operação
  private async logOperation(
    invoiceId: string,
    operation: string,
    requestData: any,
    responseData: any,
    status: 'success' | 'error',
    errorMessage?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('nfse_integration_logs')
      .insert([{
        invoice_id: invoiceId,
        operation,
        request_data: requestData,
        response_data: responseData,
        status,
        error_message: errorMessage
      }]);

    if (error) {
      console.error('Erro ao registrar log de operação:', error);
    }
  }

  // Buscar invoice por ID
  async getInvoice(invoiceId: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single();

    if (error || !data) {
      return null;
    }

    return data;
  }

  // Buscar invoices por appointment
  async getInvoicesByAppointment(appointmentId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error('Erro ao buscar notas fiscais do agendamento');
    }

    return data || [];
  }

  // Listar invoices com filtros
  async listInvoices(filters: {
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ invoices: Invoice[]; total: number }> {
    let query = supabase
      .from('invoices')
      .select('*', { count: 'exact' });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date);
    }

    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50) - 1);

    const { data, error, count } = await query;

    if (error) {
      throw new Error('Erro ao listar notas fiscais');
    }

    return {
      invoices: data || [],
      total: count || 0
    };
  }

  // Cancelar nota fiscal
  async cancelInvoice(invoiceId: string, reason: string): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Nota fiscal não encontrada');
    }

    if (invoice.status !== 'issued') {
      throw new Error('Apenas notas fiscais emitidas podem ser canceladas');
    }

    const config = await this.loadConfig();

    try {
      // Chamar API para cancelamento
      const response = await axios.post(
        `${config.api_url}/nfse/cancelar`,
        {
          numero_nfse: invoice.nfse_number,
          codigo_verificacao: invoice.nfse_verification_code,
          motivo: reason
        },
        {
          headers: {
            'Authorization': `Bearer ${config.api_key}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.sucesso) {
        // Atualizar status no banco
        const { data, error } = await supabase
          .from('invoices')
          .update({ status: 'cancelled' })
          .eq('id', invoiceId)
          .select()
          .single();

        if (error || !data) {
          throw new Error('Erro ao atualizar status da nota fiscal');
        }

        // Log da operação
        await this.logOperation(invoiceId, 'cancel', { reason }, response.data, 'success');

        return data;
      } else {
        throw new Error(response.data.erro || 'Erro ao cancelar NFS-e');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      await this.logOperation(invoiceId, 'cancel', { reason }, null, 'error', errorMessage);
      throw error;
    }
  }

  // Retentar emissão de nota fiscal com erro
  async retryInvoice(invoiceId: string): Promise<Invoice> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) {
      throw new Error('Nota fiscal não encontrada');
    }

    if (invoice.status !== 'error') {
      throw new Error('Apenas notas fiscais com erro podem ser retentadas');
    }

    if (invoice.retry_count >= 3) {
      throw new Error('Número máximo de tentativas excedido');
    }

    // Buscar dados do appointment para recriar a requisição
    const { data: appointmentData, error: appointmentError } = await supabase
      .from('appointments')
      .select(`
        *,
        patient:patients(*),
        doctor:users(*)
      `)
      .eq('id', invoice.appointment_id)
      .single();

    if (appointmentError || !appointmentData) {
      throw new Error('Dados do agendamento não encontrados');
    }

    // Recriar requisição
    const request: NFSeRequest = {
      appointment_id: invoice.appointment_id,
      amount: invoice.amount,
      service_description: invoice.service_description,
      patient_data: {
        name: appointmentData.patient.name,
        cpf: appointmentData.patient.cpf,
        email: appointmentData.patient.email
      },
      doctor_data: {
        name: appointmentData.doctor.name,
        cpf: appointmentData.doctor.cpf || ''
      }
    };

    // Resetar status para processing
    await supabase
      .from('invoices')
      .update({ status: 'processing', error_message: null })
      .eq('id', invoiceId);

    // Tentar emitir novamente
    const config = await this.loadConfig();
    const nfseResponse = await this.callNFSeAPI(config, request, invoice);

    if (nfseResponse.success) {
      return await this.updateInvoiceSuccess(invoiceId, nfseResponse);
    } else {
      await this.updateInvoiceError(invoiceId, nfseResponse.error_message || 'Erro na retentativa');
      throw new Error(nfseResponse.error_message || 'Erro na retentativa de emissão');
    }
  }

  // Buscar configuração ativa
  async getActiveConfig(): Promise<NFSeConfig | null> {
    try {
      return await this.loadConfig();
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      // Retornar configuração mock em caso de erro
      return {
        id: 'mock-config',
        provider_name: 'Mock Provider',
        api_url: 'https://api.mock-nfse.com',
        api_key: 'mock-api-key',
        city_code: '3550308',
        cnpj: '00.000.000/0001-00',
        municipal_inscription: '123456789',
        service_code: '14.01',
        tax_rate: 5.0,
        active: true
      };
    }
  }

  // Atualizar configuração
  async updateConfig(configData: Partial<NFSeConfig>): Promise<NFSeConfig> {
    const { data, error } = await supabase
      .from('nfse_config')
      .update(configData)
      .eq('active', true)
      .select()
      .single();

    if (error || !data) {
      throw new Error('Erro ao atualizar configuração de NFS-e');
    }

    // Limpar cache da configuração
    this.config = null;

    return data;
  }
}

export const nfseService = new NFSeService();