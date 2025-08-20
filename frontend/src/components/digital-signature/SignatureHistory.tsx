import React from 'react'
import { DigitalSignature } from '../../types/database'
import { digitalSignatureService } from '../../services/digital-signature'
import { useToast } from '../../contexts/ToastContext'
import { SignatureStatusIndicator } from './SignatureStatusIndicator'
import { 
  Download, 
  ExternalLink, 
  X, 
  User,
  Mail,
  FileText,
  Clipboard,
  Award,
  Eye
} from 'lucide-react'

interface SignatureHistoryProps {
  signatures: DigitalSignature[]
  onCancelSignature: (signatureId: string) => void
}

export function SignatureHistory({ signatures, onCancelSignature }: SignatureHistoryProps) {
  const { showToast } = useToast()

  const handleDownload = async (signature: DigitalSignature) => {
    if (signature.status !== 'signed') {
      showToast('error', 'Documento ainda não foi assinado')
      return
    }

    try {
      await digitalSignatureService.downloadSignedDocument(signature.id)
      showToast('success', 'Download iniciado')
    } catch (error) {
      console.error('Error downloading document:', error)
      showToast(
        'error',
        error instanceof Error ? error.message : 'Erro ao baixar documento'
      )
    }
  }

  const handleOpenSignatureUrl = (signature: DigitalSignature) => {
    if (!signature.signature_url) {
      showToast('error', 'URL de assinatura não disponível')
      return
    }

    window.open(signature.signature_url, '_blank', 'noopener,noreferrer')
  }

  const handleCancel = (signature: DigitalSignature) => {
    if (signature.status !== 'pending' && signature.status !== 'sent') {
      showToast('error', 'Apenas assinaturas pendentes podem ser canceladas')
      return
    }

    if (window.confirm('Tem certeza que deseja cancelar esta solicitação de assinatura?')) {
      onCancelSignature(signature.id)
    }
  }

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'prescription':
        return <FileText className="w-4 h-4 text-blue-500" />
      case 'report':
        return <Clipboard className="w-4 h-4 text-green-500" />
      case 'certificate':
        return <Award className="w-4 h-4 text-purple-500" />
      default:
        return <FileText className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-'
    return digitalSignatureService.formatDateTime(dateString)
  }

  if (signatures.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-medium text-gray-900">
        Histórico de Assinaturas
      </h4>

      <div className="space-y-3">
        {signatures.map((signature) => (
          <div
            key={signature.id}
            className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center gap-3 mb-3">
                  {getDocumentIcon(signature.document_type)}
                  <div>
                    <h5 className="font-medium text-gray-900">
                      {digitalSignatureService.getDocumentTypeText(signature.document_type)}
                    </h5>
                    <p className="text-sm text-gray-600">
                      Criado em {formatDate(signature.created_at)}
                    </p>
                  </div>
                  <SignatureStatusIndicator status={signature.status} />
                </div>

                {/* Signer Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <User className="w-3 h-3" />
                    <span>{signature.signer_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-3 h-3" />
                    <span>{signature.signer_email}</span>
                  </div>
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  {signature.sent_at && (
                    <div>
                      <span className="text-gray-500">Enviado:</span>
                      <p className="font-medium text-gray-700">
                        {formatDate(signature.sent_at)}
                      </p>
                    </div>
                  )}
                  
                  {signature.signed_at && (
                    <div>
                      <span className="text-gray-500">Assinado:</span>
                      <p className="font-medium text-green-700">
                        {formatDate(signature.signed_at)}
                      </p>
                    </div>
                  )}
                  
                  {signature.expires_at && (
                    <div>
                      <span className="text-gray-500">Expira:</span>
                      <p className="font-medium text-gray-700">
                        {formatDate(signature.expires_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Document Content Preview */}
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 flex items-center gap-2">
                    <Eye className="w-3 h-3" />
                    Ver conteúdo do documento
                  </summary>
                  <div className="mt-2 p-3 bg-white border border-gray-200 rounded text-sm font-mono whitespace-pre-wrap max-h-40 overflow-y-auto">
                    {signature.document_content}
                  </div>
                </details>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                {signature.status === 'signed' && (
                  <button
                    onClick={() => handleDownload(signature)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                    title="Baixar documento assinado"
                  >
                    <Download className="w-3 h-3" />
                    Baixar
                  </button>
                )}

                {(signature.status === 'pending' || signature.status === 'sent') && signature.signature_url && (
                  <button
                    onClick={() => handleOpenSignatureUrl(signature)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    title="Abrir URL de assinatura"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Assinar
                  </button>
                )}

                {(signature.status === 'pending' || signature.status === 'sent') && (
                  <button
                    onClick={() => handleCancel(signature)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Cancelar assinatura"
                  >
                    <X className="w-3 h-3" />
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Error Message */}
            {signature.status === 'failed' && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                <strong>Erro:</strong> Falha na assinatura digital. Tente criar uma nova solicitação.
              </div>
            )}

            {/* Provider Information */}
            <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
              <span>Provedor: {signature.signature_provider}</span>
              {signature.external_signature_id && (
                <span className="ml-4">ID Externo: {signature.external_signature_id}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}