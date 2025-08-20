
import { Calendar, Clock, User, UserCheck, Phone, MoreVertical } from 'lucide-react'
import { AppointmentWithRelations } from '../../services/appointments'
import { formatTime } from '../../utils/calendar'

interface AppointmentListProps {
  appointments: AppointmentWithRelations[]
  onAppointmentClick: (appointment: AppointmentWithRelations) => void
  loading?: boolean
}

export function AppointmentList({ appointments, onAppointmentClick, loading }: AppointmentListProps) {
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

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="w-20 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-12 text-center">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum agendamento encontrado
          </h3>
          <p className="text-gray-600">
            Não há agendamentos para os filtros selecionados.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Lista de Agendamentos ({appointments.length})
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            onClick={() => onAppointmentClick(appointment)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Time */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                </div>

                {/* Appointment Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {formatTime(new Date(appointment.scheduled_at))}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {getStatusText(appointment.status)}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <User className="w-4 h-4" />
                      <span className="truncate">{appointment.patient.name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="w-4 h-4" />
                      <span>{appointment.patient.phone}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 mt-1 text-sm text-gray-500">
                    <UserCheck className="w-4 h-4" />
                    <span>{appointment.doctor.name}</span>
                    <span>•</span>
                    <span>{appointment.duration_minutes} min</span>
                    {appointment.value && appointment.value > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-green-600 font-medium">
                          R$ {appointment.value.toFixed(2).replace('.', ',')}
                        </span>
                      </>
                    )}
                  </div>

                  {appointment.notes && (
                    <p className="text-sm text-gray-500 mt-1 truncate">
                      {appointment.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0">
                <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}