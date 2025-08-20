import { appointmentService } from '../services/appointments'
import { PatientService } from '../services/patients'
import { AuthService } from '../services/auth'
import { supabaseAdmin } from '../config/supabase'
import { CreateAppointmentData, UpdateAppointmentData } from '../types/database'

describe('Appointment Service', () => {
  let testPatientId: string
  let testDoctorId: string
  let testAppointmentId: string

  beforeAll(async () => {
    // Create test doctor
    const doctorData = {
      email: `test.doctor.${Date.now()}@visioncare.com`,
      password: 'testpassword123',
      name: 'Dr. Test Doctor',
      role: 'doctor' as const
    }

    const doctor = await AuthService.signUp(doctorData)
    if (!doctor.user) {
      throw new Error(`Failed to create doctor: ${doctor.error}`)
    }
    testDoctorId = doctor.user.id

    // Create test patient
    const patientData = {
      cpf: '12345678901', // Test CPF (will skip validation in test env)
      name: 'Test Patient',
      birth_date: '1990-01-01',
      phone: '(11) 99999-9999',
      email: `test.patient.${Date.now()}@email.com`,
      address: {
        street: 'Test Street',
        number: '123',
        neighborhood: 'Test Neighborhood',
        city: 'Test City',
        state: 'SP',
        zipCode: '12345-678'
      }
    }

    const patient = await PatientService.createPatient(patientData)
    testPatientId = patient.id
  })

  afterAll(async () => {
    // Clean up test data
    if (testAppointmentId) {
      try {
        await appointmentService.deleteAppointment(testAppointmentId)
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    if (testPatientId) {
      try {
        await PatientService.deletePatient(testPatientId)
      } catch (error) {
        // Ignore errors during cleanup
      }
    }

    if (testDoctorId) {
      try {
        await supabaseAdmin.from('users').delete().eq('id', testDoctorId)
        await supabaseAdmin.auth.admin.deleteUser(testDoctorId)
      } catch (error) {
        // Ignore errors during cleanup
      }
    }
  })

  describe('createAppointment', () => {
    it('should create a new appointment successfully', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 0, 0, 0)

      const appointmentData: CreateAppointmentData = {
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 30,
        notes: 'Test appointment',
        value: 150.00
      }

      const appointment = await appointmentService.createAppointment(appointmentData)
      testAppointmentId = appointment.id

      expect(appointment).toBeDefined()
      expect(appointment.id).toBeDefined()
      expect(appointment.patient_id).toBe(testPatientId)
      expect(appointment.doctor_id).toBe(testDoctorId)
      expect(appointment.duration_minutes).toBe(30)
      expect(appointment.status).toBe('scheduled')
      expect(appointment.patient).toBeDefined()
      expect(appointment.doctor).toBeDefined()
    })

    it('should throw error for conflicting appointment times', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(10, 15, 0, 0) // 15 minutes after the first appointment

      const conflictingAppointmentData: CreateAppointmentData = {
        patient_id: testPatientId,
        doctor_id: testDoctorId,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 30
      }

      await expect(
        appointmentService.createAppointment(conflictingAppointmentData)
      ).rejects.toThrow('Time conflict detected')
    })

    it('should throw error for invalid patient ID', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(11, 0, 0, 0)

      const invalidAppointmentData: CreateAppointmentData = {
        patient_id: '00000000-0000-0000-0000-000000000000',
        doctor_id: testDoctorId,
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 30
      }

      await expect(
        appointmentService.createAppointment(invalidAppointmentData)
      ).rejects.toThrow()
    })
  })

  describe('getAppointmentById', () => {
    it('should return appointment by ID', async () => {
      const appointment = await appointmentService.getAppointmentById(testAppointmentId)

      expect(appointment).toBeDefined()
      expect(appointment?.id).toBe(testAppointmentId)
      expect(appointment?.patient).toBeDefined()
      expect(appointment?.doctor).toBeDefined()
    })

    it('should return null for non-existent appointment', async () => {
      const appointment = await appointmentService.getAppointmentById(
        '00000000-0000-0000-0000-000000000000'
      )

      expect(appointment).toBeNull()
    })
  })

  describe('getAppointments', () => {
    it('should return appointments with filters', async () => {
      const result = await appointmentService.getAppointments({
        doctorId: testDoctorId,
        limit: 10,
        offset: 0
      })

      expect(result).toBeDefined()
      expect(result.appointments).toBeInstanceOf(Array)
      expect(result.appointments.length).toBeGreaterThan(0)
      expect(result.appointments[0].doctor_id).toBe(testDoctorId)
    })

    it('should return appointments for specific patient', async () => {
      const result = await appointmentService.getAppointments({
        patientId: testPatientId,
        limit: 10,
        offset: 0
      })

      expect(result).toBeDefined()
      expect(result.appointments).toBeInstanceOf(Array)
      expect(result.appointments.length).toBeGreaterThan(0)
      expect(result.appointments[0].patient_id).toBe(testPatientId)
    })
  })

  describe('updateAppointment', () => {
    it('should update appointment successfully', async () => {
      const updateData: UpdateAppointmentData = {
        notes: 'Updated test appointment',
        value: 200.00,
        status: 'confirmed'
      }

      const updatedAppointment = await appointmentService.updateAppointment(
        testAppointmentId,
        updateData
      )

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.notes).toBe('Updated test appointment')
      expect(updatedAppointment.value).toBe(200.00)
      expect(updatedAppointment.status).toBe('confirmed')
    })

    it('should update appointment time without conflicts', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 0, 0, 0) // Different time

      const updateData: UpdateAppointmentData = {
        scheduled_at: tomorrow.toISOString(),
        duration_minutes: 45
      }

      const updatedAppointment = await appointmentService.updateAppointment(
        testAppointmentId,
        updateData
      )

      expect(updatedAppointment).toBeDefined()
      expect(new Date(updatedAppointment.scheduled_at).getHours()).toBe(14)
      expect(updatedAppointment.duration_minutes).toBe(45)
    })

    it('should throw error for non-existent appointment', async () => {
      const updateData: UpdateAppointmentData = {
        notes: 'This should fail'
      }

      await expect(
        appointmentService.updateAppointment(
          '00000000-0000-0000-0000-000000000000',
          updateData
        )
      ).rejects.toThrow()
    })
  })

  describe('checkTimeConflict', () => {
    it('should detect time conflicts correctly', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 15, 0, 0) // 15 minutes after the updated appointment

      const hasConflict = await appointmentService.checkTimeConflict(
        testDoctorId,
        tomorrow.toISOString(),
        30
      )

      expect(hasConflict).toBe(true)
    })

    it('should not detect conflicts for different times', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(16, 0, 0, 0) // Different time

      const hasConflict = await appointmentService.checkTimeConflict(
        testDoctorId,
        tomorrow.toISOString(),
        30
      )

      expect(hasConflict).toBe(false)
    })

    it('should exclude specific appointment from conflict check', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(14, 0, 0, 0) // Same time as existing appointment

      const hasConflict = await appointmentService.checkTimeConflict(
        testDoctorId,
        tomorrow.toISOString(),
        45,
        testAppointmentId // Exclude this appointment
      )

      expect(hasConflict).toBe(false)
    })
  })

  describe('getAvailableSlots', () => {
    it('should return available time slots', async () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 2) // Day after tomorrow to avoid conflicts
      const dateString = tomorrow.toISOString().split('T')[0]

      const availableSlots = await appointmentService.getAvailableSlots(
        testDoctorId,
        dateString,
        30
      )

      expect(availableSlots).toBeInstanceOf(Array)
      expect(availableSlots.length).toBeGreaterThan(0)
      
      // Check that slots are within working hours
      availableSlots.forEach(slot => {
        const slotDate = new Date(slot)
        const hour = slotDate.getHours()
        expect(hour).toBeGreaterThanOrEqual(8)
        expect(hour).toBeLessThan(18)
        // Should not be during lunch (12-13)
        expect(hour < 12 || hour >= 13).toBe(true)
      })
    })
  })

  describe('getAppointmentsByDateRange', () => {
    it('should return appointments within date range', async () => {
      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)

      const appointments = await appointmentService.getAppointmentsByDateRange(
        today.toISOString(),
        nextWeek.toISOString(),
        testDoctorId
      )

      expect(appointments).toBeInstanceOf(Array)
      expect(appointments.length).toBeGreaterThan(0)
      
      appointments.forEach((appointment: any) => {
        expect(appointment.doctor_id).toBe(testDoctorId)
        const appointmentDate = new Date(appointment.scheduled_at)
        expect(appointmentDate.getTime()).toBeGreaterThanOrEqual(today.getTime())
        expect(appointmentDate.getTime()).toBeLessThanOrEqual(nextWeek.getTime())
      })
    })
  })

  describe('updateAppointmentStatus', () => {
    it('should update appointment status', async () => {
      const updatedAppointment = await appointmentService.updateAppointmentStatus(
        testAppointmentId,
        'in_progress'
      )

      expect(updatedAppointment).toBeDefined()
      expect(updatedAppointment.status).toBe('in_progress')
    })
  })

  describe('getUpcomingAppointments', () => {
    it('should return upcoming appointments', async () => {
      const upcomingAppointments = await appointmentService.getUpcomingAppointments(
        testDoctorId,
        5
      )

      expect(upcomingAppointments).toBeInstanceOf(Array)
      
      upcomingAppointments.forEach((appointment: any) => {
        expect(appointment.doctor_id).toBe(testDoctorId)
        expect(['scheduled', 'confirmed']).toContain(appointment.status)
        const appointmentDate = new Date(appointment.scheduled_at)
        expect(appointmentDate.getTime()).toBeGreaterThan(Date.now())
      })
    })
  })
})