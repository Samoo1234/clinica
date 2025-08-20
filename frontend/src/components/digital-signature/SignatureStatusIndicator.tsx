import React from 'react'
import { SignatureStatus } from '../../types/database'
import { digitalSignatureService } from '../../services/digital-signature'
import { 
  Clock, 
  Send, 
  CheckCircle, 
  XCircle, 
  X,
  AlertCircle
} from 'lucide-react'

interface SignatureStatusIndicatorProps {
  status: SignatureStatus
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SignatureStatusIndicator({ 
  status, 
  showText = true, 
  size = 'md' 
}: SignatureStatusIndicatorProps) {
  const getStatusConfig = (status: SignatureStatus) => {
    switch (status) {
      case 'pending':
        return {
          icon: Clock,
          text: 'Pendente',
          className: 'text-yellow-600 bg-yellow-50 border-yellow-200',
          iconClassName: 'text-yellow-600'
        }
      case 'sent':
        return {
          icon: Send,
          text: 'Enviado',
          className: 'text-blue-600 bg-blue-50 border-blue-200',
          iconClassName: 'text-blue-600'
        }
      case 'signed':
        return {
          icon: CheckCircle,
          text: 'Assinado',
          className: 'text-green-600 bg-green-50 border-green-200',
          iconClassName: 'text-green-600'
        }
      case 'failed':
        return {
          icon: XCircle,
          text: 'Falhou',
          className: 'text-red-600 bg-red-50 border-red-200',
          iconClassName: 'text-red-600'
        }
      case 'cancelled':
        return {
          icon: X,
          text: 'Cancelado',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          iconClassName: 'text-gray-600'
        }
      default:
        return {
          icon: AlertCircle,
          text: 'Desconhecido',
          className: 'text-gray-600 bg-gray-50 border-gray-200',
          iconClassName: 'text-gray-600'
        }
    }
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3'
        }
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5'
        }
      default: // md
        return {
          container: 'px-3 py-1 text-sm',
          icon: 'w-4 h-4'
        }
    }
  }

  const config = getStatusConfig(status)
  const sizeClasses = getSizeClasses(size)
  const Icon = config.icon

  if (!showText) {
    return (
      <div 
        className={`inline-flex items-center justify-center rounded-full p-1 ${config.className}`}
        title={config.text}
      >
        <Icon className={`${sizeClasses.icon} ${config.iconClassName}`} />
      </div>
    )
  }

  return (
    <div className={`inline-flex items-center gap-1 rounded-full border font-medium ${config.className} ${sizeClasses.container}`}>
      <Icon className={`${sizeClasses.icon} ${config.iconClassName}`} />
      <span>{config.text}</span>
    </div>
  )
}

// Utility component for status with tooltip
export function SignatureStatusWithTooltip({ 
  status, 
  createdAt, 
  sentAt, 
  signedAt, 
  expiresAt 
}: {
  status: SignatureStatus
  createdAt: string
  sentAt?: string
  signedAt?: string
  expiresAt?: string
}) {
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return '-'
    return digitalSignatureService.formatDateTime(dateString)
  }

  const getTooltipContent = () => {
    const lines = [
      `Status: ${digitalSignatureService.getStatusText(status)}`,
      `Criado: ${formatDate(createdAt)}`
    ]

    if (sentAt) {
      lines.push(`Enviado: ${formatDate(sentAt)}`)
    }

    if (signedAt) {
      lines.push(`Assinado: ${formatDate(signedAt)}`)
    }

    if (expiresAt) {
      lines.push(`Expira: ${formatDate(expiresAt)}`)
    }

    return lines.join('\n')
  }

  return (
    <div title={getTooltipContent()}>
      <SignatureStatusIndicator status={status} />
    </div>
  )
}