import { Router, Request, Response } from 'express'
import multer from 'multer'
import { medicalRecordsService } from '../services/medical-records'
import { authMiddleware } from '../middleware/auth'
import { CreateMedicalRecordData, UpdateMedicalRecordData } from '../types/database'

const router = Router()

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common medical file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Word documents are allowed.'))
    }
  }
})

// Apply authentication middleware to all routes
router.use(authMiddleware)

// Create a new medical record
router.post('/', async (req: Request, res: Response) => {
  try {
    const data: CreateMedicalRecordData = req.body
    
    // Validate required fields
    if (!data.patient_id || !data.doctor_id) {
      return res.status(400).json({
        error: 'Patient ID and Doctor ID are required'
      })
    }

    const record = await medicalRecordsService.createMedicalRecord(data)
    
    res.status(201).json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('Error creating medical record:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to create medical record'
    })
  }
})

// Get medical record by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const record = await medicalRecordsService.getMedicalRecordById(id)
    
    if (!record) {
      return res.status(404).json({
        error: 'Medical record not found'
      })
    }

    res.json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('Error getting medical record:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get medical record'
    })
  }
})

// Get medical records by patient ID
router.get('/patient/:patientId', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const { limit, offset, orderBy } = req.query
    
    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      orderBy: (orderBy as 'asc' | 'desc') || 'desc'
    }

    const result = await medicalRecordsService.getMedicalRecordsByPatientId(patientId, options)
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0
      }
    })
  } catch (error) {
    console.error('Error getting medical records by patient:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get medical records'
    })
  }
})

// Get medical records by doctor ID
router.get('/doctor/:doctorId', async (req: Request, res: Response) => {
  try {
    const { doctorId } = req.params
    const { limit, offset, startDate, endDate } = req.query
    
    const options = {
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
      startDate: startDate as string,
      endDate: endDate as string
    }

    const result = await medicalRecordsService.getMedicalRecordsByDoctorId(doctorId, options)
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0
      }
    })
  } catch (error) {
    console.error('Error getting medical records by doctor:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get medical records'
    })
  }
})

// Update medical record
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    const data: UpdateMedicalRecordData = req.body

    const record = await medicalRecordsService.updateMedicalRecord(id, data)
    
    res.json({
      success: true,
      data: record
    })
  } catch (error) {
    console.error('Error updating medical record:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to update medical record'
    })
  }
})

// Delete medical record
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params
    await medicalRecordsService.deleteMedicalRecord(id)
    
    res.json({
      success: true,
      message: 'Medical record deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting medical record:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete medical record'
    })
  }
})

// Upload attachment to medical record
router.post('/:id/attachments', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const { id: recordId } = req.params
    
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded'
      })
    }

    const attachment = await medicalRecordsService.uploadAttachment(
      recordId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    )
    
    res.status(201).json({
      success: true,
      data: attachment
    })
  } catch (error) {
    console.error('Error uploading attachment:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to upload attachment'
    })
  }
})

// Get attachments for medical record
router.get('/:id/attachments', async (req: Request, res: Response) => {
  try {
    const { id: recordId } = req.params
    const attachments = await medicalRecordsService.getAttachmentsByRecordId(recordId)
    
    res.json({
      success: true,
      data: attachments
    })
  } catch (error) {
    console.error('Error getting attachments:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get attachments'
    })
  }
})

// Get attachment download URL
router.get('/attachments/:id/download', async (req: Request, res: Response) => {
  try {
    const { id: attachmentId } = req.params
    
    // First get the attachment to get the file path
    const attachments = await medicalRecordsService.getAttachmentsByRecordId('')
    const attachment = attachments.find(a => a.id === attachmentId)
    
    if (!attachment) {
      return res.status(404).json({
        error: 'Attachment not found'
      })
    }

    const downloadUrl = await medicalRecordsService.getAttachmentUrl(attachment.file_path)
    
    res.json({
      success: true,
      data: {
        downloadUrl,
        filename: attachment.filename,
        mimeType: attachment.mime_type
      }
    })
  } catch (error) {
    console.error('Error getting attachment download URL:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get download URL'
    })
  }
})

// Delete attachment
router.delete('/attachments/:id', async (req: Request, res: Response) => {
  try {
    const { id: attachmentId } = req.params
    await medicalRecordsService.deleteAttachment(attachmentId)
    
    res.json({
      success: true,
      message: 'Attachment deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to delete attachment'
    })
  }
})

// Search medical records
router.get('/search/:query', async (req: Request, res: Response) => {
  try {
    const { query } = req.params
    const { patientId, doctorId, limit, offset } = req.query
    
    const options = {
      patientId: patientId as string,
      doctorId: doctorId as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined
    }

    const result = await medicalRecordsService.searchMedicalRecords(query, options)
    
    res.json({
      success: true,
      data: result.records,
      pagination: {
        total: result.total,
        limit: options.limit || 50,
        offset: options.offset || 0
      }
    })
  } catch (error) {
    console.error('Error searching medical records:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to search medical records'
    })
  }
})

// Get patient medical statistics
router.get('/patient/:patientId/stats', async (req: Request, res: Response) => {
  try {
    const { patientId } = req.params
    const stats = await medicalRecordsService.getPatientMedicalStats(patientId)
    
    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error getting patient medical stats:', error)
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get patient medical statistics'
    })
  }
})

export default router