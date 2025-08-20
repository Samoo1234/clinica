import request from 'supertest'
import express from 'express'
import { supabase } from '../config/supabase'
import externalIntegrationRoutes from '../routes/external-integration'
import { externalIntegrationService } from '../services/external-integration'
import { ExternalPartner, Patient, MedicalRecord } from '../types/database'

// Mock the supabase config
jest.mock('../config/supabase')

const app = express()
app.use(express.json())
app.use('/api/external', externalIntegrationRoutes)

describe('External Integration API', () => {
  let mockPartner: ExternalPartner
  let mockPatient: Patient
  let mockRecord: MedicalRecord
  let authToken: string

  beforeEach(() => {
    jest.clearAllMocks()

    // Mock partner data
    mockPartner = {
      id: 'partner-123',
      name: 'Ótica Exemplo',
      partner_type: 'optics',
      cnpj: '12.345.678/0001-90',
      email: 'contato@oticaexemplo.com',
      phone: '(11) 99999-9999',
      address: { street: 'Rua Exemplo, 123' },
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
      status: 'active',
      permissions: {
        patient_access: true,
        patient_search: true,
        prescription_access: true
      },
      webhook_url: 'https://oticaexemplo.com/webhook',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Mock patient data
    mockPatient = {
      id: 'patient-123',
      cpf: '123.456.789-00',
      name: 'João Silva',
      birth_date: '1990-01-01',
      phone: '(11) 98765-4321',
      email: 'joao@email.com',
      address: { street: 'Rua do Paciente, 456' },
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Mock medical record
    mockRecord = {
      id: 'record-123',
      patient_id: 'patient-123',
      doctor_id: 'doctor-123',
      consultation_date: '2024-01-01',
      chief_complaint: 'Dificuldade para enxergar',
      anamnesis: 'Paciente relata visão embaçada',
      physical_exam: {
        visualAcuity: { rightEye: '20/20', leftEye: '20/25' }
      },
      diagnosis: 'Miopia leve',
      prescription: 'Óculos com grau -0.5 OD, -0.75 OE',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z'
    }

    // Mock auth token for admin routes
    authToken = 'valid-jwt-token'
  })

  describe('Admin Routes', () => {
    describe('POST /admin/partners', () => {
      it('should create a new partner', async () => {
        const mockSupabaseResponse = {
          data: mockPartner,
          error: null
        }

        ;(supabase.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue(mockSupabaseResponse)
            })
          })
        })

        const partnerData = {
          name: 'Nova Ótica',
          partner_type: 'optics',
          cnpj: '98.765.432/0001-10',
          email: 'contato@novaoptica.com'
        }

        const response = await request(app)
          .post('/api/external/admin/partners')
          .set('Authorization', `Bearer ${authToken}`)
          .send(partnerData)

        expect(response.status).toBe(201)
        expect(response.body).toMatchObject({
          name: partnerData.name,
          partner_type: partnerData.partner_type,
          cnpj: partnerData.cnpj,
          email: partnerData.email
        })
      })

      it('should handle creation errors', async () => {
        ;(supabase.from as jest.Mock).mockReturnValue({
          insert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'CNPJ already exists' }
              })
            })
          })
        })

        const response = await request(app)
          .post('/api/external/admin/partners')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            name: 'Ótica Duplicada',
            partner_type: 'optics',
            cnpj: '12.345.678/0001-90',
            email: 'duplicada@email.com'
          })

        expect(response.status).toBe(500)
        expect(response.body.error).toBe('Failed to create partner')
      })
    })

    describe('GET /admin/partners', () => {
      it('should return all partners', async () => {
        ;(supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockResolvedValue({
              data: [mockPartner],
              error: null
            })
          })
        })

        const response = await request(app)
          .get('/api/external/admin/partners')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual([mockPartner])
      })
    })

    describe('GET /admin/partners/:id', () => {
      it('should return a specific partner', async () => {
        ;(supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPartner,
                error: null
              })
            })
          })
        })

        const response = await request(app)
          .get(`/api/external/admin/partners/${mockPartner.id}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockPartner)
      })

      it('should return 404 for non-existent partner', async () => {
        ;(supabase.from as jest.Mock).mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })

        const response = await request(app)
          .get('/api/external/admin/partners/non-existent')
          .set('Authorization', `Bearer ${authToken}`)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Partner not found')
      })
    })

    describe('POST /admin/prescriptions/share', () => {
      it('should share a prescription with a partner', async () => {
        const mockShare = {
          id: 'share-123',
          record_id: mockRecord.id,
          partner_id: mockPartner.id,
          patient_id: mockPatient.id,
          prescription_data: { prescription: mockRecord.prescription },
          status: 'shared',
          shared_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }

        // Mock partner validation
        ;(supabase.from as jest.Mock)
          .mockReturnValueOnce({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockPartner,
                  error: null
                })
              })
            })
          })
          // Mock prescription share creation
          .mockReturnValueOnce({
            insert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({
                  data: mockShare,
                  error: null
                })
              })
            })
          })

        const shareData = {
          record_id: mockRecord.id,
          partner_id: mockPartner.id,
          patient_id: mockPatient.id,
          prescription_data: { prescription: mockRecord.prescription }
        }

        const response = await request(app)
          .post('/api/external/admin/prescriptions/share')
          .set('Authorization', `Bearer ${authToken}`)
          .send(shareData)

        expect(response.status).toBe(201)
        expect(response.body).toMatchObject(mockShare)
      })
    })
  })

  describe('External API Routes', () => {
    beforeEach(() => {
      // Mock partner authentication
      jest.spyOn(externalIntegrationService, 'authenticatePartner')
        .mockResolvedValue(mockPartner)
      jest.spyOn(externalIntegrationService, 'validatePartnerPermission')
        .mockResolvedValue(true)
      jest.spyOn(externalIntegrationService, 'logPartnerAccess')
        .mockResolvedValue({} as any)
    })

    describe('GET /api/test', () => {
      it('should authenticate partner successfully', async () => {
        const response = await request(app)
          .get('/api/external/api/test')
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(200)
        expect(response.body.message).toBe('Authentication successful')
        expect(response.body.partner).toMatchObject({
          id: mockPartner.id,
          name: mockPartner.name,
          type: mockPartner.partner_type
        })
      })

      it('should reject invalid credentials', async () => {
        jest.spyOn(externalIntegrationService, 'authenticatePartner')
          .mockResolvedValue(null)

        const response = await request(app)
          .get('/api/external/api/test')
          .set('X-API-Key', 'invalid-key')
          .set('X-API-Secret', 'invalid-secret')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('Invalid credentials')
      })

      it('should reject missing credentials', async () => {
        const response = await request(app)
          .get('/api/external/api/test')

        expect(response.status).toBe(401)
        expect(response.body.error).toBe('Missing API credentials')
      })
    })

    describe('GET /api/patients/:patientId', () => {
      it('should return patient data for authorized partner', async () => {
        jest.spyOn(externalIntegrationService, 'getPatientForPartner')
          .mockResolvedValue(mockPatient)

        const response = await request(app)
          .get(`/api/external/api/patients/${mockPatient.id}`)
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
          id: mockPatient.id,
          name: mockPatient.name,
          birth_date: mockPatient.birth_date,
          phone: mockPatient.phone,
          email: mockPatient.email
        })
        // Should not include sensitive data like CPF or address
        expect(response.body.cpf).toBeUndefined()
        expect(response.body.address).toBeUndefined()
      })

      it('should return 404 for non-existent patient', async () => {
        jest.spyOn(externalIntegrationService, 'getPatientForPartner')
          .mockResolvedValue(null)

        const response = await request(app)
          .get('/api/external/api/patients/non-existent')
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(404)
        expect(response.body.error).toBe('Patient not found')
      })

      it('should reject partner without patient_access permission', async () => {
        jest.spyOn(externalIntegrationService, 'validatePartnerPermission')
          .mockResolvedValue(false)

        const response = await request(app)
          .get(`/api/external/api/patients/${mockPatient.id}`)
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(403)
        expect(response.body.error).toBe('Insufficient permissions')
      })
    })

    describe('GET /api/patients/search/:cpf', () => {
      it('should search patient by CPF', async () => {
        jest.spyOn(externalIntegrationService, 'searchPatientForPartner')
          .mockResolvedValue(mockPatient)

        const response = await request(app)
          .get(`/api/external/api/patients/search/${mockPatient.cpf}`)
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(200)
        expect(response.body).toMatchObject({
          id: mockPatient.id,
          name: mockPatient.name,
          birth_date: mockPatient.birth_date,
          phone: mockPatient.phone,
          email: mockPatient.email
        })
      })

      it('should reject partner without patient_search permission', async () => {
        jest.spyOn(externalIntegrationService, 'validatePartnerPermission')
          .mockImplementation((partnerId, permission) => 
            Promise.resolve(permission !== 'patient_search')
          )

        const response = await request(app)
          .get(`/api/external/api/patients/search/${mockPatient.cpf}`)
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(403)
        expect(response.body.error).toBe('Insufficient permissions')
      })
    })

    describe('GET /api/prescriptions', () => {
      it('should return shared prescriptions for partner', async () => {
        const mockShares = [{
          id: 'share-123',
          record_id: mockRecord.id,
          partner_id: mockPartner.id,
          patient_id: mockPatient.id,
          prescription_data: { prescription: mockRecord.prescription },
          status: 'shared',
          shared_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }]

        jest.spyOn(externalIntegrationService, 'getPrescriptionShares')
          .mockResolvedValue(mockShares)

        const response = await request(app)
          .get('/api/external/api/prescriptions')
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockShares)
      })
    })

    describe('POST /api/prescriptions/:shareId/dispense', () => {
      it('should confirm prescription dispensing', async () => {
        const mockUpdatedShare = {
          id: 'share-123',
          record_id: mockRecord.id,
          partner_id: mockPartner.id,
          patient_id: mockPatient.id,
          prescription_data: { prescription: mockRecord.prescription },
          status: 'dispensed',
          dispensed_at: '2024-01-01T12:00:00Z',
          dispensed_by: 'João Farmacêutico',
          notes: 'Dispensado com sucesso',
          shared_at: '2024-01-01T00:00:00Z',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T12:00:00Z'
        }

        jest.spyOn(externalIntegrationService, 'confirmPrescriptionDispensing')
          .mockResolvedValue(mockUpdatedShare)

        const response = await request(app)
          .post('/api/external/api/prescriptions/share-123/dispense')
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)
          .send({
            dispensed_by: 'João Farmacêutico',
            notes: 'Dispensado com sucesso'
          })

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockUpdatedShare)
      })

      it('should require dispensed_by field', async () => {
        const response = await request(app)
          .post('/api/external/api/prescriptions/share-123/dispense')
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)
          .send({
            notes: 'Dispensado com sucesso'
          })

        expect(response.status).toBe(400)
        expect(response.body.error).toBe('Missing required field')
        expect(response.body.message).toBe('dispensed_by is required')
      })
    })

    describe('GET /api/stats', () => {
      it('should return partner statistics', async () => {
        const mockStats = {
          totalRequests: 150,
          successfulRequests: 145,
          failedRequests: 5,
          prescriptionsShared: 25,
          prescriptionsDispensed: 20
        }

        jest.spyOn(externalIntegrationService, 'getIntegrationStats')
          .mockResolvedValue(mockStats)

        const response = await request(app)
          .get('/api/external/api/stats')
          .set('X-API-Key', mockPartner.api_key)
          .set('X-API-Secret', mockPartner.api_secret)

        expect(response.status).toBe(200)
        expect(response.body).toEqual(mockStats)
      })
    })
  })

  describe('Error Handling', () => {
    beforeEach(() => {
      jest.spyOn(externalIntegrationService, 'authenticatePartner')
        .mockResolvedValue(mockPartner)
      jest.spyOn(externalIntegrationService, 'validatePartnerPermission')
        .mockResolvedValue(true)
      jest.spyOn(externalIntegrationService, 'logPartnerAccess')
        .mockResolvedValue({} as any)
    })

    it('should handle service errors gracefully', async () => {
      jest.spyOn(externalIntegrationService, 'getPatientForPartner')
        .mockRejectedValue(new Error('Database connection failed'))

      const response = await request(app)
        .get(`/api/external/api/patients/${mockPatient.id}`)
        .set('X-API-Key', mockPartner.api_key)
        .set('X-API-Secret', mockPartner.api_secret)

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Failed to fetch patient')
      expect(response.body.message).toBe('Database connection failed')
    })

    it('should handle authentication errors', async () => {
      jest.spyOn(externalIntegrationService, 'authenticatePartner')
        .mockRejectedValue(new Error('Authentication service unavailable'))

      const response = await request(app)
        .get('/api/external/api/test')
        .set('X-API-Key', mockPartner.api_key)
        .set('X-API-Secret', mockPartner.api_secret)

      expect(response.status).toBe(500)
      expect(response.body.error).toBe('Authentication error')
    })
  })
})