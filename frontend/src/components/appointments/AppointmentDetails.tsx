import { useState } from 'react'
import { X, Calendar, Clock, User, UserCheck, Phone, Mail, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
import { AppointmentWithRelations, appointmentService } from '../../services/appointments'
import { useToast } from '../../contexts/ToastContext'
import { formatDateTime } from '../../utils/calendar'

interface AppointmentDetailsProps {
  appointment: AppointmentWithRelations | null
  isOpen: boolean
  onClose: () => void
  onEdit: (appointment: AppointmentWithRelations) => void
  onRefresh: () => void
}

export function AppointmentDetails({
  appointment,
  isOpen,
  onClose,
  onEdit,
  onRefresh
}: AppointmentDetailsProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)

  if (!isOpen || !appointment) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'no_show':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado'
      case 'confirmed': return 'Confirmado'
      case 'in_progress': return 'Em andamento'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      case 'no_show': return 'Faltou'
      default: return status
    }
  }

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendente'
      case 'paid': return 'Pago'
      case 'cancelled': return 'Cancelado'
      case 'refunded': return 'Reembolsado'
      default: return status
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    setLoading(true)
    try {
      await appointmentService.updateAppointmentStatus(appointment.id, newStatus as any)
      showToast('success', 'Status atualizado com sucesso!')
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error updating status:', error)
      showToast('error', 'Erro ao atualizar status')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Tem certeza que deseja excluir este agendamento?')) {
      return
    }

    setLoading(true)
    try {
      await appointmentService.deleteAppointment(appointment.id)
      showToast('success', 'Agendamento excluído com sucesso!')
      onRefresh()
      onClose()
    } catch (error) {
      console.error('Error deleting appointment:', error)
      showToast('error', 'Erro ao excluir agendamento')
    } finally {
      setLoading(false)
    }
  }

  const canConfirm = appointment.status === 'scheduled'
  const canComplete = appointment.status === 'confirmed' || appointment.status === 'in_progress'
  const canCancel = ['scheduled', 'confirmed'].includes(appointment.status)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Detalhes do Agendamento
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(appointment.status)}`}>
                {getStatusText(appointment.status)}
              </span>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(appointment.payment_status)}`}>
                Pagamento: {getPaymentStatusText(appointment.payment_status)}
              </span>
            </div>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Data e Hora</p>
                <p className="font-medium">{formatDateTime(appointment.scheduled_at)}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Clock className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Duração</p>
                <p className="font-medium">{appointment.duration_minutes} minutos</p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informações do Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium">{appointment.patient.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">CPF</p>
                <p className="font-medium">{appointment.patient.cpf}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{appointment.patient.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Médico Responsável
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium">{appointment.doctor.name}</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-medium">{appointment.doctor.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Value */}
          {appointment.value && appointment.value > 0 && (
            <div>
              <p className="text-sm text-gray-600">Valor</p>
              <p className="text-lg font-semibold text-green-600">
                R$ {appointment.value.toFixed(2).replace('.', ',')}
              </p>
            </div>
          )}

          {/* Notes */}
          {appointment.notes && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Observações</p>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-900">{appointment.notes}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
            {canConfirm && (
              <button
                onClick={() => handleStatusUpdate('confirmed')}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirmar</span>
              </button>
            )}

            {canComplete && (
              <button
                onClick={() => handleStatusUpdate('completed')}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Concluir</span>
              </button>
            )}

            {canCancel && (
              <button
                onClick={() => handleStatusUpdate('cancelled')}
                disabled={loading}
                className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Cancelar</span>
              </button>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleDelete}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>Excluir</span>
          </button>

          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-md transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={() => onEdit(appointment)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              <span>Editar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}