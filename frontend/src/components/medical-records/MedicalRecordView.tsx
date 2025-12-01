import React, { useState, useEffect } from 'react'
import { MedicalRecord, Attachment } from '../../types/database'
import { Patient } from '../../services/patient-central'
import { medicalRecordsService } from '../../services/medical-records'
import { useToast } from '../../contexts/ToastContext'
import { DigitalSignatureInterface } from '../digital-signature/DigitalSignatureInterface'
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  User, 
  FileText, 
  Activity,
  Eye,
  Download,
  Image,
  File,
  Stethoscope,
  Clipboard,
  Pill
} from 'lucide-react'

interface MedicalRecordViewProps {
  record: MedicalRecord
  patient: Patient
  onEdit: () => void
  onBack: () => void
}

export function MedicalRecordView({ record, patient, onEdit, onBack }: MedicalRecordViewProps) {
  const { showToast } = useToast()
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [loadingAttachments, setLoadingAttachments] = useState(true)

  useEffect(() => {
    loadAttachments()
  }, [record.id])

  const loadAttachments = async () => {
    try {
      setLoadingAttachments(true)
      const attachmentList = await medicalRecordsService.getAttachmentsByRecordId(record.id)
      setAttachments(attachmentList)
    } catch (error) {
      console.error('Error loading attachments:', error)
      showToast('error', 'Erro ao carregar anexos')
    } finally {
      setLoadingAttachments(false)
    }
  }

  const handleDownload = async (attachment: Attachment) => {
    try {
      const { downloadUrl, filename } = await medicalRecordsService.getAttachmentDownloadUrl(attachment.id)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
    } catch (error) {
      console.error('Error downloading file:', error)
      showToast('error', 'Erro ao baixar arquivo')
    }
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatDateTime = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="w-4 h-4 text-blue-500" />
    } else if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />
    } else {
      return <File className="w-4 h-4 text-gray-500" />
    }
  }

  const formatFileSize = (bytes: number): string => {
    return medicalRecordsService.formatFileSize(bytes)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>
            
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Consulta - {formatDate(record.consultation_date)}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span>{patient.name}</span>
                </div>
                {(record as any).doctor && (
                  <div className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    <span>Dr. {(record as any).doctor.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <span>Criado em {formatDateTime(record.created_at)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={onEdit}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Data da Consulta</h3>
              <p className="text-gray-700">{formatDate(record.consultation_date)}</p>
            </div>
            
            {record.follow_up_date && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Data de Retorno</h3>
                <p className="text-gray-700">{formatDate(record.follow_up_date)}</p>
              </div>
            )}
          </div>

          {/* Chief Complaint */}
          {record.chief_complaint && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Clipboard className="w-5 h-5 text-primary-600" />
                Queixa Principal
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{record.chief_complaint}</p>
              </div>
            </div>
          )}

          {/* Anamnesis */}
          {record.anamnesis && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Anamnese
              </h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{record.anamnesis}</p>
              </div>
            </div>
          )}

          {/* Physical Examination */}
          {record.physical_exam && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                Exame Físico Oftalmológico
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Visual Acuity */}
                {record.physical_exam.visualAcuity && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      Acuidade Visual
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Olho Direito (OD):</span>
                        <span className="font-medium">
                          {record.physical_exam.visualAcuity.rightEye || '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Olho Esquerdo (OE):</span>
                        <span className="font-medium">
                          {record.physical_exam.visualAcuity.leftEye || '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Intraocular Pressure */}
                {record.physical_exam.intraocularPressure && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Pressão Intraocular
                    </h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Olho Direito (OD):</span>
                        <span className="font-medium">
                          {record.physical_exam.intraocularPressure.rightEye || 0} mmHg
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Olho Esquerdo (OE):</span>
                        <span className="font-medium">
                          {record.physical_exam.intraocularPressure.leftEye || 0} mmHg
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Fundoscopy and Biomicroscopy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {record.physical_exam.fundoscopy && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Fundoscopia
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {record.physical_exam.fundoscopy}
                    </p>
                  </div>
                )}

                {record.physical_exam.biomicroscopy && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">
                      Biomicroscopia
                    </h4>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {record.physical_exam.biomicroscopy}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnosis */}
          {record.diagnosis && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Diagnóstico
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{record.diagnosis}</p>
              </div>
            </div>
          )}

          {/* Prescription */}
          {record.prescription && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3 flex items-center gap-2">
                <Pill className="w-5 h-5 text-primary-600" />
                Prescrição / Conduta
              </h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{record.prescription}</p>
              </div>
            </div>
          )}

          {/* Attachments */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Anexos
            </h3>
            
            {loadingAttachments ? (
              <div className="flex items-center justify-center py-8 bg-gray-50 rounded-lg">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                <span className="ml-2 text-gray-600">Carregando anexos...</span>
              </div>
            ) : attachments.length > 0 ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="space-y-3">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                    >
                      <div className="flex items-center space-x-3">
                        {getFileIcon(attachment.mime_type)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {attachment.filename}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span>{formatFileSize(attachment.file_size)}</span>
                            <span>•</span>
                            <span>{formatDateTime(attachment.created_at)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDownload(attachment)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Baixar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <FileText className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-gray-600">Nenhum anexo encontrado</p>
              </div>
            )}
          </div>

          {/* Digital Signature */}
          <div>
            <DigitalSignatureInterface record={record} />
          </div>
        </div>
      </div>
    </div>
  )
}