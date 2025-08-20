import { useState, useEffect } from 'react'
import { X, Play } from 'lucide-react'

interface StartConsultationModalProps {
  onClose: () => void
  onStartConsultation: (appointmentId: string) => void
}

interface Appointment {
  id: string
  patient: {
    name: string
    cpf: string
  }
  doctor: {
    name: string
  }
  scheduledAt: string
  duration: number
}

export function StartConsultationModal({
  onClose,
  onStartConsultation
}: StartConsultationModalProps) {
  const [availableAppointments, setAvailableAppointments] = useState<Appointment[]>([])
  const [selectedAppointment, setSelectedAppointment] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAvailableAppointments()
  }, [])

  const loadAvailableAppointments = async () => {
    try {
      setLoading(true)
      // Mock data for now - in real implementation, this would come from the API
      const mockAppointments: Appointment[] = [
        {
          id: '1',
          patient: { name: 'João Silva', cpf: '123.456.789-00' },
          doctor: { name: 'Dr. Maria Santos' },
          scheduledAt: new Date().toISOString(),
          duration: 30
        },
        {
          id: '2',
          patient: { name: 'Ana Costa', cpf: '987.654.321-00' },
          doctor: { name: 'Dr. Pedro Lima' },
          scheduledAt: new Date(Date.now() + 3600000).toISOString(),
          duration: 45
        }
      ]
      setAvailableAppointments(mockAppointments)
    } catch (error) {
      console.error('Erro ao carregar agendamentos:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedAppointment) {
      onStartConsultation(selectedAppointment)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Iniciar Consulta
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Selecione um agendamento para iniciar a consulta:
            </label>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Carregando agendamentos...</p>
              </div>
            ) : availableAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Nenhum agendamento disponível para iniciar consulta.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableAppointments.map((appointment) => (
                  <label
                    key={appointment.id}
                    className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAppointment === appointment.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="appointment"
                      value={appointment.id}
                      checked={selectedAppointment === appointment.id}
                      onChange={(e) => setSelectedAppointment(e.target.value)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">
                            {appointment.patient.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            CPF: {appointment.patient.cpf}
                          </p>
                          <p className="text-sm text-gray-600">
                            Médico: {appointment.doctor.name}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {formatDateTime(appointment.scheduledAt)}
                          </p>
                          <p className="text-sm text-gray-600">
                            {appointment.duration} min
                          </p>
                        </div>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!selectedAppointment || loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Play className="w-4 h-4" />
              <span>Iniciar Consulta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}