import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PatientList } from '../components/patients/PatientList'
import { PatientForm } from '../components/patients/PatientForm'
import { PatientDetails } from '../components/patients/PatientDetails'
import { DeletePatientModal } from '../components/patients/DeletePatientModal'
import NotificationPreferences from '../components/notifications/NotificationPreferences'
import { useToast } from '../contexts/ToastContext'
import type { Patient } from '../services/patient-central'

export function Patients() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isNotificationPreferencesOpen, setIsNotificationPreferencesOpen] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { showSuccess, showError } = useToast()

  // Check for action parameter on component mount
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'new') {
      handleNewPatient()
      // Remove the action parameter from URL
      setSearchParams({})
    }
  }, [searchParams, setSearchParams])

  const handleNewPatient = () => {
    setSelectedPatient(null)
    setIsFormOpen(true)
  }

  const handleEditPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsFormOpen(true)
    setIsDetailsOpen(false)
  }

  const handleViewPatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDetailsOpen(true)
  }

  const handleDeletePatient = (patient: Patient) => {
    setSelectedPatient(patient)
    setIsDeleteModalOpen(true)
    setIsDetailsOpen(false)
  }

  const handlePatientSaved = (patient: Patient) => {
    const isEditing = selectedPatient !== null
    setIsFormOpen(false)
    setSelectedPatient(null)
    setRefreshTrigger(prev => prev + 1)
    
    showSuccess(
      isEditing ? 'Paciente atualizado' : 'Paciente cadastrado',
      isEditing 
        ? `${patient.name} foi atualizado com sucesso.`
        : `${patient.name} foi cadastrado com sucesso.`
    )
  }

  const handlePatientDeleted = () => {
    setIsDeleteModalOpen(false)
    setSelectedPatient(null)
    setRefreshTrigger(prev => prev + 1)
    
    showSuccess(
      'Paciente excluído',
      'O paciente foi removido com sucesso.'
    )
  }

  const handleFormCancel = () => {
    setIsFormOpen(false)
    setSelectedPatient(null)
  }

  const handleDetailsClose = () => {
    setIsDetailsOpen(false)
    setSelectedPatient(null)
  }

  const handleDeleteModalClose = () => {
    setIsDeleteModalOpen(false)
    setSelectedPatient(null)
  }

  const handleNotificationPreferencesClose = () => {
    setIsNotificationPreferencesOpen(false)
    setSelectedPatient(null)
  }

  // Listen for notification preferences events
  useEffect(() => {
    const handleOpenNotificationPreferences = (event: any) => {
      const { patientId } = event.detail;
      const patient = selectedPatient;
      if (patient && patient.id === patientId) {
        setIsDetailsOpen(false);
        setIsNotificationPreferencesOpen(true);
      }
    };

    window.addEventListener('openNotificationPreferences', handleOpenNotificationPreferences);
    return () => {
      window.removeEventListener('openNotificationPreferences', handleOpenNotificationPreferences);
    };
  }, [selectedPatient]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pacientes</h1>
          <p className="text-gray-600">Gerencie os pacientes da clínica</p>
        </div>
        <button 
          onClick={handleNewPatient}
          className="btn-primary px-4 py-2 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Paciente
        </button>
      </div>

      {/* Patient List */}
      <PatientList
        onEditPatient={handleEditPatient}
        onDeletePatient={handleDeletePatient}
        onViewPatient={handleViewPatient}
        refreshTrigger={refreshTrigger}
      />

      {/* Patient Form Modal */}
      <PatientForm
        patient={selectedPatient}
        onSave={handlePatientSaved}
        onCancel={handleFormCancel}
        isOpen={isFormOpen}
      />

      {/* Patient Details Modal */}
      <PatientDetails
        patient={selectedPatient}
        isOpen={isDetailsOpen}
        onClose={handleDetailsClose}
        onEdit={handleEditPatient}
      />

      {/* Delete Confirmation Modal */}
      <DeletePatientModal
        patient={selectedPatient}
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteModalClose}
        onDeleted={handlePatientDeleted}
      />

      {/* Notification Preferences Modal */}
      {selectedPatient && isNotificationPreferencesOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <NotificationPreferences
              patientId={selectedPatient.id}
              onClose={handleNotificationPreferencesClose}
            />
          </div>
        </div>
      )}
    </div>
  )
}