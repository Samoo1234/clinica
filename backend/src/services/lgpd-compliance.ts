import { supabaseAdmin } from '../config/supabase'
import { AuditService } from './audit'
import { User } from '../types/database'

export interface DataRetentionPolicy {
  table_name: string
  retention_days: number
  anonymize_after_days?: number
  delete_after_days: number
  conditions?: any
}

export interface DataSubjectRequest {
  id?: string
  patient_id: string
  request_type: 'ACCESS' | 'RECTIFICATION' | 'ERASURE' | 'PORTABILITY' | 'RESTRICTION'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'
  requested_by: string
  requested_at: string
  completed_at?: string
  notes?: string
  data_provided?: any
}

/**
 * LGPD Compliance service for data protection and privacy
 */
export class LGPDComplianceService {
  private static readonly DEFAULT_POLICIES: DataRetentionPolicy[] = [
    {
      table_name: 'audit_logs',
      retention_days: 2555, // 7 years for audit logs
      delete_after_days: 2555
    },
    {
      table_name: 'medical_records',
      retention_days: 7300, // 20 years for medical records
      anonymize_after_days: 5475, // 15 years
      delete_after_days: 7300
    },
    {
      table_name: 'appointments',
      retention_days: 1825, // 5 years for appointments
      anonymize_after_days: 1095, // 3 years
      delete_after_days: 1825
    },
    {
      table_name: 'invoices',
      retention_days: 1825, // 5 years for financial records
      delete_after_days: 1825
    },
    {
      table_name: 'integration_logs',
      retention_days: 365, // 1 year for integration logs
      delete_after_days: 365
    }
  ]

  /**
   * Apply data retention policies
   */
  static async applyRetentionPolicies(user: User): Promise<{ 
    processed: number, 
    anonymized: number, 
    deleted: number, 
    error?: string 
  }> {
    try {
      let totalProcessed = 0
      let totalAnonymized = 0
      let totalDeleted = 0

      for (const policy of this.DEFAULT_POLICIES) {
        const result = await this.applyPolicyToTable(policy, user)
        totalProcessed += result.processed
        totalAnonymized += result.anonymized
        totalDeleted += result.deleted
      }

      // Log the retention policy execution
      await AuditService.log({
        user,
        action: 'SYSTEM',
        resourceType: 'SYSTEM',
        metadata: {
          operation: 'DATA_RETENTION_POLICY',
          processed: totalProcessed,
          anonymized: totalAnonymized,
          deleted: totalDeleted
        }
      })

      return {
        processed: totalProcessed,
        anonymized: totalAnonymized,
        deleted: totalDeleted
      }
    } catch (error: any) {
      return {
        processed: 0,
        anonymized: 0,
        deleted: 0,
        error: error.message
      }
    }
  }

  /**
   * Apply retention policy to a specific table
   */
  private static async applyPolicyToTable(
    policy: DataRetentionPolicy, 
    user: User
  ): Promise<{ processed: number, anonymized: number, deleted: number }> {
    const now = new Date()
    let processed = 0
    let anonymized = 0
    let deleted = 0

    // Calculate cutoff dates
    const anonymizeCutoff = new Date()
    if (policy.anonymize_after_days) {
      anonymizeCutoff.setDate(now.getDate() - policy.anonymize_after_days)
    }

    const deleteCutoff = new Date()
    deleteCutoff.setDate(now.getDate() - policy.delete_after_days)

    try {
      // First, anonymize old records if policy specifies
      if (policy.anonymize_after_days && policy.table_name !== 'audit_logs') {
        const anonymizeResult = await this.anonymizeOldRecords(
          policy.table_name,
          anonymizeCutoff,
          deleteCutoff
        )
        anonymized = anonymizeResult.count
        processed += anonymized
      }

      // Then, delete very old records
      const deleteResult = await this.deleteOldRecords(
        policy.table_name,
        deleteCutoff,
        policy.conditions
      )
      deleted = deleteResult.count
      processed += deleted

    } catch (error) {
      console.error(`Error applying policy to ${policy.table_name}:`, error)
    }

    return { processed, anonymized, deleted }
  }

