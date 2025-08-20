import React, { useState } from 'react'
import { MedicalRecord, DigitalSignature, DocumentType } from '../../types/database'
import { digitalSignatureService, CreateSignatureRequest } from '../../services/digital-signature'
import { useAuth } from '../../contexts/SimpleAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { 
  FileSignature, 
  X, 
  Send,
  FileText,
  Clipboard,
  Award,
  User,
  Mail
} from 'lucide-react'

interface SignatureRequestFormProps {
  record: MedicalRecord
  onSignatureCreated: (signature: DigitalSignature) => void
  onCancel: () => void
}

export function SignatureRequestForm({ record, onSignatureCreated, onCancel }: SignatureRequestFormProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    documentType: 'prescription' as DocumentType,
    documentContent: record.prescription || '',
    signerEmail: user?.email || '',
    signerName: user?.name || ''
  })
  
  const [loading, setLoading] = useState(false)

  const documentTypeOptions = [
    { value: 'prescription', label: 'Receita Médica', icon: FileText, description: 'Prescrição de medicamentos' },
    { value: 'report', label: 'Laudo Médico', icon: Clipboard, description: 'Relatório de exames e diagnósticos' },
    { value: 'certificate', label: 'Atestado Médico', icon: Award, description: 'Certificado médico' }
  ]

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleDocumentTypeChange = (type: DocumentType) => {
    let defaultContent = ''
    
    switch (type) {
      case 'prescription':
        defaultContent = record.prescription || ''
        break
      case 'report':
        defaultContent = `LAUDO MÉDICO OFTALMOLÓGICO

Paciente: [Nome do paciente]
Data da consulta: ${new Date(record.consultation_date).toLocaleDateString('pt-BR')}

ANAMNESE:
${record.anamnesis || ''}

EXAME FÍSICO:
${record.physical_exam ? JSON.stringify(record.physical_exam, null, 2) : ''}

DIAGNÓSTICO:
${record.diagnosis || ''}

CONDUTA:
${record.prescription || ''}`
        break
      case 'certificate':
        defaultContent = `ATESTADO MÉDICO

Atesto para os devidos fins que o(a) paciente [Nome do paciente] esteve sob meus cuidados médicos em ${new Date(record.consultation_date).toLocaleDateString('pt-BR')}.

Diagnóstico: ${record.diagnosis || '[Diagnóstico]'}

Recomendo afastamento de suas atividades por [período] dias.

Data: ${new Date().toLocaleDateString('pt-BR')}`
        break
    }
    
    setFormData(prev => ({
      ...prev,
      documentType: type,
      documentContent: defaultContent
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.documentContent.trim()) {
      showToast('error', 'O conteúdo do documento é obrigatório')
      return
    }
    
    if (!formData.signerEmail.trim()) {
      showToast('error', 'O email do assinante é obrigatório')
      return
    }
    
    if (!formData.signerName.trim()) {
      showToast('error', 'O nome do assinante é obrigatório')
      return
    }

    try {
      setLoading(true)
      
      const request: CreateSignatureRequest = {
        recordId: record.id,
        documentType: formData.documentType,
        documentContent: formData.documentContent,
        signerEmail: formData.signerEmail,
        signerName: formData.signerName
      }
      
      const signature = await digitalSignatureService.createSignatureRequest(request)
      onSignatureCreated(signature)
      
    } catch (error) {
      console.error('Error creating signature request:', error)
      showToast(
        'error',
        error instanceof Error ? error.message : 'Erro ao criar solicitação de assinatura'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileSignature className="w-5 h-5 text-primary-600" />
          Nova Solicitação de Assinatura
        </h4>
        
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Tipo de Documento *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {documentTypeOptions.map((option) => {
              const Icon = option.icon
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleDocumentTypeChange(option.value as DocumentType)}
                  className={`p-4 border rounded-lg text-left transition-colors ${
                    formData.documentType === option.value
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{option.label}</span>
                  </div>
                  <p className="text-xs text-gray-600">{option.description}</p>
                </button>
              )
            })}
          </div>
        </div>

        {/* Document Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo do Documento *
          </label>
          <textarea
            value={formData.documentContent}
            onChange={(e) => handleInputChange('documentContent', e.target.value)}
            rows={12}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
            placeholder="Digite o conteúdo do documento que será assinado..."
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Este conteúdo será enviado para assinatura digital
          </p>
        </div>

        {/* Signer Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Nome do Assinante *
            </label>
            <input
              type="text"
              value={formData.signerName}
              onChange={(e) => handleInputChange('signerName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Nome completo do médico"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="w-4 h-4 inline mr-1" />
              Email do Assinante *
            </label>
            <input
              type="email"
              value={formData.signerEmail}
              onChange={(e) => handleInputChange('signerEmail', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="email@exemplo.com"
              required
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <Send className="w-4 h-4" />
            )}
            Enviar para Assinatura
          </button>
        </div>
      </form>
    </div>
  )
}