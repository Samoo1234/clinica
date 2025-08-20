import { useAuth } from '../contexts/SimpleAuthContext'
import { Shield, Stethoscope, Users, CheckCircle } from 'lucide-react'

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

export function AuthTest() {
  const { user } = useAuth()

  if (!user) return null

  const RoleIcon = roleIcons[user.role]

  return (
    <div className="bg-green-50 p-6 rounded-lg border border-green-200">
      <div className="flex items-center mb-4">
        <CheckCircle className="w-6 h-6 text-green-600 mr-2" />
        <h3 className="text-green-800 font-semibold">Sistema de Autenticação Ativo</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <RoleIcon className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">Usuário: {user.name}</p>
            <p className="text-sm text-gray-600">Email: {user.email}</p>
            <p className="text-sm text-gray-600">Perfil: {roleLabels[user.role]}</p>
            <p className="text-sm text-gray-600">Status: {user.active ? 'Ativo' : 'Inativo'}</p>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded border">
          <h4 className="font-medium text-gray-900 mb-2">Funcionalidades Implementadas:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>✅ Configuração do Supabase Auth no frontend e backend</li>
            <li>✅ Sistema de login/logout com Supabase Auth</li>
            <li>✅ Sistema de roles usando metadata de usuário</li>
            <li>✅ Middleware de autorização baseado em Supabase JWT</li>
            <li>✅ Políticas RLS configuradas para controle de acesso por role</li>
          </ul>
        </div>
      </div>
    </div>
  )
}