  /**
   * Anonymize old records
   */
  private static async anonymizeOldRecords(
    tableName: string,
    cutoffDate: Date,
    deleteCutoff: Date
  ): Promise<{ count: number }> {
    try {
      let updateData: any = {}

      // Define anonymization rules per table
      switch (tableName) {
        case 'patients':
          updateData = {
            name: 'ANONIMIZADO',
            email: null,
            phone: null,
            address: null,
            emergency_contact: null,
            updated_at: new Date().toISOString()
          }
          break
        case 'medical_records':
          updateData = {
            anamnesis: 'DADOS ANONIMIZADOS',
            physical_exam: null,
            diagnosis: 'DADOS ANONIMIZADOS',
            prescription: 'DADOS ANONIMIZADOS',
            vital_signs: null,
            updated_at: new Date().toISOString()
          }
          break
        case 'appointments':
          updateData = {
            notes: 'DADOS ANONIMIZADOS',
            updated_at: new Date().toISOString()
          }
          break
        default:
          return { count: 0 }
      }

      const { data, error } = await supabaseAdmin
        .from(tableName)
        .update(updateData)
        .lt('created_at', cutoffDate.toISOString())
        .gte('created_at', deleteCutoff.toISOString())
        .select('id')

      if (error) {
        console.error(`Error anonymizing ${tableName}:`, error)
        return { count: 0 }
      }

      return { count: data?.length || 0 }
    } catch (error) {
      console.error(`Error anonymizing ${tableName}:`, error)
      return { count: 0 }
    }
  }

  /**
   * Delete old records
   */
  private static async deleteOldRecords(
    tableName: string,
    cutoffDate: Date,
    conditions?: any
  ): Promise<{ count: number }> {
    try {
      let query = supabaseAdmin
        .from(tableName)
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (conditions) {
        Object.keys(conditions).forEach(key => {
          query = query.eq(key, conditions[key])
        })
      }

      const { data, error } = await query.select('id')

      if (error) {
        console.error(`Error deleting from ${tableName}:`, error)
        return { count: 0 }
      }

      return { count: data?.length || 0 }
    } catch (error) {
      console.error(`Error deleting from ${tableName}:`, error)
      return { count: 0 }
    }
  }

  /**
   * Handle data subject access request
   */
  static async handleAccessRequest(
    patientId: string,
    requestedBy: string,
    user: User
  ): Promise<{ data?: any, error?: string }> {
    try {
      // Get all patient data
      const { data: patient, error: patientError } = await supabaseAdmin
        .from('patients')
        .select('*')
        .eq('id', patientId)
        .single()

      if (patientError || !patient) {
        return { error: 'Patient not found' }
      }

      // Get medical records
      const { data: medicalRecords } = await supabaseAdmin
        .from('medical_records')
        .select('*')
        .eq('patient_id', patientId)

      // Get appointments
      const { data: appointments } = await supabaseAdmin
        .from('appointments')
        .select('*')
        .eq('patient_id', patientId)

      // Get invoices
      const { data: invoices } = await supabaseAdmin
        .from('invoices')
        .select('*')
        .in('appointment_id', appointments?.map(a => a.id) || [])

      const patientData = {
        personal_data: patient,
        medical_records: medicalRecords || [],
        appointments: appointments || [],
        invoices: invoices || [],
        generated_at: new Date().toISOString()
      }

      // Log the access request
      await AuditService.log({
        user,
        action: 'DATA_ACCESS',
        resourceType: 'PATIENT',
        resourceId: patientId,
        metadata: {
          request_type: 'ACCESS',
          requested_by: requestedBy,
          data_provided: true
        }
      })

      // Record the request
      await supabaseAdmin
        .from('data_subject_requests')
        .insert([{
          patient_id: patientId,
          request_type: 'ACCESS',
          status: 'COMPLETED',
          requested_by: requestedBy,
          requested_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          data_provided: patientData
        }])

      return { data: patientData }
    } catch (error: any) {
      return { error: error.message }
    }
  }

