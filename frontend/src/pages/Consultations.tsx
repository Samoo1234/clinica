import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/SimpleAuthContext'
import { useToast } from '../contexts/ToastContext'
import { ConsultationList } from '../components/consultations/ConsultationList'
import { ConsultationDetails } from '../components/consultations/ConsultationDetails'
import { ConsultationFilters } from '../components/consultations/ConsultationFilters'
import { StartConsultationModal } from '../components/consultations/StartConsultationModal'
// import { consultationsService } from '../services/consultations' // Removido - usando dados do banco EXTERNO
import { Consultation, ConsultationStatus, ConsultationStats } from '../types/consultations'
import { Plus, Calendar, Clock, Users, ExternalLink, User, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { listarAgendamentosExternos, type AgendamentoExterno } from '../services/agendamentos-externos'
import { patientSyncService } from '../services/patient-sync'
import { getLocalDateString, isToday, isTodayOrFuture, formatDateBR } from '../utils/date'

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

  // Agendamentos externos
  const [agendamentosExternos, setAgendamentosExternos] = useState<AgendamentoExterno[]>([])
  const [loadingExternos, setLoadingExternos] = useState(false)
  const [mostrarExternos, setMostrarExternos] = useState(true) // Mostrar por padrão

  // Stats
  const [stats, setStats] = useState<ConsultationStats>({
    today: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  })

  // Carregar agendamentos externos automaticamente ao montar
  useEffect(() => {
    loadAgendamentosExternos()
  }, [])

  // Atualizar stats quando agendamentos externos carregarem
  useEffect(() => {
    updateStatsFromExternos()
  }, [agendamentosExternos])

  // Calcular estatísticas a partir dos agendamentos externos
  const updateStatsFromExternos = () => {
    const hoje = getLocalDateString()
    const agendamentosHoje = agendamentosExternos.filter(a => a.data === hoje)
    const pendentes = agendamentosExternos.filter(a => a.status === 'pendente' || a.status === 'confirmado')
    const realizados = agendamentosExternos.filter(a => a.status === 'realizado')
    
    setStats({
      today: agendamentosHoje.length,
      inProgress: consultations.filter(c => c.status === 'in_progress').length,
      completed: realizados.length,
      pending: pendentes.length
    })
  }

  const loadAgendamentosExternos = async () => {
    try {
      setLoadingExternos(true)
      // Buscar TODOS os agendamentos (sem filtro de data ou status)
      const data = await listarAgendamentosExternos({
        limite: 100
      })
      console.log('📊 Agendamentos externos carregados:', data.length)
      setAgendamentosExternos(data)
    } catch (error) {
      console.error('❌ Erro ao carregar agendamentos externos:', error)
      showError('Erro ao carregar agendamentos externos')
    } finally {
      setLoadingExternos(false)
    }
  }

  const handleStartConsultation = async (appointmentId: string) => {
    // Esta função é usada pelo modal antigo - redirecionar para usar agendamentos externos
    showError('Use os agendamentos externos para iniciar uma consulta')
    setShowStartModal(false)
  }

  const handleUpdateConsultation = async (consultationId: string, updates: Partial<Consultation>) => {
    const currentConsultation = consultations.find(c => c.id === consultationId) as any
    const updated = { ...currentConsultation, ...updates, updatedAt: new Date().toISOString() } as Consultation
    
    // Atualiza localmente
    setConsultations(prev => 
      prev.map(c => c.id === consultationId ? updated : c)
    )
    if (selectedConsultation?.id === consultationId) {
      setSelectedConsultation(updated)
    }
    
    showSuccess('Consulta atualizada')
  }

  const handleCompleteConsultation = async (consultationId: string, medicalRecordData: any) => {
    // Buscar a consulta atual
    const consulta = consultations.find(c => c.id === consultationId)
    
    if (!consulta?.patient?.cpf) {
      showError('CPF do paciente é obrigatório para finalizar a consulta')
      return
    }

    try {
      // Usar o serviço de sincronização para persistir os dados
      const resultado = await patientSyncService.finalizarConsulta({
        paciente: {
          cpf: consulta.patient.cpf,
          nome: consulta.patient.name,
          telefone: consulta.patient.phone,
          email: consulta.patient.email,
          data_nascimento: consulta.patient.birthDate
        },
        doctor_id: user?.id || consulta.doctorId,
        agendamento_id: consulta.appointmentId,
        chief_complaint: consulta.queixaPrincipal || medicalRecordData.notes,
        physical_exam: consulta.exameOftalmologico || {},
        diagnosis: medicalRecordData.diagnosis,
        prescription: medicalRecordData.prescription,
        follow_up_date: medicalRecordData.followUpDate
      })

      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao finalizar consulta')
      }

      // Atualizar lista local
      setConsultations(prev => 
        prev.map(c => c.id === consultationId 
          ? { ...c, status: 'completed' as const, completedAt: new Date().toISOString(), ...medicalRecordData }
          : c
        )
      )
      setSelectedConsultation(null)
      
      // Recarregar agendamentos para atualizar status
      loadAgendamentosExternos()
      
      showSuccess('Consulta finalizada e prontuário salvo com sucesso!')

    } catch (error: any) {
      console.error('Erro ao finalizar consulta:', error)
      showError(error.message || 'Erro ao finalizar consulta')
    }
  }

  // Iniciar consulta a partir de agendamento externo (funciona sem backend)
  const handleStartExternalConsultation = async (agendamento: AgendamentoExterno) => {
    try {
      // Verificar se tem CPF para buscar histórico
      let historicoInfo = ''
      if (agendamento.cpf) {
        const historico = await patientSyncService.buscarHistoricoMedicoPorCPF(agendamento.cpf)
        if (historico.totalConsultas > 0) {
          historicoInfo = ` (${historico.totalConsultas} consulta(s) anterior(es))`
          console.log('📋 Histórico encontrado:', historico)
        }
      }

      // Criar consulta local a partir do agendamento externo
      const novaConsulta: Consultation = {
        id: `ext-${agendamento.id}`,
        appointmentId: agendamento.id,
        patientId: agendamento.id, // Usar ID do agendamento como referência
        doctorId: agendamento.medico?.id || '',
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Dados do paciente vindos do agendamento externo
        patient: {
          id: agendamento.id,
          name: agendamento.nome,
          cpf: agendamento.cpf || '',
          birthDate: agendamento.data_nascimento || '',
          phone: agendamento.telefone,
          email: agendamento.email || undefined
        },
        // Dados do médico
        doctor: agendamento.medico ? {
          id: agendamento.medico.id,
          name: agendamento.medico.nome,
          email: '',
          specialization: agendamento.medico.especialidade || undefined
        } : undefined,
        // Dados do agendamento
        appointment: {
          id: agendamento.id,
          scheduledAt: `${agendamento.data}T${agendamento.horario}`,
          duration: 30
        }
      }
      
      setConsultations(prev => [novaConsulta, ...prev])
      setSelectedConsultation(novaConsulta)
      showSuccess(`Consulta iniciada para ${agendamento.nome}${historicoInfo}`)
    } catch (error: any) {
      showError(error.message || 'Erro ao iniciar consulta')
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

      {/* Agendamentos Externos */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Agendamentos do Sistema Externo</h3>
              <p className="text-sm text-gray-600">
                {(() => {
                  const hoje = getLocalDateString()
                  const futuros = agendamentosExternos.filter(a => a.data >= hoje)
                  const disponiveis = agendamentosExternos.filter(a => a.data === hoje)
                  return `${futuros.length} agendamento(s) • ${disponiveis.length} disponível(is) hoje`
                })()}
              </p>
            </div>
          </div>
          <button
            onClick={() => setMostrarExternos(!mostrarExternos)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            {mostrarExternos ? 'Ocultar' : 'Ver Agendamentos'}
          </button>
        </div>

        {mostrarExternos && (
          <div className="mt-4 space-y-2">
            {loadingExternos ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Carregando...</p>
              </div>
            ) : agendamentosExternos.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum agendamento encontrado no sistema externo
              </div>
            ) : (
              <div className="grid gap-2">
                {agendamentosExternos
                  .filter((agendamento) => {
                    // Filtrar apenas agendamentos de hoje ou futuros (fuso horário local)
                    return isTodayOrFuture(agendamento.data)
                  })
                  .map((agendamento) => {
                  const dataAgendamento = agendamento.data
                  const isHoje = isToday(dataAgendamento)
                  const isFuture = !isHoje && isTodayOrFuture(dataAgendamento)
                  
                  return (
                    <div
                      key={agendamento.id}
                      className={`bg-white border rounded-lg p-4 transition-all ${
                        isHoje 
                          ? 'border-green-400 shadow-md' 
                          : 'border-gray-200 opacity-60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-semibold ${isHoje ? 'text-gray-900' : 'text-gray-500'}`}>
                              {agendamento.nome}
                            </span>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Externo
                            </span>
                            {isHoje && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Hoje
                              </span>
                            )}
                            {isFuture && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-medium rounded-full">
                                Futuro
                              </span>
                            )}
                          </div>
                          <div className="mt-1 text-sm text-gray-600 space-y-1">
                            <div className="flex items-center gap-4">
                              <span className={isHoje ? 'font-medium text-blue-600' : ''}>
                                📅 {formatDateBR(agendamento.data)}
                              </span>
                              <span>🕐 {agendamento.horario}</span>
                              {agendamento.telefone && <span>📞 {agendamento.telefone}</span>}
                            </div>
                            {agendamento.medico && (
                              <div className="text-gray-500">
                                👨‍⚕️ {agendamento.medico.nome}
                                {agendamento.medico.especialidade && ` - ${agendamento.medico.especialidade}`}
                              </div>
                            )}
                            {agendamento.cidade && (
                              <div className="text-gray-500">📍 {agendamento.cidade}</div>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col gap-2 items-end">
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                            {agendamento.status}
                          </span>
                          {canStartConsultations && (
                            <button
                              disabled={!isHoje}
                              onClick={() => handleStartExternalConsultation(agendamento)}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isHoje
                                  ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              }`}
                              title={
                                isHoje 
                                  ? 'Iniciar consulta' 
                                  : 'Disponível apenas no dia do agendamento'
                              }
                            >
                              {isHoje ? 'Iniciar Consulta' : 'Indisponível'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
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