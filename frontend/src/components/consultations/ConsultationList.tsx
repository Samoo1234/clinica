
import { Consultation } from '../../types/consultations'
import { Clock, User, Calendar, Play, CheckCircle, XCircle } from 'lucide-react'

interface ConsultationListProps {
  consultations: Consultation[]
  loading: boolean
  selectedConsultation: Consultation | null
  onSelectConsultation: (consultation: Consultation) => void
  onUpdateConsultation: (id: string, updates: Partial<Consultation>) => void
}

export function ConsultationList({
  consultations,
  loading,
  selectedConsultation,
  onSelectConsultation
}: ConsultationListProps) {
  const getStatusIcon = (status: Consultation['status']) => {
    switch (status) {
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: Consultation['status']) => {
    switch (status) {
      case 'waiting':
        return 'Aguardando'
      case 'in_progress':
        return 'Em Andamento'
      case 'completed':
        return 'Concluída'
      case 'cancelled':
        return 'Cancelada'
      default:
        return 'Desconhecido'
    }
  }

  const getStatusColor = (status: Consultation['status']) => {
    switch (status) {
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Consultas</h2>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Consultas ({consultations.length})
        </h2>
        
        {consultations.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma consulta encontrada</p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultations.map((consultation) => (
              <div
                key={consultation.id}
                onClick={() => onSelectConsultation(consultation)}
                className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                  selectedConsultation?.id === consultation.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(consultation.status)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(consultation.status)}`}>
                      {getStatusText(consultation.status)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {consultation.appointment?.scheduledAt && formatTime(consultation.appointment.scheduledAt)}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">
                      {consultation.patient?.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      Dr. {consultation.doctor?.name}
                    </span>
                  </div>

                  {consultation.appointment?.scheduledAt && (
                    <div className="text-sm text-gray-500">
                      {formatDate(consultation.appointment.scheduledAt)}
                    </div>
                  )}
                </div>

                {consultation.notes && (
                  <div className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {consultation.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}