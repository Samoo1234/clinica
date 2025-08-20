import { useAuth } from '../../contexts/AuthContext'
import { LogOut, User, Shield, Stethoscope, Users } from 'lucide-react'

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

export function UserHeader() {
  const { user, signOut } = useAuth()

  if (!user) return null

  const RoleIcon = roleIcons[user.role]

  const handleSignOut = async () => {
    if (confirm('Tem certeza que deseja sair?')) {
      await signOut()
    }
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <div className="flex items-center space-x-1 text-sm text-gray-500">
                <RoleIcon className="w-3 h-3" />
                <span>{roleLabels[user.role]}</span>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </div>
  )
}