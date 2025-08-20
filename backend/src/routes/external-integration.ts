import { Router, Request, Response } from 'express'
import { externalIntegrationService } from '../services/external-integration'
import { authenticatePartner, requirePartnerPermission, logPartnerRequest } from '../middleware/partner-auth'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Admin routes for managing partners (require internal authentication)
router.use('/admin', authMiddleware)

// Create new partner
router.post('/admin/partners', async (req: Request, res: Response) => {
  try {
    const partner = await externalIntegrationService.createPartner(req.body)
    res.status(201).json(partner)
  } catch (error) {
    console.error('Create partner error:', error)
    res.status(500).json({
      error: 'Failed to create partner',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get all partners
router.get('/admin/partners', async (req: Request, res: Response) => {
  try {
    const partners = await externalIntegrationService.getPartners()
    res.json(partners)
  } catch (error) {
    console.error('Get partners error:', error)
    res.status(500).json({
      error: 'Failed to fetch partners',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get partner by ID
router.get('/admin/partners/:id', async (req: Request, res: Response) => {
  try {
    const partner = await externalIntegrationService.getPartnerById(req.params.id)
    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' })
    }
    res.json(partner)
  } catch (error) {
    console.error('Get partner error:', error)
    res.status(500).json({
      error: 'Failed to fetch partner',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Update partner
router.put('/admin/partners/:id', async (req: Request, res: Response) => {
  try {
    const partner = await externalIntegrationService.updatePartner(req.params.id, req.body)
    res.json(partner)
  } catch (error) {
    console.error('Update partner error:', error)
    res.status(500).json({
      error: 'Failed to update partner',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Delete partner
router.delete('/admin/partners/:id', async (req: Request, res: Response) => {
  try {
    await externalIntegrationService.deletePartner(req.params.id)
    res.status(204).send()
  } catch (error) {
    console.error('Delete partner error:', error)
    res.status(500).json({
      error: 'Failed to delete partner',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get partner access logs
router.get('/admin/partners/:id/logs', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100
    const logs = await externalIntegrationService.getPartnerAccessLogs(req.params.id, limit)
    res.json(logs)
  } catch (error) {
    console.error('Get partner logs error:', error)
    res.status(500).json({
      error: 'Failed to fetch partner logs',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Get partner statistics
router.get('/admin/partners/:id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await externalIntegrationService.getIntegrationStats(req.params.id)
    res.json(stats)
  } catch (error) {
    console.error('Get partner stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch partner statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Share prescription with partner
router.post('/admin/prescriptions/share', async (req: Request, res: Response) => {
  try {
    const share = await externalIntegrationService.sharePrescription(req.body)
    res.status(201).json(share)
  } catch (error) {
    console.error('Share prescription error:', error)
    res.status(500).json({
      error: 'Failed to share prescription',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// External API routes (require partner authentication)
router.use('/api', authenticatePartner, logPartnerRequest)

// Test authentication endpoint
router.get('/api/test', (req: Request, res: Response) => {
  res.json({
    message: 'Authentication successful',
    partner: {
      id: req.partner!.id,
      name: req.partner!.name,
      type: req.partner!.partner_type
    }
  })
})

// Get patient by ID (requires patient_access permission)
router.get('/api/patients/:patientId', 
  requirePartnerPermission('patient_access'),
  async (req: Request, res: Response) => {
    try {
      const patient = await externalIntegrationService.getPatientForPartner(
        req.partner!.id,
        req.params.patientId
      )
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' })
      }

      // Return only necessary patient data for external partners
      const sanitizedPatient = {
        id: patient.id,
        name: patient.name,
        birth_date: patient.birth_date,
        phone: patient.phone,
        email: patient.email
      }

      res.json(sanitizedPatient)
    } catch (error) {
      console.error('Get patient error:', error)
      res.status(500).json({
        error: 'Failed to fetch patient',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Search patient by CPF (requires patient_search permission)
router.get('/api/patients/search/:cpf',
  requirePartnerPermission('patient_search'),
  async (req: Request, res: Response) => {
    try {
      const patient = await externalIntegrationService.searchPatientForPartner(
        req.partner!.id,
        req.params.cpf
      )
      
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found' })
      }

      // Return only necessary patient data for external partners
      const sanitizedPatient = {
        id: patient.id,
        name: patient.name,
        birth_date: patient.birth_date,
        phone: patient.phone,
        email: patient.email
      }

      res.json(sanitizedPatient)
    } catch (error) {
      console.error('Search patient error:', error)
      res.status(500).json({
        error: 'Failed to search patient',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Get shared prescriptions for partner
router.get('/api/prescriptions',
  requirePartnerPermission('prescription_access'),
  async (req: Request, res: Response) => {
    try {
      const shares = await externalIntegrationService.getPrescriptionShares(req.partner!.id)
      res.json(shares)
    } catch (error) {
      console.error('Get prescriptions error:', error)
      res.status(500).json({
        error: 'Failed to fetch prescriptions',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Confirm prescription dispensing
router.post('/api/prescriptions/:shareId/dispense',
  requirePartnerPermission('prescription_access'),
  async (req: Request, res: Response) => {
    try {
      const { dispensed_by, notes } = req.body
      
      if (!dispensed_by) {
        return res.status(400).json({
          error: 'Missing required field',
          message: 'dispensed_by is required'
        })
      }

      const share = await externalIntegrationService.confirmPrescriptionDispensing(
        req.params.shareId,
        dispensed_by,
        notes
      )
      
      res.json(share)
    } catch (error) {
      console.error('Confirm dispensing error:', error)
      res.status(500).json({
        error: 'Failed to confirm dispensing',
        message: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
)

// Get partner's own statistics
router.get('/api/stats', async (req: Request, res: Response) => {
  try {
    const stats = await externalIntegrationService.getIntegrationStats(req.partner!.id)
    res.json(stats)
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({
      error: 'Failed to fetch statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router