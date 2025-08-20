import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { financialService } from '../services/financial';
import { supabase } from '../services/database';

describe('Financial Service', () => {
  let testPatientId: string;
  let testDoctorId: string;
  let testAppointmentId: string;
  let testPaymentId: string;

  beforeEach(async () => {
    // Create test patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .insert({
        cpf: '12345678901',
        name: 'Test Patient Financial',
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
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'doctor.financial@test.com',
        name: 'Dr. Financial Test',
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
        value: 150.00,
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

  describe('Payment Management', () => {
    it('should create a payment', async () => {
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 150.00,
        payment_method: 'cash' as const,
        status: 'pending' as const,
        installments: 1,
        installment_number: 1,
        due_date: new Date().toISOString().split('T')[0]
      };

      const payment = await financialService.createPayment(paymentData);
      testPaymentId = payment.id;

      expect(payment).toBeDefined();
      expect(payment.appointment_id).toBe(testAppointmentId);
      expect(payment.amount).toBe(150.00);
      expect(payment.payment_method).toBe('cash');
      expect(payment.status).toBe('pending');
    });

    it('should get payment by id', async () => {
      // First create a payment
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 150.00,
        payment_method: 'credit_card' as const,
        status: 'pending' as const,
        installments: 1,
        installment_number: 1
      };

      const createdPayment = await financialService.createPayment(paymentData);
      testPaymentId = createdPayment.id;

      // Then get it
      const payment = await financialService.getPayment(testPaymentId);

      expect(payment).toBeDefined();
      expect(payment!.id).toBe(testPaymentId);
      expect(payment!.amount).toBe(150.00);
    });

    it('should update payment', async () => {
      // First create a payment
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 150.00,
        payment_method: 'cash' as const,
        status: 'pending' as const,
        installments: 1,
        installment_number: 1
      };

      const createdPayment = await financialService.createPayment(paymentData);
      testPaymentId = createdPayment.id;

      // Then update it
      const updatedPayment = await financialService.updatePayment(testPaymentId, {
        status: 'paid',
        payment_date: new Date().toISOString()
      });

      expect(updatedPayment.status).toBe('paid');
      expect(updatedPayment.payment_date).toBeDefined();
    });

    it('should get payments by appointment', async () => {
      // Create a payment
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 150.00,
        payment_method: 'pix' as const,
        status: 'pending' as const,
        installments: 1,
        installment_number: 1
      };

      const payment = await financialService.createPayment(paymentData);
      testPaymentId = payment.id;

      // Get payments by appointment
      const payments = await financialService.getPaymentsByAppointment(testAppointmentId);

      expect(payments).toBeDefined();
      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0].appointment_id).toBe(testAppointmentId);
    });

    it('should get payments by patient', async () => {
      // Create a payment
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 150.00,
        payment_method: 'debit_card' as const,
        status: 'pending' as const,
        installments: 1,
        installment_number: 1
      };

      const payment = await financialService.createPayment(paymentData);
      testPaymentId = payment.id;

      // Get payments by patient
      const payments = await financialService.getPaymentsByPatient(testPatientId);

      expect(payments).toBeDefined();
      expect(payments.length).toBeGreaterThan(0);
    });
  });

  describe('Service Prices', () => {
    let testServicePriceId: string;

    afterEach(async () => {
      if (testServicePriceId) {
        await supabase.from('service_prices').delete().eq('id', testServicePriceId);
      }
    });

    it('should create service price', async () => {
      const servicePriceData = {
        service_name: 'Test Service',
        description: 'Test service description',
        base_price: 100.00,
        insurance_price: 80.00,
        active: true
      };

      const servicePrice = await financialService.createServicePrice(servicePriceData);
      testServicePriceId = servicePrice.id;

      expect(servicePrice).toBeDefined();
      expect(servicePrice.service_name).toBe('Test Service');
      expect(servicePrice.base_price).toBe(100.00);
      expect(servicePrice.insurance_price).toBe(80.00);
    });

    it('should get service prices', async () => {
      const servicePrices = await financialService.getServicePrices();

      expect(servicePrices).toBeDefined();
      expect(Array.isArray(servicePrices)).toBe(true);
    });

    it('should update service price', async () => {
      // First create a service price
      const servicePriceData = {
        service_name: 'Test Service Update',
        base_price: 100.00,
        active: true
      };

      const createdServicePrice = await financialService.createServicePrice(servicePriceData);
      testServicePriceId = createdServicePrice.id;

      // Then update it
      const updatedServicePrice = await financialService.updateServicePrice(testServicePriceId, {
        base_price: 120.00,
        insurance_price: 90.00
      });

      expect(updatedServicePrice.base_price).toBe(120.00);
      expect(updatedServicePrice.insurance_price).toBe(90.00);
    });
  });

  describe('Financial Reports', () => {
    it('should get accounts receivable', async () => {
      const accountsReceivable = await financialService.getAccountsReceivable();

      expect(accountsReceivable).toBeDefined();
      expect(Array.isArray(accountsReceivable)).toBe(true);
    });

    it('should get overdue payments', async () => {
      const overduePayments = await financialService.getOverduePayments();

      expect(overduePayments).toBeDefined();
      expect(Array.isArray(overduePayments)).toBe(true);
    });

    it('should get financial summary', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const summary = await financialService.getFinancialSummary(startDate, endDate);

      expect(summary).toBeDefined();
      expect(typeof summary.totalIncome).toBe('number');
      expect(typeof summary.totalExpenses).toBe('number');
      expect(typeof summary.netIncome).toBe('number');
      expect(typeof summary.totalPending).toBe('number');
      expect(summary.period.startDate).toBe(startDate);
      expect(summary.period.endDate).toBe(endDate);
    });
  });

  describe('Payment Installments', () => {
    it('should create payment installments', async () => {
      // First create a payment
      const paymentData = {
        appointment_id: testAppointmentId,
        amount: 300.00,
        payment_method: 'credit_card' as const,
        status: 'pending' as const,
        installments: 3,
        installment_number: 1
      };

      const payment = await financialService.createPayment(paymentData);
      testPaymentId = payment.id;

      // Create installments
      const installments = await financialService.createPaymentInstallments(
        testPaymentId,
        3,
        300.00
      );

      expect(installments).toBeDefined();
      expect(installments.length).toBe(3);
      expect(installments[0].installment_number).toBe(1);
      expect(installments[1].installment_number).toBe(2);
      expect(installments[2].installment_number).toBe(3);

      // Clean up installments
      for (const installment of installments) {
        await supabase.from('payment_installments').delete().eq('id', installment.id);
      }
    });
  });

  describe('Financial Transactions', () => {
    let testTransactionId: string;

    afterEach(async () => {
      if (testTransactionId) {
        await supabase.from('financial_transactions').delete().eq('id', testTransactionId);
      }
    });

    it('should create financial transaction', async () => {
      const transactionData = {
        transaction_type: 'income',
        amount: 150.00,
        description: 'Test transaction',
        category: 'consultation',
        transaction_date: new Date().toISOString().split('T')[0]
      };

      const transaction = await financialService.createFinancialTransaction(transactionData);
      testTransactionId = transaction.id;

      expect(transaction).toBeDefined();
      expect(transaction.transaction_type).toBe('income');
      expect(transaction.amount).toBe(150.00);
      expect(transaction.description).toBe('Test transaction');
    });

    it('should get financial transactions', async () => {
      const transactions = await financialService.getFinancialTransactions();

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
    });

    it('should get financial transactions with date range', async () => {
      const startDate = '2024-01-01';
      const endDate = '2024-12-31';

      const transactions = await financialService.getFinancialTransactions(startDate, endDate);

      expect(transactions).toBeDefined();
      expect(Array.isArray(transactions)).toBe(true);
    });
  });
});