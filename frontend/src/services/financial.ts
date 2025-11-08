import { supabase } from '../lib/supabase';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
};

// Helper function to get simple auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return `Bearer ${token}`;
};

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
  private baseUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/financial`;

  // Payment management
  async createPayment(paymentData: Omit<Payment, 'id' | 'created_at' | 'updated_at'>): Promise<Payment> {
    const response = await fetch(`${this.baseUrl}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (!response.ok) {
      throw new Error('Failed to create payment');
    }

    return response.json();
  }

  async getPayment(id: string): Promise<PaymentWithDetails> {
    const response = await fetch(`${this.baseUrl}/payments/${id}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment');
    }

    return response.json();
  }

  async updatePayment(id: string, updates: Partial<Payment>): Promise<Payment> {
    const response = await fetch(`${this.baseUrl}/payments/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update payment');
    }

    return response.json();
  }

  async getPaymentsByAppointment(appointmentId: string): Promise<Payment[]> {
    const response = await fetch(`${this.baseUrl}/appointments/${appointmentId}/payments`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch appointment payments');
    }

    return response.json();
  }

  async getPaymentsByPatient(patientId: string): Promise<PaymentWithDetails[]> {
    const response = await fetch(`${this.baseUrl}/patients/${patientId}/payments`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patient payments');
    }

    return response.json();
  }

  async processPayment(paymentId: string, data: {
    payment_method: Payment['payment_method'];
    transaction_id?: string;
    notes?: string;
  }): Promise<{ message: string; payment_id: string }> {
    const response = await fetch(`${this.baseUrl}/payments/${paymentId}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error('Failed to process payment');
    }

    return response.json();
  }

  // Service prices
  async getServicePrices(): Promise<ServicePrice[]> {
    const response = await fetch(`${this.baseUrl}/service-prices`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch service prices');
    }

    return response.json();
  }

  async createServicePrice(serviceData: Omit<ServicePrice, 'id' | 'created_at' | 'updated_at'>): Promise<ServicePrice> {
    const response = await fetch(`${this.baseUrl}/service-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(serviceData)
    });

    if (!response.ok) {
      throw new Error('Failed to create service price');
    }

    return response.json();
  }

  async updateServicePrice(id: string, updates: Partial<ServicePrice>): Promise<ServicePrice> {
    const response = await fetch(`${this.baseUrl}/service-prices/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      throw new Error('Failed to update service price');
    }

    return response.json();
  }

  // Financial reports
  async getAccountsReceivable(): Promise<PaymentWithDetails[]> {
    const response = await fetch(`${this.baseUrl}/reports/accounts-receivable`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts receivable');
    }

    return response.json();
  }

  async getOverduePayments(): Promise<PaymentWithDetails[]> {
    const response = await fetch(`${this.baseUrl}/reports/overdue-payments`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch overdue payments');
    }

    return response.json();
  }

  async getFinancialSummary(startDate: string, endDate: string): Promise<FinancialSummary> {
    const response = await fetch(`${this.baseUrl}/reports/financial-summary?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch financial summary');
    }

    return response.json();
  }

  async getFinancialDashboard(startDate?: string, endDate?: string): Promise<FinancialDashboard> {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const response = await fetch(`${this.baseUrl}/dashboard?${params.toString()}`, {
      headers: {
        'Authorization': getAuthHeader()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch financial dashboard');
    }

    return response.json();
  }

  async getPaymentAlerts(): Promise<PaymentAlert[]> {
    const response = await fetch(`${this.baseUrl}/alerts`, {
      headers: {
        'Authorization': getAuthHeader()
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch payment alerts');
    }

    return response.json();
  }

  async getPatientFinancialSummary(patientId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/patients/${patientId}/summary`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch patient financial summary');
    }

    return response.json();
  }

  async calculateRevenue(startDate: string, endDate: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/reports/revenue?start_date=${startDate}&end_date=${endDate}`, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to calculate revenue');
    }

    return response.json();
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