import { useState, useEffect } from 'react'
import { MedicalRecord, DigitalSignature } from '../../types/database'
import { digitalSignatureService } from '../../services/digital-signature'
import { useAuth } from '../../contexts/SimpleAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { SignatureRequestForm } from './SignatureRequestForm'
import { SignatureHistory } from './SignatureHistory'
import { 
  FileSignature, 
  Plus, 
  History,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react'

interface DigitalSignatureInterfaceProps {
  record: MedicalRecord
  onSignatureCreated?: (signature: DigitalSignature) => void
}

export function DigitalSignatureInterface({ record, onSignatureCreated }: DigitalSignatureInterfaceProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [signatures, setSignatures] = useState<DigitalSignature[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadSignatures()
  }, [record.id])

  const loadSignatures = async () => {
    try {
      setLoading(true)
      const signatureList = await digitalSignatureService.getSignaturesByRecord(record.id)
      setSignatures(signatureList)
    } catch (error) {
      console.error('Error loading signatures:', error)
      showToast('error', 'Erro ao carregar assinaturas digitais')
    } finally {
      setLoading(false)
    }
  }

  const handleSignatureCreated = (signature: DigitalSignature) => {
    setSignatures(prev => [signature, ...prev])
    setShowCreateForm(false)
    onSignatureCreated?.(signature)
    showToast('success', 'Solicitação de assinatura criada com sucesso')
  }

  const handleRefreshSignatures = async () => {
    try {
      setRefreshing(true)
      
      // Update status of pending/sent signatures
      const pendingSignatures = signatures.filter(s => 
        s.status === 'pending' || s.status === 'sent'
      )
      
      const updatedSignatures = await Promise.all(
        pendingSignatures.map(async (signature) => {
          try {
            return await digitalSignatureService.getSignatureStatus(signature.id)
          } catch (error) {
            console.error(`Error updating signature ${signature.id}:`, error)
            return signature
          }
        })
      )

      // Update signatures list with new statuses
      setSignatures(prev => {
        const updated = [...prev]
        updatedSignatures.forEach(updatedSig => {
          const index = updated.findIndex(s => s.id === updatedSig.id)
          if (index !== -1) {
            updated[index] = updatedSig
          }
        })
        return updated
      })

      showToast('success', 'Status das assinaturas atualizado')
    } catch (error) {
      console.error('Error refreshing signatures:', error)
      showToast('error', 'Erro ao atualizar status das assinaturas')
    } finally {
      setRefreshing(false)
    }
  }

  const handleCancelSignature = async (signatureId: string) => {
    try {
      await digitalSignatureService.cancelSignature(signatureId)
      setSignatures(prev => 
        prev.map(s => 
          s.id === signatureId 
            ? { ...s, status: 'cancelled' as const }
            : s
        )
      )
      showToast('success', 'Assinatura cancelada com sucesso')
    } catch (error) {
      console.error('Error cancelling signature:', error)
      showToast('error', 'Erro ao cancelar assinatura')
    }
  }

  const getSignatureSummary = () => {
    const total = signatures.length
    const signed = signatures.filter(s => s.status === 'signed').length
    const pending = signatures.filter(s => s.status === 'pending' || s.status === 'sent').length
    const failed = signatures.filter(s => s.status === 'failed').length

    return { total, signed, pending, failed }
  }

  const summary = getSignatureSummary()

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Carregando assinaturas digitais...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-primary-600" />
              Assinatura Digital
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Gerencie assinaturas digitais para documentos médicos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshSignatures}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors disabled:opacity-50"
            >
              {refreshing ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
              ) : (
                <History className="w-4 h-4" />
              )}
              Atualizar
            </button>

            {user?.role === 'doctor' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Nova Assinatura
              </button>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {signatures.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <FileSignature className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Total</span>
              </div>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summary.total}</p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Assinados</span>
              </div>
              <p className="text-2xl font-bold text-green-900 mt-1">{summary.signed}</p>
            </div>

            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-600">Pendentes</span>
              </div>
              <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.pending}</p>
            </div>

            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Falharam</span>
              </div>
              <p className="text-2xl font-bold text-red-900 mt-1">{summary.failed}</p>
            </div>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="mb-6">
            <SignatureRequestForm
              record={record}
              onSignatureCreated={handleSignatureCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}

        {/* Signatures List */}
        {signatures.length > 0 ? (
          <SignatureHistory
            signatures={signatures}
            onCancelSignature={handleCancelSignature}
          />
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileSignature className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma assinatura digital
            </h3>
            <p className="text-gray-600 mb-4">
              Ainda não há solicitações de assinatura digital para este prontuário.
            </p>
            {user?.role === 'doctor' && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                Criar primeira assinatura
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}