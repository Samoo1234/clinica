import { useState, useEffect } from 'react'
import { ModuleGuard } from '../components/ModuleGuard'
import { digitalSignatureService } from '../services/digital-signature'
import { DigitalSignature as DigitalSignatureType } from '../types/database'
import { useToast } from '../contexts/ToastContext'
import { 
  FileSignature, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  User,
  Calendar,
  Plus,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react'

export default function DigitalSignature() {
  const [signatures, setSignatures] = useState<DigitalSignatureType[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const { showError, showSuccess } = useToast()

  useEffect(() => {
    loadAllSignatures()
  }, [])

  const loadAllSignatures = async () => {
    try {
      setLoading(true)
      // Como não temos um endpoint para buscar todas as assinaturas,
      // vamos simular com dados de exemplo
      const mockSignatures: DigitalSignatureType[] = [
        {
          id: '1',
          document_type: 'prescription',
          document_hash: 'hash123',
          signer_email: 'paciente@email.com',
          signer_name: 'João Silva',
          status: 'signed',
          signature_url: null,
          signed_at: '2024-01-15T10:30:00Z',
          expires_at: '2024-02-15T10:30:00Z',
          created_at: '2024-01-10T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z'
        },
        {
          id: '2',
          document_type: 'medical_report',
          document_hash: 'hash456',
          signer_email: 'maria@email.com',
          signer_name: 'Maria Santos',
          status: 'pending',
          signature_url: null,
          signed_at: null,
          expires_at: '2024-02-20T10:30:00Z',
          created_at: '2024-01-18T10:30:00Z',
          updated_at: '2024-01-18T10:30:00Z'
        }
      ]
      setSignatures(mockSignatures)
    } catch (error) {
      console.error('Error loading signatures:', error)
      showError('Erro ao carregar assinaturas digitais')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'signed':
        return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'pending':
      case 'sent':
        return <Clock className="w-5 h-5 text-yellow-600" />
      case 'failed':
      case 'cancelled':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'signed':
        return 'Assinado'
      case 'pending':
        return 'Pendente'
      case 'sent':
        return 'Enviado'
      case 'failed':
        return 'Falhou'
      case 'cancelled':
        return 'Cancelado'
      default:
        return status
    }
  }

  const getDocumentTypeText = (type: string) => {
    switch (type) {
      case 'prescription':
        return 'Receita Médica'
      case 'medical_report':
        return 'Relatório Médico'
      case 'exam_result':
        return 'Resultado de Exame'
      default:
        return type
    }
  }

  if (loading) {
    return (
      <ModuleGuard module="digitalSignature">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assinatura Digital</h1>
            <p className="text-gray-600">Gerencie assinaturas digitais de documentos</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Carregando assinaturas digitais...</span>
            </div>
          </div>
        </div>
      </ModuleGuard>
    )
  }

  const filteredSignatures = signatures.filter(signature => {
    const matchesSearch = signature.signer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getDocumentTypeText(signature.document_type).toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || signature.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleCreateSignature = async (formData: any) => {
    try {
      // Simular criação de assinatura
      const newSignature: DigitalSignatureType = {
        id: Date.now().toString(),
        document_type: formData.documentType,
        document_hash: 'hash' + Date.now(),
        signer_email: formData.signerEmail,
        signer_name: formData.signerName,
        status: 'pending',
        signature_url: null,
        signed_at: null,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      setSignatures(prev => [newSignature, ...prev])
      setShowCreateForm(false)
      showSuccess('Solicitação de assinatura criada com sucesso!')
    } catch (error) {
      showError('Erro ao criar solicitação de assinatura')
    }
  }

  return (
    <ModuleGuard module="digitalSignature">
      <div className="space-y-6">
        {/* Header com ações */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assinatura Digital</h1>
            <p className="text-gray-600">Gerencie assinaturas digitais de documentos</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Assinatura</span>
            </button>
            <button
              onClick={loadAllSignatures}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Atualizar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  placeholder="Nome do assinante ou tipo de documento..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="pending">Pendente</option>
                <option value="sent">Enviado</option>
                <option value="signed">Assinado</option>
                <option value="failed">Falhou</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <FileSignature className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{filteredSignatures.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Assinados</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSignatures.filter(s => s.status === 'signed').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSignatures.filter(s => s.status === 'pending' || s.status === 'sent').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Falharam</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredSignatures.filter(s => s.status === 'failed' || s.status === 'cancelled').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Histórico de Assinaturas ({filteredSignatures.length})
            </h2>
            
            {filteredSignatures.length > 0 ? (
              <div className="space-y-4">
                {filteredSignatures.map((signature) => (
                  <div
                    key={signature.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(signature.status)}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {getDocumentTypeText(signature.document_type)}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{signature.signer_name}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>
                              {new Date(signature.created_at).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        signature.status === 'signed' 
                          ? 'bg-green-100 text-green-800'
                          : signature.status === 'pending' || signature.status === 'sent'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {getStatusText(signature.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileSignature className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma assinatura digital
                </h3>
                <p className="text-gray-600">
                  Ainda não há solicitações de assinatura digital registradas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal para criar nova assinatura */}
        {showCreateForm && (
          <CreateSignatureModal
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateSignature}
          />
        )}
      </div>
    </ModuleGuard>
  )
}

// Modal para criar nova assinatura
interface CreateSignatureModalProps {
  onClose: () => void
  onSubmit: (formData: any) => void
}

function CreateSignatureModal({ onClose, onSubmit }: CreateSignatureModalProps) {
  const [formData, setFormData] = useState({
    documentType: 'prescription',
    documentContent: '',
    signerName: '',
    signerEmail: ''
  })
  const [loading, setLoading] = useState(false)

  const documentTypes = [
    { value: 'prescription', label: 'Receita Médica' },
    { value: 'medical_report', label: 'Laudo Médico' },
    { value: 'certificate', label: 'Atestado Médico' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await onSubmit(formData)
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-[600px] shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <FileSignature className="w-5 h-5 text-blue-600" />
              <span>Nova Solicitação de Assinatura</span>
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Documento *
              </label>
              <select
                value={formData.documentType}
                onChange={(e) => setFormData(prev => ({ ...prev, documentType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {documentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Assinante *
              </label>
              <input
                type="text"
                value={formData.signerName}
                onChange={(e) => setFormData(prev => ({ ...prev, signerName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nome completo do médico"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email do Assinante *
              </label>
              <input
                type="email"
                value={formData.signerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, signerEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="email@exemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Conteúdo do Documento *
              </label>
              <textarea
                value={formData.documentContent}
                onChange={(e) => setFormData(prev => ({ ...prev, documentContent: e.target.value }))}
                rows={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                placeholder="Digite o conteúdo do documento que será assinado..."
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
                {loading ? '⏳ Criando...' : '📄 Criar Solicitação'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}