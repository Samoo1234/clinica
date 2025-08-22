import { supabase } from './supabase';

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

export interface Invoice {
  id: string;
  appointment_id: string;
  nfse_number?: string;
  nfse_verification_code?: string;
  nfse_url?: string;
  amount: number;
  service_description: string;
  tax_amount: number;
  net_amount: number;
  issue_date?: string;
  due_date?: string;
  status: 'pending' | 'processing' | 'issued' | 'error' | 'cancelled';
  error_message?: string;
  retry_count: number;
  nfse_data?: any;
  created_at: string;
  updated_at: string;
}

export interface InvoiceWithDetails extends Invoice {
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

export interface NFSeConfig {
  id: string;
  provider_name: string;
  api_url: string;
  api_key: string;
  city_code: string;
  cnpj: string;
  municipal_inscription?: string;
  service_code: string;
  tax_rate: number;
  active: boolean;
}

export interface NFSeLog {
  id: string;
  invoice_id: string;
  operation: string;
  status: 'success' | 'error';
  processing_time_ms?: number;
  error_message?: string;
  created_at: string;
}

export interface NFSeReport {
  invoices: InvoiceWithDetails[];
  summary: {
    total_invoices: number;
    total_amount: number;
    total_tax: number;
    total_net: number;
    by_status: Record<string, number>;
  };
}

class NFSeService {
  private baseUrl = '/api/nfse';

  // Invoice management
  async issueInvoice(data: {
    appointment_id?: string;
    amount: number;
    service_description: string;
    patient_name?: string;
    patient_cpf?: string;
    patient_email?: string;
  }): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/issue`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao emitir NFS-e');
    }

    const result = await response.json();
    return result.invoice;
  }

  async getInvoice(id: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoice/${id}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar nota fiscal');
    }

    const result = await response.json();
    return result.invoice;
  }

  async getInvoicesByAppointment(appointmentId: string): Promise<Invoice[]> {
    const response = await fetch(`${this.baseUrl}/appointment/${appointmentId}/invoices`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar notas fiscais do agendamento');
    }

    const result = await response.json();
    return result.invoices;
  }

  async listInvoices(filters: {
    status?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ invoices: Invoice[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/invoices?${params.toString()}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao listar notas fiscais');
    }

    return response.json();
  }

  async cancelInvoice(id: string, reason: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoice/${id}/cancel`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao cancelar nota fiscal');
    }

    const result = await response.json();
    return result.invoice;
  }

  async retryInvoice(id: string): Promise<Invoice> {
    const response = await fetch(`${this.baseUrl}/invoice/${id}/retry`, {
      method: 'POST',
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao retentar emissão');
    }

    const result = await response.json();
    return result.invoice;
  }

  // Configuration management
  async getConfig(): Promise<NFSeConfig> {
    const response = await fetch(`${this.baseUrl}/config`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar configuração');
    }

    const result = await response.json();
    return result.config;
  }

  async updateConfig(configData: Partial<NFSeConfig>): Promise<NFSeConfig> {
    const response = await fetch(`${this.baseUrl}/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(configData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao atualizar configuração');
    }

    const result = await response.json();
    return result.config;
  }

  // Logs and monitoring
  async getLogs(filters: {
    invoice_id?: string;
    operation?: string;
    status?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: NFSeLog[]; total: number }> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/logs?${params.toString()}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao buscar logs');
    }

    return response.json();
  }

  // Reports
  async getReport(filters: {
    start_date?: string;
    end_date?: string;
    status?: string;
  } = {}): Promise<NFSeReport> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/report?${params.toString()}`, {
      headers: { 'Authorization': getAuthHeader() }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao gerar relatório');
    }

    return response.json();
  }

  // PDF download
  async downloadInvoicePDF(invoiceId: string): Promise<Blob> {
    const invoice = await this.getInvoice(invoiceId);
    
    if (!invoice.nfse_url) {
      throw new Error('URL da NFS-e não disponível');
    }

    // For now, redirect to the NFS-e URL
    // In a real implementation, you might want to proxy the PDF through your backend
    window.open(invoice.nfse_url, '_blank');
    
    // Return empty blob for now
    return new Blob();
  }

  // Utility functions
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  }

  getStatusLabel(status: Invoice['status']): string {
    const labels = {
      pending: 'Pendente',
      processing: 'Processando',
      issued: 'Emitida',
      error: 'Erro',
      cancelled: 'Cancelada'
    };
    return labels[status] || status;
  }

  getStatusColor(status: Invoice['status']): string {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-blue-600 bg-blue-100',
      issued: 'text-green-600 bg-green-100',
      error: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }

  getStatusIcon(status: Invoice['status']): string {
    const icons = {
      pending: '⏳',
      processing: '⚙️',
      issued: '✅',
      error: '❌',
      cancelled: '🚫'
    };
    return icons[status] || '❓';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR');
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('pt-BR');
  }
}

export const nfseService = new NFSeService();