import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Dashboard } from '../pages/Dashboard'
import { Patients } from '../pages/Patients'
import { Appointments } from '../pages/Appointments'
import { MedicalRecords } from '../pages/MedicalRecords'
import Consultations from '../pages/Consultations'
import Financial from '../pages/Financial'
import FiscalManagement from '../pages/FiscalManagement'
import Reports from '../pages/Reports'
import { SecurityManagement } from '../pages/SecurityManagement'
import ModuleSettings from '../pages/ModuleSettings'
import DigitalSignature from '../pages/DigitalSignature'
import ExternalIntegration from '../pages/ExternalIntegration'
import NotificationManagement from '../pages/NotificationManagement'

// Placeholder components for routes not yet implemented
function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-600">Esta funcionalidade será implementada em breve</p>
      </div>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Em Desenvolvimento</h3>
        <p className="text-gray-600">
          Esta página será implementada nas próximas tarefas do projeto.
        </p>
      </div>
    </div>
  )
}

export function AppRoutes() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/consultations" element={<Consultations />} />
        <Route path="/financial" element={<Financial />} />
        <Route path="/fiscal-management" element={<FiscalManagement />} />
        <Route path="/digital-signature" element={<DigitalSignature />} />
        <Route path="/external-integration" element={<ExternalIntegration />} />
        <Route path="/notifications" element={<NotificationManagement />} />
        <Route path="/invoices" element={<ComingSoon title="Notas Fiscais" />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/security" element={<SecurityManagement />} />
        <Route path="/settings/modules" element={<ModuleSettings />} />
        <Route path="/users" element={<ComingSoon title="Gestão de Usuários" />} />
        <Route path="/settings" element={<ComingSoon title="Configurações" />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}