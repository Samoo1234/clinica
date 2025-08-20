import { useState } from 'react'
import { Consultation } from '../../types/consultations'
import { VitalSignsForm } from './VitalSignsForm'
import { ConsultationNotes } from './ConsultationNotes'
import { CompleteConsultationModal } from './CompleteConsultationModal'
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Activity, 
  FileText, 
  CheckCircle,
  Play,
  Pause,
  Edit
} from 'lucide-react'

interface ConsultationDetailsProps {
  consultation: Consultation
  onUpdateConsultation: (id: string, updates: Partial<Consultation>) => void
  onCompleteConsultation: (id: string, data: any) => void
  canEdit: boolean
}

export function ConsultationDetails({
  consultation,
  onUpdateConsultation,
  onCompleteConsultation,
  canEdit
}: ConsultationDetailsProps) {
  const [showCompleteModal, setShowCompleteModal] = useState(false)
  const [editingVitalSigns, setEditingVitalSigns] = useState(false)
  const [editingNotes, setEditingNotes] = useState(false)

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
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

  const handleStartConsultation = () => {
    onUpdateConsultation(consultation.id, { status: 'in_progress' })
  }

  const handlePauseConsultation = () => {
    onUpdateConsultation(consultation.id, { status: 'waiting' })
  }

  const handleVitalSignsUpdate = (vitalSigns: Consultation['vitalSigns']) => {
    onUpdateConsultation(consultation.id, { vitalSigns })
    setEditingVitalSigns(false)
  }

  const handleNotesUpdate = (notes: string) => {
    onUpdateConsultation(consultation.id, { notes })
    setEditingNotes(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">
              Detalhes da Consulta
            </h2>
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(consultation.status)}`}>
              {getStatusText(consultation.status)}
            </span>
          </div>

          {canEdit && (
            <div className="flex space-x-2">
              {consultation.status === 'waiting' && (
                <button
                  onClick={handleStartConsultation}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Iniciar</span>
                </button>
              )}

              {consultation.status === 'in_progress' && (
                <>
                  <button
                    onClick={handlePauseConsultation}
                    className="flex items-center space-x-2 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    <span>Pausar</span>
                  </button>
                  <button
                    onClick={() => setShowCompleteModal(true)}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Finalizar</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Patient Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Informações do Paciente</span>
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Nome</label>
                <p className="text-gray-900">{consultation.patient?.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">CPF</label>
                <p className="text-gray-900">{consultation.patient?.cpf}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Data de Nascimento</label>
                <p className="text-gray-900">
                  {consultation.patient?.birthDate && formatDate(consultation.patient.birthDate)}
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <span className="text-gray-900">{consultation.patient?.phone}</span>
              </div>

              {consultation.patient?.email && (
                <div className="flex items-center space-x-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{consultation.patient.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Appointment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Informações do Agendamento</span>
            </h3>

            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">Médico</label>
                <p className="text-gray-900">Dr. {consultation.doctor?.name}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Data/Hora Agendada</label>
                <p className="text-gray-900">
                  {consultation.appointment?.scheduledAt && formatDateTime(consultation.appointment.scheduledAt)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-600">Duração</label>
                <p className="text-gray-900">{consultation.appointment?.duration} minutos</p>
              </div>

              {consultation.appointment?.value && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Valor</label>
                  <p className="text-gray-900">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL'
                    }).format(consultation.appointment.value)}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-600">Iniciada em</label>
                <p className="text-gray-900">{formatDateTime(consultation.startedAt)}</p>
              </div>

              {consultation.completedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Finalizada em</label>
                  <p className="text-gray-900">{formatDateTime(consultation.completedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Vital Signs */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Sinais Vitais</span>
            </h3>
            {canEdit && consultation.status === 'in_progress' && (
              <button
                onClick={() => setEditingVitalSigns(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <VitalSignsForm
            vitalSigns={consultation.vitalSigns}
            editing={editingVitalSigns}
            onSave={handleVitalSignsUpdate}
            onCancel={() => setEditingVitalSigns(false)}
            readOnly={!canEdit || consultation.status !== 'in_progress'}
          />
        </div>

        {/* Notes */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Observações</span>
            </h3>
            {canEdit && consultation.status === 'in_progress' && (
              <button
                onClick={() => setEditingNotes(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            )}
          </div>

          <ConsultationNotes
            notes={consultation.notes || ''}
            editing={editingNotes}
            onSave={handleNotesUpdate}
            onCancel={() => setEditingNotes(false)}
            readOnly={!canEdit || consultation.status !== 'in_progress'}
          />
        </div>

        {/* Diagnosis and Prescription (if completed) */}
        {consultation.status === 'completed' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {consultation.diagnosis && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Diagnóstico</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900">{consultation.diagnosis}</p>
                </div>
              </div>
            )}

            {consultation.prescription && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Prescrição</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-900 whitespace-pre-wrap">{consultation.prescription}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Complete Consultation Modal */}
      {showCompleteModal && (
        <CompleteConsultationModal
          consultation={consultation}
          onClose={() => setShowCompleteModal(false)}
          onComplete={onCompleteConsultation}
        />
      )}
    </div>
  )
}