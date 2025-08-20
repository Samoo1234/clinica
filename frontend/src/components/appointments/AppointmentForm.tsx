import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, UserCheck } from 'lucide-react'
import { CreateAppointmentData, UpdateAppointmentData, appointmentService } from '../../services/appointments'
import { Patient } from '../../types/database'
import { patientService } from '../../services/patients'
import { userService, Doctor } from '../../services/users'
import { useToast } from '../../contexts/ToastContext'
import { getTimeSlots, isTimeSlotAvailable } from '../../utils/calendar'

interface AppointmentFormProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  appointment?: any
  selectedDate?: Date
  selectedTime?: string
  doctorId?: string
}



export function AppointmentForm({
  isOpen,
  onClose,
  onSuccess,
  appointment,
  selectedDate,
  selectedTime,
  doctorId
}: AppointmentFormProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [, setExistingAppointments] = useState<any[]>([])

  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: doctorId || '',
    scheduled_date: selectedDate ? selectedDate.toISOString().split('T')[0] : '',
    scheduled_time: selectedTime || '',
    duration_minutes: 30,
    notes: '',
    value: 0,
    appointment_type: 'consulta'
  })

  useEffect(() => {
    if (isOpen) {
      loadPatients()
      loadDoctors()
      if (appointment) {
        const scheduledAt = new Date(appointment.scheduled_at)
        setFormData({
          patient_id: appointment.patient_id,
          doctor_id: appointment.doctor_id,
          scheduled_date: scheduledAt.toISOString().split('T')[0],
          scheduled_time: scheduledAt.toTimeString().slice(0, 5),
          duration_minutes: appointment.duration_minutes,
          notes: appointment.notes || '',
          value: appointment.value || 0,
          appointment_type: 'consulta'
        })
      }
    }
  }, [isOpen, appointment])

  useEffect(() => {
    if (formData.doctor_id && formData.scheduled_date) {
      loadAvailableSlots()
    }
  }, [formData.doctor_id, formData.scheduled_date])

  const loadPatients = async () => {
    try {
      const response = await patientService.getPatients({ limit: 100 })
      setPatients(response.data)
    } catch (error) {
      console.error('Error loading patients:', error)
      showToast('error', 'Erro ao carregar pacientes')
    }
  }

  const loadDoctors = async () => {
    try {
      const doctorsList = await userService.getDoctors()
      setDoctors(doctorsList)
    } catch (error) {
      console.error('Error loading doctors:', error)
      showToast('error', 'Erro ao carregar médicos')
    }
  }

  const loadAvailableSlots = async () => {
    try {
      const response = await appointmentService.getAppointmentsByDateRange(
        `${formData.scheduled_date}T00:00:00.000Z`,
        `${formData.scheduled_date}T23:59:59.999Z`,
        formData.doctor_id
      )
      setExistingAppointments(response)
      
      const slots = getTimeSlots(8, 18, 30)
      const date = new Date(formData.scheduled_date)
      const available = slots.filter(slot => 
        isTimeSlotAvailable(slot, date, response, formData.duration_minutes)
      )
      setAvailableSlots(available)
    } catch (error) {
      console.error('Error loading available slots:', error)
      setAvailableSlots(getTimeSlots(8, 18, 30))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const scheduledAt = new Date(`${formData.scheduled_date}T${formData.scheduled_time}:00.000Z`)
      
      const appointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        scheduled_at: scheduledAt.toISOString(),
        duration_minutes: formData.duration_minutes,
        notes: formData.notes,
        value: formData.value
      }

      if (appointment) {
        await appointmentService.updateAppointment(appointment.id, appointmentData as UpdateAppointmentData)
        showToast('success', 'Agendamento atualizado com sucesso!')
      } else {
        await appointmentService.createAppointment(appointmentData as CreateAppointmentData)
        showToast('success', 'Agendamento criado com sucesso!')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving appointment:', error)
      showToast(
        'error',
        error instanceof Error ? error.message : 'Erro ao salvar agendamento'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration_minutes' || name === 'value' ? Number(value) : value
    }))
  }

  if (!isOpen) return null

  const selectedPatient = patients.find(p => p.id === formData.patient_id)
  // const selectedDoctor = doctors.find(d => d.id === formData.doctor_id)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {appointment ? 'Editar Agendamento' : 'Novo Agendamento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              Paciente *
            </label>
            <select
              name="patient_id"
              value={formData.patient_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um paciente</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.name} - {patient.cpf}
                </option>
              ))}
            </select>
            {selectedPatient && (
              <p className="text-sm text-gray-600 mt-1">
                Telefone: {selectedPatient.phone}
              </p>
            )}
          </div>

          {/* Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <UserCheck className="w-4 h-4 inline mr-1" />
              Médico *
            </label>
            <select
              name="doctor_id"
              value={formData.doctor_id}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione um médico</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data *
              </label>
              <input
                type="date"
                name="scheduled_date"
                value={formData.scheduled_date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                Horário *
              </label>
              <select
                name="scheduled_time"
                value={formData.scheduled_time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecione um horário</option>
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
              {availableSlots.length === 0 && formData.doctor_id && formData.scheduled_date && (
                <p className="text-sm text-red-600 mt-1">
                  Nenhum horário disponível para esta data
                </p>
              )}
            </div>
          </div>

          {/* Duration and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duração (minutos)
              </label>
              <select
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={30}>30 minutos</option>
                <option value={60}>60 minutos</option>
                <option value={90}>90 minutos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Consulta
              </label>
              <select
                name="appointment_type"
                value={formData.appointment_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="consulta">Consulta</option>
                <option value="retorno">Retorno</option>
                <option value="exame">Exame</option>
                <option value="cirurgia">Cirurgia</option>
                <option value="emergencia">Emergência</option>
              </select>
            </div>
          </div>

          {/* Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor (R$)
            </label>
            <input
              type="number"
              name="value"
              value={formData.value}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Observações
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Observações sobre o agendamento..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Salvando...' : appointment ? 'Atualizar' : 'Criar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}