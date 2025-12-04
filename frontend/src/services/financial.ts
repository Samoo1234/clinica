import { supabase } from '../config/supabase';

export interface Payment {
  id: string;
  appointment_id: string;
  amount: number;
  payment_method: 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'check' | 'insurance';
  payment_date?: string;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  notes?: string;
  transaction_id?: string;
  installments: number;
  installment_number: number;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentWithDetails extends Payment {
  appointment?: {
    id: string;
    scheduled_at: string;
    patient: {
      name: string;
      cpf: string;
    };
    doctor: {
      name: string;
    };
  };
}

export interface ServicePrice {
  id: string;
  service_name: string;
  description?: string;
  base_price: number;
  insurance_price?: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpenses: number;
  netIncome: number;
  totalPending: number;
  period: {
    startDate: string;
    endDate: string;
  };
}

export interface PaymentAlert {
  alert_type: string;
  alert_message: string;
  patient_name: string;
  patient_phone: string;
  amount: number;
  due_date: string;
  days_overdue: number;
  priority: string;
}

export interface FinancialDashboard {
  total_revenue: number;
  paid_revenue: number;
  pending_revenue: number;
  overdue_revenue: number;
  total_appointments: number;
  paid_appointments: number;
  pending_appointments: number;
  overdue_appointments: number;
  average_appointment_value: number;
  payment_rate_percentage: number;
}

class FinancialService {
  // Payment management - usando Supabase diretamente
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create payment: ${error.message}`);
    return data;
  }

  async getPayment(id: string): Promise<PaymentWithDetails> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw new Error(`Failed to fetch payment: ${error.message}`);
    return data;
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase
      .from('payments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update payment: ${error.message}`);
    return data;
  }

  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('appointment_id', appointmentId);

    if (error) throw new Error(`Failed to fetch appointment payments: ${error.message}`);
    return data || [];
  }

  async getPaymentsByPatient(patientId: string): Promise<PaymentWithDetails[]> {
    // Busca payments através de appointments do paciente
    const { data, error } = await supabase
      .from('payments')
      .select(`
        *,
        appointments!inner(patient_id)
      `)
      .eq('appointments.patient_id', patientId);

    if (error) {
      console.warn('Failed to fetch patient payments:', error.message);
      return [];
    }
    return data || [];
  }

  async processPayment(paymentId: string, data: {
    payment_method: Payment['payment_method'];
    transaction_id?: string;
    notes?: string;
  }): Promise<{ message: string; payment_id: string }> {
    const { error } = await supabase
      .from('payments')
      .update({
        payment_method: data.payment_method,
        transaction_id: data.transaction_id,
        notes: data.notes,
        status: 'paid',
        payment_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (error) throw new Error(`Failed to process payment: ${error.message}`);
    return { message: 'Payment processed', payment_id: paymentId };
  }

  // Service prices
  async getServicePrices(): Promise<ServicePrice[]> {
    const { data, error } = await supabase
      .from('service_prices')
      .select('*')
      .eq('active', true);

    if (error) {
      console.warn('Failed to fetch service prices:', error.message);
      return [];
    }
    return data || [];
  }

  async createServicePrice(serviceData: Omit<ServicePrice, 'id' | 'created_at' | 'updated_at'>): Promise<ServicePrice> {
    const { data, error } = await supabase
      .from('service_prices')
      .insert(serviceData)
      .select()
      .single();

    if (error) throw new Error(`Failed to create service price: ${error.message}`);
    return data;
  }

  async updateServicePrice(id: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
    const { data, error } = await supabase
      .from('service_prices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update service price: ${error.message}`);
    return data;
  }

  // Financial reports
  async getAccountsReceivable(): Promise<PaymentWithDetails[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending');

    if (error) {
      console.warn('Failed to fetch accounts receivable:', error.message);
      return [];
    }
    return data || [];
  }

  async getOverduePayments(): Promise<PaymentWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today);

    if (error) {
      console.warn('Failed to fetch overdue payments:', error.message);
      return [];
    }
    return data || [];
  }

  async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    const { data: payments, error } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate);

    if (error) {
      console.warn('Failed to fetch financial summary:', error.message);
    }

    const paidPayments = (payments || []).filter(p => p.status === 'paid');
    const pendingPayments = (payments || []).filter(p => p.status === 'pending');

    return {
      totalIncome: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalExpenses: 0,
      netIncome: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPending: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      period: { startDate, endDate }
    };
  }

  async getFinancialDashboard(startDate?: string, endDate?: string): Promise<FinancialDashboard> {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const end = endDate || today;

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .gte('created_at', start)
      .lte('created_at', end);

    const allPayments = payments || [];
    const paidPayments = allPayments.filter(p => p.status === 'paid');
    const pendingPayments = allPayments.filter(p => p.status === 'pending');
    const overduePayments = pendingPayments.filter(p => p.due_date && p.due_date < today);

    const totalRevenue = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paidRevenue = paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

    return {
      total_revenue: totalRevenue,
      paid_revenue: paidRevenue,
      pending_revenue: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      overdue_revenue: overduePayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      total_appointments: allPayments.length,
      paid_appointments: paidPayments.length,
      pending_appointments: pendingPayments.length,
      overdue_appointments: overduePayments.length,
      average_appointment_value: allPayments.length > 0 ? totalRevenue / allPayments.length : 0,
      payment_rate_percentage: allPayments.length > 0 ? (paidPayments.length / allPayments.length) * 100 : 0
    };
  }

  async getPaymentAlerts(): Promise<PaymentAlert[]> {
    // Buscar pagamentos em atraso
    const today = new Date().toISOString().split('T')[0];
    const { data: overduePayments } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', today);

    // Transformar em alertas (sem dados do paciente por enquanto)
    return (overduePayments || []).map(payment => {
      const dueDate = new Date(payment.due_date);
      const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        alert_type: 'overdue_payment',
        alert_message: `Pagamento em atraso há ${daysOverdue} dias`,
        patient_name: 'Paciente',
        patient_phone: '',
        amount: payment.amount || 0,
        due_date: payment.due_date,
        days_overdue: daysOverdue,
        priority: daysOverdue > 30 ? 'high' : daysOverdue > 7 ? 'medium' : 'low'
      };
    });
  }

  async getPatientFinancialSummary(patientId: string): Promise<any> {
    const payments = await this.getPaymentsByPatient(patientId);
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');

    return {
      totalPaid: paidPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      totalPending: pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0),
      paymentsCount: payments.length,
      payments
    };
  }

  async calculateRevenue(startDate: string, endDate: string): Promise<any> {
    return this.getFinancialSummary(startDate, endDate);
  }

  // Utility functions
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  getPaymentMethodLabel(method: Payment['payment_method']): string {
    const labels = {
      cash: 'Dinheiro',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
      pix: 'PIX',
      bank_transfer: 'Transferência Bancária',
      check: 'Cheque',
      insurance: 'Convênio'
    };
    return labels[method] || method;
  }

  getPaymentStatusLabel(status: Payment['status'], dueDate?: string): string {
    const labels = {
      pending: 'Pendente',
      paid: 'Pago',
      cancelled: 'Cancelado',
      refunded: 'Reembolsado'
    };
    
    // Check if payment is overdue
    if (status === 'pending' && dueDate && new Date(dueDate) < new Date()) {
      return 'Em Atraso';
    }
    
    return labels[status] || status;
  }

  getPaymentStatusColor(status: Payment['status'], dueDate?: string): string {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      paid: 'text-green-600 bg-green-100',
      cancelled: 'text-gray-600 bg-gray-100',
      refunded: 'text-blue-600 bg-blue-100'
    };
    
    // Check if payment is overdue
    if (status === 'pending' && dueDate && new Date(dueDate) < new Date()) {
      return 'text-red-600 bg-red-100';
    }
    
    return colors[status] || 'text-gray-600 bg-gray-100';
  }
}

export const financialService = new FinancialService();