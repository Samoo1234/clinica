// Tipos para sistema modular
export interface ModuleConfig {
  // Módulos CORE (sempre ativos)
  patients: boolean // sempre true
  consultations: boolean // sempre true
  medicalRecords: boolean // sempre true
  
  // Módulos OPCIONAIS
  appointments: boolean
  financial: boolean
  nfse: boolean
  digitalSignature: boolean
  externalIntegration: boolean
  reports: boolean
  notifications: boolean
  security: boolean
}

export interface MenuItem {
  name: string
  path: string
  icon: string
  module: keyof ModuleConfig
  alwaysVisible?: boolean // para módulos core
}

export const DEFAULT_MODULE_CONFIG: ModuleConfig = {
  // Core modules (sempre ativos)
  patients: true,
  consultations: true,
  medicalRecords: true,
  
  // Optional modules (podem ser desabilitados)
  appointments: true,
  financial: true,
  nfse: true,
  digitalSignature: true,
  externalIntegration: true,
  reports: true,
  notifications: true,
  security: true
}

export const MODULE_DESCRIPTIONS = {
  patients: 'Gestão de Pacientes',
  consultations: 'Consultas Médicas',
  medicalRecords: 'Prontuários Médicos',
  appointments: 'Agendamentos',
  financial: 'Gestão Financeira',
  nfse: 'Nota Fiscal de Serviço',
  digitalSignature: 'Assinatura Digital',
  externalIntegration: 'Integrações Externas',
  reports: 'Relatórios',
  notifications: 'Notificações',
  security: 'Segurança Avançada'
}