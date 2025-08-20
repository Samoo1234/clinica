import { Router } from 'express'
import { consultationsService } from '../services/consultations'
import { authMiddleware } from '../middleware/auth'

const router = Router()

// Apply auth middleware to all routes
router.use(authMiddleware)

// Get consultations with filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      status: req.query.status as string,
      doctorId: req.query.doctorId as string,
      patientName: req.query.patientName as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string
    }

    const consultations = await consultationsService.getConsultations(filters)
    res.json({ consultations })
  } catch (error: any) {
    console.error('Error fetching consultations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get consultation statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await consultationsService.getConsultationStats()
    res.json({ stats })
  } catch (error: any) {
    console.error('Error fetching consultation stats:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get available appointments for starting consultations
router.get('/available-appointments', async (req, res) => {
  try {
    const appointments = await consultationsService.getAvailableAppointments()
    res.json({ appointments })
  } catch (error: any) {
    console.error('Error fetching available appointments:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get consultation by ID
router.get('/:id', async (req, res) => {
  try {
    const consultation = await consultationsService.getConsultation(req.params.id)
    res.json({ consultation })
  } catch (error: any) {
    console.error('Error fetching consultation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Start a new consultation
router.post('/start', async (req, res) => {
  try {
    const { appointmentId, ...data } = req.body
    const consultation = await consultationsService.startConsultation(appointmentId, data)
    res.json({ consultation })
  } catch (error: any) {
    console.error('Error starting consultation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update consultation
router.put('/:id', async (req, res) => {
  try {
    const consultation = await consultationsService.updateConsultation(req.params.id, req.body)
    res.json({ consultation })
  } catch (error: any) {
    console.error('Error updating consultation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Complete consultation
router.post('/:id/complete', async (req, res) => {
  try {
    await consultationsService.completeConsultation(req.params.id, req.body)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error completing consultation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Cancel consultation
router.post('/:id/cancel', async (req, res) => {
  try {
    await consultationsService.cancelConsultation(req.params.id, req.body.reason)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Error cancelling consultation:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update vital signs
router.put('/:id/vital-signs', async (req, res) => {
  try {
    const consultation = await consultationsService.updateVitalSigns(req.params.id, req.body.vitalSigns)
    res.json({ consultation })
  } catch (error: any) {
    console.error('Error updating vital signs:', error)
    res.status(500).json({ error: error.message })
  }
})

// Add notes
router.put('/:id/notes', async (req, res) => {
  try {
    const consultation = await consultationsService.addNotes(req.params.id, req.body.notes)
    res.json({ consultation })
  } catch (error: any) {
    console.error('Error adding notes:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get patient consultations
router.get('/patient/:patientId', async (req, res) => {
  try {
    const consultations = await consultationsService.getPatientConsultations(req.params.patientId)
    res.json({ consultations })
  } catch (error: any) {
    console.error('Error fetching patient consultations:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get doctor consultations
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const consultations = await consultationsService.getDoctorConsultations(req.params.doctorId)
    res.json({ consultations })
  } catch (error: any) {
    console.error('Error fetching doctor consultations:', error)
    res.status(500).json({ error: error.message })
  }
})

export { router as consultationsRouter }