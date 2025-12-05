import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/SimpleAuthContext'
import { useToast } from '../contexts/ToastContext'
import { ConsultationList } from '../components/consultations/ConsultationList'
import { ConsultationDetails } from '../components/consultations/ConsultationDetails'
import { ConsultationFilters } from '../components/consultations/ConsultationFilters'
import { Consultation, ConsultationStatus, ConsultationStats } from '../types/consultations'
import { Calendar, Clock, Users, ExternalLink, User, FileText, AlertCircle, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { listarAgendamentosExternos, type AgendamentoExterno } from '../services/agendamentos-externos'
import { patientSyncService } from '../services/patient-sync'
import { buscarClientePorTelefoneENome, buscarClientePorCPF } from '../config/supabaseCentral'
import { getLocalDateString, isToday, isTodayOrFuture, formatDateBR } from '../utils/date'
import { consultationPersistenceService } from '../services/consultation-persistence'

export default function Consultations() {
  const { user } = useAuth()
  const { showSuccess, showError } = useToast()
  
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)
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

  // Consultas finalizadas (para exibição na lista)
  const [consultasFinalizadas, setConsultasFinalizadas] = useState<Consultation[]>([])

  // Stats
  const [stats, setStats] = useState<ConsultationStats>({
    today: 0,
    inProgress: 0,
    completed: 0,
    pending: 0
  })

  // Carregar agendamentos externos e consultas ao montar
  useEffect(() => {
    loadAgendamentosExternos()
    loadConsultasEmAndamento()
    loadConsultasFinalizadas()
  }, [])

  // Carregar consultas em andamento do banco (recuperação de dados)
  const loadConsultasEmAndamento = async () => {
    try {
      setLoading(true)
      console.log('🔄 Carregando consultas em andamento do banco...')
      const consultasRecuperadas = await consultationPersistenceService.buscarConsultasEmAndamento()
      
      if (consultasRecuperadas.length > 0) {
        console.log(`✅ ${consultasRecuperadas.length} consulta(s) recuperada(s) do banco`)
        setConsultations(consultasRecuperadas)
        showSuccess(`${consultasRecuperadas.length} consulta(s) em andamento recuperada(s)`)
      }
    } catch (error) {
      console.error('❌ Erro ao carregar consultas em andamento:', error)
    } finally {
      setLoading(false)
    }
  }

  // Carregar consultas finalizadas do banco
  const loadConsultasFinalizadas = async () => {
    try {
      console.log('🔄 Carregando consultas finalizadas...')
      const finalizadas = await consultationPersistenceService.buscarConsultasFinalizadas(50)
      console.log(`✅ ${finalizadas.length} consulta(s) finalizada(s) carregada(s)`)
      setConsultasFinalizadas(finalizadas)
    } catch (error) {
      console.error('❌ Erro ao carregar consultas finalizadas:', error)
    }
  }

  // Atualizar stats quando dados mudarem
  useEffect(() => {
    updateStats()
  }, [agendamentosExternos, consultations, consultasFinalizadas])

  // Calcular estatísticas
  const updateStats = () => {
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
        limite: 200
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

  // Função para filtrar agendamentos externos
  const filtrarAgendamentos = (agendamentos: AgendamentoExterno[]) => {
    return agendamentos.filter(agendamento => {
      // Filtro por nome do paciente
      if (filters.patientName) {
        const nomeNormalizado = agendamento.nome.toLowerCase()
        if (!nomeNormalizado.includes(filters.patientName.toLowerCase())) {
          return false
        }
      }

      // Filtro por status
      if (filters.status) {
        const statusMap: Record<string, string[]> = {
          'waiting': ['pendente', 'confirmado'],
          'in_progress': ['em_andamento'],
          'completed': ['realizado'],
          'cancelled': ['cancelado', 'faltou']
        }
        const statusValidos = statusMap[filters.status] || []
        if (!statusValidos.includes(agendamento.status)) {
          return false
        }
      }

      // Filtro por médico
      if (filters.doctorId && agendamento.medico) {
        if (agendamento.medico.id !== filters.doctorId) {
          return false
        }
      }

      // Filtro por data inicial
      if (filters.dateFrom) {
        if (agendamento.data < filters.dateFrom) {
          return false
        }
      }

      // Filtro por data final
      if (filters.dateTo) {
        if (agendamento.data > filters.dateTo) {
          return false
        }
      }

      return true
    })
  }

  // Obter lista de médicos únicos dos agendamentos
  const medicosUnicos = Array.from(
    new Map(
      agendamentosExternos
        .filter(a => a.medico)
        .map(a => [a.medico!.id, { id: a.medico!.id, name: a.medico!.nome }])
    ).values()
  )

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
    
    // PERSISTIR NO BANCO - auto-save
    const resultado = await consultationPersistenceService.atualizarConsulta(consultationId, updates)
    if (!resultado.success) {
      console.error('⚠️ Falha ao persistir atualização:', resultado.error)
    }
  }

  // Função para converter ExameOftalmologico para o formato do banco
  const converterExameParaBanco = (exame: any) => {
    if (!exame) return {}
    
    return {
      // Acuidade Visual
      visualAcuity: {
        rightEye: exame.acuidadeOD || '',
        leftEye: exame.acuidadeOE || '',
        bothEyes: exame.acuidadeAO || ''
      },
      // Pressão Intraocular
      intraocularPressure: {
        rightEye: exame.pressaoOD || 0,
        leftEye: exame.pressaoOE || 0
      },
      // Refração OD
      refractionOD: exame.refracaoOD ? {
        spherical: exame.refracaoOD.esferico || '',
        cylindrical: exame.refracaoOD.cilindrico || '',
        axis: exame.refracaoOD.eixo || 0,
        addition: exame.refracaoOD.adicao || '',
        dnp: exame.refracaoOD.dnp || 0,
        acuity: exame.refracaoOD.acuidade || ''
      } : null,
      // Refração OE
      refractionOE: exame.refracaoOE ? {
        spherical: exame.refracaoOE.esferico || '',
        cylindrical: exame.refracaoOE.cilindrico || '',
        axis: exame.refracaoOE.eixo || 0,
        addition: exame.refracaoOE.adicao || '',
        dnp: exame.refracaoOE.dnp || 0,
        acuity: exame.refracaoOE.acuidade || ''
      } : null,
      // Outros exames
      biomicroscopy: exame.biomicroscopia || '',
      fundoscopy: exame.fundoscopia || '',
      ocularMotility: exame.motilidadeOcular || '',
      pupillaryReflexes: exame.reflexosPupilares || '',
      visualField: exame.campoVisual || '',
      // Lentes de contato
      contactLenses: exame.usoLentesContato || false,
      contactLensType: exame.tipoLentesContato || ''
    }
  }

  const handleCompleteConsultation = async (consultationId: string, medicalRecordData: any) => {
    // Buscar a consulta atual
    const consulta = consultations.find(c => c.id === consultationId)
    
    if (!consulta?.patient?.cpf) {
      showError('CPF do paciente é obrigatório para finalizar a consulta')
      return
    }

    // Converter exame oftalmológico para formato do banco
    const physicalExam = converterExameParaBanco(consulta.exameOftalmologico)
    console.log('📋 Exame oftalmológico a ser salvo:', physicalExam)

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
        anamnesis: (consulta as any).anamnese || medicalRecordData.treatment || '',
        physical_exam: physicalExam,
        diagnosis: medicalRecordData.diagnosis,
        prescription: medicalRecordData.prescription,
        follow_up_date: medicalRecordData.followUpDate
      })

      if (!resultado.success) {
        throw new Error(resultado.error || 'Erro ao finalizar consulta')
      }

      // Marcar consulta como finalizada no banco de consultas
      await consultationPersistenceService.finalizarConsulta(consultationId)
      console.log('✅ Consulta finalizada no banco de persistência')

      // Atualizar lista local - remover da lista de consultas em andamento
      setConsultations(prev => prev.filter(c => c.id !== consultationId))
      setSelectedConsultation(null)
      
      // Recarregar agendamentos e consultas finalizadas
      loadAgendamentosExternos()
      loadConsultasFinalizadas()
      
      showSuccess('Consulta finalizada e prontuário salvo com sucesso!')

    } catch (error: any) {
      console.error('Erro ao finalizar consulta:', error)
      showError(error.message || 'Erro ao finalizar consulta')
    }
  }

  // Iniciar consulta a partir de agendamento externo (funciona sem backend)
  const handleStartExternalConsultation = async (agendamento: AgendamentoExterno) => {
    try {
      // Buscar dados do cliente no banco CENTRAL
      let cpfCliente = agendamento.cpf || ''
      let clienteCentralId = agendamento.id
      let dataNascimento = agendamento.data_nascimento || ''
      let historicoInfo = ''
      
      // Se não tem CPF no agendamento, tentar buscar no banco central por telefone + nome
      if (!cpfCliente && agendamento.telefone) {
        console.log('🔍 Buscando cliente no banco central por telefone + nome:', agendamento.telefone, agendamento.nome)
        const clienteCentral = await buscarClientePorTelefoneENome(agendamento.telefone, agendamento.nome)
        if (clienteCentral) {
          console.log('✅ Cliente encontrado no banco central:', clienteCentral.nome, 'CPF:', clienteCentral.cpf)
          cpfCliente = clienteCentral.cpf || ''
          clienteCentralId = clienteCentral.id
          dataNascimento = clienteCentral.data_nascimento || dataNascimento
        } else {
          console.log('⚠️ Cliente não encontrado no banco central por telefone')
        }
      }
      
      // Verificar se tem CPF para buscar histórico
      if (cpfCliente) {
        const historico = await patientSyncService.buscarHistoricoMedicoPorCPF(cpfCliente)
        if (historico.totalConsultas > 0) {
          historicoInfo = ` (${historico.totalConsultas} consulta(s) anterior(es))`
          console.log('📋 Histórico encontrado:', historico)
        }
      }

      // Criar consulta local a partir do agendamento externo
      // Gerar UUID válido para a consulta
      const consultaId = crypto.randomUUID()
      
      const novaConsulta: Consultation = {
        id: consultaId,
        appointmentId: agendamento.id,
        patientId: clienteCentralId, // Usar ID do cliente central se encontrado
        doctorId: agendamento.medico?.id || '',
        status: 'in_progress',
        startedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Dados do paciente vindos do agendamento externo + banco central
        patient: {
          id: clienteCentralId,
          name: agendamento.nome,
          cpf: cpfCliente,
          birthDate: dataNascimento,
          phone: agendamento.telefone,
          email: agendamento.email || undefined
        },
        // Dados do médico
        doctor: agendamento.medico ? {
          id: agendamento.medico.id,
          name: agendamento.medico.nome
        } : undefined,
        // Dados do agendamento
        appointment: {
          id: agendamento.id,
          scheduledAt: `${agendamento.data}T${agendamento.horario}`,
          duration: 30
        }
      }
      
      // PERSISTIR NO BANCO - salvar consulta ao iniciar
      const resultado = await consultationPersistenceService.criarConsulta(novaConsulta)
      if (!resultado.success) {
        console.error('⚠️ Falha ao persistir consulta:', resultado.error)
        showError('Erro ao salvar consulta no banco')
        return
      }
      console.log('✅ Consulta persistida no banco:', novaConsulta.id)
      
      setConsultations(prev => [novaConsulta, ...prev])
      setSelectedConsultation(novaConsulta)
      showSuccess(`Consulta iniciada para ${agendamento.nome}${historicoInfo}`)
    } catch (error: any) {
      showError(error.message || 'Erro ao iniciar consulta')
    }
  }

  // Check if user can start/edit consultations (doctors only)
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
                {(() => {
                  // Aplica filtros do usuário primeiro
                  const agendamentosFiltrados = filtrarAgendamentos(agendamentosExternos)
                  
                  // Se não tem filtro de data, mostra apenas hoje/futuro
                  const hasDateFilter = filters.dateFrom || filters.dateTo
                  const agendamentosParaExibir = hasDateFilter 
                    ? agendamentosFiltrados 
                    : agendamentosFiltrados.filter(a => isTodayOrFuture(a.data))
                  
                  if (agendamentosParaExibir.length === 0) {
                    return (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum agendamento encontrado com os filtros selecionados
                      </div>
                    )
                  }
                  
                  return agendamentosParaExibir.map((agendamento) => {
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
                          {canStartConsultations && agendamento.status !== 'realizado' && (
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
                })
                })()}
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
        doctors={medicosUnicos}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Consultation List - Em andamento + Finalizadas */}
        <div className="lg:col-span-1">
          <ConsultationList
            consultations={[...consultations, ...consultasFinalizadas]}
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

    </div>
  )
}