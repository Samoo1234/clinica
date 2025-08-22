// Demo mode para quando Supabase não está configurado
import type { Patient } from '../types/database'

export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export const demoPatients: Patient[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    cpf: '123.456.789-00',
    birth_date: '1980-05-15',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01234-567',
    emergency_contact: 'Maria Silva - (11) 88888-8888',
    medical_history: 'Histórico médico do paciente',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    name: 'Maria Santos',
    email: 'maria@email.com',
    phone: '(11) 88888-8888',
    cpf: '987.654.321-00',
    birth_date: '1975-08-22',
    address: 'Av. Paulista, 456',
    city: 'São Paulo',
    state: 'SP',
    zip_code: '01310-100',
    emergency_contact: 'João Santos - (11) 77777-7777',
    medical_history: 'Histórico médico da paciente',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const showDemoWarning = () => {
  console.warn('🚨 MODO DEMO ATIVO - Configure as variáveis de ambiente do Supabase')
}