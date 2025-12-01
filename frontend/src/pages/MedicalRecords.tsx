import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PatientSelector } from '../components/medical-records/PatientSelector'
import { MedicalRecordsList } from '../components/medical-records/MedicalRecordsList'
import { MedicalRecordForm } from '../components/medical-records/MedicalRecordForm'
import { MedicalRecordView } from '../components/medical-records/MedicalRecordView'
import { MedicalRecord } from '../types/database'
import { PatientCentralService, type Patient } from '../services/patient-central'
import { medicalRecordsService } from '../services/medical-records'
import { useToast } from '../contexts/ToastContext'
import { FileText, Plus, ArrowLeft } from 'lucide-react'

type ViewMode = 'list' | 'form' | 'view'

export function MedicalRecords() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { showToast } = useToast()
  
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [loading, setLoading] = useState(false)
  const [recordsLoading, setRecordsLoading] = useState(false)

  // Initialize from URL params
  useEffect(() => {
    const patientId = searchParams.get('patientId')
    const recordId = searchParams.get('recordId')
    const mode = searchParams.get('mode') as ViewMode
    const action = searchParams.get('action')

    if (action === 'new') {
      setViewMode('form')
      setSelectedRecord(null)
      // Remove the action parameter from URL
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('action')
      setSearchParams(newParams)
      return
    }

    if (patientId) {
      loadPatient(patientId)
    }
    if (mode && ['list', 'form', 'view'].includes(mode)) {
      setViewMode(mode)
    }
    if (recordId && mode === 'view') {
      loadRecord(recordId)
    }
  }, [searchParams, setSearchParams])

  const loadPatient = async (patientId: string) => {
    try {
      setLoading(true)
      const patient = await PatientCentralService.getPatientById(patientId)
      setSelectedPatient(patient)
      await loadMedicalRecords(patientId)
    } catch (error) {
      console.error('Error loading patient:', error)
      showToast('error', 'Erro ao carregar dados do paciente')
    } finally {
      setLoading(false)
    }
  }

  const loadRecord = async (recordId: string) => {
    try {
      const record = await medicalRecordsService.getMedicalRecordById(recordId)
      setSelectedRecord(record)
    } catch (error) {
      console.error('Error loading record:', error)
      showToast('error', 'Erro ao carregar prontuário')
    }
  }

  const loadMedicalRecords = async (patientId: string) => {
    try {
      setRecordsLoading(true)
      const { records } = await medicalRecordsService.getMedicalRecordsByPatientId(patientId, {
        orderBy: 'desc'
      })
      setMedicalRecords(records)
    } catch (error) {
      console.error('Error loading medical records:', error)
      showToast('error', 'Erro ao carregar prontuários')
    } finally {
      setRecordsLoading(false)
    }
  }

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient)
    setSelectedRecord(null)
    setViewMode('list')
    setSearchParams({ patientId: patient.id, mode: 'list' })
    loadMedicalRecords(patient.id)
  }

  const handleNewRecord = () => {
    if (!selectedPatient) return
    setSelectedRecord(null)
    setViewMode('form')
    setSearchParams({ patientId: selectedPatient.id, mode: 'form' })
  }

  const handleEditRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setViewMode('form')
    setSearchParams({ 
      patientId: selectedPatient!.id, 
      recordId: record.id, 
      mode: 'form' 
    })
  }

  const handleViewRecord = (record: MedicalRecord) => {
    setSelectedRecord(record)
    setViewMode('view')
    setSearchParams({ 
      patientId: selectedPatient!.id, 
      recordId: record.id, 
      mode: 'view' 
    })
  }

  const handleRecordSaved = async (record: MedicalRecord) => {
    if (selectedPatient) {
      await loadMedicalRecords(selectedPatient.id)
    }
    setViewMode('list')
    setSearchParams({ patientId: selectedPatient!.id, mode: 'list' })
    showToast('success', 'Prontuário salvo com sucesso')
  }

  const handleBackToList = () => {
    setSelectedRecord(null)
    setViewMode('list')
    if (selectedPatient) {
      setSearchParams({ patientId: selectedPatient.id, mode: 'list' })
    }
  }

  const handleBackToPatients = () => {
    setSelectedPatient(null)
    setSelectedRecord(null)
    setViewMode('list')
    setSearchParams({})
  }

  if (!selectedPatient) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary-600" />
            Prontuários Médicos
          </h1>
          <p className="text-gray-600">
            Selecione um paciente para visualizar ou criar prontuários médicos
          </p>
        </div>
        
        <PatientSelector onPatientSelect={handlePatientSelect} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToPatients}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary-600" />
              Prontuários - {selectedPatient.name}
            </h1>
            <p className="text-gray-600">
              CPF: {PatientCentralService.formatCPF(selectedPatient.cpf)}
            </p>
          </div>
        </div>

        {viewMode === 'list' && (
          <button
            onClick={handleNewRecord}
            className="flex items-center gap-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Consulta
          </button>
        )}
      </div>

      {/* Content */}
      {viewMode === 'list' && (
        <MedicalRecordsList
          patient={selectedPatient}
          records={medicalRecords}
          loading={recordsLoading}
          onViewRecord={handleViewRecord}
          onEditRecord={handleEditRecord}
          onNewRecord={handleNewRecord}
        />
      )}

      {viewMode === 'form' && (
        <MedicalRecordForm
          patient={selectedPatient}
          record={selectedRecord}
          onSave={handleRecordSaved}
          onCancel={handleBackToList}
        />
      )}

      {viewMode === 'view' && selectedRecord && (
        <MedicalRecordView
          record={selectedRecord}
          patient={selectedPatient}
          onEdit={() => handleEditRecord(selectedRecord)}
          onBack={handleBackToList}
        />
      )}
    </div>
  )
}