import { useAuth } from '../../contexts/SimpleAuthContext'
import { LogOut, User, Shield, Stethoscope, Users, Bell, Settings } from 'lucide-react'

const roleIcons = {
  admin: Shield,
  doctor: Stethoscope,
  receptionist: Users
}

const roleLabels = {
  admin: 'Administrador',
  doctor: 'Médico',
  receptionist: 'Recepcionista'
}

export function Header() {
  const { user, signOut } = useAuth()

  if (!user) return null

  const RoleIcon = roleIcons[user.role]

  const handleSignOut = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut()
    }
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Title */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">VisionCare</h1>
                <p className="text-xs text-gray-500">Sistema de Gestão Oftalmológica</p>
              </div>
            </div>
          </div>

          {/* User Info and Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>

            {/* User Info */}
            <div className="flex items-center space-x-3 pl-4 border-l border-gray-200">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-primary-600" />
              </div>
              <div className="hidden md:block">
                <p className="font-medium text-gray-900 text-sm">{user.name}</p>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <RoleIcon className="w-3 h-3" />
                  <span>{roleLabels[user.role]}</span>
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                title="Sair do sistema"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}