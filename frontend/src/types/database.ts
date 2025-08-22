// Database types for frontend
export type UserRole = 'admin' | 'doctor' | 'receptionist'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type InvoiceStatus = 'pending' | 'issued' | 'error' | 'cancelled'
export type SignatureStatus = 'pending' | 'sent' | 'signed' | 'failed' | 'cancelled'
export type DocumentType = 'prescription' | 'report' | 'certificate' | 'medical_report' | 'exam_result' | 'consent_form'

// User interfaces
export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  active: boolean
  created_at: string
  updated_at: string
}

// Patient interfaces
export interface PatientAddress {
  street: string
  number: string
  complement?: string
  neighborhood: string
  city: string
  state: string
  zipCode: string
}

export interface InsuranceInfo {
  provider: string
  planNumber: string
  validUntil: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
}

export interface Patient {
  id: string
  cpf: string
  name: string
  birth_date: string
  phone: string
  email?: string
  address: PatientAddress
  insurance_info?: InsuranceInfo
  emergency_contact?: EmergencyContact
  created_at: string
  updated_at: string
}

// Medical record interfaces
export interface PhysicalExam {
  visualAcuity?: {
    rightEye: string
    leftEye: string
  }
  intraocularPressure?: {
    rightEye: number
    leftEye: number
  }
  fundoscopy?: string
  biomicroscopy?: string
  [key: string]: any
}

export interface MedicalRecord {
  id: string
  patient_id: string
  doctor_id: string
  consultation_date: string
  chief_complaint?: string
  anamnesis?: string
  physical_exam: PhysicalExam
  diagnosis?: string
  prescription?: string
  follow_up_date?: string
  created_at: string
  updated_at: string
}

// Appointment interfaces
export interface Appointment {
  id: string
  patient_id: string
  doctor_id: string
  scheduled_at: string
  duration_minutes: number
  status: AppointmentStatus
  notes?: string
  value?: number
  payment_status: PaymentStatus
  created_at: string
  updated_at: string
}

// Attachment interfaces
export interface Attachment {
  id: string
  record_id: string
  filename: string
  file_path: string
  mime_type: string
  file_size: number
  created_at: string
}

// Invoice interfaces
export interface Invoice {
  id: string
  appointment_id: string
  nfse_number?: string
  amount: number
  status: InvoiceStatus
  nfse_data: Record<string, any>
  issued_at?: string
  created_at: string
}

// Digital signature interfaces
export interface DigitalSignature {
  id: string
  record_id: string
  document_type: DocumentType
  document_content: string
  signature_provider: string
  external_signature_id?: string
  signature_url?: string
  status: SignatureStatus
  signed_document_path?: string
  signature_data: Record<string, any>
  signer_email: string
  signer_name: string
  sent_at?: string
  signed_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
}

// Integration log interfaces
export interface IntegrationLog {
  id: string
  service_name: string
  operation: string
  request_data: Record<string, any>
  response_data: Record<string, any>
  status: string
  error_message?: string
  created_at: string
}

// Create/Update types
export interface CreatePatientData {
  cpf: string
  name: string
  birth_date: string
  phone: string
  email?: string
  address: PatientAddress
  insurance_info?: InsuranceInfo
  emergency_contact?: EmergencyContact
}

export interface UpdatePatientData extends Partial<CreatePatientData> {
  id: string
}

// Database type for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
      patients: {
        Row: Patient
        Insert: Omit<Patient, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>
      }
      medical_records: {
        Row: MedicalRecord
        Insert: Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MedicalRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      appointments: {
        Row: Appointment
        Insert: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Appointment, 'id' | 'created_at' | 'updated_at'>>
      }
      attachments: {
        Row: Attachment
        Insert: Omit<Attachment, 'id' | 'created_at'>
        Update: Partial<Omit<Attachment, 'id' | 'created_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
      digital_signatures: {
        Row: DigitalSignature
        Insert: Omit<DigitalSignature, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<DigitalSignature, 'id' | 'created_at' | 'updated_at'>>
      }
      integration_logs: {
        Row: IntegrationLog
        Insert: Omit<IntegrationLog, 'id' | 'created_at'>
        Update: Partial<Omit<IntegrationLog, 'id' | 'created_at'>>
      }
    }
  }
}