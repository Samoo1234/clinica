import React, { useState, useEffect } from 'react';
import { nfseService, NFSeReport } from '../../services/nfse';
import { useToast } from '../../contexts/ToastContext';

const FiscalReports: React.FC = () => {
  const [report, setReport] = useState<NFSeReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    status: ''
  });
  const { showError } = useToast();

  useEffect(() => {
    loadReport();
  }, []);

  const loadReport = async () => {
    try {
      setLoading(true);
      const reportData = await nfseService.getReport(filters);
      setReport(reportData);
    } catch (error) {
      console.error('Error loading fiscal report:', error);
      
      // Em caso de erro, usar dados mock para demonstração
      const mockReport: NFSeReport = {
        invoices: [
          {
            id: '1',
            appointment_id: 'app-1',
            nfse_number: '2024001',
            amount: 150.00,
            tax_amount: 7.50,
            net_amount: 142.50,
            service_description: 'Consulta oftalmológica',
            status: 'issued',
            issue_date: new Date().toISOString(),
            retry_count: 0
          },
          {
            id: '2',
            appointment_id: 'app-2',
            nfse_number: '2024002',
            amount: 200.00,
            tax_amount: 10.00,
            net_amount: 190.00,
            service_description: 'Exame de refração',
            status: 'pending',
            issue_date: null,
            retry_count: 0
          }
        ],
        summary: {
          total_invoices: 2,
          total_amount: 350.00,
          total_tax: 17.50,
          total_net: 332.50,
          by_status: {
            issued: 1,
            pending: 1
          }
        }
      };
      
      setReport(mockReport);
      showError('Usando dados de demonstração - Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerateReport = () => {
    loadReport();
  };

  const exportToCSV = () => {
    if (!report || report.invoices.length === 0) return;

    const headers = [
      'Número NFS-e',
      'Data de Emissão',
      'Descrição do Serviço',
      'Valor Bruto',
      'ISS',
      'Valor Líquido',
      'Status',
      'Paciente',
      'Médico'
    ];

    const csvContent = [
      headers.join(','),
      ...report.invoices.map(invoice => [
        invoice.nfse_number || '',
        invoice.issue_date ? new Date(invoice.issue_date).toLocaleDateString('pt-BR') : '',
        `"${invoice.service_description}"`,
        invoice.amount.toFixed(2).replace('.', ','),
        invoice.tax_amount.toFixed(2).replace('.', ','),
        invoice.net_amount.toFixed(2).replace('.', ','),
        nfseService.getStatusLabel(invoice.status),
        invoice.appointment?.patient?.name || '',
        invoice.appointment?.doctor?.name || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio-fiscal-${filters.start_date}-${filters.end_date}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'processing', label: 'Processando' },
    { value: 'issued', label: 'Emitida' },
    { value: 'error', label: 'Erro' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Relatórios Fiscais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Gerando...' : 'Gerar Relatório'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📄</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total de Notas</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {report.summary.total_invoices}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Valor Total</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {nfseService.formatCurrency(report.summary.total_amount)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 text-lg">🏛️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total ISS</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {nfseService.formatCurrency(report.summary.total_tax)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 text-lg">💵</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Valor Líquido</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {nfseService.formatCurrency(report.summary.total_net)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Distribution */}
      {report && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição por Status</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(report.summary.by_status).map(([status, count]) => (
              <div key={status} className="text-center">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${nfseService.getStatusColor(status as any)}`}>
                  {nfseService.getStatusIcon(status as any)} {nfseService.getStatusLabel(status as any)}
                </div>
                <div className="mt-2 text-2xl font-bold text-gray-900">{count}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Actions */}
      {report && report.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exportar Dados</h3>
          
          <div className="flex space-x-4">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              📊 Exportar CSV
            </button>
            
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              🖨️ Imprimir
            </button>
          </div>
        </div>
      )}

      {/* Detailed Report Table */}
      {report && report.invoices.length > 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detalhamento das Notas Fiscais</h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Número NFS-e
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Emissão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Serviço
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Bruto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ISS
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor Líquido
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {report.invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {invoice.nfse_number || `#${invoice.id.slice(0, 8)}`}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {invoice.issue_date ? nfseService.formatDate(invoice.issue_date) : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {invoice.service_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {nfseService.formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {nfseService.formatCurrency(invoice.tax_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {nfseService.formatCurrency(invoice.net_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nfseService.getStatusColor(invoice.status)}`}>
                        {nfseService.getStatusIcon(invoice.status)} {nfseService.getStatusLabel(invoice.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {report && report.invoices.length === 0 && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
          <p className="text-gray-500">
            Não foram encontradas notas fiscais para o período e filtros selecionados.
          </p>
        </div>
      )}
    </div>
  );
};

export default FiscalReports;