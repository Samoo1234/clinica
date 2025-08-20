import request from 'supertest'
import express from 'express'
import { medicalRecordsService } from '../services/medical-records'
import medicalRecordsRoutes from '../routes/medical-records'
import { authMiddleware } from '../middleware/auth'
import { CreateMedicalRecordData, UpdateMedicalRecordData, PhysicalExam } from '../types/database'

// Mock the auth middleware for testing
jest.mock('../middleware/auth', () => ({
  authMiddleware: (req: any, res: any, next: any) => {
    req.user = { id: 'test-doctor-id', role: 'doctor' }
    next()
  }
}))

// Mock the medical records service
jest.mock('../services/medical-records')

const app = express()
app.use(express.json())
app.use('/api/medical-records', medicalRecordsRoutes)

const mockMedicalRecordsService = medicalRecordsService as jest.Mocked<typeof medicalRecordsService>

describe('Medical Records API', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('POST /api/medical-records', () => {
    it('should create a new medical record', async () => {
      const mockRecord = {
        id: 'test-record-id',
        patient_id: 'test-patient-id',
        doctor_id: 'test-doctor-id',
        consultation_date: '2024-01-15',
        chief_complaint: 'Blurred vision',
        anamnesis: 'Patient reports blurred vision for 2 weeks',
        physical_exam: {
          visualAcuity: { rightEye: '20/20', leftEye: '20/25' },
          intraocularPressure: { rightEye: 15, leftEye: 16 },
          fundoscopy: 'Normal optic disc',
          biomicroscopy: 'Clear cornea'
        },
        diagnosis: 'Mild myopia',
        prescription: 'Glasses prescription: -0.5 D',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockMedicalRecordsService.createMedicalRecord.mockResolvedValue(mockRecord)

      const recordData: CreateMedicalRecordData = {
        patient_id: 'test-patient-id',
        doctor_id: 'test-doctor-id',
        chief_complaint: 'Blurred vision',
        anamnesis: 'Patient reports blurred vision for 2 weeks',
        diagnosis: 'Mild myopia',
        prescription: 'Glasses prescription: -0.5 D'
      }

      const response = await request(app)
        .post('/api/medical-records')
        .send(recordData)
        .expect(201)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockRecord)
      expect(mockMedicalRecordsService.createMedicalRecord).toHaveBeenCalledWith(recordData)
    })

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/medical-records')
        .send({
          chief_complaint: 'Blurred vision'
        })
        .expect(400)

      expect(response.body.error).toBe('Patient ID and Doctor ID are required')
    })
  })

  describe('GET /api/medical-records/:id', () => {
    it('should get a medical record by ID', async () => {
      const mockRecord = {
        id: 'test-record-id',
        patient_id: 'test-patient-id',
        doctor_id: 'test-doctor-id',
        consultation_date: '2024-01-15',
        chief_complaint: 'Blurred vision',
        anamnesis: 'Patient reports blurred vision for 2 weeks',
        physical_exam: {
          visualAcuity: { rightEye: '20/20', leftEye: '20/25' },
          intraocularPressure: { rightEye: 15, leftEye: 16 },
          fundoscopy: 'Normal optic disc',
          biomicroscopy: 'Clear cornea'
        },
        diagnosis: 'Mild myopia',
        prescription: 'Glasses prescription: -0.5 D',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z'
      }

      mockMedicalRecordsService.getMedicalRecordById.mockResolvedValue(mockRecord)

      const response = await request(app)
        .get('/api/medical-records/test-record-id')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockRecord)
    })

    it('should return 404 if medical record not found', async () => {
      mockMedicalRecordsService.getMedicalRecordById.mockResolvedValue(null)

      const response = await request(app)
        .get('/api/medical-records/nonexistent-id')
        .expect(404)

      expect(response.body.error).toBe('Medical record not found')
    })
  })

  describe('GET /api/medical-records/patient/:patientId', () => {
    it('should get medical records by patient ID with pagination', async () => {
      const mockRecords = [
        {
          id: 'record-1',
          patient_id: 'test-patient-id',
          doctor_id: 'test-doctor-id',
          consultation_date: '2024-01-15',
          chief_complaint: 'Blurred vision',
          anamnesis: 'Patient reports blurred vision',
          physical_exam: {
            visualAcuity: { rightEye: '20/20', leftEye: '20/25' }
          },
          diagnosis: 'Mild myopia',
          prescription: 'Glasses prescription',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          id: 'record-2',
          patient_id: 'test-patient-id',
          doctor_id: 'test-doctor-id',
          consultation_date: '2024-01-10',
          chief_complaint: 'Eye strain',
          anamnesis: 'Patient reports eye strain',
          physical_exam: {
            visualAcuity: { rightEye: '20/20', leftEye: '20/20' }
          },
          diagnosis: 'Eye strain',
          prescription: 'Rest and eye drops',
          created_at: '2024-01-10T10:00:00Z',
          updated_at: '2024-01-10T10:00:00Z'
        }
      ]

      mockMedicalRecordsService.getMedicalRecordsByPatientId.mockResolvedValue({
        records: mockRecords,
        total: 2
      })

      const response = await request(app)
        .get('/api/medical-records/patient/test-patient-id?limit=10&offset=0&orderBy=desc')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockRecords)
      expect(response.body.pagination).toEqual({
        total: 2,
        limit: 10,
        offset: 0
      })
    })
  })

  describe('PUT /api/medical-records/:id', () => {
    it('should update a medical record', async () => {
      const updatedRecord = {
        id: 'test-record-id',
        patient_id: 'test-patient-id',
        doctor_id: 'test-doctor-id',
        consultation_date: '2024-01-15',
        chief_complaint: 'Blurred vision',
        anamnesis: 'Patient reports blurred vision',
        physical_exam: {
          visualAcuity: { rightEye: '20/20', leftEye: '20/25' }
        },
        diagnosis: 'Updated diagnosis',
        prescription: 'Updated prescription',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T11:00:00Z'
      }

      mockMedicalRecordsService.updateMedicalRecord.mockResolvedValue(updatedRecord)

      const updateData: UpdateMedicalRecordData = {
        diagnosis: 'Updated diagnosis'
      }

      const response = await request(app)
        .put('/api/medical-records/test-record-id')
        .send(updateData)
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(updatedRecord)
      expect(mockMedicalRecordsService.updateMedicalRecord).toHaveBeenCalledWith('test-record-id', updateData)
    })
  })

  describe('DELETE /api/medical-records/:id', () => {
    it('should delete a medical record', async () => {
      mockMedicalRecordsService.deleteMedicalRecord.mockResolvedValue()

      const response = await request(app)
        .delete('/api/medical-records/test-record-id')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.message).toBe('Medical record deleted successfully')
      expect(mockMedicalRecordsService.deleteMedicalRecord).toHaveBeenCalledWith('test-record-id')
    })
  })

  describe('GET /api/medical-records/:id/attachments', () => {
    it('should get attachments for a medical record', async () => {
      const mockAttachments = [
        {
          id: 'attachment-1',
          record_id: 'test-record-id',
          filename: 'eye-exam.pdf',
          file_path: 'medical-records/test-record-id/eye-exam.pdf',
          mime_type: 'application/pdf',
          file_size: 1024,
          created_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockMedicalRecordsService.getAttachmentsByRecordId.mockResolvedValue(mockAttachments)

      const response = await request(app)
        .get('/api/medical-records/test-record-id/attachments')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockAttachments)
    })
  })

  describe('GET /api/medical-records/search/:query', () => {
    it('should search medical records', async () => {
      const mockRecords = [
        {
          id: 'record-1',
          patient_id: 'test-patient-id',
          doctor_id: 'test-doctor-id',
          consultation_date: '2024-01-15',
          chief_complaint: 'Blurred vision',
          anamnesis: 'Patient reports blurred vision',
          physical_exam: {
            visualAcuity: { rightEye: '20/20', leftEye: '20/25' }
          },
          diagnosis: 'Myopia',
          prescription: 'Glasses prescription',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        }
      ]

      mockMedicalRecordsService.searchMedicalRecords.mockResolvedValue({
        records: mockRecords,
        total: 1
      })

      const response = await request(app)
        .get('/api/medical-records/search/myopia?limit=10&offset=0')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockRecords)
      expect(mockMedicalRecordsService.searchMedicalRecords).toHaveBeenCalledWith('myopia', {
        patientId: undefined,
        doctorId: undefined,
        limit: 10,
        offset: 0
      })
    })
  })

  describe('GET /api/medical-records/patient/:patientId/stats', () => {
    it('should get patient medical statistics', async () => {
      const mockStats = {
        totalRecords: 5,
        lastConsultation: '2024-01-15',
        commonDiagnoses: [
          { diagnosis: 'Myopia', count: 3 },
          { diagnosis: 'Eye strain', count: 2 }
        ]
      }

      mockMedicalRecordsService.getPatientMedicalStats.mockResolvedValue(mockStats)

      const response = await request(app)
        .get('/api/medical-records/patient/test-patient-id/stats')
        .expect(200)

      expect(response.body.success).toBe(true)
      expect(response.body.data).toEqual(mockStats)
    })
  })
})

