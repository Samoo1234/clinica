import React from 'react'
import { MedicalRecord } from '../../types/database'
import { Patient } from '../../services/patient-central'
import { medicalRecordsService } from '../../services/medical-records'
import { 
  FileText, 
  Calendar, 
  User, 
  Eye, 
  Edit, 
  Plus,
  Clock,
  Stethoscope
} from 'lucide-react'

interface MedicalRecordsListProps {
  patient: Patient
  records: MedicalRecord[]
  loading: boolean
  onViewRecord: (record: MedicalRecord) => void
  onEditRecord: (record: MedicalRecord) => void
  onNewRecord: () => void
}

export function MedicalRecordsList({
  patient,
  records,
  loading,
  onViewRecord,
  onEditRecord,
  onNewRecord
}: MedicalRecordsListProps) {
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string): string => {
    return new Date(dateString).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const truncateText = (text: string | undefined, maxLength: number): string => {
    if (!text) return '-'
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Carregando prontuários...</span>
          </div>
        </div>
      </div>
    )
  }

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum prontuário encontrado
            </h3>
            <p className="text-gray-600 mb-6">
              Este paciente ainda não possui consultas registradas
            </p>
            <button
              onClick={onNewRecord}
              className="inline-flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar Primeira Consulta
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Histórico Médico
            </h2>
            <p className="text-gray-600 text-sm">
              {records.length} consulta{records.length !== 1 ? 's' : ''} registrada{records.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-primary-600" />
                      <span className="font-medium text-gray-900">
                        {formatDate(record.consultation_date)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-3 h-3" />
                      <span className="text-sm">
                        {formatTime(record.created_at)}
                      </span>
                    </div>

                    {(record as any).doctor && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="text-sm">
                          Dr. {(record as any).doctor.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content Preview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {record.chief_complaint && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Queixa Principal
                        </h4>
                        <p className="text-sm text-gray-600">
                          {truncateText(record.chief_complaint, 100)}
                        </p>
                      </div>
                    )}

                    {record.diagnosis && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          Diagnóstico
                        </h4>
                        <p className="text-sm text-gray-600">
                          {truncateText(record.diagnosis, 100)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Physical Exam Summary */}
                  {record.physical_exam && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                        <Stethoscope className="w-3 h-3" />
                        Exame Físico
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {record.physical_exam.visualAcuity && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-700">Acuidade Visual</div>
                            <div className="text-gray-600">
                              OD: {record.physical_exam.visualAcuity.rightEye || '-'}
                            </div>
                            <div className="text-gray-600">
                              OE: {record.physical_exam.visualAcuity.leftEye || '-'}
                            </div>
                          </div>
                        )}
                        
                        {record.physical_exam.intraocularPressure && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-700">PIO</div>
                            <div className="text-gray-600">
                              OD: {record.physical_exam.intraocularPressure.rightEye || 0} mmHg
                            </div>
                            <div className="text-gray-600">
                              OE: {record.physical_exam.intraocularPressure.leftEye || 0} mmHg
                            </div>
                          </div>
                        )}

                        {record.physical_exam.fundoscopy && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-700">Fundoscopia</div>
                            <div className="text-gray-600">
                              {truncateText(record.physical_exam.fundoscopy, 30)}
                            </div>
                          </div>
                        )}

                        {record.physical_exam.biomicroscopy && (
                          <div className="bg-gray-50 p-2 rounded">
                            <div className="font-medium text-gray-700">Biomicroscopia</div>
                            <div className="text-gray-600">
                              {truncateText(record.physical_exam.biomicroscopy, 30)}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Follow-up Date */}
                  {record.follow_up_date && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Retorno:</span> {formatDate(record.follow_up_date)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="ml-4 flex flex-col gap-2">
                  <button
                    onClick={() => onViewRecord(record)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded transition-colors"
                    title="Visualizar prontuário"
                  >
                    <Eye className="w-3 h-3" />
                    Ver
                  </button>
                  
                  <button
                    onClick={() => onEditRecord(record)}
                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded transition-colors"
                    title="Editar prontuário"
                  >
                    <Edit className="w-3 h-3" />
                    Editar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}