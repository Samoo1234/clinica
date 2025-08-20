export type ConsultationStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

export interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  status: ConsultationStatus
  startedAt: string
  completedAt?: string
  notes?: string
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
    oxygenSaturation?: number
  }
  symptoms?: string[]
  diagnosis?: string
  prescription?: string
  followUpDate?: string
  createdAt: string
  updatedAt: string
  
  // Related data
  patient?: {
    id: string
    name: string
    cpf: string
    birthDate: string
    phone: string
    email?: string
  }
  
  doctor?: {
    id: string
    name: string
    email: string
    specialization?: string
  }
  
  appointment?: {
    id: string
    scheduledAt: string
    duration: number
    value?: number
    notes?: string
  }
}

export interface ConsultationFilters {
  status: ConsultationStatus | ''
  doctorId: string
  patientName: string
  dateFrom: string
  dateTo: string
}

export interface ConsultationStats {
  today: number
  inProgress: number
  completed: number
  pending: number
}

export interface StartConsultationData {
  appointmentId: string
  notes?: string
  vitalSigns?: Consultation['vitalSigns']
}

export interface UpdateConsultationData {
  notes?: string
  vitalSigns?: Consultation['vitalSigns']
  symptoms?: string[]
  diagnosis?: string
  prescription?: string
  followUpDate?: string
}

export interface CompleteConsultationData {
  diagnosis: string
  prescription?: string
  followUpDate?: string
  notes?: string
  vitalSigns?: Consultation['vitalSigns']
  symptoms?: string[]
}