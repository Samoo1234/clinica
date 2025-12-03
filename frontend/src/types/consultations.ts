export type ConsultationStatus = 'waiting' | 'in_progress' | 'completed' | 'cancelled'

// Dados de refração para cada olho
export interface RefractionData {
  esferico?: string      // Esférico (ex: +2.00, -1.50)
  cilindrico?: string    // Cilíndrico (ex: -0.50, -1.25)
  eixo?: number          // Eixo em graus (0-180)
  adicao?: string        // Adição para perto (ex: +2.00)
  dnp?: number           // Distância naso-pupilar em mm
  acuidade?: string      // Acuidade visual (ex: 20/20, 20/40)
}

// Exame oftalmológico completo
export interface ExameOftalmologico {
  // Acuidade Visual
  acuidadeOD?: string           // Olho Direito (ex: 20/20)
  acuidadeOE?: string           // Olho Esquerdo (ex: 20/25)
  acuidadeAO?: string           // Ambos os olhos
  
  // Pressão Intraocular (Tonometria)
  pressaoOD?: number            // Olho Direito em mmHg
  pressaoOE?: number            // Olho Esquerdo em mmHg
  
  // Refração
  refracaoOD?: RefractionData   // Olho Direito
  refracaoOE?: RefractionData   // Olho Esquerdo
  
  // Exames complementares
  biomicroscopia?: string       // Observações da lâmpada de fenda
  fundoscopia?: string          // Exame de fundo de olho
  motilidadeOcular?: string     // Avaliação da motilidade
  reflexosPupilares?: string    // Avaliação dos reflexos
  campoVisual?: string          // Campimetria
  
  // Outros
  usoLentesContato?: boolean
  tipoLentesContato?: string
}

// Prescrição de óculos
export interface PrescricaoOculos {
  longeOD?: RefractionData
  longeOE?: RefractionData
  pertoOD?: RefractionData
  pertoOE?: RefractionData
  tipoLente?: 'monofocal' | 'bifocal' | 'multifocal' | 'progressiva'
  material?: string             // CR-39, policarbonato, etc.
  tratamentos?: string[]        // Antirreflexo, fotossensível, etc.
  observacoes?: string
  validade?: string             // Data de validade da receita
}

export interface Consultation {
  id: string
  appointmentId: string
  patientId: string
  doctorId: string
  status: ConsultationStatus
  startedAt: string
  completedAt?: string
  notes?: string
  
  // Exame Oftalmológico (substitui vitalSigns)
  exameOftalmologico?: ExameOftalmologico
  
  // Mantém compatibilidade com código legado
  vitalSigns?: {
    bloodPressure?: string
    heartRate?: number
    temperature?: number
    weight?: number
    height?: number
    oxygenSaturation?: number
  }
  
  // Queixas do paciente
  queixaPrincipal?: string
  symptoms?: string[]
  
  // Diagnóstico e conduta
  diagnosis?: string
  cid10?: string                // Código CID-10
  
  // Prescrição de óculos/lentes
  prescricaoOculos?: PrescricaoOculos
  prescription?: string         // Prescrição de medicamentos
  
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