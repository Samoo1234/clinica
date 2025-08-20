import React, { useState } from 'react';
import { nfseService } from '../../services/nfse';
import { useToast } from '../../contexts/ToastContext';

interface IssueNFSeModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  appointmentData?: {
    patient_name: string;
    doctor_name: string;
    scheduled_at: string;
    value?: number;
  };
  onSuccess?: (invoice: any) => void;
}

const IssueNFSeModal: React.FC<IssueNFSeModalProps> = ({
  isOpen,
  onClose,
  appointmentId,
  appointmentData,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: appointmentData?.value || 0,
    service_description: 'Consulta oftalmológica'
  });
  const { showSuccess, showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || formData.amount <= 0) {
      showError('Valor deve ser maior que zero');
      return;
    }

    if (!formData.service_description.trim()) {
      showError('Descrição do serviço é obrigatória');
      return;
    }

    try {
      setLoading(true);
      
      const invoice = await nfseService.issueInvoice({
        appointment_id: appointmentId,
        amount: formData.amount,
        service_description: formData.service_description
      });

      showSuccess('NFS-e emitida com sucesso!');
      onSuccess?.(invoice);
      onClose();
      
    } catch (error) {
      console.error('Error issuing NFS-e:', error);
      showError(error instanceof Error ? error.message : 'Erro ao emitir NFS-e');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Emitir NFS-e
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {appointmentData && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Dados da Consulta</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Paciente:</strong> {appointmentData.patient_name}</p>
                <p><strong>Médico:</strong> {appointmentData.doctor_name}</p>
                <p><strong>Data:</strong> {new Date(appointmentData.scheduled_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor da Consulta *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                  R$
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', parseFloat(e.target.value) || 0)}
                  className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição do Serviço *
              </label>
              <textarea
                value={formData.service_description}
                onChange={(e) => handleInputChange('service_description', e.target.value)}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Descreva o serviço prestado..."
                required
              />
            </div>

            <div className="bg-gray-50 p-3 rounded text-sm">
              <div className="flex justify-between mb-1">
                <span>Valor Bruto:</span>
                <span>{nfseService.formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between mb-1">
                <span>ISS (5%):</span>
                <span className="text-red-600">
                  -{nfseService.formatCurrency(formData.amount * 0.05)}
                </span>
              </div>
              <div className="flex justify-between font-medium border-t pt-1">
                <span>Valor Líquido:</span>
                <span className="text-green-600">
                  {nfseService.formatCurrency(formData.amount * 0.95)}
                </span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? '⏳ Emitindo...' : '📄 Emitir NFS-e'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueNFSeModal;