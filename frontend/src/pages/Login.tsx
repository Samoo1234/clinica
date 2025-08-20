import { LoginForm } from '../components/auth/LoginForm'

export function Login() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-200 rounded-full opacity-20"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200 rounded-full opacity-20"></div>
        </div>
        
        {/* Login Form */}
        <div className="relative">
          <LoginForm />
        </div>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-600">
            © 2024 VisionCare. Todos os direitos reservados.
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Sistema de Gestão para Clínicas Oftalmológicas
          </p>
        </div>
      </div>
    </div>
  )
}