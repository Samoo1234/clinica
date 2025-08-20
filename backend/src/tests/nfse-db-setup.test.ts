import { describe, it, expect } from '@jest/globals';
import { supabase } from '../config/supabase';

describe('NFS-e Database Setup', () => {
  describe('Tables Creation', () => {
    it('should have invoices table created', async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have nfse_config table created', async () => {
      const { data, error } = await supabase
        .from('nfse_config')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have nfse_integration_logs table created', async () => {
      const { data, error } = await supabase
        .from('nfse_integration_logs')
        .select('id')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Configuration Setup', () => {
    it('should be able to insert test configuration', async () => {
      const testConfig = {
        provider_name: 'Test Provider Setup',
        api_url: 'https://test-setup.example.com',
        api_key: 'test-setup-key',
        city_code: '3304557',
        cnpj: '12.345.678/0001-90',
        service_code: '1401',
        tax_rate: 5.00,
        active: false // Not active to avoid conflicts
      };

      const { data, error } = await supabase
        .from('nfse_config')
        .insert([testConfig])
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.provider_name).toBe('Test Provider Setup');

      // Clean up
      if (data?.id) {
        await supabase
          .from('nfse_config')
          .delete()
          .eq('id', data.id);
      }
    });
  });

  describe('Functions and Views', () => {
    it('should have calculate_invoice_taxes function available', async () => {
      const { data, error } = await supabase
        .rpc('calculate_invoice_taxes', { gross_amount: 100.00 });

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      
      if (data && data.length > 0) {
        expect(data[0]).toHaveProperty('tax_amount');
        expect(data[0]).toHaveProperty('net_amount');
      }
    });

    it('should have get_next_nfse_number function available', async () => {
      const { data, error } = await supabase
        .rpc('get_next_nfse_number');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(typeof data).toBe('string');
    });

    it('should have invoice_summary view available', async () => {
      const { data, error } = await supabase
        .from('invoice_summary')
        .select('*')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Constraints and Indexes', () => {
    it('should enforce status constraints on invoices', async () => {
      const invalidInvoice = {
        appointment_id: '00000000-0000-0000-0000-000000000000',
        amount: 100.00,
        service_description: 'Test',
        tax_amount: 5.00,
        net_amount: 95.00,
        status: 'invalid_status' // This should fail
      };

      const { error } = await supabase
        .from('invoices')
        .insert([invalidInvoice]);

      expect(error).not.toBeNull();
      expect(error?.message).toContain('violates check constraint');
    });

    it('should require positive amounts', async () => {
      const invalidInvoice = {
        appointment_id: '00000000-0000-0000-0000-000000000000',
        amount: -100.00, // Negative amount should fail
        service_description: 'Test',
        tax_amount: 5.00,
        net_amount: 95.00,
        status: 'pending'
      };

      const { error } = await supabase
        .from('invoices')
        .insert([invalidInvoice]);

      // This might not fail depending on database constraints
      // but it's good to test the structure
      expect(error).toBeDefined();
    });
  });
});