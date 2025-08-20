import React from 'react';
import { Invoice, nfseService } from '../../services/nfse';

interface InvoiceListProps {
  invoices: Invoice[];
  loading: boolean;
  filters: {
    status: string;
    start_date: string;
    end_date: string;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
  onFilterChange: (field: string, value: string) => void;
  onInvoiceSelect: (invoice: Invoice) => void;
  onPageChange: (newOffset: number) => void;
  onRetryInvoice: (invoiceId: string) => void;
  onDownloadPDF: (invoiceId: string) => void;
}

const InvoiceList: React.FC<InvoiceListProps> = ({
  invoices,
  loading,
  filters,
  pagination,
  onFilterChange,
  onInvoiceSelect,
  onPageChange,
  onRetryInvoice,
  onDownloadPDF
}) => {
  const statusOptions = [
    { value: '', label: 'Todos os Status' },
    { value: 'pending', label: 'Pendente' },
    { value: 'processing', label: 'Processando' },
    { value: 'issued', label: 'Emitida' },
    { value: 'error', label: 'Erro' },
    { value: 'cancelled', label: 'Cancelada' }
  ];

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const handlePreviousPage = () => {
    if (pagination.offset > 0) {
      onPageChange(pagination.offset - pagination.limit);
    }
  };

  const handleNextPage = () => {
    if (pagination.offset + pagination.limit < pagination.total) {
      onPageChange(pagination.offset + pagination.limit);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      {/* Filters */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Notas Fiscais</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => onFilterChange('start_date', e.target.value)}
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
              onChange={(e) => onFilterChange('end_date', e.target.value)}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Carregando notas fiscais...</p>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-6 text-center">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-gray-500">Nenhuma nota fiscal encontrada</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="p-4 hover:bg-gray-50 cursor-pointer"
              onClick={() => onInvoiceSelect(invoice)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{nfseService.getStatusIcon(invoice.status)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">
                          {invoice.nfse_number || `Nota #${invoice.id.slice(0, 8)}`}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${nfseService.getStatusColor(invoice.status)}`}>
                          {nfseService.getStatusLabel(invoice.status)}
                        </span>
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        {invoice.service_description}
                      </div>
                      <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Valor: {nfseService.formatCurrency(invoice.amount)}</span>
                        {invoice.issue_date && (
                          <span>Emitida: {nfseService.formatDate(invoice.issue_date)}</span>
                        )}
                        <span>Criada: {nfseService.formatDate(invoice.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {invoice.status === 'error' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetryInvoice(invoice.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      title="Reenviar nota fiscal"
                    >
                      🔄 Reenviar
                    </button>
                  )}
                  
                  {invoice.status === 'issued' && invoice.nfse_url && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadPDF(invoice.id);
                      }}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                      title="Baixar PDF"
                    >
                      📥 PDF
                    </button>
                  )}

                  <div className="text-right">
                    <div className="text-lg font-medium text-gray-900">
                      {nfseService.formatCurrency(invoice.amount)}
                    </div>
                    {invoice.tax_amount > 0 && (
                      <div className="text-xs text-gray-500">
                        ISS: {nfseService.formatCurrency(invoice.tax_amount)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {invoice.error_message && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  <strong>Erro:</strong> {invoice.error_message}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!loading && invoices.length > 0 && (
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {pagination.offset + 1} a {Math.min(pagination.offset + pagination.limit, pagination.total)} de {pagination.total} notas fiscais
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePreviousPage}
              disabled={pagination.offset === 0}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>
            
            <span className="text-sm text-gray-700">
              Página {currentPage} de {totalPages}
            </span>
            
            <button
              onClick={handleNextPage}
              disabled={pagination.offset + pagination.limit >= pagination.total}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Próxima
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;