import React, { useState, useEffect } from 'react'
import { Search, Filter, Edit, Trash2, Eye, Phone, Mail, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react'
import { PatientCentralService } from '../../services/patient-central'
import type { Patient, PaginatedResult } from '../../services/patient-central'

interface PatientListProps {
  onEditPatient: (patient: Patient) => void
  onDeletePatient: (patient: Patient) => void
  onViewPatient: (patient: Patient) => void
  refreshTrigger?: number
}

interface Filters {
  hasInsurance: boolean | null
  hasEmergencyContact: boolean | null
  ageRange: { min: number | null; max: number | null }
}

export function PatientList({ 
  onEditPatient, 
  onDeletePatient, 
  onViewPatient, 
  refreshTrigger 
}: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    hasInsurance: null,
    hasEmergencyContact: null,
    ageRange: { min: null, max: null }
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })
  const [error, setError] = useState<string | null>(null)

  const loadPatients = async (page = 1, query = searchQuery) => {
    try {
      setLoading(true)
      setError(null)
      
      let result: PaginatedResult<Patient>
      
      if (query.trim()) {
        result = await PatientCentralService.searchPatients({
          query: query.trim(),
          page,
          limit: pagination.limit
        })
      } else {
        result = await PatientCentralService.getAllPatients({
          page,
          limit: pagination.limit
        })
      }
      
      // Apply client-side filters
      let filteredPatients = result.data
      
      if (filters.hasInsurance !== null) {
        filteredPatients = filteredPatients.filter(patient => 
          filters.hasInsurance 
            ? patient.insurance_info?.provider 
            : !patient.insurance_info?.provider
        )
      }
      
      if (filters.hasEmergencyContact !== null) {
        filteredPatients = filteredPatients.filter(patient => 
          filters.hasEmergencyContact 
            ? patient.emergency_contact?.name 
            : !patient.emergency_contact?.name
        )
      }
      
      if (filters.ageRange.min !== null || filters.ageRange.max !== null) {
        filteredPatients = filteredPatients.filter(patient => {
          const age = calculateAge(patient.birth_date)
          const minAge = filters.ageRange.min || 0
          const maxAge = filters.ageRange.max || 150
          return age >= minAge && age <= maxAge
        })
      }
      
      setPatients(filteredPatients)
      setPagination(result.pagination)
    } catch (error: any) {
      setError(error.message || 'Erro ao carregar pacientes')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }

  const calculateAge = (birthDate: string): number => {
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    
    return age
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    setPagination(prev => ({ ...prev, page: 1 }))
    loadPatients(1, query)
  }

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }))
    loadPatients(newPage)
  }

  const applyFilters = () => {
    loadPatients(1)
    setShowFilters(false)
  }

  const clearFilters = () => {
    setFilters({
      hasInsurance: null,
      hasEmergencyContact: null,
      ageRange: { min: null, max: null }
    })
    loadPatients(1)
    setShowFilters(false)
  }

  useEffect(() => {
    loadPatients()
  }, [refreshTrigger])

  if (loading && patients.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, CPF ou telefone..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-secondary px-4 py-2 ${showFilters ? 'bg-primary-100 text-primary-700' : ''}`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Convênio
                </label>
                <select
                  value={filters.hasInsurance === null ? '' : filters.hasInsurance.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasInsurance: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="true">Com convênio</option>
                  <option value="false">Sem convênio</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contato de Emergência
                </label>
                <select
                  value={filters.hasEmergencyContact === null ? '' : filters.hasEmergencyContact.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasEmergencyContact: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                  className="input"
                >
                  <option value="">Todos</option>
                  <option value="true">Com contato</option>
                  <option value="false">Sem contato</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Faixa Etária
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.ageRange.min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      ageRange: { ...prev.ageRange, min: e.target.value ? parseInt(e.target.value) : null }
                    }))}
                    className="input flex-1"
                    min="0"
                    max="150"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.ageRange.max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      ageRange: { ...prev.ageRange, max: e.target.value ? parseInt(e.target.value) : null }
                    }))}
                    className="input flex-1"
                    min="0"
                    max="150"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={clearFilters}
                className="btn-secondary px-4 py-2 text-sm"
              >
                Limpar
              </button>
              <button
                onClick={applyFilters}
                className="btn-primary px-4 py-2 text-sm"
              >
                Aplicar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Patients List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Pacientes ({pagination.total})
            </h3>
            {loading && (
              <div className="text-sm text-gray-500">Carregando...</div>
            )}
          </div>
        </div>

        {patients.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400 mb-4">
              <Search className="w-12 h-12 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'Nenhum paciente encontrado' : 'Nenhum paciente cadastrado'}
            </h3>
            <p className="text-gray-600">
              {searchQuery 
                ? 'Tente ajustar os termos de busca ou filtros.'
                : 'Comece cadastrando o primeiro paciente da clínica.'
              }
            </p>
          </div>
        ) : (
          <>
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Paciente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contato
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Idade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Convênio
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {patients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {patient.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            CPF: {PatientCentralService.formatCPF(patient.cpf)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-2 text-gray-400" />
                            {PatientCentralService.formatPhone(patient.phone)}
                          </div>
                          {patient.email && (
                            <div className="flex items-center text-sm text-gray-500">
                              <Mail className="w-4 h-4 mr-2 text-gray-400" />
                              {patient.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {calculateAge(patient.birth_date)} anos
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(patient.birth_date)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient.insurance_info?.provider ? (
                          <div className="text-sm text-gray-900">
                            {patient.insurance_info.provider}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">Particular</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onViewPatient(patient)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Visualizar"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditPatient(patient)}
                            className="text-gray-600 hover:text-gray-900 p-1"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeletePatient(patient)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden divide-y divide-gray-200">
              {patients.map((patient) => (
                <div key={patient.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {patient.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        CPF: {PatientCentralService.formatCPF(patient.cpf)}
                      </p>
                      
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {PatientCentralService.formatPhone(patient.phone)}
                        </div>
                        
                        {patient.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Mail className="w-4 h-4 mr-2 text-gray-400" />
                            {patient.email}
                          </div>
                        )}
                        
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                          {calculateAge(patient.birth_date)} anos
                        </div>
                        
                        {patient.insurance_info?.provider && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                            {patient.insurance_info.provider}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => onViewPatient(patient)}
                        className="text-primary-600 hover:text-primary-900 p-2"
                        title="Visualizar"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditPatient(patient)}
                        className="text-gray-600 hover:text-gray-900 p-2"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeletePatient(patient)}
                        className="text-red-600 hover:text-red-900 p-2"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
                    {pagination.total} resultados
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={!pagination.hasPrev}
                      className="btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Anterior
                    </button>
                    
                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, pagination.totalPages))].map((_, i) => {
                        const pageNum = Math.max(1, pagination.page - 2) + i
                        if (pageNum > pagination.totalPages) return null
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 text-sm rounded ${
                              pageNum === pagination.page
                                ? 'bg-primary-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {pageNum}
                          </button>
                        )
                      })}
                    </div>
                    
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={!pagination.hasNext}
                      className="btn-secondary px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Próxima
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}