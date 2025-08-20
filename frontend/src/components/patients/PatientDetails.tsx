import React from 'react'
import { X, User, Phone, Mail, Calendar, MapPin, Shield, AlertTriangle } from 'lucide-react'
import { PatientService } from '../../services/patients'
import type { Patient } from '../../types/database'

interface PatientDetailsProps {
  patient: Patient | null
  isOpen: boolean
  onClose: () => void
  onEdit: (patient: Patient) => void
}

export function PatientDetails({ patient, isOpen, onClose, onEdit }: PatientDetailsProps) {
  if (!isOpen || !patient) return null

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

  const formatAddress = (address: any): string => {
    if (!address) return 'Não informado'
    
    const parts = [
      address.street,
      address.number,
      address.complement,
      address.neighborhood,
      address.city,
      address.state,
      PatientService.formatZipCode(address.zipCode)
    ].filter(Boolean)
    
    return parts.join(', ')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {patient.name}
              </h2>
              <p className="text-sm text-gray-500">
                CPF: {PatientService.formatCPF(patient.cpf)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(patient)}
              className="btn-primary px-4 py-2"
            >
              Editar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Personal Information */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2 text-primary-600" />
                  Dados Pessoais
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {calculateAge(patient.birth_date)} anos
                      </p>
                      <p className="text-sm text-gray-500">
                        Nascimento: {formatDate(patient.birth_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {PatientService.formatPhone(patient.phone)}
                      </p>
                      <p className="text-sm text-gray-500">Telefone principal</p>
                    </div>
                  </div>

                  {patient.email && (
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.email}
                        </p>
                        <p className="text-sm text-gray-500">Email</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-primary-600" />
                  Endereço
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900">
                    {formatAddress(patient.address)}
                  </p>
                </div>
              </div>

              {/* Registration Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Informações de Cadastro
                </h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">Cadastrado em</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(patient.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Última atualização</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(patient.updated_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="space-y-6">
              {/* Insurance Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-primary-600" />
                  Convênio
                </h3>
                {patient.insurance_info?.provider ? (
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Convênio</p>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.insurance_info.provider}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Número do Plano</p>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.insurance_info.planNumber}
                        </p>
                      </div>
                      {patient.insurance_info.validUntil && (
                        <div>
                          <p className="text-sm text-gray-500">Válido até</p>
                          <p className="text-sm font-medium text-gray-900">
                            {formatDate(patient.insurance_info.validUntil)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">
                      Paciente particular - sem convênio cadastrado
                    </p>
                  </div>
                )}
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2 text-primary-600" />
                  Contato de Emergência
                </h3>
                {patient.emergency_contact?.name ? (
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-gray-500">Nome</p>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.emergency_contact.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Telefone</p>
                        <p className="text-sm font-medium text-gray-900">
                          {PatientService.formatPhone(patient.emergency_contact.phone)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Parentesco</p>
                        <p className="text-sm font-medium text-gray-900">
                          {patient.emergency_contact.relationship}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">
                      Nenhum contato de emergência cadastrado
                    </p>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Ações Rápidas
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  <button className="btn-secondary p-3 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Agendar Consulta
                    </div>
                    <div className="text-xs text-gray-500">
                      Criar novo agendamento para este paciente
                    </div>
                  </button>
                  
                  <button className="btn-secondary p-3 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Ver Prontuário
                    </div>
                    <div className="text-xs text-gray-500">
                      Visualizar histórico médico
                    </div>
                  </button>
                  
                  <button className="btn-secondary p-3 text-left">
                    <div className="text-sm font-medium text-gray-900">
                      Histórico de Consultas
                    </div>
                    <div className="text-xs text-gray-500">
                      Ver todas as consultas realizadas
                    </div>
                  </button>
                  
                  <button 
                    className="btn-secondary p-3 text-left"
                    onClick={() => {
                      // This will be handled by the parent component
                      const event = new CustomEvent('openNotificationPreferences', { 
                        detail: { patientId: patient.id } 
                      });
                      window.dispatchEvent(event);
                    }}
                  >
                    <div className="text-sm font-medium text-gray-900">
                      Preferências de Notificação
                    </div>
                    <div className="text-xs text-gray-500">
                      Configurar lembretes e notificações
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}