  /**
   * Handle data subject erasure request (Right to be forgotten)
   */
  static async handleErasureRequest(
    patientId: string,
    requestedBy: string,
    user: User,
    justification?: string
  ): Promise<{ success: boolean, error?: string }> {
    try {
      // Check if patient has active medical records that need to be retained
      const { data: recentRecords } = await supabaseAdmin
        .from('medical_records')
        .select('id, consultation_date')
        .eq('patient_id', patientId)
        .gte('consultation_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString())

      if (recentRecords && recentRecords.length > 0) {
        // Cannot delete recent medical records - anonymize instead
        await this.anonymizePatientData(patientId, user)
        
        await supabaseAdmin
          .from('data_subject_requests')
          .insert([{
            patient_id: patientId,
            request_type: 'ERASURE',
            status: 'COMPLETED',
            requested_by: requestedBy,
            requested_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            notes: 'Data anonymized due to legal retention requirements'
          }])

        return { success: true }
      }

      // Delete all patient data
      await this.deletePatientData(patientId, user)

      // Record the request
      await supabaseAdmin
        .from('data_subject_requests')
        .insert([{
          patient_id: patientId,
          request_type: 'ERASURE',
          status: 'COMPLETED',
          requested_by: requestedBy,
          requested_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          notes: justification || 'Complete data erasure performed'
        }])

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  }

  /**
   * Anonymize patient data
   */
  private static async anonymizePatientData(patientId: string, user: User): Promise<void> {
    // Anonymize patient record
    await supabaseAdmin
      .from('patients')
      .update({
        name: 'PACIENTE ANONIMIZADO',
        cpf: 'ANONIMIZADO',
        email: null,
        phone: null,
        address: null,
        emergency_contact: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', patientId)

    // Anonymize medical records
    await supabaseAdmin
      .from('medical_records')
      .update({
        anamnesis: 'DADOS ANONIMIZADOS',
        physical_exam: null,
        diagnosis: 'DADOS ANONIMIZADOS',
        prescription: 'DADOS ANONIMIZADOS',
        vital_signs: null,
        updated_at: new Date().toISOString()
      })
      .eq('patient_id', patientId)

    // Log the anonymization
    await AuditService.log({
      user,
      action: 'UPDATE',
      resourceType: 'PATIENT',
      resourceId: patientId,
      metadata: {
        operation: 'ANONYMIZATION',
        reason: 'LGPD_ERASURE_REQUEST'
      }
    })
  }

  /**
   * Delete patient data completely
   */
  private static async deletePatientData(patientId: string, user: User): Promise<void> {
    // Delete in correct order due to foreign key constraints
    
    // Delete attachments first
    const { data: medicalRecords } = await supabaseAdmin
      .from('medical_records')
      .select('id')
      .eq('patient_id', patientId)

    if (medicalRecords) {
      for (const record of medicalRecords) {
        await supabaseAdmin
          .from('attachments')
          .delete()
          .eq('record_id', record.id)
      }
    }

    // Delete invoices
    const { data: appointments } = await supabaseAdmin
      .from('appointments')
      .select('id')
      .eq('patient_id', patientId)

    if (appointments) {
      for (const appointment of appointments) {
        await supabaseAdmin
          .from('invoices')
          .delete()
          .eq('appointment_id', appointment.id)
      }
    }

    // Delete medical records
    await supabaseAdmin
      .from('medical_records')
      .delete()
      .eq('patient_id', patientId)

    // Delete appointments
    await supabaseAdmin
      .from('appointments')
      .delete()
      .eq('patient_id', patientId)

    // Delete patient
    await supabaseAdmin
      .from('patients')
      .delete()
      .eq('id', patientId)

    // Log the deletion
    await AuditService.log({
      user,
      action: 'DELETE',
      resourceType: 'PATIENT',
      resourceId: patientId,
      metadata: {
        operation: 'COMPLETE_ERASURE',
        reason: 'LGPD_ERASURE_REQUEST'
      }
    })
  }

  /**
   * Get data subject requests
   */
  static async getDataSubjectRequests(params: {
    patientId?: string
    requestType?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<{ requests: DataSubjectRequest[], total: number, error?: string }> {
    try {
      let query = supabaseAdmin
        .from('data_subject_requests')
        .select('*', { count: 'exact' })
        .order('requested_at', { ascending: false })

      if (params.patientId) {
        query = query.eq('patient_id', params.patientId)
      }

      if (params.requestType) {
        query = query.eq('request_type', params.requestType)
      }

      if (params.status) {
        query = query.eq('status', params.status)
      }

      if (params.limit) {
        query = query.limit(params.limit)
      }

      if (params.offset) {
        query = query.range(params.offset, params.offset + (params.limit || 50) - 1)
      }

      const { data, error, count } = await query

      if (error) {
        return { requests: [], total: 0, error: error.message }
      }

      return { requests: data || [], total: count || 0 }
    } catch (error: any) {
      return { requests: [], total: 0, error: error.message }
    }
  }
}