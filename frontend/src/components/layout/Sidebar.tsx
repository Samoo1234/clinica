import React from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/SimpleAuthContext'
import { useModules } from '../../contexts/ModuleContext'
import { 
  Home, 
  Users, 
  FileText, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Settings,
  Stethoscope,
  Receipt,
  Shield,
  PenTool,
  Link as LinkIcon,
  Bell
} from 'lucide-react'
import { ModuleConfig } from '../../types/modules'

interface NavItem {
  to: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  roles?: string[]
  module: keyof ModuleConfig
  alwaysVisible?: boolean
}

const navigationItems: NavItem[] = [
  {
    to: '/dashboard',
    icon: Home,
    label: 'Dashboard',
    module: 'patients',
    alwaysVisible: true
  },
  {
    to: '/patients',
    icon: Users,
    label: 'Pacientes',
    module: 'patients',
    alwaysVisible: true
  },
  {
    to: '/appointments',
    icon: Calendar,
    label: 'Agendamentos',
    module: 'appointments'
  },
  {
    to: '/medical-records',
    icon: FileText,
    label: 'Prontuários',
    roles: ['doctor', 'admin'],
    module: 'medicalRecords',
    alwaysVisible: true
  },
  {
    to: '/consultations',
    icon: Stethoscope,
    label: 'Consultas',
    roles: ['doctor', 'admin'],
    module: 'consultations',
    alwaysVisible: true
  },
  {
    to: '/financial',
    icon: DollarSign,
    label: 'Financeiro',
    roles: ['admin', 'receptionist'],
    module: 'financial'
  },
  {
    to: '/fiscal-management',
    icon: Receipt,
    label: 'Gestão Fiscal',
    roles: ['admin'],
    module: 'nfse'
  },
  {
    to: '/digital-signature',
    icon: PenTool,
    label: 'Assinatura Digital',
    roles: ['admin', 'doctor'],
    module: 'digitalSignature'
  },
  {
    to: '/external-integration',
    icon: LinkIcon,
    label: 'Integrações',
    roles: ['admin'],
    module: 'externalIntegration'
  },
  {
    to: '/reports',
    icon: BarChart3,
    label: 'Relatórios',
    roles: ['admin', 'doctor'],
    module: 'reports'
  },
  {
    to: '/notifications',
    icon: Bell,
    label: 'Notificações',
    roles: ['admin'],
    module: 'notifications'
  },
  {
    to: '/security',
    icon: Shield,
    label: 'Segurança',
    roles: ['admin'],
    module: 'security'
  },
  {
    to: '/settings/modules',
    icon: Settings,
    label: 'Configurar Módulos',
    roles: ['admin'],
    module: 'patients',
    alwaysVisible: true
  }
]

export function Sidebar() {
  const { user } = useAuth()
  const { isModuleEnabled } = useModules()

  if (!user) return null

  const filteredItems = navigationItems.filter(item => {
    // Verifica permissões de role
    const hasRolePermission = !item.roles || item.roles.includes(user.role)
    
    // Verifica se o módulo está habilitado
    const isModuleActive = item.alwaysVisible || isModuleEnabled(item.module)
    
    return hasRolePermission && isModuleActive
  })

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-[calc(100vh-73px)]">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}