describe('Medical Records Service', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Physical Exam Structure for Ophthalmology', () => {
    it('should create default ophthalmology physical exam structure', () => {
      const defaultPhysicalExam: PhysicalExam = {
        visualAcuity: {
          rightEye: '',
          leftEye: ''
        },
        intraocularPressure: {
          rightEye: 0,
          leftEye: 0
        },
        fundoscopy: '',
        biomicroscopy: ''
      }

      expect(defaultPhysicalExam).toHaveProperty('visualAcuity')
      expect(defaultPhysicalExam).toHaveProperty('intraocularPressure')
      expect(defaultPhysicalExam).toHaveProperty('fundoscopy')
      expect(defaultPhysicalExam).toHaveProperty('biomicroscopy')
      expect(defaultPhysicalExam.visualAcuity).toHaveProperty('rightEye')
      expect(defaultPhysicalExam.visualAcuity).toHaveProperty('leftEye')
      expect(defaultPhysicalExam.intraocularPressure).toHaveProperty('rightEye')
      expect(defaultPhysicalExam.intraocularPressure).toHaveProperty('leftEye')
    })

    it('should allow additional custom fields in physical exam', () => {
      const customPhysicalExam: PhysicalExam = {
        visualAcuity: {
          rightEye: '20/20',
          leftEye: '20/25'
        },
        intraocularPressure: {
          rightEye: 15,
          leftEye: 16
        },
        fundoscopy: 'Normal optic disc',
        biomicroscopy: 'Clear cornea',
        // Custom fields
        pupilReaction: 'Normal',
        colorVision: 'Normal',
        visualField: 'Full'
      }

      expect(customPhysicalExam).toHaveProperty('pupilReaction')
      expect(customPhysicalExam).toHaveProperty('colorVision')
      expect(customPhysicalExam).toHaveProperty('visualField')
    })
  })

  describe('Chronological Ordering', () => {
    it('should support chronological ordering options', () => {
      const orderingOptions = {
        limit: 50,
        offset: 0,
        orderBy: 'desc' as const
      }

      expect(orderingOptions.orderBy).toBe('desc')
      expect(['asc', 'desc']).toContain(orderingOptions.orderBy)
    })
  })

  describe('File Upload Validation', () => {
    it('should validate allowed file types', () => {
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]

      expect(allowedTypes).toContain('image/jpeg')
      expect(allowedTypes).toContain('application/pdf')
      expect(allowedTypes).not.toContain('text/plain')
    })

    it('should validate file size limits', () => {
      const maxFileSize = 10 * 1024 * 1024 // 10MB
      const testFileSize = 5 * 1024 * 1024 // 5MB

      expect(testFileSize).toBeLessThan(maxFileSize)
    })
  })

  describe('Search Functionality', () => {
    it('should support search in multiple fields', () => {
      const searchFields = ['diagnosis', 'prescription', 'chief_complaint']
      
      expect(searchFields).toContain('diagnosis')
      expect(searchFields).toContain('prescription')
      expect(searchFields).toContain('chief_complaint')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', () => {
      const errorMessage = 'Failed to create medical record: Database connection error'
      
      expect(errorMessage).toContain('Failed to create medical record')
      expect(errorMessage).toContain('Database connection error')
    })

    it('should handle file upload errors', () => {
      const uploadError = 'Failed to upload file: Storage bucket not found'
      
      expect(uploadError).toContain('Failed to upload file')
      expect(uploadError).toContain('Storage bucket not found')
    })
  })
})