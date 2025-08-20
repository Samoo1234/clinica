import React, { useState, useEffect } from 'react';
import { nfseService } from '../../services/nfse';
import { appointmentsService } from '../../services/appointments';
import { patientsService } from '../../services/patients';
import { useToast } from '../../contexts/ToastContext';
import { 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  FileText,
  Plus,
  Filter,
  RefreshCw
} from 'lucide-react';

interface ConsultationForNFSe {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_cpf?: string;
  doctor_name: string;
  scheduled_at: string;
  status: string;
  value?: number;
  has_nfse: boolean;
}

interface IssueNFSeTabProps {
  onNFSeIssued?: () => void;
}

const IssueNFSeTab: React.FC<IssueNFSeTabProps> = ({ onNFSeIssued }) => {
  const [consultations, setConsultations] = useState<ConsultationForNFSe[]>([]);
  const [filteredConsultations, setFilteredConsultations] = useState<ConsultationForNFSe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationForNFSe | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [showAvulsaForm, setShowAvulsaForm] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    period: '30', // últimos 30 dias
    hasNFSe: 'no' // só consultas sem NFSe
  });
  
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadConsultations();
  }, [filters]);

  useEffect(() => {
    filterConsultations();
  }, [consultations, searchTerm, filters]);

  const loadConsultations = async () => {
    try {
      setLoading(true);
      
      // Simular dados de consultas que podem gerar NFSe
      // Em produção, isso viria de uma API específica
      const mockConsultations: ConsultationForNFSe[] = [
        {
          id: '1',
          patient_id: 'p1',
          patient_name: 'João Silva',
          patient_cpf: '123.456.789-00',
          doctor_name: 'Dr. Maria Santos',
          scheduled_at: '2024-01-15T10:00:00Z',
          status: 'completed',
          value: 150.00,
          has_nfse: false
        },
        {
          id: '2',
          patient_id: 'p2',
          patient_name: 'Ana Costa',
          patient_cpf: '987.654.321-00',
          doctor_name: 'Dr. Carlos Lima',
          scheduled_at: '2024-01-16T14:30:00Z',
          status: 'completed',
          value: 200.00,
          has_nfse: false
        },
        {
          id: '3',
          patient_id: 'p3',
          patient_name: 'Pedro Oliveira',
          patient_cpf: '456.789.123-00',
          doctor_name: 'Dr. Maria Santos',
          scheduled_at: '2024-01-17T09:15:00Z',
          status: 'completed',
          value: 180.00,
          has_nfse: true
        }
      ];
      
      setConsultations(mockConsultations);
    } catch (error) {
      console.error('Error loading consultations:', error);
      showError('Erro ao carregar consultas');
    } finally {
      setLoading(false);
    }
  };

  const filterConsultations = () => {
    let filtered = [...consultations];

    // Filtro por NFSe
    if (filters.hasNFSe === 'no') {
      filtered = filtered.filter(c => !c.has_nfse);
    } else if (filters.hasNFSe === 'yes') {
      filtered = filtered.filter(c => c.has_nfse);
    }

    // Filtro por status
    if (filters.status !== 'all') {
      filtered = filtered.filter(c => c.status === filters.status);
    }

    // Busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.patient_name.toLowerCase().includes(term) ||
        c.doctor_name.toLowerCase().includes(term) ||
        c.patient_cpf?.includes(term)
      );
    }

    setFilteredConsultations(filtered);
  };

  const handleIssueNFSe = async (consultation: ConsultationForNFSe, formData: any) => {
    try {
      const invoice = await nfseService.issueInvoice({
        appointment_id: consultation.id,
        amount: formData.amount,
        service_description: formData.service_description
      });

      // Atualizar a consulta como tendo NFSe
      setConsultations(prev => 
        prev.map(c => 
          c.id === consultation.id 
            ? { ...c, has_nfse: true }
            : c
        )
      );

      showSuccess('NFSe emitida com sucesso!');
      setShowIssueForm(false);
      setSelectedConsultation(null);
      onNFSeIssued?.();
      
    } catch (error) {
      console.error('Error issuing NFSe:', error);
      showError(error instanceof Error ? error.message : 'Erro ao emitir NFSe');
    }
  };

  const handleIssueAvulsaNFSe = async (formData: any) => {
    try {
      const invoice = await nfseService.issueInvoice({
        amount: formData.amount,
        service_description: formData.service_description,
        patient_name: formData.patient_name,
        patient_cpf: formData.patient_cpf,
        patient_email: formData.patient_email
      });

      showSuccess('NFSe avulsa emitida com sucesso!');
      setShowAvulsaForm(false);
      onNFSeIssued?.();
      
    } catch (error) {
      console.error('Error issuing avulsa NFSe:', error);
      showError(error instanceof Error ? error.message : 'Erro ao emitir NFSe avulsa');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Carregando consultas...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Emitir NFSe</h2>
          <p className="text-sm text-gray-600">
            Selecione consultas para emitir notas fiscais ou crie NFSe avulsa
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowAvulsaForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>NFSe Avulsa</span>
          </button>
          <button
            onClick={loadConsultations}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Nome, CPF ou médico..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status NFSe
            </label>
            <select
              value={filters.hasNFSe}
              onChange={(e) => setFilters(prev => ({ ...prev, hasNFSe: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas</option>
              <option value="no">Sem NFSe</option>
              <option value="yes">Com NFSe</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status Consulta
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">Todas</option>
              <option value="completed">Concluídas</option>
              <option value="scheduled">Agendadas</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Período
            </label>
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>
        </div>
      </div>

      {/* Lista de consultas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">
            Consultas Disponíveis ({filteredConsultations.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredConsultations.length > 0 ? (
            filteredConsultations.map((consultation) => (
              <div key={consultation.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <User className="w-8 h-8 text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {consultation.patient_name}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>CPF: {consultation.patient_cpf}</span>
                        <span>Dr. {consultation.doctor_name}</span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(consultation.scheduled_at).toLocaleDateString('pt-BR')}
                        </span>
                        {consultation.value && (
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            R$ {consultation.value.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {consultation.has_nfse ? (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        NFSe Emitida
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedConsultation(consultation);
                          setShowIssueForm(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Emitir NFSe</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma consulta encontrada
              </h3>
              <p className="text-gray-600">
                Não há consultas que atendam aos filtros selecionados.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal para emitir NFSe de consulta */}
      {showIssueForm && selectedConsultation && (
        <IssueConsultationNFSeModal
          consultation={selectedConsultation}
          onClose={() => {
            setShowIssueForm(false);
            setSelectedConsultation(null);
          }}
          onIssue={handleIssueNFSe}
        />
      )}

      {/* Modal para NFSe avulsa */}
      {showAvulsaForm && (
        <IssueAvulsaNFSeModal
          onClose={() => setShowAvulsaForm(false)}
          onIssue={handleIssueAvulsaNFSe}
        />
      )}
    </div>
  );
};

// Modal para emitir NFSe de consulta
interface IssueConsultationNFSeModalProps {
  consultation: ConsultationForNFSe;
  onClose: () => void;
  onIssue: (consultation: ConsultationForNFSe, formData: any) => void;
}

const IssueConsultationNFSeModal: React.FC<IssueConsultationNFSeModalProps> = ({
  consultation,
  onClose,
  onIssue
}) => {
  const [formData, setFormData] = useState({
    amount: consultation.value || 0,
    service_description: 'Consulta oftalmológica'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onIssue(consultation, formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Emitir NFSe - Consulta
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Dados da Consulta</h4>
            <div className="text-sm text-blue-800 space-y-1">
              <p><strong>Paciente:</strong> {consultation.patient_name}</p>
              <p><strong>CPF:</strong> {consultation.patient_cpf}</p>
              <p><strong>Médico:</strong> {consultation.doctor_name}</p>
              <p><strong>Data:</strong> {new Date(consultation.scheduled_at).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>

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
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                onChange={(e) => setFormData(prev => ({ ...prev, service_description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? '⏳ Emitindo...' : '📄 Emitir NFSe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Modal para NFSe avulsa
interface IssueAvulsaNFSeModalProps {
  onClose: () => void;
  onIssue: (formData: any) => void;
}

const IssueAvulsaNFSeModal: React.FC<IssueAvulsaNFSeModalProps> = ({
  onClose,
  onIssue
}) => {
  const [formData, setFormData] = useState({
    patient_name: '',
    patient_cpf: '',
    patient_email: '',
    amount: 0,
    service_description: 'Consulta oftalmológica'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onIssue(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              Emitir NFSe Avulsa
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Paciente *
              </label>
              <input
                type="text"
                value={formData.patient_name}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_name: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CPF *
              </label>
              <input
                type="text"
                value={formData.patient_cpf}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_cpf: e.target.value }))}
                placeholder="000.000.000-00"
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.patient_email}
                onChange={(e) => setFormData(prev => ({ ...prev, patient_email: e.target.value }))}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor *
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
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full pl-10 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                onChange={(e) => setFormData(prev => ({ ...prev, service_description: e.target.value }))}
                rows={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? '⏳ Emitindo...' : '📄 Emitir NFSe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IssueNFSeTab;