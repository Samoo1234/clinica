// Database types for backend
export type UserRole = 'admin' | 'doctor' | 'receptionist'
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
export type PaymentStatus = 'pending' | 'paid' | 'cancelled' | 'refunded'
export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'pix' | 'bank_transfer' | 'check' | 'insurance'
export type InvoiceStatus = 'pending' | 'issued' | 'error' | 'cancelled'
export type SignatureStatus = 'pending' | 'sent' | 'signed' | 'failed' | 'cancelled'
export type PartnerType = 'optics' | 'pharmacy' | 'laboratory' | 'other'
export type PartnerStatus = 'active' | 'inactive' | 'suspended'
export type PrescriptionStatus = 'pending' | 'shared' | 'dispensed' | 'cancelled'
export type NotificationType = 'appointment_reminder' | 'appointment_confirmation' | 'appointment_cancellation' | 'payment_reminder' | 'custom'
export type NotificationChannel = 'email' | 'sms' | 'both'
export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled'

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

export interface CreateUserData {
  id: string
  email: string
  name: string
  role?: UserRole
  active?: boolean
}

export interface UpdateUserData {
  email?: string
  name?: string
  role?: UserRole
  active?: boolean
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
  agendamento_cliente_id?: string
  erp_cliente_id?: string
  created_at: string
  updated_at: string
}

export interface CreatePatientData {
  cpf: string
  name: string
  birth_date: string
  phone: string
  email?: string
  address: PatientAddress
  insurance_info?: InsuranceInfo
  emergency_contact?: EmergencyContact
  agendamento_cliente_id?: string
  erp_cliente_id?: string
}

