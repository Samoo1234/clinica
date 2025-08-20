import { supabaseAdmin as supabase } from '../config/supabase';
import { Database } from '../types/database';

type Payment = Database['public']['Tables']['payments']['Row'];
type PaymentInsert = Database['public']['Tables']['payments']['Insert'];
type PaymentUpdate = Database['public']['Tables']['payments']['Update'];
type PaymentInstallment = Database['public']['Tables']['payment_installments']['Row'];
type ServicePrice = Database['public']['Tables']['service_prices']['Row'];
type FinancialTransaction = Database['public']['Tables']['financial_transactions']['Row'];

export class FinancialService {
  // Payment management
  async createPayment(paymentData: PaymentInsert): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating payment: ${error.message}`);
    }

    // Create financial transaction record
    await this.createFinancialTransaction({
      payment_id: data.id,
      transaction_type: 'income',
      amount: data.amount,
      description: `Payment for appointment ${data.appointment_id}`,
      category: 'consultation',
      transaction_date: new Date().toISOString().split('T')[0]
    });

    return data;
  }

  async updatePayment(id: string, updates: PaymentUpdate): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating payment: ${error.message}`);
    }

    return data;
  }

  async getPayment(id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          id,
          scheduled_at,
          patient:patients(name, cpf),
          doctor:users(name)
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching payment: ${error.message}`);
    }

    return data;
  }

  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching payments: ${error.message}`);
    }

    return data;
  }

  async getPaymentsByPatient(patientId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments!inner(
          id,
          scheduled_at,
          patient_id
        )
      `)
      .eq('appointment.patient_id', patientId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching patient payments: ${error.message}`);
    }

    return data;
  }

  // Payment installments
  async createPaymentInstallments(paymentId: string, installments: number, totalAmount: number): Promise<PaymentInstallment[]> {
    const installmentAmount = totalAmount / installments;
    const installmentData = [];

    for (let i = 1; i <= installments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i - 1);
      
      installmentData.push({
        payment_id: paymentId,
        installment_number: i,
        amount: installmentAmount,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'pending' as const
      });
    }

    const { data, error } = await supabase
      .from('payment_installments')
      .insert(installmentData)
      .select();

    if (error) {
      throw new Error(`Error creating payment installments: ${error.message}`);
    }

    return data;
  }

  async updatePaymentInstallment(id: string, updates: Partial<PaymentInstallment>): Promise<PaymentInstallment> {
    const { data, error } = await supabase
      .from('payment_installments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating payment installment: ${error.message}`);
    }

    return data;
  }

  async getOverduePayments(): Promise<Payment[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          id,
          scheduled_at,
          patient:patients(name, cpf, phone),
          doctor:users(name)
        )
      `)
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching overdue payments: ${error.message}`);
    }

    return data;
  }

  // Service prices management
  async getServicePrices(): Promise<ServicePrice[]> {
    const { data, error } = await supabase
      .from('service_prices')
      .select('*')
      .eq('active', true)
      .order('service_name');

    if (error) {
      throw new Error(`Error fetching service prices: ${error.message}`);
    }

    return data;
  }

  async createServicePrice(serviceData: Omit<ServicePrice, 'id' | 'created_at' | 'updated_at'>): Promise<ServicePrice> {
    const { data, error } = await supabase
      .from('service_prices')
      .insert(serviceData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating service price: ${error.message}`);
    }

    return data;
  }

  async updateServicePrice(id: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
    const { data, error } = await supabase
      .from('service_prices')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Error updating service price: ${error.message}`);
    }

    return data;
  }

  // Financial transactions
  async createFinancialTransaction(transactionData: Omit<FinancialTransaction, 'id' | 'created_at'>): Promise<FinancialTransaction> {
    const { data, error } = await supabase
      .from('financial_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      throw new Error(`Error creating financial transaction: ${error.message}`);
    }

    return data;
  }

  async getFinancialTransactions(startDate?: string, endDate?: string): Promise<FinancialTransaction[]> {
    let query = supabase
      .from('financial_transactions')
      .select('*')
      .order('transaction_date', { ascending: false });

    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Error fetching financial transactions: ${error.message}`);
    }

    return data;
  }

  // Financial reports
  async getAccountsReceivable(): Promise<any[]> {
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointment:appointments(
          id,
          scheduled_at,
          patient:patients(name, cpf, phone),
          doctor:users(name)
        )
      `)
      .eq('status', 'pending')
      .order('due_date', { ascending: true });

    if (error) {
      throw new Error(`Error fetching accounts receivable: ${error.message}`);
    }

    return data;
  }

  async getFinancialSummary(startDate: string, endDate: string): Promise<any> {
    // Get total income
    const { data: incomeData, error: incomeError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('transaction_type', 'income')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (incomeError) {
      throw new Error(`Error fetching income data: ${incomeError.message}`);
    }

    // Get total expenses
    const { data: expenseData, error: expenseError } = await supabase
      .from('financial_transactions')
      .select('amount')
      .eq('transaction_type', 'expense')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (expenseError) {
      throw new Error(`Error fetching expense data: ${expenseError.message}`);
    }

    // Get pending payments
    const { data: pendingData, error: pendingError } = await supabase
      .from('payments')
      .select('amount')
      .eq('status', 'pending');

    if (pendingError) {
      throw new Error(`Error fetching pending payments: ${pendingError.message}`);
    }

    const totalIncome = incomeData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const totalExpenses = expenseData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
    const totalPending = pendingData.reduce((sum: number, item: any) => sum + Number(item.amount), 0);

    return {
      totalIncome,
      totalExpenses,
      netIncome: totalIncome - totalExpenses,
      totalPending,
      period: { startDate, endDate }
    };
  }
}

export const financialService = new FinancialService();