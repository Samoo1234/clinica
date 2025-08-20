import React, { useState, useEffect, useCallback } from 'react'
import { Patient } from '../../types/database'
import { PatientService } from '../../services/patients'
import { useToast } from '../../contexts/ToastContext'
import { Search, User, Calendar, Phone } from 'lucide-react'
import { debounce } from 'lodash'

interface PatientSelectorProps {
  onPatientSelect: (patient: Patient) => void
}

export function PatientSelector({ onPatientSelect }: PatientSelectorProps) {
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setPatients([])
        setHasSearched(false)
        return
      }

      try {
        setLoading(true)
        setHasSearched(true)
        const result = await PatientService.searchPatients({
          query: query.trim(),
          limit: 20
        })
        setPatients(result.data)
      } catch (error) {
        console.error('Error searching patients:', error)
        showToast('Erro ao buscar pacientes', 'error')
        setPatients([])
      } finally {
        setLoading(false)
      }
    }, 300),
    [showToast]
  )

  useEffect(() => {
    debouncedSearch(searchQuery)
    return () => {
      debouncedSearch.cancel()
    }
  }, [searchQuery, debouncedSearch])

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const formatBirthDate = (birthDate: string): string => {
    return new Date(birthDate).toLocaleDateString('pt-BR')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Buscar Paciente
          </h2>
          <p className="text-gray-600 text-sm">
            Digite o nome, CPF ou telefone do paciente para buscar
          </p>
        </div>

        {/* Search Input */}
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome, CPF ou telefone do paciente..."
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-gray-600">Buscando pacientes...</span>
          </div>
        )}

        {/* No Results */}
        {hasSearched && !loading && patients.length === 0 && (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum paciente encontrado
            </h3>
            <p className="text-gray-600">
              Tente buscar com outros termos ou verifique se o paciente está cadastrado
            </p>
          </div>
        )}

        {/* Search Instructions */}
        {!hasSearched && !loading && (
          <div className="text-center py-8">
            <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Digite para buscar
            </h3>
            <p className="text-gray-600">
              Comece digitando o nome, CPF ou telefone do paciente
            </p>
          </div>
        )}

        {/* Results List */}
        {patients.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              Pacientes encontrados ({patients.length})
            </h3>
            <div className="max-h-96 overflow-y-auto space-y-2">
              {patients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => onPatientSelect(patient)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <h4 className="font-medium text-gray-900">
                          {patient.name}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">CPF:</span>
                          {PatientService.formatCPF(patient.cpf)}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>{calculateAge(patient.birth_date)} anos</span>
                          <span className="text-gray-400">
                            ({formatBirthDate(patient.birth_date)})
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {PatientService.formatPhone(patient.phone)}
                        </div>
                      </div>

                      {patient.email && (
                        <div className="mt-1 text-sm text-gray-600">
                          <span className="font-medium">Email:</span> {patient.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="ml-4">
                      <div className="text-xs text-gray-500 text-right">
                        Clique para selecionar
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}