export interface UpdatePatientData {
  cpf?: string
  name?: string
  birth_date?: string
  phone?: string
  email?: string
  address?: PatientAddress
  insurance_info?: InsuranceInfo
  emergency_contact?: EmergencyContact
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

export interface CreateMedicalRecordData {
  patient_id: string
  doctor_id: string
  consultation_date?: string
  chief_complaint?: string
  anamnesis?: string
  physical_exam?: PhysicalExam
  diagnosis?: string
  prescription?: string
  follow_up_date?: string
}

export interface UpdateMedicalRecordData {
  chief_complaint?: string
  anamnesis?: string
  physical_exam?: PhysicalExam
  diagnosis?: string
  prescription?: string
  follow_up_date?: string
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

export interface CreateAppointmentData {
  patient_id: string
  doctor_id: string
  scheduled_at: string
  duration_minutes?: number
  status?: AppointmentStatus
  notes?: string
  value?: number
  payment_status?: PaymentStatus
}

export interface UpdateAppointmentData {
  scheduled_at?: string
  duration_minutes?: number
  status?: AppointmentStatus
  notes?: string
  value?: number
  payment_status?: PaymentStatus
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

export interface CreateAttachmentData {
  record_id: string
  filename: string
  file_path: string
  mime_type: string
  file_size: number
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

export interface CreateInvoiceData {
  appointment_id: string
  amount: number
  status?: InvoiceStatus
  nfse_data?: Record<string, any>
}

export interface UpdateInvoiceData {
  nfse_number?: string
  status?: InvoiceStatus
  nfse_data?: Record<string, any>
  issued_at?: string
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

export interface CreateIntegrationLogData {
  service_name: string
  operation: string
  request_data?: Record<string, any>
  response_data?: Record<string, any>
  status: string
  error_message?: string
}

// Payment interfaces
export interface Payment {
  id: string
  appointment_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date?: string
  status: PaymentStatus
  notes?: string
  transaction_id?: string
  installments: number
  installment_number: number
  due_date?: string
  created_at: string
  updated_at: string
}

export interface CreatePaymentData {
  appointment_id: string
  amount: number
  payment_method: PaymentMethod
  payment_date?: string
  status?: PaymentStatus
  notes?: string
  transaction_id?: string
  installments?: number
  installment_number?: number
  due_date?: string
}

export interface UpdatePaymentData {
  amount?: number
  payment_method?: PaymentMethod
  payment_date?: string
  status?: PaymentStatus
  notes?: string
  transaction_id?: string
  due_date?: string
}

// Payment installment interfaces
export interface PaymentInstallment {
  id: string
  payment_id: string
  installment_number: number
  amount: number
  due_date: string
  payment_date?: string
  status: PaymentStatus
  created_at: string
  updated_at: string
}

// Service price interfaces
export interface ServicePrice {
  id: string
  service_name: string
  description?: string
  base_price: number
  insurance_price?: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateServicePriceData {
  service_name: string
  description?: string
  base_price: number
  insurance_price?: number
  active?: boolean
}

export interface UpdateServicePriceData {
  service_name?: string
  description?: string
  base_price?: number
  insurance_price?: number
  active?: boolean
}

// Financial transaction interfaces
export interface FinancialTransaction {
  id: string
  payment_id?: string
  transaction_type: string
  amount: number
  description: string
  category?: string
  transaction_date: string
  created_at: string
}

export interface CreateFinancialTransactionData {
  payment_id?: string
  transaction_type: string
  amount: number
  description: string
  category?: string
  transaction_date?: string
}

// Digital signature interfaces
export interface DigitalSignature {
  id: string
  record_id: string
  document_type: string
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

export interface CreateDigitalSignatureData {
  record_id: string
  document_type: string
  document_content: string
  signature_provider: string
  external_signature_id?: string
  signature_url?: string
  status?: SignatureStatus
  signed_document_path?: string
  signature_data?: Record<string, any>
  signer_email: string
  signer_name: string
  sent_at?: string
  signed_at?: string
  expires_at?: string
}

export interface UpdateDigitalSignatureData {
  status?: SignatureStatus
  signed_document_path?: string
  signature_data?: Record<string, any>
  signed_at?: string
}

// External partner interfaces
export interface ExternalPartner {
  id: string
  name: string
  partner_type: PartnerType
  cnpj: string
  email: string
  phone?: string
  address: Record<string, any>
  api_key: string
  api_secret: string
  status: PartnerStatus
  permissions: Record<string, any>
  webhook_url?: string
  created_at: string
  updated_at: string
}

export interface CreateExternalPartnerData {
  name: string
  partner_type: PartnerType
  cnpj: string
  email: string
  phone?: string
  address?: Record<string, any>
  permissions?: Record<string, any>
  webhook_url?: string
}

export interface UpdateExternalPartnerData {
  name?: string
  partner_type?: PartnerType
  email?: string
  phone?: string
  address?: Record<string, any>
  status?: PartnerStatus
  permissions?: Record<string, any>
  webhook_url?: string
}

// Prescription share interfaces
export interface PrescriptionShare {
  id: string
  record_id: string
  partner_id: string
  patient_id: string
  prescription_data: Record<string, any>
  shared_at: string
  status: PrescriptionStatus
  dispensed_at?: string
  dispensed_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreatePrescriptionShareData {
  record_id: string
  partner_id: string
  patient_id: string
  prescription_data: Record<string, any>
  status?: PrescriptionStatus
  notes?: string
}

export interface UpdatePrescriptionShareData {
  status?: PrescriptionStatus
  dispensed_at?: string
  dispensed_by?: string
  notes?: string
}

// Partner access log interfaces
export interface PartnerAccessLog {
  id: string
  partner_id: string
  patient_id?: string
  operation: string
  endpoint: string
  request_data: Record<string, any>
  response_data: Record<string, any>
  status_code: number
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
  created_at: string
}

export interface CreatePartnerAccessLogData {
  partner_id: string
  patient_id?: string
  operation: string
  endpoint: string
  request_data?: Record<string, any>
  response_data?: Record<string, any>
  status_code: number
  ip_address?: string
  user_agent?: string
  success: boolean
  error_message?: string
}

// Notification interfaces
export interface NotificationTemplate {
  id: string
  name: string
  type: NotificationType
  channel: NotificationChannel
  subject: string
  body: string
  variables: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface CreateNotificationTemplateData {
  name: string
  type: NotificationType
  channel: NotificationChannel
  subject: string
  body: string
  variables?: string[]
  active?: boolean
}

export interface UpdateNotificationTemplateData {
  name?: string
  type?: NotificationType
  channel?: NotificationChannel
  subject?: string
  body?: string
  variables?: string[]
  active?: boolean
}

export interface UserNotificationPreferences {
  id: string
  user_id?: string
  patient_id?: string
  appointment_reminders_enabled: boolean
  appointment_reminders_channel: NotificationChannel
  reminder_hours_before: number
  payment_reminders_enabled: boolean
  custom_notifications_enabled: boolean
  created_at: string
  updated_at: string
}

export interface CreateUserNotificationPreferencesData {
  user_id?: string
  patient_id?: string
  appointment_reminders_enabled?: boolean
  appointment_reminders_channel?: NotificationChannel
  reminder_hours_before?: number
  payment_reminders_enabled?: boolean
  custom_notifications_enabled?: boolean
}

export interface UpdateUserNotificationPreferencesData {
  appointment_reminders_enabled?: boolean
  appointment_reminders_channel?: NotificationChannel
  reminder_hours_before?: number
  payment_reminders_enabled?: boolean
  custom_notifications_enabled?: boolean
}

export interface Notification {
  id: string
  type: NotificationType
  channel: NotificationChannel
  recipient_email?: string
  recipient_phone?: string
  subject: string
  body: string
  status: NotificationStatus
  scheduled_at: string
  sent_at?: string
  error_message?: string
  retry_count: number
  max_retries: number
  appointment_id?: string
  patient_id?: string
  user_id?: string
  template_id?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface CreateNotificationData {
  type: NotificationType
  channel: NotificationChannel
  recipient_email?: string
  recipient_phone?: string
  subject: string
  body: string
  status?: NotificationStatus
  scheduled_at?: string
  appointment_id?: string
  patient_id?: string
  user_id?: string
  template_id?: string
  metadata?: Record<string, any>
}

export interface UpdateNotificationData {
  status?: NotificationStatus
  sent_at?: string
  error_message?: string
  retry_count?: number
}

// Database schema type for Supabase
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: CreateUserData
        Update: UpdateUserData
      }
      patients: {
        Row: Patient
        Insert: CreatePatientData
        Update: UpdatePatientData
      }
      medical_records: {
        Row: MedicalRecord
        Insert: CreateMedicalRecordData
        Update: UpdateMedicalRecordData
      }
      appointments: {
        Row: Appointment
        Insert: CreateAppointmentData
        Update: UpdateAppointmentData
      }
      attachments: {
        Row: Attachment
        Insert: CreateAttachmentData
        Update: Partial<CreateAttachmentData>
      }
      invoices: {
        Row: Invoice
        Insert: CreateInvoiceData
        Update: UpdateInvoiceData
      }
      integration_logs: {
        Row: IntegrationLog
        Insert: CreateIntegrationLogData
        Update: Partial<CreateIntegrationLogData>
      }
      payments: {
        Row: Payment
        Insert: CreatePaymentData
        Update: UpdatePaymentData
      }
      payment_installments: {
        Row: PaymentInstallment
        Insert: Omit<PaymentInstallment, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<PaymentInstallment>
      }
      service_prices: {
        Row: ServicePrice
        Insert: CreateServicePriceData
        Update: UpdateServicePriceData
      }
      financial_transactions: {
        Row: FinancialTransaction
        Insert: CreateFinancialTransactionData
        Update: Partial<CreateFinancialTransactionData>
      }
      digital_signatures: {
        Row: DigitalSignature
        Insert: CreateDigitalSignatureData
        Update: UpdateDigitalSignatureData
      }
      external_partners: {
        Row: ExternalPartner
        Insert: CreateExternalPartnerData
        Update: UpdateExternalPartnerData
      }
      prescription_shares: {
        Row: PrescriptionShare
        Insert: CreatePrescriptionShareData
        Update: UpdatePrescriptionShareData
      }
      partner_access_logs: {
        Row: PartnerAccessLog
        Insert: CreatePartnerAccessLogData
        Update: Partial<CreatePartnerAccessLogData>
      }
      notification_templates: {
        Row: NotificationTemplate
        Insert: CreateNotificationTemplateData
        Update: UpdateNotificationTemplateData
      }
      user_notification_preferences: {
        Row: UserNotificationPreferences
        Insert: CreateUserNotificationPreferencesData
        Update: UpdateUserNotificationPreferencesData
      }
      notifications: {
        Row: Notification
        Insert: CreateNotificationData
        Update: UpdateNotificationData
      }
    }
    Enums: {
      user_role: UserRole
      appointment_status: AppointmentStatus
      payment_status: PaymentStatus
      payment_method: PaymentMethod
      invoice_status: InvoiceStatus
      signature_status: SignatureStatus
      partner_type: PartnerType
      partner_status: PartnerStatus
      prescription_status: PrescriptionStatus
      notification_type: NotificationType
      notification_channel: NotificationChannel
      notification_status: NotificationStatus
    }
  }
}