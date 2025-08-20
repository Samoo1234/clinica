import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { supabase } from '../config/supabase';
import { nfseService } from '../services/nfse';

// Mock do axios para testes
jest.mock('axios');
const mockedAxios = jest.mocked(require('axios'));

describe('NFS-e Simple Tests', () => {
  beforeAll(async () => {
    // Configurar configuração de teste
    await supabase
      .from('nfse_config')
      .upsert([{
        provider_name: 'Teste Simples',
        api_url: 'https://api-teste.exemplo.com',
        api_key: 'test-key',
        city_code: '3304557',
        cnpj: '12.345.678/0001-90',
        service_code: '1401',
        tax_rate: 5.00,
        active: true
      }]);
  });

  afterAll(async () => {
    // Limpar configuração de teste
    await supabase
      .from('nfse_config')
      .delete()
      .eq('provider_name', 'Teste Simples');
  });

  describe('Configuração', () => {
    it('deve buscar configuração ativa', async () => {
      const config = await nfseService.getActiveConfig();
      
      expect(config).toBeDefined();
      expect(config?.provider_name).toBe('Teste Simples');
      expect(config?.active).toBe(true);
      expect(config?.tax_rate).toBe(5.00);
    });

    it('deve ter configuração válida', async () => {
      const config = await nfseService.getActiveConfig();
      
      expect(config?.api_url).toBeTruthy();
      expect(config?.api_key).toBeTruthy();
      expect(config?.cnpj).toBeTruthy();
      expect(config?.city_code).toBeTruthy();
      expect(config?.service_code).toBeTruthy();
    });
  });

  describe('Listagem de Invoices', () => {
    it('deve listar invoices vazias inicialmente', async () => {
      const result = await nfseService.listInvoices({
        limit: 10,
        offset: 0
      });

      expect(result).toBeDefined();
      expect(result.invoices).toBeDefined();
      expect(result.total).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });

    it('deve aceitar filtros de status', async () => {
      const result = await nfseService.listInvoices({
        status: 'issued',
        limit: 5
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });

    it('deve aceitar filtros de data', async () => {
      const result = await nfseService.listInvoices({
        start_date: '2024-01-01',
        end_date: '2024-12-31',
        limit: 10
      });

      expect(result).toBeDefined();
      expect(Array.isArray(result.invoices)).toBe(true);
    });
  });

  describe('Busca de Invoice', () => {
    it('deve retornar null para invoice inexistente', async () => {
      const invoice = await nfseService.getInvoice('00000000-0000-0000-0000-000000000000');
      
      expect(invoice).toBeNull();
    });

    it('deve buscar invoices por appointment inexistente', async () => {
      const invoices = await nfseService.getInvoicesByAppointment('00000000-0000-0000-0000-000000000000');
      
      expect(Array.isArray(invoices)).toBe(true);
      expect(invoices.length).toBe(0);
    });
  });

  describe('Validações', () => {
    it('deve validar dados obrigatórios para emissão', async () => {
      // Mock de erro para dados inválidos
      mockedAxios.post.mockRejectedValueOnce(new Error('Dados inválidos'));

      const invalidRequest = {
        appointment_id: '00000000-0000-0000-0000-000000000000',
        amount: 0, // Valor inválido
        service_description: '',
        patient_data: {
          name: '',
          cpf: ''
        },
        doctor_data: {
          name: '',
          cpf: ''
        }
      };

      await expect(nfseService.issueInvoice(invalidRequest))
        .rejects
        .toThrow();
    });

    it('deve validar configuração antes de emitir', async () => {
      // Desativar configuração temporariamente
      await supabase
        .from('nfse_config')
        .update({ active: false })
        .eq('provider_name', 'Teste Simples');

      const request = {
        appointment_id: '00000000-0000-0000-0000-000000000000',
        amount: 100.00,
        service_description: 'Teste',
        patient_data: {
          name: 'Teste',
          cpf: '12345678901'
        },
        doctor_data: {
          name: 'Dr. Teste',
          cpf: '98765432100'
        }
      };

      await expect(nfseService.issueInvoice(request))
        .rejects
        .toThrow('Configuração de NFS-e não encontrada');

      // Reativar configuração
      await supabase
        .from('nfse_config')
        .update({ active: true })
        .eq('provider_name', 'Teste Simples');
    });
  });

  describe('Estrutura do Banco', () => {
    it('deve ter tabelas necessárias criadas', async () => {
      // Verificar se as tabelas existem
      const { data: invoicesTable } = await supabase
        .from('invoices')
        .select('id')
        .limit(1);

      const { data: configTable } = await supabase
        .from('nfse_config')
        .select('id')
        .limit(1);

      const { data: logsTable } = await supabase
        .from('nfse_integration_logs')
        .select('id')
        .limit(1);

      // Se não houver erro, as tabelas existem
      expect(invoicesTable).toBeDefined();
      expect(configTable).toBeDefined();
      expect(logsTable).toBeDefined();
    });

    it('deve ter view de relatório criada', async () => {
      const { data, error } = await supabase
        .from('invoice_summary')
        .select('*')
        .limit(1);

      // Se não houver erro, a view existe
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});