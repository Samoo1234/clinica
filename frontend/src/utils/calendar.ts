// Calendar utility functions

export interface CalendarDay {
  date: Date
  isCurrentMonth: boolean
  isToday: boolean
  isSelected: boolean
  appointments: any[]
}

export interface CalendarWeek {
  days: CalendarDay[]
}

export function getCalendarDays(
  year: number,
  month: number,
  selectedDate?: Date,
  appointments: any[] = []
): CalendarWeek[] {
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const firstDayOfWeek = firstDayOfMonth.getDay() // 0 = Sunday
  const today = new Date()
  
  // Clear time for accurate comparison
  today.setHours(0, 0, 0, 0)
  
  const days: CalendarDay[] = []
  
  // Add days from previous month to fill the first week
  const prevMonth = new Date(year, month - 1, 0)
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, prevMonth.getDate() - i)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      appointments: getAppointmentsForDate(date, appointments)
    })
  }
  
  // Add days of current month
  for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
    const date = new Date(year, month, day)
    days.push({
      date,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      appointments: getAppointmentsForDate(date, appointments)
    })
  }
  
  // Add days from next month to fill the last week
  const remainingDays = 42 - days.length // 6 weeks * 7 days
  for (let day = 1; day <= remainingDays; day++) {
    const date = new Date(year, month + 1, day)
    days.push({
      date,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      appointments: getAppointmentsForDate(date, appointments)
    })
  }
  
  // Group days into weeks
  const weeks: CalendarWeek[] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push({
      days: days.slice(i, i + 7)
    })
  }
  
  return weeks
}

export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

export function getAppointmentsForDate(date: Date, appointments: any[]): any[] {
  return appointments.filter(appointment => {
    const appointmentDate = new Date(appointment.scheduled_at)
    return isSameDay(date, appointmentDate)
  })
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR')
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return `${formatDate(date)} às ${formatTime(date)}`
}

export function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month]
}

export function getDayName(day: number): string {
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
  return days[day]
}

export function getTimeSlots(startHour: number = 8, endHour: number = 18, interval: number = 30): string[] {
  const slots: string[] = []
  
  for (let hour = startHour; hour < endHour; hour++) {
    // Skip lunch time (12:00 - 13:00)
    if (hour === 12) continue
    
    for (let minute = 0; minute < 60; minute += interval) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      slots.push(timeString)
    }
  }
  
  return slots
}

export function isTimeSlotAvailable(
  timeSlot: string,
  date: Date,
  appointments: any[],
  duration: number = 30
): boolean {
  const [hours, minutes] = timeSlot.split(':').map(Number)
  const slotStart = new Date(date)
  slotStart.setHours(hours, minutes, 0, 0)
  const slotEnd = new Date(slotStart.getTime() + duration * 60000)
  
  return !appointments.some(appointment => {
    const appointmentStart = new Date(appointment.scheduled_at)
    const appointmentEnd = new Date(appointmentStart.getTime() + appointment.duration_minutes * 60000)
    
    // Check for overlap
    return slotStart < appointmentEnd && slotEnd > appointmentStart
  })
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

export function startOfWeek(date: Date): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = result.getDate() - day
  result.setDate(diff)
  result.setHours(0, 0, 0, 0)
  return result
}

export function endOfWeek(date: Date): Date {
  const result = startOfWeek(date)
  result.setDate(result.getDate() + 6)
  result.setHours(23, 59, 59, 999)
  return result
}

export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
}