import React, { useState, useEffect, useRef } from 'react'
import { MedicalRecord, Attachment } from '../../types/database'
import { Patient, PatientCentralService } from '../../services/patient-central'
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
  Pill,
  Printer,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Cake
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
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadAttachments()
  }, [record.id])

  // Função para imprimir o prontuário
  const handlePrint = () => {
    const printContent = printRef.current
    if (!printContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      showToast('error', 'Não foi possível abrir a janela de impressão. Verifique se pop-ups estão habilitados.')
      return
    }

    const styles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: Arial, sans-serif; 
          font-size: 12px; 
          line-height: 1.5; 
          color: #333;
          padding: 20px;
        }
        .print-header {
          text-align: center;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .print-header h1 { font-size: 18px; margin-bottom: 5px; }
        .print-header p { font-size: 11px; color: #666; }
        .patient-info {
          background: #f5f5f5;
          padding: 15px;
          border-radius: 5px;
          margin-bottom: 20px;
        }
        .patient-info h2 { font-size: 14px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
        .patient-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .patient-field { margin-bottom: 5px; }
        .patient-field label { font-weight: bold; color: #555; }
        .section { margin-bottom: 20px; page-break-inside: avoid; }
        .section h3 { 
          font-size: 13px; 
          background: #e0e0e0; 
          padding: 8px 10px; 
          margin-bottom: 10px;
          border-left: 4px solid #333;
        }
        .section-content { padding: 10px; background: #fafafa; border: 1px solid #eee; }
        .exam-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .exam-box { background: #fff; padding: 10px; border: 1px solid #ddd; }
        .exam-box h4 { font-size: 12px; margin-bottom: 8px; color: #444; }
        .exam-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
        .diagnosis-box { background: #e3f2fd; padding: 10px; border: 1px solid #90caf9; }
        .prescription-box { background: #e8f5e9; padding: 10px; border: 1px solid #a5d6a7; }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
        }
        .signature-line {
          margin-top: 60px;
          border-top: 1px solid #333;
          width: 250px;
          margin-left: auto;
          margin-right: auto;
          padding-top: 5px;
        }
        @media print {
          body { padding: 10px; }
          .no-print { display: none !important; }
        }
      </style>
    `

    const doctorName = (record as any).doctor?.name || 'Médico Responsável'
    const doctorCrm = (record as any).doctor?.crm || ''

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Prontuário - ${patient.name}</title>
          ${styles}
        </head>
        <body>
          <div class="print-header">
            <h1>PRONTUÁRIO MÉDICO OFTALMOLÓGICO</h1>
            <p>Vision Care - Clínica Oftalmológica</p>
          </div>

          <div class="patient-info">
            <h2>DADOS DO PACIENTE</h2>
            <div class="patient-grid">
              <div class="patient-field"><label>Nome:</label> ${patient.name}</div>
              <div class="patient-field"><label>CPF:</label> ${PatientCentralService.formatCPF(patient.cpf)}</div>
              <div class="patient-field"><label>Data de Nascimento:</label> ${patient.birth_date ? formatDate(patient.birth_date) : '-'}</div>
              <div class="patient-field"><label>Telefone:</label> ${patient.phone || '-'}</div>
              <div class="patient-field"><label>Email:</label> ${patient.email || '-'}</div>
              <div class="patient-field"><label>Endereço:</label> ${patient.address ? 
                [patient.address.street, patient.address.number, patient.address.neighborhood, patient.address.city, patient.address.state].filter(Boolean).join(', ') : '-'}</div>
              <div class="patient-field"><label>Idade:</label> ${patient.birth_date ? calcularIdade(patient.birth_date) : '-'}</div>
            </div>
          </div>

          <div class="section">
            <h3>INFORMAÇÕES DA CONSULTA</h3>
            <div class="section-content">
              <div class="patient-grid">
                <div class="patient-field"><label>Data da Consulta:</label> ${formatDate(record.consultation_date)}</div>
                <div class="patient-field"><label>Médico:</label> Dr(a). ${doctorName} ${doctorCrm ? `(CRM: ${doctorCrm})` : ''}</div>
                ${record.follow_up_date ? `<div class="patient-field"><label>Data de Retorno:</label> ${formatDate(record.follow_up_date)}</div>` : ''}
              </div>
            </div>
          </div>

          ${record.chief_complaint ? `
          <div class="section">
            <h3>QUEIXA PRINCIPAL</h3>
            <div class="section-content">${record.chief_complaint}</div>
          </div>
          ` : ''}

          ${record.anamnesis ? `
          <div class="section">
            <h3>ANAMNESE</h3>
            <div class="section-content">${record.anamnesis}</div>
          </div>
          ` : ''}

          ${record.physical_exam ? `
          <div class="section">
            <h3>EXAME FÍSICO OFTALMOLÓGICO</h3>
            <div class="exam-grid">
              ${record.physical_exam.visualAcuity ? `
              <div class="exam-box">
                <h4>Acuidade Visual</h4>
                <div class="exam-row"><span>OD:</span> <span>${record.physical_exam.visualAcuity.rightEye || '-'}</span></div>
                <div class="exam-row"><span>OE:</span> <span>${record.physical_exam.visualAcuity.leftEye || '-'}</span></div>
              </div>
              ` : ''}
              ${record.physical_exam.intraocularPressure ? `
              <div class="exam-box">
                <h4>Pressão Intraocular</h4>
                <div class="exam-row"><span>OD:</span> <span>${record.physical_exam.intraocularPressure.rightEye || 0} mmHg</span></div>
                <div class="exam-row"><span>OE:</span> <span>${record.physical_exam.intraocularPressure.leftEye || 0} mmHg</span></div>
              </div>
              ` : ''}
              ${record.physical_exam.fundoscopy ? `
              <div class="exam-box">
                <h4>Fundoscopia</h4>
                <p>${record.physical_exam.fundoscopy}</p>
              </div>
              ` : ''}
              ${record.physical_exam.biomicroscopy ? `
              <div class="exam-box">
                <h4>Biomicroscopia</h4>
                <p>${record.physical_exam.biomicroscopy}</p>
              </div>
              ` : ''}
            </div>
          </div>
          ` : ''}

          ${record.diagnosis ? `
          <div class="section">
            <h3>DIAGNÓSTICO</h3>
            <div class="diagnosis-box">${record.diagnosis}</div>
          </div>
          ` : ''}

          ${record.prescription ? `
          <div class="section">
            <h3>PRESCRIÇÃO / CONDUTA</h3>
            <div class="prescription-box">${record.prescription}</div>
          </div>
          ` : ''}

          <div class="footer">
            <div class="signature-line">
              Dr(a). ${doctorName}<br/>
              ${doctorCrm ? `CRM: ${doctorCrm}` : ''}
            </div>
            <p style="margin-top: 20px; font-size: 10px; color: #666;">
              Documento gerado em ${formatDateTime(new Date().toISOString())}
            </p>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()
    printWindow.focus()
    
    // Aguardar o carregamento antes de imprimir
    setTimeout(() => {
      printWindow.print()
    }, 250)
  }

  // Calcular idade do paciente
  const calcularIdade = (dataNascimento: string): number => {
    const hoje = new Date()
    const nascimento = new Date(dataNascimento)
    let idade = hoje.getFullYear() - nascimento.getFullYear()
    const mes = hoje.getMonth() - nascimento.getMonth()
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--
    }
    return idade
  }

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
      const downloadUrl = await medicalRecordsService.getAttachmentDownloadUrl(attachment.file_path)
      
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = attachment.filename
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
          
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onEdit}
              className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
          </div>
        </div>

        <div ref={printRef} className="space-y-6">
          {/* Patient Information Card */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-5 border border-blue-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Dados do Paciente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-xs text-gray-500">CPF</p>
                  <p className="font-medium text-gray-900">{PatientCentralService.formatCPF(patient.cpf)}</p>
                </div>
              </div>
              
              {patient.birth_date && (
                <div className="flex items-center gap-2">
                  <Cake className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Data de Nascimento / Idade</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(patient.birth_date)} ({calcularIdade(patient.birth_date)} anos)
                    </p>
                  </div>
                </div>
              )}
              
              {patient.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Telefone</p>
                    <p className="font-medium text-gray-900">{patient.phone}</p>
                  </div>
                </div>
              )}
              
              {patient.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="font-medium text-gray-900">{patient.email}</p>
                  </div>
                </div>
              )}
              
              {patient.address && (patient.address.street || patient.address.city) && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500">Endereço</p>
                    <p className="font-medium text-gray-900">
                      {[
                        patient.address.street,
                        patient.address.number,
                        patient.address.complement,
                        patient.address.neighborhood,
                        patient.address.city,
                        patient.address.state,
                        patient.address.zipCode
                      ].filter(Boolean).join(', ')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Consultation Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-500" />
                Data da Consulta
              </h3>
              <p className="text-gray-700 text-lg">{formatDate(record.consultation_date)}</p>
            </div>
            
            {(record as any).doctor && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-gray-500" />
                  Médico Responsável
                </h3>
                <p className="text-gray-700 text-lg">Dr(a). {(record as any).doctor.name}</p>
                {(record as any).doctor.crm && (
                  <p className="text-gray-500 text-sm">CRM: {(record as any).doctor.crm}</p>
                )}
              </div>
            )}
            
            {record.follow_up_date && (
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Data de Retorno
                </h3>
                <p className="text-amber-900 text-lg font-semibold">{formatDate(record.follow_up_date)}</p>
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

              {/* Refraction */}
              {(record.physical_exam.refractionOD || record.physical_exam.refractionOE) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {record.physical_exam.refractionOD && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Refração - Olho Direito (OD)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Esférico:</span>
                          <span className="font-medium">{record.physical_exam.refractionOD.spherical || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cilíndrico:</span>
                          <span className="font-medium">{record.physical_exam.refractionOD.cylindrical || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eixo:</span>
                          <span className="font-medium">{record.physical_exam.refractionOD.axis || '-'}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adição:</span>
                          <span className="font-medium">{record.physical_exam.refractionOD.addition || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DNP:</span>
                          <span className="font-medium">{record.physical_exam.refractionOD.dnp || '-'} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AV c/c:</span>
                          <span className="font-medium">{record.physical_exam.refractionOD.acuity || '-'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {record.physical_exam.refractionOE && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                        <Eye className="w-4 h-4" />
                        Refração - Olho Esquerdo (OE)
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Esférico:</span>
                          <span className="font-medium">{record.physical_exam.refractionOE.spherical || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cilíndrico:</span>
                          <span className="font-medium">{record.physical_exam.refractionOE.cylindrical || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Eixo:</span>
                          <span className="font-medium">{record.physical_exam.refractionOE.axis || '-'}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adição:</span>
                          <span className="font-medium">{record.physical_exam.refractionOE.addition || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DNP:</span>
                          <span className="font-medium">{record.physical_exam.refractionOE.dnp || '-'} mm</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">AV c/c:</span>
                          <span className="font-medium">{record.physical_exam.refractionOE.acuity || '-'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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

              {/* Other exams */}
              {(record.physical_exam.ocularMotility || record.physical_exam.pupillaryReflexes || record.physical_exam.visualField) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  {record.physical_exam.ocularMotility && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Motilidade Ocular</h4>
                      <p className="text-gray-700 text-sm">{record.physical_exam.ocularMotility}</p>
                    </div>
                  )}
                  {record.physical_exam.pupillaryReflexes && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Reflexos Pupilares</h4>
                      <p className="text-gray-700 text-sm">{record.physical_exam.pupillaryReflexes}</p>
                    </div>
                  )}
                  {record.physical_exam.visualField && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-2 text-sm">Campo Visual</h4>
                      <p className="text-gray-700 text-sm">{record.physical_exam.visualField}</p>
                    </div>
                  )}
                </div>
              )}
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