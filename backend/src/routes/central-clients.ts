/**
 * Rotas para gerenciar clientes no Banco Central
 * Endpoints compartilhados entre Agendamento, Clínica e ERP
 */

import { Router, Request, Response } from 'express'
import { supabaseCentralAdmin } from '../config/supabase-central'

const router = Router()

/**
 * GET /api/central-clients
 * Lista todos os clientes (com paginação e filtros)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '', 
      cadastro_completo,
      active = 'true'
    } = req.query

    const offset = (Number(page) - 1) * Number(limit)

    let query = supabaseCentralAdmin
      .from('clientes')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filtro de busca (nome, telefone, cpf, email)
    if (search) {
      query = query.or(`nome.ilike.%${search}%,telefone.ilike.%${search}%,cpf.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Filtro de cadastro completo
    if (cadastro_completo !== undefined) {
      query = query.eq('cadastro_completo', cadastro_completo === 'true')
    }

    // Filtro de ativo
    if (active !== undefined) {
      query = query.eq('active', active === 'true')
    }

    // Paginação
    query = query.range(offset, offset + Number(limit) - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('❌ Erro ao listar clientes:', error)
      return res.status(500).json({ error: error.message })
    }

    res.json({
      data,
      pagination: {
        total: count || 0,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil((count || 0) / Number(limit))
      }
    })
  } catch (error: any) {
    console.error('❌ Erro ao listar clientes:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/central-clients/:id
 * Busca cliente por ID
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseCentralAdmin
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      console.error('❌ Erro ao buscar cliente:', error)
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    res.json({ data })
  } catch (error: any) {
    console.error('❌ Erro ao buscar cliente:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/central-clients/cpf/:cpf
 * Busca cliente por CPF
 */
router.get('/cpf/:cpf', async (req: Request, res: Response) => {
  try {
    const { cpf } = req.params

    const { data, error } = await supabaseCentralAdmin
      .from('clientes')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error) {
      console.error('❌ Cliente não encontrado por CPF:', cpf)
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    res.json({ data })
  } catch (error: any) {
    console.error('❌ Erro ao buscar cliente por CPF:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/central-clients/telefone/:telefone
 * Busca cliente por telefone
 */
router.get('/telefone/:telefone', async (req: Request, res: Response) => {
  try {
    const { telefone } = req.params

    const { data, error } = await supabaseCentralAdmin
      .from('clientes')
      .select('*')
      .eq('telefone', telefone)
      .maybeSingle()

    if (error) {
      console.error('❌ Erro ao buscar cliente por telefone:', error)
      return res.status(500).json({ error: error.message })
    }

    if (!data) {
      return res.status(404).json({ error: 'Cliente não encontrado' })
    }

    res.json({ data })
  } catch (error: any) {
    console.error('❌ Erro ao buscar cliente por telefone:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/central-clients
 * Cria novo cliente (cadastro inicial - agendamento)
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const clienteData = req.body

    // Validações básicas
    if (!clienteData.nome || !clienteData.telefone) {
      return res.status(400).json({ 
        error: 'Nome e telefone são obrigatórios' 
      })
    }

    // Verificar se já existe cliente com mesmo CPF
    if (clienteData.cpf) {
      const { data: existente } = await supabaseCentralAdmin
        .from('clientes')
        .select('id')
        .eq('cpf', clienteData.cpf)
        .maybeSingle()

      if (existente) {
        return res.status(409).json({ 
          error: 'Já existe cliente cadastrado com este CPF',
          cliente_id: existente.id 
        })
      }
    }

    // Inserir cliente
    const { data, error } = await supabaseCentralAdmin
      .from('clientes')
      .insert({
        ...clienteData,
        active: true,
        cadastro_completo: false // Cadastro inicial = parcial
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao criar cliente:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log('✅ Cliente criado:', data.id)
    res.status(201).json({ data })
  } catch (error: any) {
    console.error('❌ Erro ao criar cliente:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/central-clients/:id
 * Atualiza cliente (completar cadastro na clínica)
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const updateData = req.body

    // Remover campos que não devem ser atualizados diretamente
    delete updateData.id
    delete updateData.created_at
    delete updateData.updated_at

    // Se está atualizando com dados completos, marcar como cadastro_completo
    if (updateData.cpf && updateData.email && updateData.data_nascimento) {
      updateData.cadastro_completo = true
    }

    const { data, error } = await supabaseCentralAdmin
      .from('clientes')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao atualizar cliente:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log('✅ Cliente atualizado:', id)
    res.json({ data })
  } catch (error: any) {
    console.error('❌ Erro ao atualizar cliente:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * DELETE /api/central-clients/:id
 * Desativa cliente (soft delete)
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params

    const { data, error } = await supabaseCentralAdmin
      .from('clientes')
      .update({ active: false })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('❌ Erro ao desativar cliente:', error)
      return res.status(500).json({ error: error.message })
    }

    console.log('✅ Cliente desativado:', id)
    res.json({ data })
  } catch (error: any) {
    console.error('❌ Erro ao desativar cliente:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router










