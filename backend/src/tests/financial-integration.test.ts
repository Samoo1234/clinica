import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import financialRoutes from '../routes/financial';
import { supabase } from '../services/database';

const app = express();
app.use(express.json());

// Mock authentication middleware
app.use((req, res, next) => {
  req.user = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    email: 'test@example.com',
    role: 'admin'
  };
  next();
});

app.use('/api/financial', financialRoutes);

describe('Financial API Integration', () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testAppointmentId: string;
  let testPaymentId: string;
  let testServicePriceId: string;

  beforeEach(async () => {
    // Create test patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        cpf: '98765432100',
        name: 'Test Patient Financial API',
        birth_date: '1990-01-01',
        phone: '11999999999',
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

    if (patientError) throw patientError;
    testPatientId = patient.id;

    // Create test doctor
    const { data: doctor, error: doctorError } = await supabase
      .from('users')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'doctor.financial.api@test.com',
        name: 'Dr. Financial API Test',
        role: 'doctor'
      })
      .select()
      .single();

    if (doctorError) throw doctorError;
    testDoctorId = doctor.id;

    // Create test appointment
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert({
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: new Date().toISOString(),
        value: 200.00,
        status: 'completed'
      })
      .select()
      .single();

    if (appointmentError) throw appointmentError;
    testAppointmentId = appointment.id;
  });

  afterEach(async () => {
    // Clean up test data
    if (testPaymentId) {
      await supabase.from('payments').delete().eq('id', testPaymentId);
    }
    if (testServicePriceId) {
      await supabase.from('service_prices').delete().eq('id', testServicePriceId);
    }
    if (testAppointmentId) {
      await supabase.from('appointments').delete().eq('id', testAppointmentId);
    }
    if (testDoctorId) {
      await supabase.from('users').delete().eq('id', testDoctorId);
    }
    if (testPatientId) {
      await supabase.from('patients').delete().eq('id', testPatientId);
    }
  });

  describe('POST /api/financial/payments', () => {
    it('should create a new payment', async () => {
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 200.00,
        payment_method: 'cash',
        status: 'pending',
        installments: 1,
        installment_number: 1,
        due_date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/financial/payments')
        .send(paymentData)
        .expect(201);

      testPaymentId = response.body.id;

      expect(response.body).toHaveProperty('id');
      expect(response.body.appointment_id).toBe(testAppointmentId);
      expect(response.body.amount).toBe(200.00);
      expect(response.body.payment_method).toBe('cash');
      expect(response.body.status).toBe('pending');
    });

    it('should return 500 for invalid appointment_id', async () => {
      const paymentData = {
        appointment_id: '00000000-0000-0000-0000-000000000000',
        amount: 200.00,
        payment_method: 'cash',
        status: 'pending',
        installments: 1,
        installment_number: 1
      };

      await request(app)
        .post('/api/financial/payments')
        .send(paymentData)
        .expect(500);
    });
  });

  describe('GET /api/financial/payments/:id', () => {
    it('should get payment by id', async () => {
      // First create a payment
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          appointment_id: testAppointmentId,
          amount: 200.00,
          payment_method: 'credit_card',
          status: 'pending',
          installments: 1,
          installment_number: 1
        })
        .select()
        .single();

      if (error) throw error;
      testPaymentId = payment.id;

      const response = await request(app)
        .get(`/api/financial/payments/${testPaymentId}`)
        .expect(200);

      expect(response.body.id).toBe(testPaymentId);
      expect(response.body.amount).toBe(200.00);
      expect(response.body.payment_method).toBe('credit_card');
    });

    it('should return 404 for non-existent payment', async () => {
      await request(app)
        .get('/api/financial/payments/00000000-0000-0000-0000-000000000000')
        .expect(404);
    });
  });

  describe('PUT /api/financial/payments/:id', () => {
    it('should update payment', async () => {
      // First create a payment
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          appointment_id: testAppointmentId,
          amount: 200.00,
          payment_method: 'cash',
          status: 'pending',
          installments: 1,
          installment_number: 1
        })
        .select()
        .single();

      if (error) throw error;
      testPaymentId = payment.id;

      const updateData = {
        status: 'paid',
        payment_date: new Date().toISOString()
      };

      const response = await request(app)
        .put(`/api/financial/payments/${testPaymentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.status).toBe('paid');
      expect(response.body.payment_date).toBeDefined();
    });
  });

  describe('GET /api/financial/appointments/:appointmentId/payments', () => {
    it('should get payments by appointment', async () => {
      // First create a payment
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          appointment_id: testAppointmentId,
          amount: 200.00,
          payment_method: 'pix',
          status: 'pending',
          installments: 1,
          installment_number: 1
        })
        .select()
        .single();

      if (error) throw error;
      testPaymentId = payment.id;

      const response = await request(app)
        .get(`/api/financial/appointments/${testAppointmentId}/payments`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0].appointment_id).toBe(testAppointmentId);
    });
  });

  describe('POST /api/financial/service-prices', () => {
    it('should create service price', async () => {
      const servicePriceData = {
        service_name: 'API Test Service',
        description: 'Test service for API',
        base_price: 150.00,
        insurance_price: 120.00,
        active: true
      };

      const response = await request(app)
        .post('/api/financial/service-prices')
        .send(servicePriceData)
        .expect(201);

      testServicePriceId = response.body.id;

      expect(response.body).toHaveProperty('id');
      expect(response.body.service_name).toBe('API Test Service');
      expect(response.body.base_price).toBe(150.00);
      expect(response.body.insurance_price).toBe(120.00);
    });
  });

  describe('GET /api/financial/service-prices', () => {
    it('should get service prices', async () => {
      const response = await request(app)
        .get('/api/financial/service-prices')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/financial/reports/accounts-receivable', () => {
    it('should get accounts receivable', async () => {
      const response = await request(app)
        .get('/api/financial/reports/accounts-receivable')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/financial/reports/financial-summary', () => {
    it('should get financial summary', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/financial/reports/financial-summary?start_date=${startDate}&end_date=${endDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('totalIncome');
      expect(response.body).toHaveProperty('totalExpenses');
      expect(response.body).toHaveProperty('netIncome');
      expect(response.body).toHaveProperty('totalPending');
      expect(response.body.period.startDate).toBe(startDate);
      expect(response.body.period.endDate).toBe(endDate);
    });

    it('should return 400 for missing date parameters', async () => {
      await request(app)
        .get('/api/financial/reports/financial-summary')
        .expect(400);
    });
  });

  describe('GET /api/financial/dashboard', () => {
    it('should get financial dashboard', async () => {
      const response = await request(app)
        .get('/api/financial/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('total_revenue');
      expect(response.body).toHaveProperty('paid_revenue');
      expect(response.body).toHaveProperty('pending_revenue');
      expect(response.body).toHaveProperty('overdue_revenue');
      expect(response.body).toHaveProperty('total_appointments');
      expect(response.body).toHaveProperty('payment_rate_percentage');
    });

    it('should get financial dashboard with date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/financial/dashboard?start_date=${startDate}&end_date=${endDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_revenue');
      expect(response.body).toHaveProperty('paid_revenue');
    });
  });

  describe('GET /api/financial/alerts', () => {
    it('should get payment alerts', async () => {
      const response = await request(app)
        .get('/api/financial/alerts')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/financial/payments/:id/process', () => {
    it('should process payment', async () => {
      // First create a payment
      const { data: payment, error } = await supabase
        .from('payments')
        .insert({
          appointment_id: testAppointmentId,
          amount: 200.00,
          payment_method: 'cash',
          status: 'pending',
          installments: 1,
          installment_number: 1
        })
        .select()
        .single();

      if (error) throw error;
      testPaymentId = payment.id;

      const processData = {
        payment_method: 'credit_card',
        transaction_id: 'TXN123456',
        notes: 'Payment processed via API test'
      };

      const response = await request(app)
        .post(`/api/financial/payments/${testPaymentId}/process`)
        .send(processData)
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('payment_id');
      expect(response.body.payment_id).toBe(testPaymentId);
    });
  });

  describe('GET /api/financial/patients/:patientId/summary', () => {
    it('should get patient financial summary', async () => {
      const response = await request(app)
        .get(`/api/financial/patients/${testPatientId}/summary`)
        .expect(200);

      expect(response.body).toHaveProperty('patient_id');
      expect(response.body).toHaveProperty('patient_name');
      expect(response.body).toHaveProperty('total_appointments');
      expect(response.body).toHaveProperty('total_amount');
    });
  });

  describe('GET /api/financial/reports/revenue', () => {
    it('should calculate revenue for period', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const response = await request(app)
        .get(`/api/financial/reports/revenue?start_date=${startDate}&end_date=${endDate}`)
        .expect(200);

      expect(response.body).toHaveProperty('total_revenue');
      expect(response.body).toHaveProperty('paid_revenue');
      expect(response.body).toHaveProperty('pending_revenue');
      expect(response.body).toHaveProperty('overdue_revenue');
    });

    it('should return 400 for missing date parameters', async () => {
      await request(app)
        .get('/api/financial/reports/revenue')
        .expect(400);
    });
  });
});