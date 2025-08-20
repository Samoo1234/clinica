-- Simple test data for VisionCare (without auth users)
-- Execute this script in Supabase SQL Editor after creating the schema and RLS policies

-- This version creates test data without requiring auth.users entries
-- For testing purposes only - in production, use proper Supabase Auth

-- Insert test patients first (no dependencies)
INSERT INTO public.patients (id, cpf, name, birth_date, phone, email, address, insurance_info, emergency_contact) VALUES
  (
    '660e8400-e29b-41d4-a716-446655440001',
    '12345678901',
    'José da Silva',
    '1980-05-15',
    '(11) 99999-1234',
    'jose.silva@email.com',
    '{"street": "Rua das Flores", "number": "123", "complement": "Apto 45", "neighborhood": "Centro", "city": "São Paulo", "state": "SP", "zipCode": "01234-567"}',
    '{"provider": "Unimed", "planNumber": "123456789", "validUntil": "2024-12-31"}',
    '{"name": "Maria da Silva", "phone": "(11) 98888-5678", "relationship": "Esposa"}'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440002',
    '98765432109',
    'Ana Paula Santos',
    '1975-08-22',
    '(11) 88888-9876',
    'ana.santos@email.com',
    '{"street": "Av. Paulista", "number": "1000", "neighborhood": "Bela Vista", "city": "São Paulo", "state": "SP", "zipCode": "01310-100"}',
    '{"provider": "Bradesco Saúde", "planNumber": "987654321", "validUntil": "2024-06-30"}',
    '{"name": "Carlos Santos", "phone": "(11) 97777-1234", "relationship": "Marido"}'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440003',
    '11122233344',
    'Pedro Oliveira',
    '1990-12-10',
    '(11) 77777-5555',
    'pedro.oliveira@email.com',
    '{"street": "Rua Augusta", "number": "500", "complement": "Casa", "neighborhood": "Consolação", "city": "São Paulo", "state": "SP", "zipCode": "01305-000"}',
    '{}',
    '{"name": "Lucia Oliveira", "phone": "(11) 96666-7890", "relationship": "Mãe"}'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440004',
    '55566677788',
    'Mariana Costa',
    '1985-03-18',
    '(11) 66666-4444',
    'mariana.costa@email.com',
    '{"street": "Rua Oscar Freire", "number": "200", "neighborhood": "Jardins", "city": "São Paulo", "state": "SP", "zipCode": "01426-000"}',
    '{"provider": "SulAmérica", "planNumber": "555666777", "validUntil": "2024-09-15"}',
    '{"name": "Roberto Costa", "phone": "(11) 95555-3333", "relationship": "Pai"}'
  ),
  (
    '660e8400-e29b-41d4-a716-446655440005',
    '99988877766',
    'Roberto Ferreira',
    '1965-07-05',
    '(11) 55555-2222',
    'roberto.ferreira@email.com',
    '{"street": "Rua Haddock Lobo", "number": "800", "complement": "Cobertura", "neighborhood": "Cerqueira César", "city": "São Paulo", "state": "SP", "zipCode": "01414-000"}',
    '{}',
    '{"name": "Helena Ferreira", "phone": "(11) 94444-1111", "relationship": "Esposa"}'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test integration logs (no dependencies)
INSERT INTO public.integration_logs (id, service_name, operation, request_data, response_data, status, error_message) VALUES
  (
    'aa0e8400-e29b-41d4-a716-446655440001',
    'nfse_api',
    'emit_invoice',
    '{"appointment_id": "test-appointment", "amount": 150.00}',
    '{"nfse_number": "2024000001", "status": "success"}',
    'success',
    null
  ),
  (
    'aa0e8400-e29b-41d4-a716-446655440002',
    'digital_signature',
    'sign_prescription',
    '{"record_id": "test-record", "document_type": "prescription"}',
    '{"signature_id": "sig_123456", "status": "signed"}',
    'success',
    null
  ),
  (
    'aa0e8400-e29b-41d4-a716-446655440003',
    'partner_api',
    'share_prescription',
    '{"patient_cpf": "12345678901", "prescription_data": "test"}',
    '{}',
    'error',
    'Partner API temporarily unavailable'
  )
ON CONFLICT (id) DO NOTHING;

-- Success message
SELECT 'Test data inserted successfully! Patients and integration logs are ready.' as message;