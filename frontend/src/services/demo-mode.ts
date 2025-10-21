// Demo mode para quando Supabase não está configurado
import type { Patient, PatientAddress, EmergencyContact } from '../types/database'

export const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY

export const demoPatients: Patient[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(11) 99999-9999',
    cpf: '123.456.789-00',
    birth_date: '1980-05-15',
    address: {
      street: 'Rua das Flores',
      number: '123',
      complement: '',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567'
    } as PatientAddress,
    emergency_contact: {
      name: 'Maria Silva',
      phone: '(11) 88888-8888',
      relationship: 'Esposa'
    } as EmergencyContact,
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
    address: {
      street: 'Av. Paulista',
      number: '456',
      complement: 'Apto 100',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01310-100'
    } as PatientAddress,
    emergency_contact: {
      name: 'João Santos',
      phone: '(11) 77777-7777',
      relationship: 'Marido'
    } as EmergencyContact,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

export const showDemoWarning = () => {
  console.warn('🚨 MODO DEMO ATIVO - Configure as variáveis de ambiente do Supabase')
}