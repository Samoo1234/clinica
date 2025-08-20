import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { supabase } from '../config/supabase';
import nfseRoutes from '../routes/nfse';
import { nfseService } from '../services/nfse';

// Mock do axios para simular chamadas da API externa
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

const app = express();
app.use(express.json());
app.use('/api/nfse', nfseRoutes);

describe('NFS-e Integration', () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testAppointmentId: string;
  let testInvoiceId: string;

  beforeAll(async () => {
    // Limpar dados de teste
    await supabase.from('nfse_integration_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Criar usuário médico de teste
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .insert([{
        email: 'doctor.nfse@test.com',
        name: 'Dr. João Silva',
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
        name: 'Maria Santos',
        cpf: '98765432100',
        birth_date: '1985-05-15',
        phone: '(21) 99999-9999',
        email: 'maria.santos@test.com',
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'Rio de Janeiro',
          state: 'RJ',
          zipCode: '20000-000'
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
        scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 30,
        status: 'completed',
        value: 150.00,
        payment_status: 'paid'
      }])
      .select()
      .single();

    if (appointmentError || !appointment) {
      throw new Error('Erro ao criar agendamento de teste');
    }
    testAppointmentId = appointment.id;

    // Configurar configuração de NFS-e de teste
    await supabase
      .from('nfse_config')
      .upsert([{
        provider_name: 'Provedor Teste',
        api_url: 'https://api-teste-nfse.exemplo.com.br',
        api_key: 'test-api-key-12345',
        city_code: '3304557',
        cnpj: '12.345.678/0001-90',
        municipal_inscription: '123456789',
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
    await supabase.from('nfse_config').delete().eq('provider_name', 'Provedor Teste');
  });

  beforeEach(() => {
    // Resetar mocks
    jest.clearAllMocks();
  });

  describe('POST /api/nfse/issue', () => {
    it('deve emitir uma nota fiscal com sucesso', async () => {
      // Mock da resposta da API externa
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          sucesso: true,
          numero_nfse: 'NFS-e-2024-001',
          codigo_verificacao: 'ABC123DEF456',
          url_visualizacao: 'https://exemplo.com/nfse/001'
        }
      });

      const response = await request(app)
        .post('/api/nfse/issue')
        .send({
          appointment_id: testAppointmentId,
          amount: 150.00,
          service_description: 'Consulta oftalmológica'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.invoice).toBeDefined();
      expect(response.body.invoice.nfse_number).toBe('NFS-e-2024-001');
      expect(response.body.invoice.status).toBe('issued');
      expect(response.body.invoice.amount).toBe(150.00);

      testInvoiceId = response.body.invoice.id;

      // Verificar se a API externa foi chamada
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://api-teste-nfse.exemplo.com.br/nfse/emitir',
        expect.objectContaining({
          prestador: expect.objectContaining({
            cnpj: '12.345.678/0001-90'
          }),
          tomador: expect.objectContaining({
            nome: 'Maria Santos',
            cpf: '98765432100'
          }),
          servico: expect.objectContaining({
            descricao: 'Consulta oftalmológica',
            valor: 150.00
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key-12345'
          })
        })
      );
    });

    it('deve retornar erro quando dados obrigatórios não são fornecidos', async () => {
      const response = await request(app)
        .post('/api/nfse/issue')
        .send({
          appointment_id: testAppointmentId
          // amount e service_description ausentes
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatórios');
    });

    it('deve retornar erro quando agendamento não existe', async () => {
      const response = await request(app)
        .post('/api/nfse/issue')
        .send({
          appointment_id: '00000000-0000-0000-0000-000000000000',
          amount: 150.00,
          service_description: 'Consulta oftalmológica'
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('não encontrado');
    });

    it('deve tratar erro da API externa', async () => {
      // Mock de erro da API externa
      mockedAxios.post.mockResolvedValueOnce({
        status: 400,
        data: {
          sucesso: false,
          erro: 'Dados inválidos para emissão'
        }
      });

      const response = await request(app)
        .post('/api/nfse/issue')
        .send({
          appointment_id: testAppointmentId,
          amount: 200.00,
          service_description: 'Consulta de retorno'
        });

      expect(response.status).toBe(500);
      expect(response.body.error).toContain('Dados inválidos');
    });
  });

  describe('GET /api/nfse/invoice/:id', () => {
    it('deve buscar uma nota fiscal por ID', async () => {
      if (!testInvoiceId) {
        // Criar uma invoice de teste se não existir
        const { data: invoice } = await supabase
          .from('invoices')
          .insert([{
            appointment_id: testAppointmentId,
            amount: 150.00,
            service_description: 'Consulta teste',
            tax_amount: 7.50,
            net_amount: 142.50,
            status: 'issued',
            nfse_number: 'TEST-001'
          }])
          .select()
          .single();
        testInvoiceId = invoice!.id;
      }

      const response = await request(app)
        .get(`/api/nfse/invoice/${testInvoiceId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invoice).toBeDefined();
      expect(response.body.invoice.id).toBe(testInvoiceId);
    });

    it('deve retornar 404 para nota fiscal inexistente', async () => {
      const response = await request(app)
        .get('/api/nfse/invoice/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('não encontrada');
    });
  });

  describe('GET /api/nfse/appointment/:appointmentId/invoices', () => {
    it('deve buscar notas fiscais de um agendamento', async () => {
      const response = await request(app)
        .get(`/api/nfse/appointment/${testAppointmentId}/invoices`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invoices).toBeDefined();
      expect(Array.isArray(response.body.invoices)).toBe(true);
    });
  });

  describe('GET /api/nfse/invoices', () => {
    it('deve listar notas fiscais com filtros', async () => {
      const response = await request(app)
        .get('/api/nfse/invoices')
        .query({
          status: 'issued',
          limit: 10,
          offset: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invoices).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(Array.isArray(response.body.invoices)).toBe(true);
    });
  });

  describe('POST /api/nfse/invoice/:id/cancel', () => {
    it('deve cancelar uma nota fiscal', async () => {
      if (!testInvoiceId) {
        // Criar uma invoice de teste se não existir
        const { data: invoice } = await supabase
          .from('invoices')
          .insert([{
            appointment_id: testAppointmentId,
            amount: 150.00,
            service_description: 'Consulta para cancelar',
            tax_amount: 7.50,
            net_amount: 142.50,
            status: 'issued',
            nfse_number: 'CANCEL-001'
          }])
          .select()
          .single();
        testInvoiceId = invoice!.id;
      }

      // Mock da resposta da API externa para cancelamento
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          sucesso: true,
          mensagem: 'Nota fiscal cancelada com sucesso'
        }
      });

      const response = await request(app)
        .post(`/api/nfse/invoice/${testInvoiceId}/cancel`)
        .send({
          reason: 'Cancelamento por solicitação do cliente'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invoice.status).toBe('cancelled');
    });

    it('deve retornar erro quando motivo não é fornecido', async () => {
      const response = await request(app)
        .post(`/api/nfse/invoice/${testInvoiceId}/cancel`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('obrigatório');
    });
  });

  describe('GET /api/nfse/config', () => {
    it('deve buscar configuração ativa', async () => {
      const response = await request(app)
        .get('/api/nfse/config');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.config).toBeDefined();
      expect(response.body.config.api_key).toBe('***'); // Dados sensíveis mascarados
    });
  });

  describe('GET /api/nfse/logs', () => {
    it('deve buscar logs de integração', async () => {
      const response = await request(app)
        .get('/api/nfse/logs')
        .query({
          limit: 10,
          offset: 0
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.logs).toBeDefined();
      expect(response.body.total).toBeDefined();
      expect(Array.isArray(response.body.logs)).toBe(true);
    });
  });

  describe('GET /api/nfse/report', () => {
    it('deve gerar relatório de notas fiscais', async () => {
      const response = await request(app)
        .get('/api/nfse/report')
        .query({
          start_date: '2024-01-01',
          end_date: '2024-12-31'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.invoices).toBeDefined();
      expect(response.body.summary).toBeDefined();
      expect(response.body.summary.total_invoices).toBeDefined();
      expect(response.body.summary.total_amount).toBeDefined();
    });
  });
});

describe('NFSeService', () => {
  let testAppointmentId: string;
  let testPatientId: string;
  let testDoctorId: string;

  beforeAll(async () => {
    // Criar dados de teste para o service
    const { data: doctor } = await supabase
      .from('users')
      .insert([{
        email: 'service.doctor@test.com',
        name: 'Dr. Service Test',
        role: 'doctor',
        cpf: '11111111111'
      }])
      .select()
      .single();
    testDoctorId = doctor!.id;

    const { data: patient } = await supabase
      .from('patients')
      .insert([{
        name: 'Service Test Patient',
        cpf: '22222222222',
        birth_date: '1990-01-01',
        phone: '(11) 99999-9999',
        email: 'service.patient@test.com'
      }])
      .select()
      .single();
    testPatientId = patient!.id;

    const { data: appointment } = await supabase
      .from('appointments')
      .insert([{
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: new Date().toISOString(),
        duration_minutes: 30,
        status: 'completed',
        value: 200.00,
        payment_status: 'paid'
      }])
      .select()
      .single();
    testAppointmentId = appointment!.id;
  });

  afterAll(async () => {
    // Limpar dados de teste
    await supabase.from('appointments').delete().eq('id', testAppointmentId);
    await supabase.from('patients').delete().eq('id', testPatientId);
    await supabase.from('users').delete().eq('id', testDoctorId);
  });

  describe('issueInvoice', () => {
    it('deve calcular impostos corretamente', async () => {
      // Mock da API externa
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          sucesso: true,
          numero_nfse: 'SERVICE-001',
          codigo_verificacao: 'SVC123',
          url_visualizacao: 'https://exemplo.com/service/001'
        }
      });

      const request = {
        appointment_id: testAppointmentId,
        amount: 200.00,
        service_description: 'Consulta de teste do service',
        patient_data: {
          name: 'Service Test Patient',
          cpf: '22222222222',
          email: 'service.patient@test.com'
        },
        doctor_data: {
          name: 'Dr. Service Test',
          cpf: '11111111111'
        }
      };

      const invoice = await nfseService.issueInvoice(request);

      expect(invoice.amount).toBe(200.00);
      expect(invoice.tax_amount).toBe(10.00); // 5% de 200
      expect(invoice.net_amount).toBe(190.00); // 200 - 10
      expect(invoice.status).toBe('issued');
    });
  });

  describe('getActiveConfig', () => {
    it('deve buscar configuração ativa', async () => {
      const config = await nfseService.getActiveConfig();
      
      expect(config).toBeDefined();
      expect(config?.active).toBe(true);
      expect(config?.provider_name).toBe('Provedor Teste');
    });
  });

  describe('listInvoices', () => {
    it('deve listar invoices com filtros', async () => {
      const result = await nfseService.listInvoices({
        status: 'issued',
        limit: 5,
        offset: 0
      });

      expect(result.invoices).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });
  });
});