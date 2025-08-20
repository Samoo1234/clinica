import React, { useState, useEffect } from 'react';
import { nfseService, Invoice, NFSeReport } from '../services/nfse';
import { useToast } from '../contexts/ToastContext';
import { ModuleGuard } from '../components/ModuleGuard';
import InvoiceList from '../components/fiscal/InvoiceList';
import InvoiceDetails from '../components/fiscal/InvoiceDetails';
import FiscalReports from '../components/fiscal/FiscalReports';
import NFSeConfig from '../components/fiscal/NFSeConfig';
import IssueNFSeTab from '../components/fiscal/IssueNFSeTab';

type TabType = 'invoices' | 'issue' | 'reports' | 'config';

const FiscalManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (activeTab === 'invoices') {
      loadInvoices();
    }
  }, [activeTab, filters, pagination.offset]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const result = await nfseService.listInvoices({
        ...filters,
        limit: pagination.limit,
        offset: pagination.offset
      });
      
      setInvoices(result.invoices);
      setPagination(prev => ({ ...prev, total: result.total }));
    } catch (error) {
      console.error('Error loading invoices:', error);
      showError('Erro ao carregar notas fiscais');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const handleInvoiceSelect = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
  };

  const handleInvoiceUpdate = (updatedInvoice: Invoice) => {
    setInvoices(prev => 
      prev.map(inv => inv.id === updatedInvoice.id ? updatedInvoice : inv)
    );
    setSelectedInvoice(updatedInvoice);
  };

  const handleRetryInvoice = async (invoiceId: string) => {
    try {
      const updatedInvoice = await nfseService.retryInvoice(invoiceId);
      handleInvoiceUpdate(updatedInvoice);
      showSuccess('Reenvio da nota fiscal iniciado');
    } catch (error) {
      console.error('Error retrying invoice:', error);
      showError(error instanceof Error ? error.message : 'Erro ao reenviar nota fiscal');
    }
  };

  const handleCancelInvoice = async (invoiceId: string, reason: string) => {
    try {
      const updatedInvoice = await nfseService.cancelInvoice(invoiceId, reason);
      handleInvoiceUpdate(updatedInvoice);
      showSuccess('Nota fiscal cancelada com sucesso');
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      showError(error instanceof Error ? error.message : 'Erro ao cancelar nota fiscal');
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

  const handlePageChange = (newOffset: number) => {
    setPagination(prev => ({ ...prev, offset: newOffset }));
  };

  const tabs = [
    { id: 'invoices', label: 'Notas Fiscais', icon: '📄' },
    { id: 'issue', label: 'Emitir NFSe', icon: '➕' },
    { id: 'reports', label: 'Relatórios', icon: '📊' },
    { id: 'config', label: 'Configurações', icon: '⚙️' }
  ];

  return (
    <ModuleGuard module="nfse">
      <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestão Fiscal</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'invoices' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <InvoiceList
                invoices={invoices}
                loading={loading}
                filters={filters}
                pagination={pagination}
                onFilterChange={handleFilterChange}
                onInvoiceSelect={handleInvoiceSelect}
                onPageChange={handlePageChange}
                onRetryInvoice={handleRetryInvoice}
                onDownloadPDF={handleDownloadPDF}
              />
            </div>
            <div className="lg:col-span-1">
              {selectedInvoice ? (
                <InvoiceDetails
                  invoice={selectedInvoice}
                  onRetryInvoice={handleRetryInvoice}
                  onCancelInvoice={handleCancelInvoice}
                  onDownloadPDF={handleDownloadPDF}
                />
              ) : (
                <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">📄</div>
                    <p>Selecione uma nota fiscal para ver os detalhes</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'issue' && (
          <IssueNFSeTab onNFSeIssued={loadInvoices} />
        )}

        {activeTab === 'reports' && (
          <FiscalReports />
        )}

        {activeTab === 'config' && (
          <NFSeConfig />
        )}
      </div>
      </div>
    </ModuleGuard>
  );
};

export default FiscalManagement;