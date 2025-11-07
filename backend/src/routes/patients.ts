import express from 'express'
import { PatientService } from '../services/patients'
import { authMiddleware } from '../middleware/auth'
import { searchLimiter } from '../middleware/rate-limit'
import type { CreatePatientData, UpdatePatientData } from '../types/database'

const router = express.Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

/**
 * GET /api/patients
 * Get all patients with pagination and optional search
 */
router.get('/', searchLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const query = req.query.q as string
    
    let result
    if (query && query.trim()) {
      result = await PatientService.searchPatients({ page, limit, query })
    } else {
      result = await PatientService.getAllPatients({ page, limit })
    }
    
    res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Get patients error:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pacientes',
      message: error.message
    })
  }
})

/**
 * GET /api/patients/search
 * Search patients with full-text search
 */
router.get('/search', searchLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const query = req.query.q as string
    
    if (!query || !query.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Parâmetro de busca é obrigatório'
      })
    }
    
    const result = await PatientService.searchPatients({ page, limit, query })
    
    res.json({
      success: true,
      ...result
    })
  } catch (error: any) {
    console.error('Search patients error:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar pacientes',
      message: error.message
    })
  }
})

/**
 * GET /api/patients/:id
 * Get patient by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do paciente é obrigatório'
      })
    }
    
    const patient = await PatientService.getPatientById(id)
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Paciente não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: patient
    })
  } catch (error: any) {
    console.error('Get patient error:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar paciente',
      message: error.message
    })
  }
})

/**
 * GET /api/patients/cpf/:cpf
 * Get patient by CPF
 */
router.get('/cpf/:cpf', async (req, res) => {
  try {
    const { cpf } = req.params
    
    if (!cpf) {
      return res.status(400).json({
        success: false,
        error: 'CPF é obrigatório'
      })
    }
    
    const patient = await PatientService.getPatientByCpf(cpf)
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Paciente não encontrado'
      })
    }
    
    res.json({
      success: true,
      data: patient
    })
  } catch (error: any) {
    console.error('Get patient by CPF error:', error)
    res.status(500).json({
      success: false,
      error: 'Erro ao buscar paciente',
      message: error.message
    })
  }
})

/**
 * POST /api/patients
 * Create new patient
 */
router.post('/', async (req, res) => {
  try {
    const patientData: CreatePatientData = req.body
    
    // Validate required fields
    if (!patientData.cpf || !patientData.name || !patientData.birth_date || 
        !patientData.phone || !patientData.address) {
      return res.status(400).json({
        success: false,
        error: 'Campos obrigatórios: CPF, nome, data de nascimento, telefone e endereço'
      })
    }
    
    const patient = await PatientService.createPatient(patientData)
    
    res.status(201).json({
      success: true,
      data: patient,
      message: 'Paciente criado com sucesso'
    })
  } catch (error: any) {
    console.error('Create patient error:', error)
    
    // Handle specific errors
    if (error.message.includes('já existe')) {
      return res.status(409).json({
        success: false,
        error: error.message
      })
    }
    
    if (error.message.includes('Dados inválidos')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao criar paciente',
      message: error.message
    })
  }
})

/**
 * PUT /api/patients/:id
 * Update patient
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const patientData: UpdatePatientData = req.body
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do paciente é obrigatório'
      })
    }
    
    if (Object.keys(patientData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Dados para atualização são obrigatórios'
      })
    }
    
    const patient = await PatientService.updatePatient(id, patientData)
    
    res.json({
      success: true,
      data: patient,
      message: 'Paciente atualizado com sucesso'
    })
  } catch (error: any) {
    console.error('Update patient error:', error)
    
    // Handle specific errors
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }
    
    if (error.message.includes('já possui este CPF')) {
      return res.status(409).json({
        success: false,
        error: error.message
      })
    }
    
    if (error.message.includes('Dados inválidos')) {
      return res.status(400).json({
        success: false,
        error: error.message
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao atualizar paciente',
      message: error.message
    })
  }
})

/**
 * DELETE /api/patients/:id
 * Delete patient
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    
    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'ID do paciente é obrigatório'
      })
    }
    
    await PatientService.deletePatient(id)
    
    res.json({
      success: true,
      message: 'Paciente excluído com sucesso'
    })
  } catch (error: any) {
    console.error('Delete patient error:', error)
    
    // Handle specific errors
    if (error.message.includes('não encontrado')) {
      return res.status(404).json({
        success: false,
        error: error.message
      })
    }
    
    if (error.message.includes('não é possível excluir')) {
      return res.status(409).json({
        success: false,
        error: error.message
      })
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao excluir paciente',
      message: error.message
    })
  }
})

export default router