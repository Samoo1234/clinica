import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/SimpleAuthContext'
import { useToast } from '../contexts/ToastContext'
import { ConsultationList } from '../components/consultations/ConsultationList'
import { ConsultationDetails } from '../components/consultations/ConsultationDetails'
import { ConsultationFilters } from '../components/consultations/ConsultationFilters'
import { StartConsultationModal } from '../components/consultations/StartConsultationModal'
import { consultationsService } from '../services/consultations'
import { Consultation, ConsultationStatus, ConsultationStats } from '../types/consultations'
import { Plus, Calendar, Clock, Users } from 'lucide-react'

export default function Consultations() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
  const [showStartModal, setShowStartModal] = useState(false)
  const [filters, setFilters] = useState({
    status: '' as ConsultationStatus | '',
    doctorId: '',
    patientName: '',
    dateFrom: '',
    dateTo: ''
  })

  // Stats
  const [stats, setStats] = useState<ConsultationStats>({
    today: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  })

  useEffect(() => {
    loadConsultations()
    loadStats()
  }, [filters])

  const loadConsultations = async () => {
    try {
      setLoading(true)
      const data = await consultationsService.getConsultations(filters)
      setConsultations(data)
    } catch (error: any) {
      showError(error.message || 'Erro ao carregar consultas')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await consultationsService.getConsultationStats()
      if (statsData) {
        setStats(statsData)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
      // Set default stats on error
      setStats({
        today: 0,
        inProgress: 0,
        completed: 0,
        pending: 0
      })
    }
  }

  const handleStartConsultation = async (appointmentId: string) => {
    try {
      const consultation = await consultationsService.startConsultation(appointmentId)
      setConsultations(prev => [consultation, ...prev])
      setSelectedConsultation(consultation)
      setShowStartModal(false)
      showSuccess('Consulta iniciada com sucesso')
      loadStats()
    } catch (error: any) {
      showError(error.message || 'Erro ao iniciar consulta')
    }
  }

  const handleUpdateConsultation = async (consultationId: string, updates: Partial<Consultation>) => {
    try {
      const updated = await consultationsService.updateConsultation(consultationId, updates)
      setConsultations(prev => 
        prev.map(c => c.id === consultationId ? updated : c)
      )
      if (selectedConsultation?.id === consultationId) {
        setSelectedConsultation(updated)
      }
      showSuccess('Consulta atualizada com sucesso')
      loadStats()
    } catch (error: any) {
      showError(error.message || 'Erro ao atualizar consulta')
    }
  }

  const handleCompleteConsultation = async (consultationId: string, medicalRecordData: any) => {
    try {
      await consultationsService.completeConsultation(consultationId, medicalRecordData)
      loadConsultations()
      setSelectedConsultation(null)
      showSuccess('Consulta finalizada com sucesso')
      loadStats()
    } catch (error: any) {
      showError(error.message || 'Erro ao finalizar consulta')
    }
  }

  // Check if user can start consultations (doctors only)
  const canStartConsultations = user?.role === 'doctor' || user?.role === 'admin'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Consultas</h1>
          <p className="text-gray-600">
            Gerencie e acompanhe as consultas médicas
          </p>
        </div>
        {canStartConsultations && (
          <button
            onClick={() => setShowStartModal(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Iniciar Consulta</span>
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Hoje</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.today || 0}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Em Andamento</p>
              <p className="text-2xl font-bold text-yellow-600">{stats?.inProgress || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Concluídas</p>
              <p className="text-2xl font-bold text-green-600">{stats?.completed || 0}</p>
            </div>
            <Users className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pendentes</p>
              <p className="text-2xl font-bold text-gray-600">{stats?.pending || 0}</p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <ConsultationFilters
        filters={filters}
        onFiltersChange={setFilters}
        onClearFilters={() => setFilters({
          status: '',
          doctorId: '',
          patientName: '',
          dateFrom: '',
          dateTo: ''
        })}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultation List */}
        <div className="lg:col-span-1">
          <ConsultationList
            consultations={consultations}
            loading={loading}
            selectedConsultation={selectedConsultation}
            onSelectConsultation={setSelectedConsultation}
            onUpdateConsultation={handleUpdateConsultation}
          />
        </div>

        {/* Consultation Details */}
        <div className="lg:col-span-2">
          {selectedConsultation ? (
            <ConsultationDetails
              consultation={selectedConsultation}
              onUpdateConsultation={handleUpdateConsultation}
              onCompleteConsultation={handleCompleteConsultation}
              canEdit={canStartConsultations}
            />
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Selecione uma consulta
              </h3>
              <p className="text-gray-600">
                Escolha uma consulta da lista para ver os detalhes e gerenciar o atendimento.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Start Consultation Modal */}
      {showStartModal && (
        <StartConsultationModal
          onClose={() => setShowStartModal(false)}
          onStartConsultation={handleStartConsultation}
        />
      )}
    </div>
  )
}