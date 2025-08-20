import request from 'supertest'
import express from 'express'
import appointmentRoutes from '../routes/appointments'
import { AuthService } from '../services/auth'
import { PatientService } from '../services/patients'
import { supabaseAdmin } from '../config/supabase'

const app = express()
app.use(express.json())
app.use('/api/appointments', appointmentRoutes)

describe('Appointments API Integration Tests', () => {
  let authToken: string
  let testPatientId: string
  let testDoctorId: string
  let testAppointmentId: string

  beforeAll(async () => {
    // Create test doctor and get auth token
    const doctorData = {
      email: `integration.doctor.${Date.now()}@visioncare.com`,
      password: 'testpassword123',
      name: 'Dr. Integration Test',
      role: 'doctor' as const
    }

    const doctor = await AuthService.signUp(doctorData)
    if (!doctor.user) {
      throw new Error(`Failed to create doctor: ${doctor.error}`)
    }
    testDoctorId = doctor.user.id

    const loginResult = await AuthService.signIn({ email: doctorData.email, password: doctorData.password })
    if (!loginResult.session) {
      throw new Error(`Failed to login: ${loginResult.error}`)
    }
    authToken = loginResult.session.access_token

    // Create test patient
    const patientData = {
      cpf: '98765432100', // Test CPF (will skip validation in test env)
      name: 'Integration Test Patient',
      birth_date: '1985-05-15',
      phone: '(11) 88888-8888',
      email: `integration.patient.${Date.now()}@email.com`,
      address: {
        street: 'Integration Street',
        number: '456',
        neighborhood: 'Integration Neighborhood',
        city: 'Integration City',
        state: 'SP',
        zipCode: '54321-876'
      }
    }

    const patient = await PatientService.createPatient(patientData)
    testPatientId = patient.id
  })

  afterAll(async () => {
    // Clean up test data
    if (testAppointmentId) {
      try {
        await request(app)
          .delete(`/api/appointments/${testAppointmentId}`)
          .set('Authorization', `Bearer ${authToken}`)
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    if (testPatientId) {
      try {
        await PatientService.deletePatient(testPatientId)
      } catch (error) {
        // Ignore cleanup errors
      }
    }

    if (testDoctorId) {
      try {
        await supabaseAdmin.from('users').delete().eq('id', testDoctorId)
        await supabaseAdmin.auth.admin.deleteUser(testDoctorId)
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  })

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)

      const appointmentData = {
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 30,
        notes: 'Integration test appointment',
        value: 180.00
      }

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(appointmentData)
        .expect(201)

      expect(response.body).toBeDefined()
      expect(response.body.id).toBeDefined()
      expect(response.body.patient_id).toBe(testPatientId)
      expect(response.body.doctor_id).toBe(testDoctorId)
      expect(response.body.status).toBe('scheduled')
      expect(response.body.patient).toBeDefined()
      expect(response.body.doctor).toBeDefined()

      testAppointmentId = response.body.id
    })

    it('should return 400 for missing required fields', async () => {
      const invalidData = {
        patient_id: testPatientId,
        // Missing doctor_id and scheduled_at
        duration_minutes: 30
      }

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400)

      expect(response.body.error).toBe('patient_id, doctor_id, and scheduled_at are required')
    })

    it('should return 409 for conflicting appointment times', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 15, 0, 0) // 15 minutes after existing appointment

      const conflictingData = {
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 30
      }

      const response = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .send(conflictingData)
        .expect(409)

      expect(response.body.error).toBe('Time conflict')
    })

    it('should return 401 without authentication', async () => {
      const appointmentData = {
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: new Date().toISOString(),
        duration_minutes: 30
      }

      await request(app)
        .post('/api/appointments')
        .send(appointmentData)
        .expect(401)
    })
  })

  describe('GET /api/appointments', () => {
    it('should return appointments with filters', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          doctorId: testDoctorId,
          limit: 10,
          offset: 0
        })
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body.appointments).toBeInstanceOf(Array)
      expect(response.body.total).toBeDefined()
      
      if (response.body.appointments.length > 0) {
        expect(response.body.appointments[0].doctor_id).toBe(testDoctorId)
      }
    })

    it('should return appointments for specific patient', async () => {
      const response = await request(app)
        .get('/api/appointments')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ patientId: testPatientId })
        .expect(200)

      expect(response.body.appointments).toBeInstanceOf(Array)
      
      if (response.body.appointments.length > 0) {
        expect(response.body.appointments[0].patient_id).toBe(testPatientId)
      }
    })
  })

  describe('GET /api/appointments/:id', () => {
    it('should return appointment by ID', async () => {
      const response = await request(app)
        .get(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body.id).toBe(testAppointmentId)
      expect(response.body.patient).toBeDefined()
      expect(response.body.doctor).toBeDefined()
    })

    it('should return 404 for non-existent appointment', async () => {
      const response = await request(app)
        .get('/api/appointments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      expect(response.body.error).toBe('Appointment not found')
    })
  })

  describe('PUT /api/appointments/:id', () => {
    it('should update appointment successfully', async () => {
      const updateData = {
        notes: 'Updated integration test appointment',
        value: 220.00,
        status: 'confirmed'
      }

      const response = await request(app)
        .put(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body.notes).toBe('Updated integration test appointment')
      expect(response.body.value).toBe(220.00)
      expect(response.body.status).toBe('confirmed')
    })

    it('should return 404 for non-existent appointment', async () => {
      const updateData = { notes: 'This should fail' }

      const response = await request(app)
        .put('/api/appointments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(404)

      expect(response.body.error).toBe('Appointment not found')
    })
  })

  describe('PATCH /api/appointments/:id/status', () => {
    it('should update appointment status', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'in_progress' })
        .expect(200)

      expect(response.body.status).toBe('in_progress')
    })

    it('should return 400 for invalid status', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'invalid_status' })
        .expect(400)

      expect(response.body.error).toBe('Invalid status')
      expect(response.body.validStatuses).toBeDefined()
    })

    it('should return 400 for missing status', async () => {
      const response = await request(app)
        .patch(`/api/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400)

      expect(response.body.error).toBe('status is required')
    })
  })

  describe('GET /api/appointments/availability/:doctorId/:date', () => {
    it('should return available time slots', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2) // Day after tomorrow
      const dateString = tomorrow.toISOString().split('T')[0]

      const response = await request(app)
        .get(`/api/appointments/availability/${testDoctorId}/${dateString}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body).toBeDefined()
      expect(response.body.availableSlots).toBeInstanceOf(Array)
      expect(response.body.availableSlots.length).toBeGreaterThan(0)
    })
  })

  describe('GET /api/appointments/date-range', () => {
    it('should return appointments within date range', async () => {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const response = await request(app)
        .get('/api/appointments/date-range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({
          startDate: today.toISOString(),
          endDate: nextWeek.toISOString(),
          doctorId: testDoctorId
        })
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
    })

    it('should return 400 for missing date parameters', async () => {
      const response = await request(app)
        .get('/api/appointments/date-range')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ startDate: new Date().toISOString() })
        .expect(400)

      expect(response.body.error).toBe('startDate and endDate are required')
    })
  })

  describe('GET /api/appointments/upcoming', () => {
    it('should return upcoming appointments', async () => {
      const response = await request(app)
        .get('/api/appointments/upcoming')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ doctorId: testDoctorId, limit: 5 })
        .expect(200)

      expect(response.body).toBeInstanceOf(Array)
    })
  })

  describe('DELETE /api/appointments/:id', () => {
    it('should delete appointment successfully', async () => {
      // First, update status to cancelled to allow deletion
      await request(app)
        .patch(`/api/appointments/${testAppointmentId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'cancelled' })

      const response = await request(app)
        .delete(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)

      expect(response.body.success).toBe(true)

      // Verify appointment is deleted
      await request(app)
        .get(`/api/appointments/${testAppointmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404)

      testAppointmentId = '' // Mark as deleted for cleanup
    })
  })
})