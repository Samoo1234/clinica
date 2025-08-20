import React, { useState, useEffect } from 'react';
import { nfseService, Invoice } from '../../services/nfse';
import { useToast } from '../../contexts/ToastContext';
import IssueNFSeModal from './IssueNFSeModal';

interface AppointmentNFSeActionsProps {
  appointmentId: string;
  appointmentData: {
    patient_name: string;
    doctor_name: string;
    scheduled_at: string;
    value?: number;
    payment_status?: string;
  };
  compact?: boolean;
}

const AppointmentNFSeActions: React.FC<AppointmentNFSeActionsProps> = ({
  appointmentId,
  appointmentData,
  compact = false
}) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadInvoices();
  }, [appointmentId]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const invoiceList = await nfseService.getInvoicesByAppointment(appointmentId);
      setInvoices(invoiceList);
    } catch (error) {
      console.error('Error loading invoices:', error);
      // Don't show error for missing invoices, it's normal
    } finally {
      setLoading(false);
    }
  };

  const handleIssueSuccess = (invoice: Invoice) => {
    setInvoices(prev => [...prev, invoice]);
    showSuccess('NFS-e emitida com sucesso!');
  };

  const handleRetryInvoice = async (invoiceId: string) => {
    try {
      const updatedInvoice = await nfseService.retryInvoice(invoiceId);
      setInvoices(prev => 
        prev.map(inv => inv.id === invoiceId ? updatedInvoice : inv)
      );
      showSuccess('Reenvio da nota fiscal iniciado');
    } catch (error) {
      console.error('Error retrying invoice:', error);
      showError(error instanceof Error ? error.message : 'Erro ao reenviar nota fiscal');
    }
  };

  const handleDownloadPDF = async (invoiceId: string) => {
    try {
      await nfseService.downloadInvoicePDF(invoiceId);
      showSuccess('Download iniciado');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      showError(error instanceof Error ? error.message : 'Erro ao baixar PDF');
    }
  };

  const issuedInvoice = invoices.find(inv => inv.status === 'issued');
  const errorInvoice = invoices.find(inv => inv.status === 'error');
  const processingInvoice = invoices.find(inv => ['pending', 'processing'].includes(inv.status));
  const hasInvoice = invoices.length > 0;
  const canIssue = appointmentData.payment_status === 'paid' && !hasInvoice;

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        {issuedInvoice && (
          <div className="flex items-center space-x-1">
            <span className="text-green-600 text-sm">✅</span>
            <button
              onClick={() => handleDownloadPDF(issuedInvoice.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
              title="Baixar NFS-e"
            >
              📥
            </button>
          </div>
        )}
        
        {errorInvoice && (
          <button
            onClick={() => handleRetryInvoice(errorInvoice.id)}
            className="text-red-600 hover:text-red-800 text-sm"
            title="Reenviar NFS-e"
          >
            🔄
          </button>
        )}
        
        {processingInvoice && (
          <span className="text-blue-600 text-sm" title="Processando NFS-e">
            ⏳
          </span>
        )}
        
        {canIssue && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="text-green-600 hover:text-green-800 text-sm"
            title="Emitir NFS-e"
          >
            📄+
          </button>
        )}

        <IssueNFSeModal
          isOpen={showIssueModal}
          onClose={() => setShowIssueModal(false)}
          appointmentId={appointmentId}
          appointmentData={appointmentData}
          onSuccess={handleIssueSuccess}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Nota Fiscal</h4>
        {canIssue && (
          <button
            onClick={() => setShowIssueModal(true)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            + Emitir NFS-e
          </button>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="text-sm text-gray-500">
          {appointmentData.payment_status === 'paid' 
            ? 'Nenhuma nota fiscal emitida'
            : 'Aguardando pagamento para emitir NFS-e'
          }
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div className="flex items-center space-x-2">
                <span className="text-sm">{nfseService.getStatusIcon(invoice.status)}</span>
                <div>
                  <div className="text-sm font-medium">
                    {invoice.nfse_number || `#${invoice.id.slice(0, 8)}`}
                  </div>
                  <div className="text-xs text-gray-500">
                    {nfseService.getStatusLabel(invoice.status)} • {nfseService.formatCurrency(invoice.amount)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                {invoice.status === 'error' && (
                  <button
                    onClick={() => handleRetryInvoice(invoice.id)}
                    className="text-blue-600 hover:text-blue-800 text-xs"
                    title="Reenviar"
                  >
                    🔄
                  </button>
                )}
                
                {invoice.status === 'issued' && invoice.nfse_url && (
                  <button
                    onClick={() => handleDownloadPDF(invoice.id)}
                    className="text-green-600 hover:text-green-800 text-xs"
                    title="Baixar PDF"
                  >
                    📥
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <IssueNFSeModal
        isOpen={showIssueModal}
        onClose={() => setShowIssueModal(false)}
        appointmentId={appointmentId}
        appointmentData={appointmentData}
        onSuccess={handleIssueSuccess}
      />
    </div>
  );
};

export default AppointmentNFSeActions;