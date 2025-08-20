import { externalIntegrationService } from '../services/external-integration'
import { supabase } from '../config/supabase'

// Mock the supabase config
jest.mock('../config/supabase', () => ({
  supabase: {
    from: jest.fn()
  }
}))

describe('External Integration Service - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Partner Management', () => {
    it('should create a partner with generated API credentials', async () => {
      const mockPartner = {
        id: 'partner-123',
        name: 'Ótica Teste',
        partner_type: 'optics',
        cnpj: '12.345.678/0001-90',
        email: 'teste@optica.com',
        api_key: 'generated-api-key',
        api_secret: 'generated-api-secret',
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockPartner,
              error: null
            })
          })
        })
      })

      const partnerData = {
        name: 'Ótica Teste',
        partner_type: 'optics' as const,
        cnpj: '12.345.678/0001-90',
        email: 'teste@optica.com'
      }

      const result = await externalIntegrationService.createPartner(partnerData)

      expect(result).toEqual(mockPartner)
      expect(supabase.from).toHaveBeenCalledWith('external_partners')
    })

    it('should authenticate partner with valid credentials', async () => {
      const mockPartner = {
        id: 'partner-123',
        name: 'Ótica Teste',
        partner_type: 'optics',
        cnpj: '12.345.678/0001-90',
        email: 'teste@optica.com',
        api_key: 'valid-api-key',
        api_secret: 'valid-api-secret',
        status: 'active',
        permissions: {},
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPartner,
                error: null
              })
            })
          })
        })
      })

      const result = await externalIntegrationService.authenticatePartner(
        'valid-api-key',
        'valid-api-secret'
      )

      expect(result).toEqual(mockPartner)
    })

    it('should return null for invalid credentials', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { code: 'PGRST116' }
              })
            })
          })
        })
      })

      const result = await externalIntegrationService.authenticatePartner(
        'invalid-key',
        'invalid-secret'
      )

      expect(result).toBeNull()
    })

    it('should validate partner permissions correctly', async () => {
      const mockPartner = {
        id: 'partner-123',
        status: 'active',
        permissions: {
          patient_access: true,
          prescription_access: false
        }
      }

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

      const hasPatientAccess = await externalIntegrationService.validatePartnerPermission(
        'partner-123',
        'patient_access'
      )
      const hasPrescriptionAccess = await externalIntegrationService.validatePartnerPermission(
        'partner-123',
        'prescription_access'
      )

      expect(hasPatientAccess).toBe(true)
      expect(hasPrescriptionAccess).toBe(false)
    })
  })

  describe('Patient Data Access', () => {
    it('should get patient data for authorized partner', async () => {
      const mockPartner = {
        id: 'partner-123',
        status: 'active',
        permissions: { patient_access: true }
      }

      const mockPatient = {
        id: 'patient-123',
        cpf: '123.456.789-00',
        name: 'João Silva',
        birth_date: '1990-01-01',
        phone: '(11) 98765-4321',
        email: 'joao@email.com',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

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
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockPatient,
                error: null
              })
            })
          })
        })

      const result = await externalIntegrationService.getPatientForPartner(
        'partner-123',
        'patient-123'
      )

      expect(result).toEqual(mockPatient)
    })

    it('should throw error for unauthorized partner', async () => {
      const mockPartner = {
        id: 'partner-123',
        status: 'active',
        permissions: { patient_access: false }
      }

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

      await expect(
        externalIntegrationService.getPatientForPartner('partner-123', 'patient-123')
      ).rejects.toThrow('Partner does not have permission to access patient data')
    })
  })

  describe('Prescription Sharing', () => {
    it('should share prescription with authorized partner', async () => {
      const mockPartner = {
        id: 'partner-123',
        status: 'active',
        permissions: { prescription_access: true },
        webhook_url: null
      }

      const mockShare = {
        id: 'share-123',
        record_id: 'record-123',
        partner_id: 'partner-123',
        patient_id: 'patient-123',
        prescription_data: { prescription: 'Óculos -0.5 OD' },
        status: 'shared',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

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

      const shareData = {
        record_id: 'record-123',
        partner_id: 'partner-123',
        patient_id: 'patient-123',
        prescription_data: { prescription: 'Óculos -0.5 OD' }
      }

      const result = await externalIntegrationService.sharePrescription(shareData)

      expect(result).toEqual(mockShare)
    })

    it('should confirm prescription dispensing', async () => {
      const mockUpdatedShare = {
        id: 'share-123',
        status: 'dispensed',
        dispensed_at: '2024-01-01T12:00:00Z',
        dispensed_by: 'João Farmacêutico',
        notes: 'Dispensado com sucesso'
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedShare,
                error: null
              })
            })
          })
        })
      })

      const result = await externalIntegrationService.confirmPrescriptionDispensing(
        'share-123',
        'João Farmacêutico',
        'Dispensado com sucesso'
      )

      expect(result).toEqual(mockUpdatedShare)
    })
  })

  describe('Access Logging', () => {
    it('should log partner access', async () => {
      const mockLog = {
        id: 'log-123',
        partner_id: 'partner-123',
        operation: 'patient_lookup',
        endpoint: '/api/patients/123',
        status_code: 200,
        success: true,
        created_at: '2024-01-01T00:00:00Z'
      }

      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockLog,
              error: null
            })
          })
        })
      })

      const logData = {
        partner_id: 'partner-123',
        operation: 'patient_lookup',
        endpoint: '/api/patients/123',
        status_code: 200,
        success: true
      }

      const result = await externalIntegrationService.logPartnerAccess(logData)

      expect(result).toEqual(mockLog)
      expect(supabase.from).toHaveBeenCalledWith('partner_access_logs')
    })
  })

  describe('Integration Statistics', () => {
    it('should calculate integration statistics', async () => {
      const mockLogs = [
        { success: true },
        { success: true },
        { success: false },
        { success: true }
      ]

      const mockShares = [
        { status: 'shared' },
        { status: 'dispensed' },
        { status: 'dispensed' },
        { status: 'shared' }
      ]

      ;(supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockLogs,
              error: null
            })
          })
        })
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockShares,
              error: null
            })
          })
        })

      const stats = await externalIntegrationService.getIntegrationStats('partner-123')

      expect(stats).toEqual({
        totalRequests: 4,
        successfulRequests: 3,
        failedRequests: 1,
        prescriptionsShared: 4,
        prescriptionsDispensed: 2
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      ;(supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database connection failed' }
            })
          })
        })
      })

      const partnerData = {
        name: 'Ótica Teste',
        partner_type: 'optics' as const,
        cnpj: '12.345.678/0001-90',
        email: 'teste@optica.com'
      }

      await expect(
        externalIntegrationService.createPartner(partnerData)
      ).rejects.toThrow('Failed to create partner: Database connection failed')
    })
  })
})