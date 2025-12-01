import express from 'express'
import { authMiddleware } from '../middleware/auth'
import { ClientSyncService } from '../services/client-sync'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

/**
 * POST /api/client-sync/create
 * Criar cliente sincronizado em todos os sistemas
 */
router.post('/create', async (req, res) => {
  try {
    const dadosCliente = req.body
    
    // Valida campos obrigatórios
    if (!dadosCliente.nome && !dadosCliente.name) {
      return res.status(400).json({
        success: false,
        error: 'Nome é obrigatório'
      })
    }
    
    if (!dadosCliente.telefone && !dadosCliente.phone) {
      return res.status(400).json({
        success: false,
        error: 'Telefone é obrigatório'
      })
    }
    
    const clienteSincronizado = await ClientSyncService.criarClienteSincronizado(dadosCliente)
    
    res.status(201).json({
      success: true,
      data: clienteSincronizado,
      message: 'Cliente criado e sincronizado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao criar cliente sincronizado:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao criar cliente',
      message: error.message
    })
  }
})

/**
 * GET /api/client-sync/search/cpf/:cpf
 * Buscar cliente por CPF em todos os sistemas
 */
router.get('/search/cpf/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    
    const cliente = await ClientSyncService.buscarClientePorCPF(cpf)
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: cliente
    })
  } catch (error: any) {
    console.error('Erro ao buscar cliente por CPF:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar cliente',
      message: error.message
    })
  }
})

/**
 * GET /api/client-sync/search/phone/:phone
 * Buscar cliente por telefone em todos os sistemas
 */
router.get('/search/phone/:phone', async (req, res) => {
  try {
    const { phone } = req.params
    
    const cliente = await ClientSyncService.buscarClientePorTelefone(phone)
    
    if (!cliente) {
      return res.status(404).json({
        success: false,
        error: 'Cliente não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: cliente
    })
  } catch (error: any) {
    console.error('Erro ao buscar cliente por telefone:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar cliente',
      message: error.message
    })
  }
})

/**
 * PUT /api/client-sync/update/:id
 * Atualizar cliente e sincronizar
 */
router.put('/update/:id', async (req, res) => {
  try {
    const { id } = req.params
    const dadosAtualizacao = req.body
    
    await ClientSyncService.atualizarClienteSincronizado(id, dadosAtualizacao)
    
    res.json({
      success: true,
      message: 'Cliente atualizado e sincronizado com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao atualizar cliente:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar cliente',
      message: error.message
    })
  }
})

/**
 * POST /api/client-sync/link-erp
 * Vincular cliente ao ERP
 */
router.post('/link-erp', async (req, res) => {
  try {
    const { visioncare_id, erp_cliente_id } = req.body
    
    if (!visioncare_id || !erp_cliente_id) {
      return res.status(400).json({
        success: false,
        error: 'visioncare_id e erp_cliente_id são obrigatórios'
      })
    }
    
    await ClientSyncService.vincularClienteAoERP(visioncare_id, erp_cliente_id)
    
    res.json({
      success: true,
      message: 'Cliente vinculado ao ERP com sucesso'
    })
  } catch (error: any) {
    console.error('Erro ao vincular cliente ao ERP:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao vincular cliente',
      message: error.message
    })
  }
})

/**
 * GET /api/client-sync/pending
 * Listar clientes do agendamento que ainda não foram sincronizados
 */
router.get('/pending', async (req, res) => {
  try {
    const clientesPendentes = await ClientSyncService.listarClientesNaoSincronizados()
    
    res.json({
      success: true,
      data: clientesPendentes,
      total: clientesPendentes.length
    })
  } catch (error: any) {
    console.error('Erro ao listar clientes pendentes:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao listar clientes',
      message: error.message
    })
  }
})

export default router












