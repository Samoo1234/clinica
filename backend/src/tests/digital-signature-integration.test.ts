import request from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import express from 'express';
import { supabaseAdmin } from '../config/supabase';
import digitalSignatureRoutes from '../routes/digital-signature';
import { authenticateToken } from '../middleware/auth';

// Create test app
const app = express();
app.use(express.json());

// Mock authentication middleware for testing
const mockAuth = (req: any, res: any, next: any) => {
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test.doctor@visioncare.com',
    role: 'doctor'
  };
  next();
};

app.use('/api/digital-signature', mockAuth, digitalSignatureRoutes);

describe('Digital Signature API Integration', () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testRecordId: string;
  let testSignatureId: string;

  beforeAll(async () => {
    // Create test data
    testDoctorId = '550e8400-e29b-41d4-a716-446655440001';

    // Create test doctor
    const { data: doctor, error: doctorError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: testDoctorId,
        email: 'test.doctor@visioncare.com',
        name: 'Dr. Test Doctor',
        role: 'doctor'
      })
      .select()
      .single();

    if (doctorError && !doctorError.message.includes('duplicate key')) {
      console.warn('Doctor creation error:', doctorError);
    }

    // Create test patient
    const { data: patient, error: patientError } = await supabaseAdmin
      .from('patients')
      .upsert({
        cpf: '12345678902',
        name: 'Test Patient for Signature',
        birth_date: '1990-01-01',
        phone: '11999999998',
        email: 'test.patient.signature@email.com',
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

    if (patientError) {
      throw patientError;
    }
    testPatientId = patient.id;

    // Create test medical record
    const { data: record, error: recordError } = await supabaseAdmin
      .from('medical_records')
      .insert({
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        consultation_date: '2024-01-15',
        diagnosis: 'Test diagnosis for signature',
        prescription: 'Test prescription for digital signature integration'
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
    if (testSignatureId) {
      await supabaseAdmin.from('digital_signatures').delete().eq('id', testSignatureId);
    }
    await supabaseAdmin.from('digital_signatures').delete().eq('record_id', testRecordId);
    await supabaseAdmin.from('medical_records').delete().eq('id', testRecordId);
    await supabaseAdmin.from('patients').delete().eq('id', testPatientId);
  });

  describe('POST /api/digital-signature/create', () => {
    it('should create a signature request successfully', async () => {
      const signatureData = {
        recordId: testRecordId,
        documentType: 'prescription',
        documentContent: 'Test prescription content for signature',
        signerEmail: 'doctor@visioncare.com',
        signerName: 'Dr. Test Doctor'
      };

      const response = await request(app)
        .post('/api/digital-signature/create')
        .send(signatureData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.record_id).toBe(testRecordId);
      expect(response.body.data.document_type).toBe('prescription');
      expect(response.body.data.status).toBe('sent');
      expect(response.body.data.signature_url).toBeDefined();

      testSignatureId = response.body.data.id;
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/digital-signature/create')
        .send({
          recordId: testRecordId,
          // Missing other required fields
        })
        .expect(400);

      expect(response.body.error).toContain('Missing required fields');
    });

    it('should return 400 for invalid document type', async () => {
      const signatureData = {
        recordId: testRecordId,
        documentType: 'invalid_type',
        documentContent: 'Test content',
        signerEmail: 'doctor@visioncare.com',
        signerName: 'Dr. Test'
      };

      const response = await request(app)
        .post('/api/digital-signature/create')
        .send(signatureData)
        .expect(400);

      expect(response.body.error).toContain('Invalid document type');
    });

    it('should return 400 for invalid email format', async () => {
      const signatureData = {
        recordId: testRecordId,
        documentType: 'prescription',
        documentContent: 'Test content',
        signerEmail: 'invalid-email',
        signerName: 'Dr. Test'
      };

      const response = await request(app)
        .post('/api/digital-signature/create')
        .send(signatureData)
        .expect(400);

      expect(response.body.error).toContain('Invalid email format');
    });
  });

  describe('GET /api/digital-signature/:id/status', () => {
    it('should get signature status successfully', async () => {
      if (!testSignatureId) {
        // Create a signature first
        const signatureData = {
          recordId: testRecordId,
          documentType: 'prescription',
          documentContent: 'Test content',
          signerEmail: 'doctor@visioncare.com',
          signerName: 'Dr. Test'
        };

        const createResponse = await request(app)
          .post('/api/digital-signature/create')
          .send(signatureData);

        testSignatureId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/digital-signature/${testSignatureId}/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(testSignatureId);
      expect(response.body.data.status).toBeDefined();
    });

    it('should return 400 for missing signature ID', async () => {
      const response = await request(app)
        .get('/api/digital-signature//status')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return 404 for non-existent signature', async () => {
      const response = await request(app)
        .get('/api/digital-signature/non-existent-id/status')
        .expect(404);

      expect(response.body.error).toContain('Signature not found');
    });
  });

  describe('GET /api/digital-signature/record/:recordId', () => {
    it('should get signatures for a record successfully', async () => {
      const response = await request(app)
        .get(`/api/digital-signature/record/${testRecordId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(Array.isArray(response.body.data)).toBe(true);
      
      if (response.body.data.length > 0) {
        expect(response.body.data[0].record_id).toBe(testRecordId);
      }
    });

    it('should return 400 for missing record ID', async () => {
      const response = await request(app)
        .get('/api/digital-signature/record/')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return empty array for record with no signatures', async () => {
      // Create a new record without signatures
      const { data: newRecord } = await supabaseAdmin
        .from('medical_records')
        .insert({
          patient_id: testPatientId,
          doctor_id: testDoctorId,
          consultation_date: '2024-01-16',
          diagnosis: 'Test diagnosis without signatures'
        })
        .select()
        .single();

      const response = await request(app)
        .get(`/api/digital-signature/record/${newRecord.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);

      // Clean up
      await supabaseAdmin.from('medical_records').delete().eq('id', newRecord.id);
    });
  });

  describe('PUT /api/digital-signature/:id/cancel', () => {
    it('should cancel signature successfully', async () => {
      if (!testSignatureId) {
        // Create a signature first
        const signatureData = {
          recordId: testRecordId,
          documentType: 'prescription',
          documentContent: 'Test content',
          signerEmail: 'doctor@visioncare.com',
          signerName: 'Dr. Test'
        };

        const createResponse = await request(app)
          .post('/api/digital-signature/create')
          .send(signatureData);

        testSignatureId = createResponse.body.data.id;
      }

      const response = await request(app)
        .put(`/api/digital-signature/${testSignatureId}/cancel`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe('cancelled');
    });

    it('should return 400 for missing signature ID', async () => {
      const response = await request(app)
        .put('/api/digital-signature//cancel')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return 404 for non-existent signature', async () => {
      const response = await request(app)
        .put('/api/digital-signature/non-existent-id/cancel')
        .expect(404);

      expect(response.body.error).toContain('Signature not found');
    });
  });

  describe('GET /api/digital-signature/:id/download', () => {
    it('should return 400 for unsigned document', async () => {
      if (!testSignatureId) {
        // Create a signature first
        const signatureData = {
          recordId: testRecordId,
          documentType: 'prescription',
          documentContent: 'Test content',
          signerEmail: 'doctor@visioncare.com',
          signerName: 'Dr. Test'
        };

        const createResponse = await request(app)
          .post('/api/digital-signature/create')
          .send(signatureData);

        testSignatureId = createResponse.body.data.id;
      }

      const response = await request(app)
        .get(`/api/digital-signature/${testSignatureId}/download`)
        .expect(400);

      expect(response.body.error).toContain('Document is not signed yet');
    });

    it('should return 400 for missing signature ID', async () => {
      const response = await request(app)
        .get('/api/digital-signature//download')
        .expect(404); // Express returns 404 for missing route params
    });

    it('should return 404 for non-existent signature', async () => {
      const response = await request(app)
        .get('/api/digital-signature/non-existent-id/download')
        .expect(404);

      expect(response.body.error).toContain('Signature not found');
    });
  });

  describe('POST /api/digital-signature/webhook', () => {
    it('should process webhook successfully', async () => {
      const webhookData = {
        externalId: 'mock_external_id',
        status: 'signed',
        signedAt: new Date().toISOString(),
        signedDocumentUrl: 'https://mock-signature.com/document/mock_external_id'
      };

      const response = await request(app)
        .post('/api/digital-signature/webhook')
        .send(webhookData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Webhook processed successfully');
    });

    it('should return 400 for missing webhook data', async () => {
      const response = await request(app)
        .post('/api/digital-signature/webhook')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Missing required webhook data');
    });
  });

  describe('Authentication', () => {
    it('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const unauthenticatedApp = express();
      unauthenticatedApp.use(express.json());
      unauthenticatedApp.use('/api/digital-signature', digitalSignatureRoutes);

      const endpoints = [
        { method: 'post', path: '/api/digital-signature/create' },
        { method: 'get', path: '/api/digital-signature/test-id/status' },
        { method: 'get', path: '/api/digital-signature/record/test-record-id' },
        { method: 'put', path: '/api/digital-signature/test-id/cancel' },
        { method: 'get', path: '/api/digital-signature/test-id/download' }
      ];

      for (const endpoint of endpoints) {
        const response = await request(unauthenticatedApp)
          [endpoint.method as keyof typeof request](endpoint.path)
          .expect(401);

        expect(response.body.error).toBeDefined();
      }
    });
  });
});