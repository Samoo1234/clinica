import React, { useState, useEffect, useCallback } from 'react'
import { Patient, MedicalRecord, PhysicalExam } from '../../types/database'
import { medicalRecordsService, CreateMedicalRecordData, UpdateMedicalRecordData } from '../../services/medical-records'
import { useAuth } from '../../contexts/SimpleAuthContext'
import { useToast } from '../../contexts/ToastContext'
import { AttachmentUpload } from './AttachmentUpload'
import { DigitalSignatureInterface } from '../digital-signature/DigitalSignatureInterface'
import { 
  Save, 
  X, 
  Eye, 
  EyeOff, 
  Activity, 
  FileText,
  Calendar,
  User,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { debounce } from 'lodash'

interface MedicalRecordFormProps {
  patient: Patient
  record?: MedicalRecord | null
  onSave: (record: MedicalRecord) => void
  onCancel: () => void
}

interface FormData {
  consultation_date: string
  chief_complaint: string
  anamnesis: string
  physical_exam: PhysicalExam
  diagnosis: string
  prescription: string
  follow_up_date: string
}

export function MedicalRecordForm({ patient, record, onSave, onCancel }: MedicalRecordFormProps) {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState<FormData>({
    consultation_date: new Date().toISOString().split('T')[0],
    chief_complaint: '',
    anamnesis: '',
    physical_exam: medicalRecordsService.createDefaultPhysicalExam(),
    diagnosis: '',
    prescription: '',
    follow_up_date: ''
  })
  
  const [loading, setLoading] = useState(false)
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [recordId, setRecordId] = useState<string | null>(record?.id || null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Initialize form with existing record data
  useEffect(() => {
    if (record) {
      setFormData({
        consultation_date: record.consultation_date,
        chief_complaint: record.chief_complaint || '',
        anamnesis: record.anamnesis || '',
        physical_exam: record.physical_exam || medicalRecordsService.createDefaultPhysicalExam(),
        diagnosis: record.diagnosis || '',
        prescription: record.prescription || '',
        follow_up_date: record.follow_up_date || ''
      })
      setRecordId(record.id)
    }
  }, [record])

  // Auto-save functionality
  const autoSave = useCallback(
    debounce(async (data: FormData, currentRecordId: string | null) => {
      if (!user || autoSaveStatus === 'saving') return

      try {
        setAutoSaveStatus('saving')
        
        if (currentRecordId) {
          // Update existing record
          const updateData: UpdateMedicalRecordData = {
            chief_complaint: data.chief_complaint,
            anamnesis: data.anamnesis,
            physical_exam: data.physical_exam,
            diagnosis: data.diagnosis,
            prescription: data.prescription,
            follow_up_date: data.follow_up_date || undefined
          }
          
          await medicalRecordsService.updateMedicalRecord(currentRecordId, updateData)
        } else {
          // Create new record
          const createData: CreateMedicalRecordData = {
            patient_id: patient.id,
            doctor_id: user.id,
            consultation_date: data.consultation_date,
            chief_complaint: data.chief_complaint,
            anamnesis: data.anamnesis,
            physical_exam: data.physical_exam,
            diagnosis: data.diagnosis,
            prescription: data.prescription,
            follow_up_date: data.follow_up_date || undefined
          }
          
          const newRecord = await medicalRecordsService.createMedicalRecord(createData)
          setRecordId(newRecord.id)
        }
        
        setAutoSaveStatus('saved')
        setHasUnsavedChanges(false)
        
        // Reset status after 2 seconds
        setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 2000)
        
      } catch (error) {
        console.error('Auto-save error:', error)
        setAutoSaveStatus('error')
        setTimeout(() => {
          setAutoSaveStatus('idle')
        }, 3000)
      }
    }, 2000),
    [user, patient.id, autoSaveStatus]
  )

  // Trigger auto-save when form data changes
  useEffect(() => {
    if (hasUnsavedChanges) {
      autoSave(formData, recordId)
    }
    
    return () => {
      autoSave.cancel()
    }
  }, [formData, recordId, hasUnsavedChanges, autoSave])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }

  const handlePhysicalExamChange = (field: keyof PhysicalExam, value: any) => {
    setFormData(prev => ({
      ...prev,
      physical_exam: {
        ...prev.physical_exam,
        [field]: value
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleVisualAcuityChange = (eye: 'rightEye' | 'leftEye', value: string) => {
    setFormData(prev => ({
      ...prev,
      physical_exam: {
        ...prev.physical_exam,
        visualAcuity: {
          ...prev.physical_exam.visualAcuity,
          [eye]: value
        }
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleIntraocularPressureChange = (eye: 'rightEye' | 'leftEye', value: string) => {
    const numValue = parseFloat(value) || 0
    setFormData(prev => ({
      ...prev,
      physical_exam: {
        ...prev.physical_exam,
        intraocularPressure: {
          ...prev.physical_exam.intraocularPressure,
          [eye]: numValue
        }
      }
    }))
    setHasUnsavedChanges(true)
  }

  const handleSave = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      let savedRecord: MedicalRecord
      
      if (recordId) {
        // Update existing record
        const updateData: UpdateMedicalRecordData = {
          chief_complaint: formData.chief_complaint,
          anamnesis: formData.anamnesis,
          physical_exam: formData.physical_exam,
          diagnosis: formData.diagnosis,
          prescription: formData.prescription,
          follow_up_date: formData.follow_up_date || undefined
        }
        
        savedRecord = await medicalRecordsService.updateMedicalRecord(recordId, updateData)
      } else {
        // Create new record
        const createData: CreateMedicalRecordData = {
          patient_id: patient.id,
          doctor_id: user.id,
          consultation_date: formData.consultation_date,
          chief_complaint: formData.chief_complaint,
          anamnesis: formData.anamnesis,
          physical_exam: formData.physical_exam,
          diagnosis: formData.diagnosis,
          prescription: formData.prescription,
          follow_up_date: formData.follow_up_date || undefined
        }
        
        savedRecord = await medicalRecordsService.createMedicalRecord(createData)
      }
      
      setHasUnsavedChanges(false)
      onSave(savedRecord)
      
    } catch (error) {
      console.error('Error saving record:', error)
      showToast('Erro ao salvar prontuário', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getAutoSaveIndicator = () => {
    switch (autoSaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-2 text-yellow-600">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600"></div>
            <span className="text-xs">Salvando...</span>
          </div>
        )
      case 'saved':
        return (
          <div className="flex items-center gap-1 text-green-600">
            <CheckCircle className="w-3 h-3" />
            <span className="text-xs">Salvo automaticamente</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center gap-1 text-red-600">
            <AlertCircle className="w-3 h-3" />
            <span className="text-xs">Erro ao salvar</span>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary-600" />
              {record ? 'Editar Consulta' : 'Nova Consulta'}
            </h2>
            <div className="flex items-center gap-4 mt-1">
              <div className="flex items-center gap-2 text-gray-600">
                <User className="w-4 h-4" />
                <span className="text-sm">{patient.name}</span>
              </div>
              {getAutoSaveIndicator()}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
            
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              Salvar
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data da Consulta *
              </label>
              <input
                type="date"
                value={formData.consultation_date}
                onChange={(e) => handleInputChange('consultation_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Retorno
              </label>
              <input
                type="date"
                value={formData.follow_up_date}
                onChange={(e) => handleInputChange('follow_up_date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Chief Complaint */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Queixa Principal
            </label>
            <textarea
              value={formData.chief_complaint}
              onChange={(e) => handleInputChange('chief_complaint', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Descreva a queixa principal do paciente..."
            />
          </div>

          {/* Anamnesis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Anamnese
            </label>
            <textarea
              value={formData.anamnesis}
              onChange={(e) => handleInputChange('anamnesis', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="História da doença atual, antecedentes pessoais e familiares..."
            />
          </div>

          {/* Physical Examination */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-600" />
              Exame Físico Oftalmológico
            </h3>
            
            <div className="space-y-6">
              {/* Visual Acuity */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Acuidade Visual
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Olho Direito (OD)
                    </label>
                    <input
                      type="text"
                      value={formData.physical_exam.visualAcuity?.rightEye || ''}
                      onChange={(e) => handleVisualAcuityChange('rightEye', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 20/20, 0.8, etc."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Olho Esquerdo (OE)
                    </label>
                    <input
                      type="text"
                      value={formData.physical_exam.visualAcuity?.leftEye || ''}
                      onChange={(e) => handleVisualAcuityChange('leftEye', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 20/20, 0.8, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Intraocular Pressure */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">
                  Pressão Intraocular (mmHg)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Olho Direito (OD)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={formData.physical_exam.intraocularPressure?.rightEye || ''}
                      onChange={(e) => handleIntraocularPressureChange('rightEye', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 15.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Olho Esquerdo (OE)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      value={formData.physical_exam.intraocularPressure?.leftEye || ''}
                      onChange={(e) => handleIntraocularPressureChange('leftEye', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="Ex: 15.5"
                    />
                  </div>
                </div>
              </div>

              {/* Fundoscopy */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Fundoscopia
                </h4>
                <textarea
                  value={formData.physical_exam.fundoscopy || ''}
                  onChange={(e) => handlePhysicalExamChange('fundoscopy', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Descreva os achados da fundoscopia..."
                />
              </div>

              {/* Biomicroscopy */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Biomicroscopia
                </h4>
                <textarea
                  value={formData.physical_exam.biomicroscopy || ''}
                  onChange={(e) => handlePhysicalExamChange('biomicroscopy', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Descreva os achados da biomicroscopia..."
                />
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnóstico
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) => handleInputChange('diagnosis', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Diagnóstico principal e diagnósticos diferenciais..."
            />
          </div>

          {/* Prescription */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prescrição / Conduta
            </label>
            <textarea
              value={formData.prescription}
              onChange={(e) => handleInputChange('prescription', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Medicações prescritas, orientações e condutas..."
            />
          </div>

          {/* Attachments */}
          {recordId && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Anexos
              </h3>
              <AttachmentUpload recordId={recordId} />
            </div>
          )}

          {/* Digital Signature - Only show if record exists and has prescription */}
          {recordId && formData.prescription && (
            <div>
              <DigitalSignatureInterface 
                record={{
                  id: recordId,
                  patient_id: patient.id,
                  doctor_id: user?.id || '',
                  consultation_date: formData.consultation_date,
                  chief_complaint: formData.chief_complaint,
                  anamnesis: formData.anamnesis,
                  physical_exam: formData.physical_exam,
                  diagnosis: formData.diagnosis,
                  prescription: formData.prescription,
                  follow_up_date: formData.follow_up_date,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}