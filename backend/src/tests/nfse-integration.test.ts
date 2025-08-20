import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { supabase } from '../config/supabase';
import { nfseService } from '../services/nfse';

// Mock do axios
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('NFS-e Integration Tests', () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testAppointmentId: string;

  beforeAll(async () => {
    // Limpar dados de teste anteriores
    await supabase.from('nfse_integration_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Criar médico de teste
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .insert([{
        email: 'integration.doctor@test.com',
        name: 'Dr. Integração Teste',
        role: 'doctor',
        cpf: '12345678901'
      }])
      .select()
      .single();

    if (doctorError || !doctor) {
      throw new Error('Erro ao criar médico de teste');
    }
    testDoctorId = doctor.id;

    // Criar paciente de teste
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert([{
        name: 'Paciente Integração',
        cpf: '98765432100',
        birth_date: '1980-01-01',
        phone: '(11) 99999-9999',
        email: 'paciente.integracao@test.com',
        address: {
          street: 'Rua da Integração',
          number: '100',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000'
        }
      }])
      .select()
      .single();

    if (patientError || !patient) {
      throw new Error('Erro ao criar paciente de teste');
    }
    testPatientId = patient.id;

    // Criar agendamento de teste
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([{
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: new Date().toISOString(),
        duration_minutes: 30,
        status: 'completed',
        value: 180.00,
        payment_status: 'paid'
      }])
      .select()
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Erro ao criar agendamento de teste');
    }
    testAppointmentId = appointment.id;

    // Configurar NFS-e para integração
    await supabase
      .from('nfse_config')
      .upsert([{
        provider_name: 'Integração Teste',
        api_url: 'https://api-integracao-teste.exemplo.com.br',
        api_key: 'integration-test-key-12345',
        city_code: '3550308', // São Paulo
        cnpj: '11.222.333/0001-44',
        municipal_inscription: '987654321',
        service_code: '1401',
        tax_rate: 5.00,
        active: true
      }]);
  });

  afterAll(async () => {
    // Limpar dados de teste
    await supabase.from('nfse_integration_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('appointments').delete().eq('id', testAppointmentId);
    await supabase.from('patients').delete().eq('id', testPatientId);
    await supabase.from('users').delete().eq('id', testDoctorId);
    await supabase.from('nfse_config').delete().eq('provider_name', 'Integração Teste');
  });

  describe('Fluxo Completo de Emissão', () => {
    it('deve emitir nota fiscal com sucesso', async () => {
      // Mock da resposta da API externa
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          sucesso: true,
          numero_nfse: 'INT-2024-001',
          codigo_verificacao: 'INT123ABC456',
          url_visualizacao: 'https://exemplo.com/nfse/int001',
          data_emissao: new Date().toISOString(),
          valor_total: 180.00,
          valor_iss: 9.00
        }
      });

      const request = {
        appointment_id: testAppointmentId,
        amount: 180.00,
        service_description: 'Consulta oftalmológica completa',
        patient_data: {
          name: 'Paciente Integração',
          cpf: '98765432100',
          email: 'paciente.integracao@test.com',
          address: {
            street: 'Rua da Integração',
            number: '100',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000'
          }
        },
        doctor_data: {
          name: 'Dr. Integração Teste',
          cpf: '12345678901'
        }
      };

      const invoice = await nfseService.issueInvoice(request);

      // Verificar dados da invoice
      expect(invoice).toBeDefined();
      expect(invoice.appointment_id).toBe(testAppointmentId);
      expect(invoice.amount).toBe(180.00);
      expect(invoice.tax_amount).toBe(9.00); // 5% de 180
      expect(invoice.net_amount).toBe(171.00); // 180 - 9
      expect(invoice.status).toBe('issued');
      expect(invoice.nfse_number).toBe('INT-2024-001');
      expect(invoice.nfse_verification_code).toBe('INT123ABC456');
      expect(invoice.nfse_url).toBe('https://exemplo.com/nfse/int001');

      // Verificar se foi chamada a API externa corretamente
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-integracao-teste.exemplo.com.br/nfse/emitir',
        expect.objectContaining({
          prestador: expect.objectContaining({
            cnpj: '11.222.333/0001-44',
            inscricao_municipal: '987654321'
          }),
          tomador: expect.objectContaining({
            nome: 'Paciente Integração',
            cpf: '98765432100',
            email: 'paciente.integracao@test.com'
          }),
          servico: expect.objectContaining({
            codigo: '1401',
            descricao: 'Consulta oftalmológica completa',
            valor: 180.00,
            aliquota_iss: 5.00
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer integration-test-key-12345',
            'Content-Type': 'application/json'
          }),
          timeout: 30000
        })
      );

      // Verificar se foi criado log da operação
      const logs = await supabase
        .from('nfse_integration_logs')
        .select('*')
        .eq('invoice_id', invoice.id)
        .eq('operation', 'issue');

      expect(logs.data).toBeDefined();
      expect(logs.data!.length).toBeGreaterThan(0);
      expect(logs.data![0].status).toBe('success');
    });

    it('deve tratar erro da API externa', async () => {
      // Mock de erro da API externa
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 400,
          data: {
            sucesso: false,
            erro: 'CPF do tomador inválido'
          }
        }
      });

      const request = {
        appointment_id: testAppointmentId,
        amount: 150.00,
        service_description: 'Consulta com erro',
        patient_data: {
          name: 'Paciente Erro',
          cpf: '00000000000', // CPF inválido
          email: 'erro@test.com'
        },
        doctor_data: {
          name: 'Dr. Teste',
          cpf: '12345678901'
        }
      };

      await expect(nfseService.issueInvoice(request))
        .rejects
        .toThrow('CPF do tomador inválido');

      // Verificar se foi criada invoice com status de erro
      const invoices = await nfseService.getInvoicesByAppointment(testAppointmentId);
      const errorInvoice = invoices.find(inv => inv.status === 'error');
      
      expect(errorInvoice).toBeDefined();
      expect(errorInvoice!.error_message).toContain('CPF do tomador inválido');
      expect(errorInvoice!.retry_count).toBe(1);

      // Verificar se foi criado log de erro
      const logs = await supabase
        .from('nfse_integration_logs')
        .select('*')
        .eq('invoice_id', errorInvoice!.id)
        .eq('operation', 'issue')
        .eq('status', 'error');

      expect(logs.data).toBeDefined();
      expect(logs.data!.length).toBeGreaterThan(0);
    });
  });

  describe('Cancelamento de Nota Fiscal', () => {
    let invoiceToCancel: any;

    beforeAll(async () => {
      // Criar uma invoice para cancelar
      const { data: invoice } = await supabase
        .from('invoices')
        .insert([{
          appointment_id: testAppointmentId,
          amount: 120.00,
          service_description: 'Consulta para cancelar',
          tax_amount: 6.00,
          net_amount: 114.00,
          status: 'issued',
          nfse_number: 'CANCEL-001',
          nfse_verification_code: 'CANCEL123'
        }])
        .select()
        .single();

      invoiceToCancel = invoice;
    });

    it('deve cancelar nota fiscal com sucesso', async () => {
      // Mock da resposta da API externa para cancelamento
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          sucesso: true,
          mensagem: 'Nota fiscal cancelada com sucesso',
          data_cancelamento: new Date().toISOString()
        }
      });

      const cancelledInvoice = await nfseService.cancelInvoice(
        invoiceToCancel.id,
        'Cancelamento por solicitação do cliente'
      );

      expect(cancelledInvoice.status).toBe('cancelled');

      // Verificar se foi chamada a API externa
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-integracao-teste.exemplo.com.br/nfse/cancelar',
        expect.objectContaining({
          numero_nfse: 'CANCEL-001',
          codigo_verificacao: 'CANCEL123',
          motivo: 'Cancelamento por solicitação do cliente'
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer integration-test-key-12345'
          })
        })
      );

      // Verificar log de cancelamento
      const logs = await supabase
        .from('nfse_integration_logs')
        .select('*')
        .eq('invoice_id', invoiceToCancel.id)
        .eq('operation', 'cancel')
        .eq('status', 'success');

      expect(logs.data).toBeDefined();
      expect(logs.data!.length).toBeGreaterThan(0);
    });
  });

  describe('Retry de Emissão', () => {
    let errorInvoice: any;

    beforeAll(async () => {
      // Criar uma invoice com erro para retry
      const { data: invoice } = await supabase
        .from('invoices')
        .insert([{
          appointment_id: testAppointmentId,
          amount: 100.00,
          service_description: 'Consulta para retry',
          tax_amount: 5.00,
          net_amount: 95.00,
          status: 'error',
          error_message: 'Erro temporário da API',
          retry_count: 1
        }])
        .select()
        .single();

      errorInvoice = invoice;
    });

    it('deve fazer retry com sucesso', async () => {
      // Mock da resposta da API externa para retry
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          sucesso: true,
          numero_nfse: 'RETRY-001',
          codigo_verificacao: 'RETRY123',
          url_visualizacao: 'https://exemplo.com/nfse/retry001'
        }
      });

      const retriedInvoice = await nfseService.retryInvoice(errorInvoice.id);

      expect(retriedInvoice.status).toBe('issued');
      expect(retriedInvoice.nfse_number).toBe('RETRY-001');
      expect(retriedInvoice.error_message).toBeNull();

      // Verificar se foi chamada a API externa
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-integracao-teste.exemplo.com.br/nfse/emitir',
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('deve falhar retry após limite de tentativas', async () => {
      // Criar invoice com muitas tentativas
      const { data: maxRetryInvoice } = await supabase
        .from('invoices')
        .insert([{
          appointment_id: testAppointmentId,
          amount: 80.00,
          service_description: 'Consulta limite retry',
          tax_amount: 4.00,
          net_amount: 76.00,
          status: 'error',
          error_message: 'Erro persistente',
          retry_count: 3 // Limite máximo
        }])
        .select()
        .single();

      await expect(nfseService.retryInvoice(maxRetryInvoice!.id))
        .rejects
        .toThrow('Número máximo de tentativas excedido');
    });
  });

  describe('Relatórios e Consultas', () => {
    it('deve gerar relatório com dados corretos', async () => {
      const result = await nfseService.listInvoices({
        status: 'issued',
        limit: 10,
        offset: 0
      });

      expect(result.invoices).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);

      // Verificar se há pelo menos uma invoice emitida
      const issuedInvoices = result.invoices.filter(inv => inv.status === 'issued');
      expect(issuedInvoices.length).toBeGreaterThan(0);
    });

    it('deve buscar invoices por período', async () => {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

      const result = await nfseService.listInvoices({
        start_date: yesterday.toISOString(),
        end_date: tomorrow.toISOString(),
        limit: 50
      });

      expect(result.invoices).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });

    it('deve buscar invoices de um agendamento específico', async () => {
      const invoices = await nfseService.getInvoicesByAppointment(testAppointmentId);

      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBeGreaterThan(0);

      // Todas as invoices devem ser do mesmo agendamento
      invoices.forEach(invoice => {
        expect(invoice.appointment_id).toBe(testAppointmentId);
      });
    });
  });

  describe('Configuração e Logs', () => {
    it('deve atualizar configuração', async () => {
      const updatedConfig = await nfseService.updateConfig({
        tax_rate: 6.00,
        service_code: '1402'
      });

      expect(updatedConfig.tax_rate).toBe(6.00);
      expect(updatedConfig.service_code).toBe('1402');

      // Restaurar configuração original
      await nfseService.updateConfig({
        tax_rate: 5.00,
        service_code: '1401'
      });
    });

    it('deve registrar logs de todas as operações', async () => {
      const { data: logs } = await supabase
        .from('nfse_integration_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs!.length).toBeGreaterThan(0);

      // Verificar estrutura dos logs
      logs!.forEach(log => {
        expect(log.operation).toBeDefined();
        expect(log.status).toBeDefined();
        expect(['success', 'error']).toContain(log.status);
        expect(log.created_at).toBeDefined();
      });
    });
  });
});