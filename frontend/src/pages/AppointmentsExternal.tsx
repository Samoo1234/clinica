/**
 * Página de Agendamentos Externos
 * Mostra agendamentos do sistema externo com opção de cadastrar pacientes no Vision Care
 */

import { useState, useEffect } from 'react'
import { Calendar, Users, UserPlus, CheckCircle, AlertCircle, RefreshCw, Search } from 'lucide-react'
import { listarAgendamentosExternos, type AgendamentoExterno } from '../services/agendamentos-externos'
import { formatDateBR } from '../utils/date'
import { criarClienteCentral, atualizarClienteCentral, buscarClientePorTelefone, buscarClientePorCPF, buscarClientePorCodigo, type ClienteCentral } from '../config/supabaseCentral'
import { useToast } from '../contexts/ToastContext'
import { CadastroClienteModal, type DadosClienteCompleto } from '../components/appointments/CadastroClienteModal'

interface AgendamentoComStatus extends AgendamentoExterno {
  clienteCentral?: ClienteCentral
  verificado: boolean
}

export function AppointmentsExternal() {
  const { showSuccess, showError } = useToast()
  
  const [agendamentos, setAgendamentos] = useState<AgendamentoComStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('todos')
  const [showCadastroModal, setShowCadastroModal] = useState(false)
  const [agendamentoSelecionado, setAgendamentoSelecionado] = useState<AgendamentoComStatus | null>(null)

  useEffect(() => {
    carregarAgendamentos()
  }, [])

  const carregarAgendamentos = async () => {
    try {
      setLoading(true)
      
      // Buscar agendamentos externos
      const data = await listarAgendamentosExternos({
        limite: 100
      })

      // Verificar quais clientes já existem no Banco Central
      // Hierarquia de busca: CPF > telefone (CPF é mais confiável)
      const agendamentosComStatus = await Promise.all(
        data.map(async (agendamento) => {
          let clienteCentral: ClienteCentral | undefined
          let verificado = false

          try {
            // 1º Tentar buscar por CPF (mais confiável)
            if (agendamento.cpf) {
              const clientePorCPF = await buscarClientePorCPF(agendamento.cpf)
              if (clientePorCPF) {
                clienteCentral = clientePorCPF
                verificado = true
                return { ...agendamento, clienteCentral, verificado }
              }
            }
            
            // 2º Tentar buscar por telefone (menos confiável, pode ter duplicatas)
            if (agendamento.telefone) {
              const clientePorTelefone = await buscarClientePorTelefone(agendamento.telefone)
              if (clientePorTelefone) {
                clienteCentral = clientePorTelefone
              }
            }
            
            verificado = true
          } catch (error) {
            console.error('Erro ao verificar cliente:', error)
          }

          return {
            ...agendamento,
            clienteCentral,
            verificado
          }
        })
      )

      setAgendamentos(agendamentosComStatus)
    } catch (error: any) {
      showError(error.message || 'Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleCadastrarPaciente = async (dadosCliente: DadosClienteCompleto, clienteId?: string) => {
    try {
      // Montar objeto endereco (JSONB) - apenas se houver algum dado de endereço
      let enderecoObj: any = null
      if (dadosCliente.endereco || dadosCliente.cep || dadosCliente.bairro || dadosCliente.numero) {
        enderecoObj = {}
        if (dadosCliente.endereco) enderecoObj.rua = dadosCliente.endereco
        if (dadosCliente.numero) enderecoObj.numero = dadosCliente.numero
        if (dadosCliente.bairro) enderecoObj.bairro = dadosCliente.bairro
        if (dadosCliente.cidade) enderecoObj.cidade = dadosCliente.cidade
        if (dadosCliente.estado) enderecoObj.estado = dadosCliente.estado
        if (dadosCliente.cep) enderecoObj.cep = dadosCliente.cep
        if (dadosCliente.complemento) enderecoObj.complemento = dadosCliente.complemento
      }
      
      console.log('📍 Objeto endereco montado:', enderecoObj)
      console.log('🔍 Dados do cliente antes de enviar:', dadosCliente)

      // Validar sexo
      const valoresSexoValidos = ['masculino', 'feminino', 'outro', 'prefiro não informar']
      let sexoValido = undefined
      if (dadosCliente.sexo && typeof dadosCliente.sexo === 'string') {
        const sexoLimpo = dadosCliente.sexo.trim().toLowerCase()
        if (sexoLimpo !== '' && valoresSexoValidos.includes(sexoLimpo)) {
          sexoValido = sexoLimpo
        }
      }
      console.log('✅ Sexo validado:', sexoValido)

      // Criar ou atualizar cliente no Banco Central
      if (clienteId) {
        // Atualizar cliente existente
        await atualizarClienteCentral(clienteId, {
          nome: dadosCliente.nome.trim(),
          telefone: dadosCliente.telefone.trim(),
          cpf: dadosCliente.cpf?.trim() || undefined,
          rg: dadosCliente.rg?.trim() || undefined,
          email: dadosCliente.email?.trim() || undefined,
          data_nascimento: dadosCliente.data_nascimento || undefined,
          sexo: sexoValido,
          endereco: enderecoObj,
          cidade: dadosCliente.cidade?.trim() || undefined,
          nome_pai: dadosCliente.nome_pai?.trim() || undefined,
          nome_mae: dadosCliente.nome_mae?.trim() || undefined,
          observacoes: dadosCliente.observacoes?.trim() || undefined,
          cadastro_completo: true // Marcar como completo ao atualizar
        })
        
        showSuccess('Cadastro completado com sucesso!')
      } else {
        // Criar novo cliente
        const novoCliente = await criarClienteCentral({
          nome: dadosCliente.nome.trim(),
          telefone: dadosCliente.telefone.trim(),
          cpf: dadosCliente.cpf?.trim() || undefined,
          rg: dadosCliente.rg?.trim() || undefined,
          email: dadosCliente.email?.trim() || undefined,
          data_nascimento: dadosCliente.data_nascimento || undefined,
          sexo: sexoValido,
          endereco: enderecoObj,
          cidade: dadosCliente.cidade?.trim() || undefined,
          nome_pai: dadosCliente.nome_pai?.trim() || undefined,
          nome_mae: dadosCliente.nome_mae?.trim() || undefined,
          observacoes: dadosCliente.observacoes?.trim() || undefined,
          cadastro_completo: false // Cadastro inicial do agendamento
        })
        
        showSuccess(`Cliente cadastrado com sucesso! ID: ${novoCliente.id}`)
      }
      
      // Atualizar a lista
      carregarAgendamentos()
      setShowCadastroModal(false)
      setAgendamentoSelecionado(null)
    } catch (error: any) {
      showError(error.message || 'Erro ao cadastrar cliente')
    }
  }

  const abrirModalCadastro = (agendamento: AgendamentoComStatus) => {
    setAgendamentoSelecionado(agendamento)
    setShowCadastroModal(true)
  }

  // Filtros
  const agendamentosFiltrados = agendamentos.filter(ag => {
    const matchSearch = ag.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       ag.telefone.includes(searchTerm)
    
    const matchStatus = statusFilter === 'todos' ? true :
                       statusFilter === 'cadastrado' ? !!ag.clienteCentral :
                       statusFilter === 'nao-cadastrado' ? !ag.clienteCentral :
                       ag.status === statusFilter

    return matchSearch && matchStatus
  })

  const stats = {
    total: agendamentos.length,
    cadastrados: agendamentos.filter(a => a.clienteCentral).length,
    naoCadastrados: agendamentos.filter(a => !a.clienteCentral).length,
    confirmados: agendamentos.filter(a => a.status === 'confirmado').length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos Externos</h1>
          <p className="text-gray-600">
            Visualize agendamentos do sistema externo e cadastre pacientes no Vision Care
          </p>
        </div>
        <button
          onClick={carregarAgendamentos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cadastrados</p>
              <p className="text-2xl font-bold text-green-600">{stats.cadastrados}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Não Cadastrados</p>
              <p className="text-2xl font-bold text-orange-600">{stats.naoCadastrados}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Confirmados</p>
              <p className="text-2xl font-bold text-blue-600">{stats.confirmados}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="todos">Todos os Status</option>
            <option value="cadastrado">Já Cadastrados</option>
            <option value="nao-cadastrado">Não Cadastrados</option>
            <option value="confirmado">Confirmados</option>
            <option value="pendente">Pendentes</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando agendamentos...</p>
          </div>
        ) : agendamentosFiltrados.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum agendamento encontrado
            </h3>
            <p className="text-gray-600">
              Tente ajustar os filtros ou aguarde novos agendamentos
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Contato
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Médico
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agendamentosFiltrados.map((agendamento) => (
                  <tr key={agendamento.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900">{agendamento.nome}</div>
                          {agendamento.cpf && (
                            <div className="text-sm text-gray-500">CPF: {agendamento.cpf}</div>
                          )}
                          {agendamento.cidade && (
                            <div className="text-sm text-gray-500">📍 {agendamento.cidade}</div>
                          )}
                        </div>
                        {agendamento.clienteCentral && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatDateBR(agendamento.data)}
                      </div>
                      <div className="text-sm text-gray-500">{agendamento.horario}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{agendamento.telefone}</div>
                      {agendamento.email && (
                        <div className="text-sm text-gray-500">{agendamento.email}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {agendamento.medico ? (
                        <div className="text-sm font-medium text-gray-900">
                          {agendamento.medico.nome}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        agendamento.status === 'confirmado' ? 'bg-green-100 text-green-800' :
                        agendamento.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' :
                        agendamento.status === 'cancelado' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {agendamento.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {agendamento.clienteCentral ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-green-600 font-medium">
                            ✓ Cadastrado
                          </span>
                          {!agendamento.clienteCentral.cadastro_completo && (
                            <>
                              <span className="text-xs text-orange-600">
                                ⚠️ Cadastro parcial
                              </span>
                              <button
                                onClick={() => abrirModalCadastro(agendamento)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition-colors"
                              >
                                <UserPlus className="w-4 h-4" />
                                Completar
                              </button>
                            </>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirModalCadastro(agendamento)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <UserPlus className="w-4 h-4" />
                          Cadastrar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Cadastro Completo */}
      {showCadastroModal && agendamentoSelecionado && (
        <CadastroClienteModal
          agendamento={agendamentoSelecionado}
          clienteExistente={agendamentoSelecionado.clienteCentral}
          onClose={() => {
            setShowCadastroModal(false)
            setAgendamentoSelecionado(null)
          }}
          onSave={handleCadastrarPaciente}
        />
      )}

    </div>
  )
}
