import React, { useState } from 'react';
import { Invoice, nfseService } from '../../services/nfse';

interface InvoiceDetailsProps {
  invoice: Invoice;
  onRetryInvoice: (invoiceId: string) => void;
  onCancelInvoice: (invoiceId: string, reason: string) => void;
  onDownloadPDF: (invoiceId: string) => void;
}

const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  onRetryInvoice,
  onCancelInvoice,
  onDownloadPDF
}) => {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showNFSeData, setShowNFSeData] = useState(false);

  const handleCancelSubmit = () => {
    if (cancelReason.trim()) {
      onCancelInvoice(invoice.id, cancelReason);
      setShowCancelModal(false);
      setCancelReason('');
    }
  };

  const formatJSON = (data: any) => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return 'Dados inválidos';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">
            Detalhes da Nota Fiscal
          </h3>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${nfseService.getStatusColor(invoice.status)}`}>
            {nfseService.getStatusIcon(invoice.status)} {nfseService.getStatusLabel(invoice.status)}
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Basic Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Informações Básicas</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="font-mono text-xs">{invoice.id}</span>
            </div>
            
            {invoice.nfse_number && (
              <div className="flex justify-between">
                <span className="text-gray-600">Número NFS-e:</span>
                <span className="font-medium">{invoice.nfse_number}</span>
              </div>
            )}
            
            {invoice.nfse_verification_code && (
              <div className="flex justify-between">
                <span className="text-gray-600">Código de Verificação:</span>
                <span className="font-mono text-xs">{invoice.nfse_verification_code}</span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="text-gray-600">Descrição do Serviço:</span>
              <span className="text-right max-w-xs">{invoice.service_description}</span>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Informações Financeiras</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Valor Bruto:</span>
              <span className="font-medium">{nfseService.formatCurrency(invoice.amount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">ISS:</span>
              <span className="text-red-600">{nfseService.formatCurrency(invoice.tax_amount)}</span>
            </div>
            
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-900 font-medium">Valor Líquido:</span>
              <span className="font-medium text-green-600">{nfseService.formatCurrency(invoice.net_amount)}</span>
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Datas</h4>
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Criada em:</span>
              <span>{nfseService.formatDateTime(invoice.created_at)}</span>
            </div>
            
            {invoice.issue_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Emitida em:</span>
                <span>{nfseService.formatDateTime(invoice.issue_date)}</span>
              </div>
            )}
            
            {invoice.due_date && (
              <div className="flex justify-between">
                <span className="text-gray-600">Vencimento:</span>
                <span>{nfseService.formatDate(invoice.due_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Information */}
        {invoice.error_message && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Informações do Erro</h4>
            <div className="p-3 bg-red-50 border border-red-200 rounded text-sm">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Tentativas:</span>
                <span className="font-medium">{invoice.retry_count}</span>
              </div>
              <div>
                <span className="text-gray-600">Mensagem:</span>
                <p className="mt-1 text-red-700">{invoice.error_message}</p>
              </div>
            </div>
          </div>
        )}

        {/* NFS-e Data */}
        {invoice.nfse_data && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-gray-900">Dados da NFS-e</h4>
              <button
                onClick={() => setShowNFSeData(!showNFSeData)}
                className="text-blue-600 hover:text-blue-800 text-sm"
              >
                {showNFSeData ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
            
            {showNFSeData && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-x-auto">
                  {formatJSON(invoice.nfse_data)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Ações</h4>
          <div className="flex flex-wrap gap-2">
            {invoice.status === 'error' && (
              <button
                onClick={() => onRetryInvoice(invoice.id)}
                className="inline-flex items-center px-3 py-2 border border-blue-300 shadow-sm text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🔄 Reenviar
              </button>
            )}
            
            {invoice.status === 'issued' && (
              <>
                {invoice.nfse_url && (
                  <button
                    onClick={() => onDownloadPDF(invoice.id)}
                    className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    📥 Baixar PDF
                  </button>
                )}
                
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  🚫 Cancelar
                </button>
              </>
            )}
            
            {invoice.nfse_url && (
              <a
                href={invoice.nfse_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                🔗 Ver Online
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Cancelar Nota Fiscal
              </h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motivo do cancelamento:
                </label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Digite o motivo do cancelamento..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCancelSubmit}
                  disabled={!cancelReason.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirmar Cancelamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetails;