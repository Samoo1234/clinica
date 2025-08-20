import React, { useState, useEffect } from 'react';
import { financialService, FinancialDashboard, PaymentAlert } from '../services/financial';
import { nfseService } from '../services/nfse';
import { useToast } from '../contexts/ToastContext';

const Financial: React.FC = () => {
  const [dashboard, setDashboard] = useState<FinancialDashboard | null>(null);
  const [alerts, setAlerts] = useState<PaymentAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const { showError } = useToast();

  useEffect(() => {
    loadFinancialData();
  }, [dateRange]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const [dashboardData, alertsData] = await Promise.all([
        financialService.getFinancialDashboard(dateRange.startDate, dateRange.endDate),
        financialService.getPaymentAlerts()
      ]);
      
      setDashboard(dashboardData);
      setAlerts(alertsData);
    } catch (error) {
      console.error('Error loading financial data:', error);
      showError('Erro ao carregar dados financeiros');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão Financeira</h1>
        
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Inicial</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Data Final</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receita Total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {financialService.formatCurrency(dashboard.total_revenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Receita Paga</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {financialService.formatCurrency(dashboard.paid_revenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pendente</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {financialService.formatCurrency(dashboard.pending_revenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Em Atraso</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {financialService.formatCurrency(dashboard.overdue_revenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics */}
      {dashboard && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Consultas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total:</span>
                <span className="text-sm font-medium">{dashboard.total_appointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pagas:</span>
                <span className="text-sm font-medium text-green-600">{dashboard.paid_appointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pendentes:</span>
                <span className="text-sm font-medium text-yellow-600">{dashboard.pending_appointments}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Em Atraso:</span>
                <span className="text-sm font-medium text-red-600">{dashboard.overdue_appointments}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Métricas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Valor Médio:</span>
                <span className="text-sm font-medium">
                  {financialService.formatCurrency(dashboard.average_appointment_value)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Taxa de Pagamento:</span>
                <span className="text-sm font-medium">{dashboard.payment_rate_percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                Ver Contas a Receber
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                Relatório Financeiro
              </button>
              <button 
                onClick={() => window.location.href = '/fiscal-management'}
                className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded"
              >
                📄 Gestão Fiscal (NFS-e)
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded">
                Gerenciar Preços
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Alertas de Pagamento</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {alerts.slice(0, 10).map((alert, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(alert.priority)}`}>
                        {alert.priority.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-900">{alert.patient_name}</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{alert.alert_message}</p>
                    <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                      <span>Valor: {financialService.formatCurrency(alert.amount)}</span>
                      <span>Vencimento: {new Date(alert.due_date).toLocaleDateString('pt-BR')}</span>
                      <span>Telefone: {alert.patient_phone}</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Ver Detalhes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {alerts.length > 10 && (
            <div className="px-6 py-3 bg-gray-50 text-center">
              <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                Ver todos os {alerts.length} alertas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Financial;