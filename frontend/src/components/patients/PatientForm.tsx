import React, { useState, useEffect } from 'react'
import { X, Save, Loader2 } from 'lucide-react'
import { PatientCentralService, type Patient } from '../../services/patient-central'

interface PatientFormProps {
  patient?: Patient
  onSave: (patient: Patient) => void
  onCancel: () => void
  isOpen: boolean
}

interface FormData {
  name: string
  cpf: string
  birth_date: string
  phone: string
  email: string
  address: {
    street: string
    number: string
    complement: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  insurance_info: {
    provider: string
    planNumber: string
    validUntil: string
  }
  emergency_contact: {
    name: string
    phone: string
    relationship: string
  }
}

const initialFormData: FormData = {
  name: '',
  cpf: '',
  birth_date: '',
  phone: '',
  email: '',
  address: {
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  },
  insurance_info: {
    provider: '',
    planNumber: '',
    validUntil: ''
  },
  emergency_contact: {
    name: '',
    phone: '',
    relationship: ''
  }
}

export function PatientForm({ patient, onSave, onCancel, isOpen }: PatientFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'personal' | 'address' | 'insurance' | 'emergency'>('personal')

  // Load patient data when editing
  useEffect(() => {
    if (patient) {
      setFormData({
        name: patient.name,
        cpf: PatientCentralService.formatCPF(patient.cpf),
        birth_date: patient.birth_date,
        phone: PatientCentralService.formatPhone(patient.phone),
        email: patient.email || '',
        address: {
          street: patient.address?.street || '',
          number: patient.address?.number || '',
          complement: patient.address?.complement || '',
          neighborhood: patient.address?.neighborhood || '',
          city: patient.address?.city || '',
          state: patient.address?.state || '',
          zipCode: PatientCentralService.formatZipCode(patient.address?.zipCode || '')
        },
        insurance_info: {
          provider: patient.insurance_info?.provider || '',
          planNumber: patient.insurance_info?.planNumber || '',
          validUntil: patient.insurance_info?.validUntil || ''
        },
        emergency_contact: {
          name: patient.emergency_contact?.name || '',
          phone: PatientCentralService.formatPhone(patient.emergency_contact?.phone || ''),
          relationship: patient.emergency_contact?.relationship || ''
        }
      })
    } else {
      setFormData(initialFormData)
    }
    setErrors([])
    setActiveTab('personal')
  }, [patient, isOpen])

  const handleInputChange = (field: string, value: string) => {
    const keys = field.split('.')
    if (keys.length === 1) {
      setFormData(prev => ({ ...prev, [field]: value }))
    } else if (keys.length === 2) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: {
          ...prev[keys[0] as keyof FormData] as any,
          [keys[1]]: value
        }
      }))
    }
  }

  const formatCPFInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      const formatted = cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      handleInputChange('cpf', formatted)
    }
  }

  const formatPhoneInput = (field: string, value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 11) {
      let formatted = cleaned
      if (cleaned.length === 10) {
        formatted = cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3')
      } else if (cleaned.length === 11) {
        formatted = cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      }
      handleInputChange(field, formatted)
    }
  }

  const formatZipCodeInput = (value: string) => {
    const cleaned = value.replace(/\D/g, '')
    if (cleaned.length <= 8) {
      const formatted = cleaned.replace(/(\d{5})(\d{3})/, '$1-$2')
      handleInputChange('address.zipCode', formatted)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])

    try {
      // Validate required fields
      const requiredFields = [
        { field: 'name', label: 'Nome' },
        { field: 'cpf', label: 'CPF' },
        { field: 'birth_date', label: 'Data de nascimento' },
        { field: 'phone', label: 'Telefone' },
        { field: 'address.street', label: 'Endereço' },
        { field: 'address.number', label: 'Número' },
        { field: 'address.neighborhood', label: 'Bairro' },
        { field: 'address.city', label: 'Cidade' },
        { field: 'address.state', label: 'Estado' },
        { field: 'address.zipCode', label: 'CEP' }
      ]

      const missingFields = requiredFields.filter(({ field }) => {
        const keys = field.split('.')
        if (keys.length === 1) {
          return !formData[keys[0] as keyof FormData]
        } else {
          const obj = formData[keys[0] as keyof FormData] as any
          return !obj || !obj[keys[1]]
        }
      })

      if (missingFields.length > 0) {
        setErrors([`Campos obrigatórios: ${missingFields.map(f => f.label).join(', ')}`])
        setIsLoading(false)
        return
      }

      // Prepare data for API
      const apiData = {
        name: formData.name.trim(),
        cpf: formData.cpf,
        birth_date: formData.birth_date,
        phone: formData.phone,
        email: formData.email.trim() || undefined,
        address: {
          street: formData.address.street.trim(),
          number: formData.address.number.trim(),
          complement: formData.address.complement.trim() || undefined,
          neighborhood: formData.address.neighborhood.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim().toUpperCase(),
          zipCode: formData.address.zipCode
        },
        insurance_info: formData.insurance_info.provider ? {
          provider: formData.insurance_info.provider.trim(),
          planNumber: formData.insurance_info.planNumber.trim(),
          validUntil: formData.insurance_info.validUntil
        } : undefined,
        emergency_contact: formData.emergency_contact.name ? {
          name: formData.emergency_contact.name.trim(),
          phone: formData.emergency_contact.phone,
          relationship: formData.emergency_contact.relationship.trim()
        } : undefined
      }

      // Validate data
      const validationErrors = PatientCentralService.validatePatientData(apiData)
      if (validationErrors.length > 0) {
        setErrors(validationErrors)
        setIsLoading(false)
        return
      }

      let savedPatient: Patient
      if (patient) {
        // Update existing patient
        savedPatient = await PatientCentralService.updatePatient(patient.id, apiData)
      } else {
        // Create new patient
        savedPatient = await PatientCentralService.createPatient(apiData)
      }

      onSave(savedPatient)
    } catch (error: any) {
      setErrors([error.message || 'Erro ao salvar paciente'])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {patient ? 'Editar Paciente' : 'Novo Paciente'}
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <div className="text-red-800">
              {errors.map((error, index) => (
                <p key={index} className="text-sm">{error}</p>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'personal', label: 'Dados Pessoais' },
              { id: 'address', label: 'Endereço' },
              { id: 'insurance', label: 'Convênio' },
              { id: 'emergency', label: 'Contato de Emergência' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Personal Data Tab */}
            {activeTab === 'personal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="input"
                    placeholder="Digite o nome completo"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={(e) => formatCPFInput(e.target.value)}
                    className="input"
                    placeholder="000.000.000-00"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento *
                  </label>
                  <input
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleInputChange('birth_date', e.target.value)}
                    className="input"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => formatPhoneInput('phone', e.target.value)}
                    className="input"
                    placeholder="(00) 00000-0000"
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="input"
                    placeholder="email@exemplo.com"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Address Tab */}
            {activeTab === 'address' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CEP *
                  </label>
                  <input
                    type="text"
                    value={formData.address.zipCode}
                    onChange={(e) => formatZipCodeInput(e.target.value)}
                    className="input"
                    placeholder="00000-000"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado *
                  </label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => handleInputChange('address.state', e.target.value.toUpperCase())}
                    className="input"
                    placeholder="SP"
                    maxLength={2}
                    disabled={isLoading}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Endereço *
                  </label>
                  <input
                    type="text"
                    value={formData.address.street}
                    onChange={(e) => handleInputChange('address.street', e.target.value)}
                    className="input"
                    placeholder="Rua, Avenida, etc."
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número *
                  </label>
                  <input
                    type="text"
                    value={formData.address.number}
                    onChange={(e) => handleInputChange('address.number', e.target.value)}
                    className="input"
                    placeholder="123"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Complemento
                  </label>
                  <input
                    type="text"
                    value={formData.address.complement}
                    onChange={(e) => handleInputChange('address.complement', e.target.value)}
                    className="input"
                    placeholder="Apto, Sala, etc."
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bairro *
                  </label>
                  <input
                    type="text"
                    value={formData.address.neighborhood}
                    onChange={(e) => handleInputChange('address.neighborhood', e.target.value)}
                    className="input"
                    placeholder="Nome do bairro"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className="input"
                    placeholder="Nome da cidade"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Insurance Tab */}
            {activeTab === 'insurance' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Convênio
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_info.provider}
                    onChange={(e) => handleInputChange('insurance_info.provider', e.target.value)}
                    className="input"
                    placeholder="Nome do convênio"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número do Plano
                  </label>
                  <input
                    type="text"
                    value={formData.insurance_info.planNumber}
                    onChange={(e) => handleInputChange('insurance_info.planNumber', e.target.value)}
                    className="input"
                    placeholder="Número da carteirinha"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Válido Até
                  </label>
                  <input
                    type="date"
                    value={formData.insurance_info.validUntil}
                    onChange={(e) => handleInputChange('insurance_info.validUntil', e.target.value)}
                    className="input"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Emergency Contact Tab */}
            {activeTab === 'emergency' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Contato
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact.name}
                    onChange={(e) => handleInputChange('emergency_contact.name', e.target.value)}
                    className="input"
                    placeholder="Nome completo"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone do Contato
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact.phone}
                    onChange={(e) => formatPhoneInput('emergency_contact.phone', e.target.value)}
                    className="input"
                    placeholder="(00) 00000-0000"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parentesco
                  </label>
                  <input
                    type="text"
                    value={formData.emergency_contact.relationship}
                    onChange={(e) => handleInputChange('emergency_contact.relationship', e.target.value)}
                    className="input"
                    placeholder="Pai, Mãe, Cônjuge, etc."
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary px-4 py-2"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {patient ? 'Atualizar' : 'Salvar'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}