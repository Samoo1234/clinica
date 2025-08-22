import { DigitalSignature } from '../types/database'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface CreateSignatureRequest {
  recordId: string
  documentType: 'prescription' | 'report' | 'certificate' | 'medical_report' | 'exam_result' | 'consent_form'
  documentContent: string
  signerEmail: string
  signerName: string
}

export interface SignatureResponse {
  success: boolean
  data: DigitalSignature
}

export interface SignaturesResponse {
  success: boolean
  data: DigitalSignature[]
}

class DigitalSignatureService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = localStorage.getItem('token')
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    }
  }

  // Create a new signature request
  async createSignatureRequest(request: CreateSignatureRequest): Promise<DigitalSignature> {
    const response = await fetch(`${API_BASE_URL}/api/digital-signature/create`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create signature request')
    }

    const result: SignatureResponse = await response.json()
    return result.data
  }

  // Get signature status
  async getSignatureStatus(signatureId: string): Promise<DigitalSignature> {
    const response = await fetch(`${API_BASE_URL}/api/digital-signature/${signatureId}/status`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get signature status')
    }

    const result: SignatureResponse = await response.json()
    return result.data
  }

  // Download signed document
  async downloadSignedDocument(signatureId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/digital-signature/${signatureId}/download`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to download signed document')
    }

    // Create blob and download
    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `signed-document-${signatureId}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Get signatures by record
  async getSignaturesByRecord(recordId: string): Promise<DigitalSignature[]> {
    const response = await fetch(`${API_BASE_URL}/api/digital-signature/record/${recordId}`, {
      method: 'GET',
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to get signatures for record')
    }

    const result: SignaturesResponse = await response.json()
    return result.data
  }

  // Cancel signature request
  async cancelSignature(signatureId: string): Promise<DigitalSignature> {
    const response = await fetch(`${API_BASE_URL}/api/digital-signature/${signatureId}/cancel`, {
      method: 'PUT',
      headers: await this.getAuthHeaders()
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to cancel signature')
    }

    const result: SignatureResponse = await response.json()
    return result.data
  }

  // Helper methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'sent':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'signed':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'pending':
        return 'Pendente'
      case 'sent':
        return 'Enviado'
      case 'signed':
        return 'Assinado'
      case 'failed':
        return 'Falhou'
      case 'cancelled':
        return 'Cancelado'
      default:
        return 'Desconhecido'
    }
  }

  getDocumentTypeText(type: string): string {
    switch (type) {
      case 'prescription':
        return 'Receita'
      case 'report':
        return 'Laudo'
      case 'certificate':
        return 'Atestado'
      default:
        return 'Documento'
    }
  }

  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
}

export const digitalSignatureService = new DigitalSignatureService()