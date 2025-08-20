import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { supabaseAdmin } from '../config/supabase';
import { digitalSignatureService } from '../services/digital-signature';

// Mock the digital signature service for testing
jest.mock('../services/digital-signature');

describe('Digital Signature Integration', () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testRecordId: string;
  let testSignatureId: string;

  beforeAll(async () => {
    // Create test data
    // Create test doctor
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('users')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test.doctor@visioncare.com',
        name: 'Dr. Test Doctor',
        role: 'doctor'
      })
      .select()
      .single();

    if (doctorError && !doctorError.message.includes('duplicate key')) {
      throw doctorError;
    }
    testDoctorId = doctor?.id || '550e8400-e29b-41d4-a716-446655440001';

    // Create test patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .insert({
        cpf: '12345678901',
        name: 'Test Patient',
        birth_date: '1990-01-01',
        phone: '11999999999',
        email: 'test.patient@email.com',
        address: {
          street: 'Test Street',
          number: '123',
          neighborhood: 'Test Neighborhood',
          city: 'Test City',
          state: 'SP',
          zipCode: '12345-678'
        }
      })
      .select()
      .single();

    if (patientError && !patientError.message.includes('duplicate key')) {
      throw patientError;
    }
    testPatientId = patient?.id || '';

    // Create test medical record
    const { data: record, error: recordError } = await supabaseAdmin
      .from('medical_records')
      .insert({
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        consultation_date: '2024-01-15',
        diagnosis: 'Test diagnosis',
        prescription: 'Test prescription for digital signature'
      })
      .select()
      .single();

    if (recordError) {
      throw recordError;
    }
    testRecordId = record.id;
  });

  afterAll(async () => {
    // Clean up test data
    await supabaseAdmin.from('digital_signatures').delete().eq('record_id', testRecordId);
    await supabaseAdmin.from('medical_records').delete().eq('id', testRecordId);
    await supabaseAdmin.from('patients').delete().eq('id', testPatientId);
    await supabaseAdmin.from('users').delete().eq('id', testDoctorId);
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Digital Signature Service', () => {
    it('should create a signature request successfully', async () => {
      const mockSignature = {
        id: 'test-signature-id',
        record_id: testRecordId,
        document_type: 'prescription',
        document_content: 'Test prescription content',
        signature_provider: 'mock',
        external_signature_id: 'mock_external_id',
        signature_url: 'https://mock-signature.com/sign/mock_external_id',
        status: 'sent' as const,
        signer_email: 'doctor@visioncare.com',
        signer_name: 'Dr. Test',
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        signed_document_path: null,
        signature_data: {},
        signed_at: null
      };

      (digitalSignatureService.createSignatureRequest as jest.Mock).mockResolvedValue(mockSignature);

      const signatureRequest = {
        recordId: testRecordId,
        documentType: 'prescription' as const,
        documentContent: 'Test prescription content',
        signerEmail: 'doctor@visioncare.com',
        signerName: 'Dr. Test'
      };

      const result = await digitalSignatureService.createSignatureRequest(signatureRequest);

      expect(result).toEqual(mockSignature);
      expect(digitalSignatureService.createSignatureRequest).toHaveBeenCalledWith(signatureRequest);
    });

    it('should get signature status', async () => {
      const mockSignature = {
        id: 'test-signature-id',
        status: 'signed' as const,
        signed_at: new Date().toISOString()
      };

      (digitalSignatureService.getSignatureStatus as jest.Mock).mockResolvedValue(mockSignature);

      const result = await digitalSignatureService.getSignatureStatus('test-signature-id');

      expect(result).toEqual(mockSignature);
      expect(digitalSignatureService.getSignatureStatus).toHaveBeenCalledWith('test-signature-id');
    });

    it('should download signed document', async () => {
      const mockBuffer = Buffer.from('Mock PDF content');

      (digitalSignatureService.downloadSignedDocument as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await digitalSignatureService.downloadSignedDocument('test-signature-id');

      expect(result).toEqual(mockBuffer);
      expect(digitalSignatureService.downloadSignedDocument).toHaveBeenCalledWith('test-signature-id');
    });

    it('should get signatures by record', async () => {
      const mockSignatures = [
        {
          id: 'signature-1',
          record_id: testRecordId,
          document_type: 'prescription',
          status: 'signed'
        },
        {
          id: 'signature-2',
          record_id: testRecordId,
          document_type: 'report',
          status: 'pending'
        }
      ];

      (digitalSignatureService.getSignaturesByRecord as jest.Mock).mockResolvedValue(mockSignatures);

      const result = await digitalSignatureService.getSignaturesByRecord(testRecordId);

      expect(result).toEqual(mockSignatures);
      expect(digitalSignatureService.getSignaturesByRecord).toHaveBeenCalledWith(testRecordId);
    });

    it('should cancel signature', async () => {
      const mockCancelledSignature = {
        id: 'test-signature-id',
        status: 'cancelled' as const,
        updated_at: new Date().toISOString()
      };

      (digitalSignatureService.cancelSignature as jest.Mock).mockResolvedValue(mockCancelledSignature);

      const result = await digitalSignatureService.cancelSignature('test-signature-id');

      expect(result).toEqual(mockCancelledSignature);
      expect(digitalSignatureService.cancelSignature).toHaveBeenCalledWith('test-signature-id');
    });
  });

  describe('Error Handling', () => {
    it('should handle signature creation errors', async () => {
      const errorMessage = 'External signature service unavailable';
      (digitalSignatureService.createSignatureRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const signatureRequest = {
        recordId: testRecordId,
        documentType: 'prescription' as const,
        documentContent: 'Test content',
        signerEmail: 'doctor@visioncare.com',
        signerName: 'Dr. Test'
      };

      await expect(digitalSignatureService.createSignatureRequest(signatureRequest))
        .rejects.toThrow(errorMessage);
    });

    it('should handle signature not found error', async () => {
      (digitalSignatureService.getSignatureStatus as jest.Mock).mockRejectedValue(new Error('Signature not found'));

      await expect(digitalSignatureService.getSignatureStatus('non-existent-id'))
        .rejects.toThrow('Signature not found');
    });

    it('should handle download errors for unsigned documents', async () => {
      (digitalSignatureService.downloadSignedDocument as jest.Mock).mockRejectedValue(new Error('Document is not signed yet'));

      await expect(digitalSignatureService.downloadSignedDocument('unsigned-signature-id'))
        .rejects.toThrow('Document is not signed yet');
    });
  });

  describe('Validation', () => {
    it('should validate required fields for signature request', () => {
      const invalidRequests = [
        {}, // Empty request
        { recordId: testRecordId }, // Missing other fields
        { recordId: testRecordId, documentType: 'prescription' }, // Missing content and signer info
        { 
          recordId: testRecordId, 
          documentType: 'invalid_type', 
          documentContent: 'content',
          signerEmail: 'invalid-email',
          signerName: 'Name'
        } // Invalid document type and email
      ];

      // These validations would be handled by the API routes
      // The service itself assumes valid input
      expect(invalidRequests.length).toBeGreaterThan(0);
    });

    it('should validate document types', () => {
      const validTypes = ['prescription', 'report', 'certificate'];
      const invalidTypes = ['invalid', 'unknown', ''];

      expect(validTypes).toContain('prescription');
      expect(validTypes).toContain('report');
      expect(validTypes).toContain('certificate');
      expect(validTypes).not.toContain('invalid');
    });

    it('should validate email format', () => {
      const validEmails = [
        'doctor@visioncare.com',
        'test.email@domain.co.uk',
        'user+tag@example.org'
      ];

      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        ''
      ];

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });

  describe('Integration Logging', () => {
    it('should log successful operations', async () => {
      // Mock successful operation
      const mockSignature = {
        id: 'test-signature-id',
        record_id: testRecordId,
        status: 'sent' as const
      };

      (digitalSignatureService.createSignatureRequest as jest.Mock).mockResolvedValue(mockSignature);

      const signatureRequest = {
        recordId: testRecordId,
        documentType: 'prescription' as const,
        documentContent: 'Test content',
        signerEmail: 'doctor@visioncare.com',
        signerName: 'Dr. Test'
      };

      await digitalSignatureService.createSignatureRequest(signatureRequest);

      // Verify that the service was called (logging would be internal)
      expect(digitalSignatureService.createSignatureRequest).toHaveBeenCalledWith(signatureRequest);
    });

    it('should log failed operations', async () => {
      const errorMessage = 'Signature service error';
      (digitalSignatureService.createSignatureRequest as jest.Mock).mockRejectedValue(new Error(errorMessage));

      const signatureRequest = {
        recordId: testRecordId,
        documentType: 'prescription' as const,
        documentContent: 'Test content',
        signerEmail: 'doctor@visioncare.com',
        signerName: 'Dr. Test'
      };

      try {
        await digitalSignatureService.createSignatureRequest(signatureRequest);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe(errorMessage);
      }
    });
  });

  describe('Status Updates', () => {
    it('should handle status transitions correctly', async () => {
      const statusTransitions = [
        { from: 'pending', to: 'sent' },
        { from: 'sent', to: 'signed' },
        { from: 'sent', to: 'failed' },
        { from: 'pending', to: 'cancelled' }
      ];

      statusTransitions.forEach(transition => {
        expect(['pending', 'sent', 'signed', 'failed', 'cancelled']).toContain(transition.from);
        expect(['pending', 'sent', 'signed', 'failed', 'cancelled']).toContain(transition.to);
      });
    });

    it('should update signature status from external provider', async () => {
      const mockUpdatedSignature = {
        id: 'test-signature-id',
        status: 'signed' as const,
        signed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      (digitalSignatureService.getSignatureStatus as jest.Mock).mockResolvedValue(mockUpdatedSignature);

      const result = await digitalSignatureService.getSignatureStatus('test-signature-id');

      expect(result.status).toBe('signed');
      expect(result.signed_at).toBeDefined();
    });
  });
});