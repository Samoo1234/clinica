import request from 'supertest'
import express from 'express'
import { supabaseAdmin } from '../config/supabase'
import patientRoutes from '../routes/patients'
import { authMiddleware } from '../middleware/auth'
import type { CreatePatientData, UpdatePatientData } from '../types/database'

// Mock auth middleware for testing
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'admin'
    }
    next()
  }
}))

// Create test app
const app = express()
app.use(express.json())
app.use('/api/patients', patientRoutes)

describe('Patient API Integration Tests', () => {
  let testPatientId: string
  
  const validPatientData: CreatePatientData = {
    cpf: '11144477735',
    name: 'João Silva',
    birth_date: '1990-01-01',
    phone: '11999999999',
    email: 'joao@example.com',
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: 'Apto 45',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234567'
    },
    insurance_info: {
      provider: 'Unimed',
      planNumber: '123456789',
      validUntil: '2024-12-31'
    },
    emergency_contact: {
      name: 'Maria Silva',
      phone: '11888888888',
      relationship: 'Esposa'
    }
  }

  beforeAll(async () => {
    // Clean up any existing test data
    await supabaseAdmin
      .from('patients')
      .delete()
      .eq('cpf', '11144477735')
  })

  afterAll(async () => {
    // Clean up test data
    if (testPatientId) {
      await supabaseAdmin
        .from('patients')
        .delete()
        .eq('id', testPatientId)
    }
    
    await supabaseAdmin
      .from('patients')
      .delete()
      .eq('cpf', '11144477735')
  })

  describe('POST /api/patients', () => {
    it('should create a new patient with valid data', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send(validPatientData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('id')
      expect(response.body.data.cpf).toBe('11144477735')
      expect(response.body.data.name).toBe('João Silva')
      expect(response.body.data.email).toBe('joao@example.com')
      expect(response.body.message).toBe('Paciente criado com sucesso')

      testPatientId = response.body.data.id
    })

    it('should reject duplicate CPF', async () => {
      const response = await request(app)
        .post('/api/patients')
        .send(validPatientData)
        .expect(409)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('já existe')
    })

    it('should reject invalid CPF', async () => {
      const invalidData = { ...validPatientData, cpf: '12345678900' }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('CPF inválido')
    })

    it('should reject missing required fields', async () => {
      const incompleteData = { name: 'Test Patient' }
      
      const response = await request(app)
        .post('/api/patients')
        .send(incompleteData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Campos obrigatórios')
    })

    it('should reject invalid email format', async () => {
      const invalidData = { ...validPatientData, cpf: '98765432100', email: 'invalid-email' }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Email inválido')
    })

    it('should reject invalid phone format', async () => {
      const invalidData = { ...validPatientData, cpf: '98765432100', phone: '123' }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Telefone deve ter')
    })

    it('should reject future birth date', async () => {
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      
      const invalidData = { 
        ...validPatientData, 
        cpf: '98765432100', 
        birth_date: futureDate.toISOString().split('T')[0] 
      }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Data de nascimento não pode ser futura')
    })
  })

  describe('GET /api/patients/:id', () => {
    it('should get patient by ID', async () => {
      const response = await request(app)
        .get(`/api/patients/${testPatientId}`)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.id).toBe(testPatientId)
      expect(response.body.data.name).toBe('João Silva')
    })

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      
      const response = await request(app)
        .get(`/api/patients/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Paciente não encontrado')
    })
  })

  describe('GET /api/patients/cpf/:cpf', () => {
    it('should get patient by CPF', async () => {
      const response = await request(app)
        .get('/api/patients/cpf/11144477735')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.cpf).toBe('11144477735')
      expect(response.body.data.name).toBe('João Silva')
    })

    it('should return 404 for non-existent CPF', async () => {
      const response = await request(app)
        .get('/api/patients/cpf/99999999999')
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toBe('Paciente não encontrado')
    })
  })

  describe('GET /api/patients', () => {
    it('should get all patients with pagination', async () => {
      const response = await request(app)
        .get('/api/patients?page=1&limit=10')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toHaveProperty('page')
      expect(response.body.pagination).toHaveProperty('limit')
      expect(response.body.pagination).toHaveProperty('total')
      expect(response.body.pagination).toHaveProperty('totalPages')
      expect(response.body.pagination).toHaveProperty('hasNext')
      expect(response.body.pagination).toHaveProperty('hasPrev')
    })

    it('should search patients by name', async () => {
      const response = await request(app)
        .get('/api/patients?q=João')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].name).toContain('João')
    })

    it('should search patients by CPF', async () => {
      const response = await request(app)
        .get('/api/patients?q=11144477735')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.data.length).toBeGreaterThan(0)
      expect(response.body.data[0].cpf).toBe('11144477735')
    })
  })

  describe('GET /api/patients/search', () => {
    it('should search patients with query parameter', async () => {
      const response = await request(app)
        .get('/api/patients/search?q=João&page=1&limit=5')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination.limit).toBe(5)
    })

    it('should require search query', async () => {
      const response = await request(app)
        .get('/api/patients/search')
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('obrigatório')
    })
  })

  describe('PUT /api/patients/:id', () => {
    it('should update patient data', async () => {
      const updateData: UpdatePatientData = {
        name: 'João Silva Santos',
        email: 'joao.santos@example.com',
        phone: '11888888888'
      }

      const response = await request(app)
        .put(`/api/patients/${testPatientId}`)
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('João Silva Santos')
      expect(response.body.data.email).toBe('joao.santos@example.com')
      expect(response.body.data.phone).toBe('11888888888')
      expect(response.body.message).toBe('Paciente atualizado com sucesso')
    })

    it('should reject invalid update data', async () => {
      const invalidData = { email: 'invalid-email' }

      const response = await request(app)
        .put(`/api/patients/${testPatientId}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Email inválido')
    })

    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'
      const updateData = { name: 'Test' }

      const response = await request(app)
        .put(`/api/patients/${fakeId}`)
        .send(updateData)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('não encontrado')
    })

    it('should reject empty update data', async () => {
      const response = await request(app)
        .put(`/api/patients/${testPatientId}`)
        .send({})
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('obrigatórios')
    })
  })

  describe('DELETE /api/patients/:id', () => {
    it('should return 404 for non-existent patient', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000'

      const response = await request(app)
        .delete(`/api/patients/${fakeId}`)
        .expect(404)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('não encontrado')
    })

    // Note: We don't test actual deletion here to preserve test data
    // In a real scenario, you'd test deletion with a separate test patient
  })

  describe('CPF Validation', () => {
    it('should validate correct CPF format', async () => {
      // Test with valid CPF: 11144477735
      const validCPF = '11144477735'
      const testData = { ...validPatientData, cpf: validCPF }
      
      // Clean up first
      await supabaseAdmin.from('patients').delete().eq('cpf', validCPF)
      
      const response = await request(app)
        .post('/api/patients')
        .send(testData)
        .expect(201)

      expect(response.body.success).toBe(true)
      
      // Clean up
      await supabaseAdmin.from('patients').delete().eq('cpf', validCPF)
    })

    it('should reject CPF with all same digits', async () => {
      const invalidData = { ...validPatientData, cpf: '11111111111' }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('CPF inválido')
    })

    it('should reject CPF with wrong length', async () => {
      const invalidData = { ...validPatientData, cpf: '123456789' }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('CPF inválido')
    })
  })

  describe('Address Validation', () => {
    it('should reject incomplete address', async () => {
      const invalidData = {
        ...validPatientData,
        cpf: '98765432100',
        address: {
          street: 'Rua',
          number: '',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234567'
        }
      }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Número do endereço é obrigatório')
    })

    it('should reject invalid state format', async () => {
      const invalidData = {
        ...validPatientData,
        cpf: '98765432100',
        address: {
          ...validPatientData.address,
          state: 'SAO'
        }
      }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('Estado deve ter 2 caracteres')
    })

    it('should reject invalid ZIP code', async () => {
      const invalidData = {
        ...validPatientData,
        cpf: '98765432100',
        address: {
          ...validPatientData.address,
          zipCode: '123'
        }
      }
      
      const response = await request(app)
        .post('/api/patients')
        .send(invalidData)
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.error).toContain('CEP deve ter 8 dígitos')
    })
  })
})