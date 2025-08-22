import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter, Move } from 'lucide-react'
import { getCalendarDays, getMonthName, addMonths, formatTime } from '../../utils/calendar'
import { AppointmentWithRelations, appointmentService } from '../../services/appointments'
import { userService, Doctor } from '../../services/users'
import { useToast } from '../../contexts/ToastContext'

interface DraggableCalendarViewProps {
  appointments: AppointmentWithRelations[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onAppointmentClick: (appointment: AppointmentWithRelations) => void
  onNewAppointment: (date: Date, time?: string) => void
  selectedDoctorId?: string
  onDoctorFilter: (doctorId: string) => void
  onRefresh: () => void
}



export function DraggableCalendarView({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onNewAppointment,
  selectedDoctorId = '',
  onDoctorFilter,
  onRefresh
}: DraggableCalendarViewProps) {
  const { showToast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggedAppointment, setDraggedAppointment] = useState<AppointmentWithRelations | null>(null)
  const [dragOverDate, setDragOverDate] = useState<Date | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [doctors, setDoctors] = useState<Doctor[]>([{ id: '', name: 'Todos os médicos', email: '', role: 'doctor' }])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const weeks = getCalendarDays(year, month, selectedDate, appointments)

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    try {
      const doctorsList = await userService.getDoctors()
      setDoctors([{ id: '', name: 'Todos os médicos', email: '', role: 'doctor' }, ...doctorsList])
    } catch (error) {
      console.error('Error loading doctors:', error)
      // Keep default doctors list if loading fails
    }
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => addMonths(prev, direction === 'next' ? 1 : -1))
  }

  const goToToday = () => {
    const today = new Date()
    setCurrentDate(today)
    onDateSelect(today)
  }

  const getAppointmentColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'completed':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'no_show':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, appointment: AppointmentWithRelations) => {
    // Only allow dragging of scheduled or confirmed appointments
    if (!['scheduled', 'confirmed'].includes(appointment.status)) {
      e.preventDefault()
      return
    }

    setDraggedAppointment(appointment)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', appointment.id)
  }

  const handleDragEnd = () => {
    setDraggedAppointment(null)
    setDragOverDate(null)
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent, date: Date) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverDate(date)
  }

  const handleDragLeave = () => {
    setDragOverDate(null)
  }

  const handleDrop = async (e: React.DragEvent, targetDate: Date) => {
    e.preventDefault()
    
    if (!draggedAppointment) return

    try {
      // Calculate new scheduled time (keep the same time, change the date)
      const originalDate = new Date(draggedAppointment.scheduled_at)
      const newDate = new Date(targetDate)
      newDate.setHours(originalDate.getHours(), originalDate.getMinutes(), 0, 0)

      // Check if it's the same date
      if (newDate.toDateString() === originalDate.toDateString()) {
        setDraggedAppointment(null)
        setDragOverDate(null)
        setIsDragging(false)
        return
      }

      // Update the appointment
      await appointmentService.updateAppointment(draggedAppointment.id, {
        scheduled_at: newDate.toISOString()
      })

      showToast('success', 'Agendamento reagendado com sucesso!')
      onRefresh()
    } catch (error) {
      console.error('Error rescheduling appointment:', error)
      showToast(
        'error',
        error instanceof Error && error.message.includes('conflict')
          ? 'Conflito de horário detectado. Escolha outro horário.'
          : 'Erro ao reagendar agendamento'
      )
    } finally {
      setDraggedAppointment(null)
      setDragOverDate(null)
      setIsDragging(false)
    }
  }

  const canDragAppointment = (appointment: AppointmentWithRelations) => {
    return ['scheduled', 'confirmed'].includes(appointment.status)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Calendar Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-gray-900">
              {getMonthName(month)} {year}
            </h2>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-gray-100 rounded-md transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Doctor Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select
                value={selectedDoctorId}
                onChange={(e) => onDoctorFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {doctors.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* Drag and Drop Instructions */}
        {isDragging && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2 text-blue-800">
              <Move className="w-4 h-4" />
              <span className="text-sm font-medium">
                Arraste o agendamento para uma nova data no calendário
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
          {/* Day Headers */}
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
            <div key={day} className="bg-gray-50 p-3 text-center">
              <span className="text-sm font-medium text-gray-700">{day}</span>
            </div>
          ))}

          {/* Calendar Days */}
          {weeks.map((week, weekIndex) =>
            week.days.map((day, dayIndex) => {
              const isDragOver = dragOverDate && 
                dragOverDate.toDateString() === day.date.toDateString()

              return (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors relative ${
                    !day.isCurrentMonth ? 'text-gray-400' : ''
                  } ${day.isToday ? 'bg-blue-50' : ''} ${
                    day.isSelected ? 'ring-2 ring-blue-500' : ''
                  } ${isDragOver ? 'bg-green-50 ring-2 ring-green-400' : ''}`}
                  onClick={() => onDateSelect(day.date)}
                  onDragOver={(e) => handleDragOver(e, day.date)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, day.date)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${
                      day.isToday ? 'text-blue-600' : day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    {day.isCurrentMonth && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          onNewAppointment(day.date)
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 rounded transition-all"
                      >
                        <Plus className="w-3 h-3 text-blue-600" />
                      </button>
                    )}
                  </div>

                  {/* Drop Zone Indicator */}
                  {isDragOver && (
                    <div className="absolute inset-0 bg-green-100 bg-opacity-50 border-2 border-dashed border-green-400 rounded flex items-center justify-center">
                      <span className="text-green-700 text-xs font-medium">
                        Soltar aqui
                      </span>
                    </div>
                  )}

                  {/* Appointments for this day */}
                  <div className="space-y-1">
                    {day.appointments.slice(0, 3).map((appointment) => {
                      const isDraggable = canDragAppointment(appointment)
                      const isBeingDragged = draggedAppointment?.id === appointment.id

                      return (
                        <div
                          key={appointment.id}
                          draggable={isDraggable}
                          onDragStart={(e) => handleDragStart(e, appointment)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAppointmentClick(appointment)
                          }}
                          className={`text-xs p-1 rounded border cursor-pointer transition-all ${
                            getAppointmentColor(appointment.status)
                          } ${isDraggable ? 'hover:shadow-md' : ''} ${
                            isBeingDragged ? 'opacity-50 scale-95' : 'hover:shadow-sm'
                          }`}
                          style={{
                            cursor: isDraggable ? 'grab' : 'pointer'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium truncate">
                              {formatTime(new Date(appointment.scheduled_at))}
                            </div>
                            {isDraggable && (
                              <Move className="w-3 h-3 opacity-50" />
                            )}
                          </div>
                          <div className="truncate">
                            {appointment.patient.name}
                          </div>
                        </div>
                      )
                    })}
                    {day.appointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.appointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
            <span>Agendado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
            <span>Confirmado</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
            <span>Em andamento</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
            <span>Cancelado</span>
          </div>
          <div className="flex items-center space-x-1">
            <Move className="w-3 h-3 text-gray-500" />
            <span>Arraste para reagendar</span>
          </div>
        </div>
      </div>
    </div>
  )
}