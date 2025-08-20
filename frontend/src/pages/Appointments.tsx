import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus, List, Calendar as CalendarIcon, Search, Filter } from 'lucide-react'
import { DraggableCalendarView } from '../components/appointments/DraggableCalendarView'
import { AppointmentList } from '../components/appointments/AppointmentList'
import { AppointmentForm } from '../components/appointments/AppointmentForm'
import { AppointmentDetails } from '../components/appointments/AppointmentDetails'
import { appointmentService, AppointmentWithRelations } from '../services/appointments'
import { useToast } from '../contexts/ToastContext'
import { startOfMonth, endOfMonth } from '../utils/calendar'

export function Appointments() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedAppointmentType, setSelectedAppointmentType] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  
  // Modal states
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithRelations | null>(null)
  const [formSelectedDate, setFormSelectedDate] = useState<Date | undefined>()
  const [formSelectedTime, setFormSelectedTime] = useState<string | undefined>()

  // Check for action parameter on component mount
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      handleNewAppointment()
      // Remove the action parameter from URL
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  useEffect(() => {
    loadAppointments()
  }, [selectedDate, selectedDoctorId])

  const loadAppointments = async () => {
    try {
      setLoading(true)
      
      // Get appointments for the current month
      const startDate = startOfMonth(selectedDate)
      const endDate = endOfMonth(selectedDate)
      
      const appointmentsList = await appointmentService.getAppointmentsByDateRange(
        startDate.toISOString(),
        endDate.toISOString(),
        selectedDoctorId || undefined
      )
      
      setAppointments(appointmentsList)
    } catch (error) {
      console.error('Error loading appointments:', error)
      showToast('error', 'Erro ao carregar agendamentos')
    } finally {
      setLoading(false)
    }
  }

  const handleNewAppointment = (date?: Date, time?: string) => {
    setFormSelectedDate(date)
    setFormSelectedTime(time)
    setEditingAppointment(null)
    setShowAppointmentForm(true)
  }

  const handleEditAppointment = (appointment: AppointmentWithRelations) => {
    setEditingAppointment(appointment)
    setFormSelectedDate(undefined)
    setFormSelectedTime(undefined)
    setShowAppointmentForm(true)
    setShowAppointmentDetails(false)
  }

  const handleAppointmentClick = (appointment: AppointmentWithRelations) => {
    setSelectedAppointment(appointment)
    setShowAppointmentDetails(true)
  }

  const handleFormSuccess = () => {
    loadAppointments()
    setShowAppointmentForm(false)
    setEditingAppointment(null)
  }

  const handleDetailsClose = () => {
    setShowAppointmentDetails(false)
    setSelectedAppointment(null)
  }

  const handleDoctorFilter = (doctorId: string) => {
    setSelectedDoctorId(doctorId)
  }

  // Filter appointments based on search term and appointment type
  const filteredAppointments = appointments.filter(appointment => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const matchesSearch = (
        appointment.patient.name.toLowerCase().includes(searchLower) ||
        appointment.patient.cpf.includes(searchTerm) ||
        appointment.patient.phone.includes(searchTerm) ||
        appointment.doctor.name.toLowerCase().includes(searchLower)
      )
      if (!matchesSearch) return false
    }

    // Appointment type filter
    if (selectedAppointmentType) {
      // For now, we'll use notes to determine type since it's not in the database schema yet
      // In a real implementation, you'd add an appointment_type field to the database
      const appointmentType = appointment.notes?.toLowerCase() || 'consulta'
      if (!appointmentType.includes(selectedAppointmentType)) return false
    }

    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agendamentos</h1>
          <p className="text-gray-600">Gerencie a agenda de consultas</p>
        </div>
        <button 
          onClick={() => handleNewAppointment()}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {/* Filters and View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por paciente, CPF, telefone ou médico..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Appointment Type Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedAppointmentType}
              onChange={(e) => setSelectedAppointmentType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os tipos</option>
              <option value="consulta">Consulta</option>
              <option value="retorno">Retorno</option>
              <option value="exame">Exame</option>
              <option value="cirurgia">Cirurgia</option>
              <option value="emergencia">Emergência</option>
            </select>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              onClick={() => setView('calendar')}
              className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                view === 'calendar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Calendário</span>
            </button>
            <button
              onClick={() => setView('list')}
              className={`flex items-center space-x-2 px-3 py-2 rounded transition-colors ${
                view === 'list'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {view === 'calendar' ? (
        <DraggableCalendarView
          appointments={filteredAppointments}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          onAppointmentClick={handleAppointmentClick}
          onNewAppointment={handleNewAppointment}
          selectedDoctorId={selectedDoctorId}
          onDoctorFilter={handleDoctorFilter}
          onRefresh={loadAppointments}
        />
      ) : (
        <AppointmentList
          appointments={filteredAppointments}
          onAppointmentClick={handleAppointmentClick}
          loading={loading}
        />
      )}

      {/* Appointment Form Modal */}
      <AppointmentForm
        isOpen={showAppointmentForm}
        onClose={() => setShowAppointmentForm(false)}
        onSuccess={handleFormSuccess}
        appointment={editingAppointment}
        selectedDate={formSelectedDate}
        selectedTime={formSelectedTime}
        doctorId={selectedDoctorId}
      />

      {/* Appointment Details Modal */}
      <AppointmentDetails
        appointment={selectedAppointment}
        isOpen={showAppointmentDetails}
        onClose={handleDetailsClose}
        onEdit={handleEditAppointment}
        onRefresh={loadAppointments}
      />
    </div>
  )
}