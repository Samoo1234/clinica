import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Plus, Filter } from 'lucide-react'
import { getCalendarDays, getMonthName, getDayName, formatTime, addMonths } from '../../utils/calendar'
import { AppointmentWithRelations } from '../../services/appointments'

interface CalendarViewProps {
  appointments: AppointmentWithRelations[]
  selectedDate: Date
  onDateSelect: (date: Date) => void
  onAppointmentClick: (appointment: AppointmentWithRelations) => void
  onNewAppointment: (date: Date, time?: string) => void
  selectedDoctorId?: string
  onDoctorFilter: (doctorId: string) => void
}

interface Doctor {
  id: string
  name: string
}

const doctors: Doctor[] = [
  { id: '', name: 'Todos os médicos' },
  { id: '1', name: 'Dr. João Silva' },
  { id: '2', name: 'Dra. Maria Santos' }
]

export function CalendarView({
  appointments,
  selectedDate,
  onDateSelect,
  onAppointmentClick,
  onNewAppointment,
  selectedDoctorId = '',
  onDoctorFilter
}: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week' | 'day'>('month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const weeks = getCalendarDays(year, month, selectedDate, appointments)

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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'scheduled': return 'Agendado'
      case 'confirmed': return 'Confirmado'
      case 'in_progress': return 'Em andamento'
      case 'completed': return 'Concluído'
      case 'cancelled': return 'Cancelado'
      case 'no_show': return 'Faltou'
      default: return status
    }
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

            {/* View Toggle */}
            <div className="flex bg-gray-100 rounded-md p-1">
              {(['month', 'week', 'day'] as const).map((viewType) => (
                <button
                  key={viewType}
                  onClick={() => setView(viewType)}
                  className={`px-3 py-1 text-sm rounded transition-colors ${
                    view === viewType
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {viewType === 'month' ? 'Mês' : viewType === 'week' ? 'Semana' : 'Dia'}
                </button>
              ))}
            </div>

            <button
              onClick={goToToday}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Hoje
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {view === 'month' && (
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {/* Day Headers */}
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="bg-gray-50 p-3 text-center">
                <span className="text-sm font-medium text-gray-700">{day}</span>
              </div>
            ))}

            {/* Calendar Days */}
            {weeks.map((week, weekIndex) =>
              week.days.map((day, dayIndex) => (
                <div
                  key={`${weekIndex}-${dayIndex}`}
                  className={`bg-white p-2 min-h-[120px] cursor-pointer hover:bg-gray-50 transition-colors ${
                    !day.isCurrentMonth ? 'text-gray-400' : ''
                  } ${day.isToday ? 'bg-blue-50' : ''} ${
                    day.isSelected ? 'ring-2 ring-blue-500' : ''
                  }`}
                  onClick={() => onDateSelect(day.date)}
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

                  {/* Appointments for this day */}
                  <div className="space-y-1">
                    {day.appointments.slice(0, 3).map((appointment) => (
                      <div
                        key={appointment.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onAppointmentClick(appointment)
                        }}
                        className={`text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow ${getAppointmentColor(appointment.status)}`}
                      >
                        <div className="font-medium truncate">
                          {formatTime(new Date(appointment.scheduled_at))}
                        </div>
                        <div className="truncate">
                          {appointment.patient.name}
                        </div>
                      </div>
                    ))}
                    {day.appointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{day.appointments.length - 3} mais
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Week View */}
        {view === 'week' && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">Visualização por semana</div>
            <div className="text-sm text-gray-400">
              Esta funcionalidade será implementada em breve
            </div>
          </div>
        )}

        {/* Day View */}
        {view === 'day' && (
          <div className="text-center py-12">
            <div className="text-gray-500 mb-2">Visualização por dia</div>
            <div className="text-sm text-gray-400">
              Esta funcionalidade será implementada em breve
            </div>
          </div>
        )}
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
        </div>
      </div>
    </div>
  )
}