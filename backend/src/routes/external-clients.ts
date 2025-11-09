import express from 'express'
import { authMiddleware } from '../middleware/auth'
import { supabaseExternoAdmin } from '../config/supabase'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

/**
 * POST /api/external-clients
 * Criar novo cliente no sistema externo
 */
router.post('/', async (req, res) => {
  try {
    if (!supabaseExternoAdmin) {
      return res.status(503).json({
        success: false,
        error: 'Sistema externo não está configurado'
      })
    }

    const clienteData = req.body
    
    // Preparar dados apenas com campos que existem na tabela
    const insertData: any = {
      nome: clienteData.nome,
      telefone: clienteData.telefone,
      active: true
    }
    
    // Adicionar campos opcionais apenas se tiverem valor não vazio
    if (clienteData.cpf && clienteData.cpf.trim() !== '') {
      insertData.cpf = clienteData.cpf.trim()
    }
    if (clienteData.rg && clienteData.rg.trim() !== '') {
      insertData.rg = clienteData.rg.trim()
    }
    if (clienteData.email && clienteData.email.trim() !== '') {
      insertData.email = clienteData.email.trim()
    }
    if (clienteData.data_nascimento) {
      insertData.data_nascimento = clienteData.data_nascimento
    }
    // Sexo: apenas se for um valor válido (em minúsculo conforme banco)
    const valoresSexoValidos = ['masculino', 'feminino', 'outro', 'prefiro não informar']
    if (clienteData.sexo && clienteData.sexo.trim() !== '') {
      const sexoLimpo = clienteData.sexo.trim().toLowerCase()
      if (valoresSexoValidos.includes(sexoLimpo)) {
        insertData.sexo = sexoLimpo
      }
    }
    if (clienteData.endereco) {
      insertData.endereco = clienteData.endereco // JSONB
    }
    if (clienteData.cidade && clienteData.cidade.trim() !== '') {
      insertData.cidade = clienteData.cidade.trim()
    }
    if (clienteData.nome_pai && clienteData.nome_pai.trim() !== '') {
      insertData.nome_pai = clienteData.nome_pai.trim()
    }
    if (clienteData.nome_mae && clienteData.nome_mae.trim() !== '') {
      insertData.nome_mae = clienteData.nome_mae.trim()
    }
    if (clienteData.foto_url && clienteData.foto_url.trim() !== '') {
      insertData.foto_url = clienteData.foto_url.trim()
    }
    if (clienteData.codigo && clienteData.codigo.trim() !== '') {
      insertData.codigo = clienteData.codigo.trim()
    }
    if (clienteData.observacoes && clienteData.observacoes.trim() !== '') {
      insertData.observacoes = clienteData.observacoes.trim()
    }
    
    console.log('📝 Criando cliente no sistema externo (via backend):')
    console.log('📦 Dados completos:', JSON.stringify(insertData, null, 2))
    
    const { data, error } = await supabaseExternoAdmin
      .from('clientes')
      .insert([insertData])
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar cliente externo:', error)
      return res.status(400).json({
        success: false,
        error: `Erro ao criar cliente no sistema externo: ${error.message}`
      })
    }

    console.log('✅ Cliente criado no sistema externo:', data)
    
    res.status(201).json({
      success: true,
      data: data,
      message: 'Cliente criado com sucesso no sistema externo'
    })
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente externo:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao criar cliente',
      message: error.message
    })
  }
})

/**
 * GET /api/external-clients/cpf/:cpf
 * Buscar cliente por CPF no sistema externo
 */
router.get('/cpf/:cpf', async (req, res) => {
  try {
    if (!supabaseExternoAdmin) {
      return res.status(503).json({
        success: false,
        error: 'Sistema externo não está configurado'
      })
    }

    const { cpf } = req.params
    const cleanCPF = cpf.replace(/\D/g, '')
    
    const { data, error } = await supabaseExternoAdmin
      .from('clientes')
      .select('*')
      .eq('cpf', cleanCPF)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Cliente não encontrado'
        })
      }
      throw error
    }

    res.json({
      success: true,
      data: data
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

export default router

