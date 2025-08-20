import { Router } from 'express'
import { appointmentService } from '../services/appointments'
import { authMiddleware } from '../middleware/auth'
import { CreateAppointmentData, UpdateAppointmentData, AppointmentStatus } from '../types/database'

const router = Router()

// Apply authentication middleware to all routes
router.use(authMiddleware)

// GET /appointments - Get all appointments with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      doctorId,
      patientId,
      date,
      status,
      limit = '10',
      offset = '0'
    } = req.query

    const filters = {
      doctorId: doctorId as string,
      patientId: patientId as string,
      date: date as string,
      status: status as AppointmentStatus,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string)
    }

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof typeof filters] === undefined) {
        delete filters[key as keyof typeof filters]
      }
    })

    const result = await appointmentService.getAppointments(filters)
    res.json(result)
  } catch (error) {
    console.error('Error fetching appointments:', error)
    res.status(500).json({ 
      error: 'Failed to fetch appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /appointments/upcoming - Get upcoming appointments
router.get('/upcoming', async (req, res) => {
  try {
    const { doctorId, limit = '10' } = req.query

    const appointments = await appointmentService.getUpcomingAppointments(
      doctorId as string,
      parseInt(limit as string)
    )

    res.json(appointments)
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error)
    res.status(500).json({ 
      error: 'Failed to fetch upcoming appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /appointments/availability/:doctorId/:date - Get available time slots
router.get('/availability/:doctorId/:date', async (req, res) => {
  try {
    const { doctorId, date } = req.params
    const { duration = '30' } = req.query

    const availableSlots = await appointmentService.getAvailableSlots(
      doctorId,
      date,
      parseInt(duration as string)
    )

    res.json({ availableSlots })
  } catch (error) {
    console.error('Error fetching available slots:', error)
    res.status(500).json({ 
      error: 'Failed to fetch available slots',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /appointments/date-range - Get appointments by date range
router.get('/date-range', async (req, res) => {
  try {
    const { startDate, endDate, doctorId } = req.query

    if (!startDate || !endDate) {
      return res.status(400).json({ 
        error: 'startDate and endDate are required' 
      })
    }

    const appointments = await appointmentService.getAppointmentsByDateRange(
      startDate as string,
      endDate as string,
      doctorId as string
    )

    res.json(appointments)
  } catch (error) {
    console.error('Error fetching appointments by date range:', error)
    res.status(500).json({ 
      error: 'Failed to fetch appointments',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// GET /appointments/:id - Get appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const appointment = await appointmentService.getAppointmentById(id)

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' })
    }

    res.json(appointment)
  } catch (error) {
    console.error('Error fetching appointment:', error)
    res.status(500).json({ 
      error: 'Failed to fetch appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// POST /appointments - Create new appointment
router.post('/', async (req, res) => {
  try {
    const appointmentData: CreateAppointmentData = req.body

    // Validate required fields
    if (!appointmentData.patient_id || !appointmentData.doctor_id || !appointmentData.scheduled_at) {
      return res.status(400).json({ 
        error: 'patient_id, doctor_id, and scheduled_at are required' 
      })
    }

    const appointment = await appointmentService.createAppointment(appointmentData)
    res.status(201).json(appointment)
  } catch (error) {
    console.error('Error creating appointment:', error)
    
    // Handle specific conflict errors
    if (error instanceof Error && error.message.includes('Time conflict')) {
      return res.status(409).json({ 
        error: 'Time conflict',
        message: error.message 
      })
    }

    res.status(500).json({ 
      error: 'Failed to create appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// PUT /appointments/:id - Update appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const appointmentData: UpdateAppointmentData = req.body

    const appointment = await appointmentService.updateAppointment(id, appointmentData)
    res.json(appointment)
  } catch (error) {
    console.error('Error updating appointment:', error)
    
    // Handle specific conflict errors
    if (error instanceof Error && error.message.includes('Time conflict')) {
      return res.status(409).json({ 
        error: 'Time conflict',
        message: error.message 
      })
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({ 
        error: 'Appointment not found',
        message: error.message 
      })
    }

    res.status(500).json({ 
      error: 'Failed to update appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// PATCH /appointments/:id/status - Update appointment status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status) {
      return res.status(400).json({ error: 'status is required' })
    }

    const validStatuses: AppointmentStatus[] = [
      'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'
    ]

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status',
        validStatuses 
      })
    }

    const appointment = await appointmentService.updateAppointmentStatus(id, status)
    res.json(appointment)
  } catch (error) {
    console.error('Error updating appointment status:', error)
    res.status(500).json({ 
      error: 'Failed to update appointment status',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// DELETE /appointments/:id - Delete appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const result = await appointmentService.deleteAppointment(id)
    res.json(result)
  } catch (error) {
    console.error('Error deleting appointment:', error)
    
    // Handle specific constraint errors
    if (error instanceof Error && error.message.includes('Cannot delete')) {
      return res.status(400).json({ 
        error: 'Cannot delete appointment',
        message: error.message 
      })
    }

    res.status(500).json({ 
      error: 'Failed to delete appointment',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

export default router