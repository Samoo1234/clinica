import { supabase } from '../config/supabase'
import { 
  ExternalPartner, 
  CreateExternalPartnerData, 
  UpdateExternalPartnerData,
  PrescriptionShare,
  CreatePrescriptionShareData,
  UpdatePrescriptionShareData,
  PartnerAccessLog,
  CreatePartnerAccessLogData,
  Patient,
  MedicalRecord
} from '../types/database'
import crypto from 'crypto'

export class ExternalIntegrationService {
  // Partner management
  async createPartner(data: CreateExternalPartnerData): Promise<ExternalPartner> {
    // Generate API credentials
    const apiKey = crypto.randomBytes(32).toString('hex')
    const apiSecret = crypto.randomBytes(64).toString('hex')

    const { data: partner, error } = await supabase
      .from('external_partners')
      .insert({
        ...data,
        api_key: apiKey,
        api_secret: apiSecret,
        status: 'active'
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create partner: ${error.message}`)
    }

    return partner
  }

  async getPartners(): Promise<ExternalPartner[]> {
    const { data: partners, error } = await supabase
      .from('external_partners')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch partners: ${error.message}`)
    }

    return partners || []
  }

  async getPartnerById(id: string): Promise<ExternalPartner | null> {
    const { data: partner, error } = await supabase
      .from('external_partners')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch partner: ${error.message}`)
    }

    return partner
  }

  async getPartnerByApiKey(apiKey: string): Promise<ExternalPartner | null> {
    const { data: partner, error } = await supabase
      .from('external_partners')
      .select('*')
      .eq('api_key', apiKey)
      .eq('status', 'active')
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to authenticate partner: ${error.message}`)
    }

    return partner
  }

  async updatePartner(id: string, data: UpdateExternalPartnerData): Promise<ExternalPartner> {
    const { data: partner, error } = await supabase
      .from('external_partners')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update partner: ${error.message}`)
    }

    return partner
  }

  async deletePartner(id: string): Promise<void> {
    const { error } = await supabase
      .from('external_partners')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete partner: ${error.message}`)
    }
  }

  // Partner authentication
  async authenticatePartner(apiKey: string, apiSecret: string): Promise<ExternalPartner | null> {
    const partner = await this.getPartnerByApiKey(apiKey)
    
    if (!partner || partner.api_secret !== apiSecret) {
      return null
    }

    return partner
  }

  async validatePartnerPermission(partnerId: string, permission: string): Promise<boolean> {
    const partner = await this.getPartnerById(partnerId)
    
    if (!partner || partner.status !== 'active') {
      return false
    }

    return partner.permissions[permission] === true
  }

  // Patient data sharing
  async getPatientForPartner(partnerId: string, patientId: string): Promise<Patient | null> {
    // Validate partner has permission to access patient data
    const hasPermission = await this.validatePartnerPermission(partnerId, 'patient_access')
    if (!hasPermission) {
      throw new Error('Partner does not have permission to access patient data')
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to fetch patient: ${error.message}`)
    }

    return patient
  }

  async searchPatientForPartner(partnerId: string, cpf: string): Promise<Patient | null> {
    // Validate partner has permission to search patients
    const hasPermission = await this.validatePartnerPermission(partnerId, 'patient_search')
    if (!hasPermission) {
      throw new Error('Partner does not have permission to search patients')
    }

    const { data: patient, error } = await supabase
      .from('patients')
      .select('*')
      .eq('cpf', cpf)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to search patient: ${error.message}`)
    }

    return patient
  }

  // Prescription sharing
  async sharePrescription(data: CreatePrescriptionShareData): Promise<PrescriptionShare> {
    // Validate partner has permission to receive prescriptions
    const hasPermission = await this.validatePartnerPermission(data.partner_id, 'prescription_access')
    if (!hasPermission) {
      throw new Error('Partner does not have permission to receive prescriptions')
    }

    const { data: share, error } = await supabase
      .from('prescription_shares')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to share prescription: ${error.message}`)
    }

    // Send webhook notification if partner has webhook URL
    const partner = await this.getPartnerById(data.partner_id)
    if (partner?.webhook_url) {
      await this.sendWebhookNotification(partner.webhook_url, {
        event: 'prescription_shared',
        data: share
      })
    }

    return share
  }

  async getPrescriptionShares(partnerId: string): Promise<PrescriptionShare[]> {
    const { data: shares, error } = await supabase
      .from('prescription_shares')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch prescription shares: ${error.message}`)
    }

    return shares || []
  }

  async confirmPrescriptionDispensing(
    shareId: string, 
    dispensedBy: string, 
    notes?: string
  ): Promise<PrescriptionShare> {
    const { data: share, error } = await supabase
      .from('prescription_shares')
      .update({
        status: 'dispensed',
        dispensed_at: new Date().toISOString(),
        dispensed_by: dispensedBy,
        notes
      })
      .eq('id', shareId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to confirm dispensing: ${error.message}`)
    }

    return share
  }

  // Access logging
  async logPartnerAccess(data: CreatePartnerAccessLogData): Promise<PartnerAccessLog> {
    const { data: log, error } = await supabase
      .from('partner_access_logs')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to log partner access: ${error.message}`)
    }

    return log
  }

  async getPartnerAccessLogs(
    partnerId: string, 
    limit: number = 100
  ): Promise<PartnerAccessLog[]> {
    const { data: logs, error } = await supabase
      .from('partner_access_logs')
      .select('*')
      .eq('partner_id', partnerId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch access logs: ${error.message}`)
    }

    return logs || []
  }

  // Webhook notifications
  private async sendWebhookNotification(webhookUrl: string, payload: any): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VisionCare-Integration/1.0'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        console.error(`Webhook notification failed: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to send webhook notification:', error)
    }
  }

  // Integration statistics
  async getIntegrationStats(partnerId: string): Promise<{
    totalRequests: number
    successfulRequests: number
    failedRequests: number
    prescriptionsShared: number
    prescriptionsDispensed: number
  }> {
    const [accessLogs, prescriptionShares] = await Promise.all([
      supabase
        .from('partner_access_logs')
        .select('success')
        .eq('partner_id', partnerId),
      supabase
        .from('prescription_shares')
        .select('status')
        .eq('partner_id', partnerId)
    ])

    const logs = accessLogs.data || []
    const shares = prescriptionShares.data || []

    return {
      totalRequests: logs.length,
      successfulRequests: logs.filter(log => log.success).length,
      failedRequests: logs.filter(log => !log.success).length,
      prescriptionsShared: shares.length,
      prescriptionsDispensed: shares.filter(share => share.status === 'dispensed').length
    }
  }
}

export const externalIntegrationService = new ExternalIntegrationService()