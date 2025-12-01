import React, { useState } from 'react'
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react'
import { PatientCentralService, type Patient } from '../../services/patient-central'

interface DeletePatientModalProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
  onDeleted: () => void
}

export function DeletePatientModal({ patient, isOpen, onClose, onDeleted }: DeletePatientModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!patient) return

    setIsDeleting(true)
    setError(null)

    try {
      await PatientCentralService.deletePatient(patient.id)
      onDeleted()
      onClose()
    } catch (error: any) {
      setError(error.message || 'Erro ao excluir paciente')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      setError(null)
      onClose()
    }
  }

  if (!isOpen || !patient) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              Excluir Paciente
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isDeleting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              Tem certeza que deseja excluir o paciente <strong>{patient.name}</strong>?
            </p>
            
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Atenção:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Esta ação não pode ser desfeita</li>
                    <li>O paciente não pode ter consultas ou prontuários associados</li>
                    <li>Todos os dados do paciente serão permanentemente removidos</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Dados do Paciente:
            </h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Nome:</strong> {patient.name}</p>
              <p><strong>CPF:</strong> {PatientCentralService.formatCPF(patient.cpf)}</p>
              <p><strong>Telefone:</strong> {PatientCentralService.formatPhone(patient.phone)}</p>
              {patient.email && (
                <p><strong>Email:</strong> {patient.email}</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="btn-secondary px-4 py-2"
            disabled={isDeleting}
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Paciente
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}