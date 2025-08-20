-- Test data for VisionCare
-- Execute this script in Supabase SQL Editor after creating the schema and RLS policies

-- IMPORTANT: This script temporarily disables foreign key constraints to insert test data
-- In production, users would be created through Supabase Auth signup

-- Temporarily disable foreign key constraint for test data insertion
ALTER TABLE public.users DISABLE TRIGGER ALL;
ALTER TABLE public.users DROP CONSTRAINT users_id_fkey;

-- Insert test users directly into public.users for testing purposes
INSERT INTO public.users (id, email, name, role, active) VALUES
  ('550e8400-e29b-41d4-a716-446655440001', 'admin@visioncare.com.br', 'Dr. Ana Silva', 'admin', true),
  ('550e8400-e29b-41d4-a716-446655440002', 'dr.carlos@visioncare.com.br', 'Dr. Carlos Oliveira', 'doctor', true),
  ('550e8400-e29b-41d4-a716-446655440003', 'dr.maria@visioncare.com.br', 'Dra. Maria Santos', 'doctor', true),
  ('550e8400-e29b-41d4-a716-446655440004', 'recepcao@visioncare.com.br', 'Fernanda Costa', 'receptionist', true),
  ('550e8400-e29b-41d4-a716-446655440005', 'recepcao2@visioncare.com.br', 'João Pereira', 'receptionist', true)
ON CONFLICT (id) DO NOTHING;

-- Re-enable triggers (but keep the foreign key constraint disabled for test environment)
ALTER TABLE public.users ENABLE TRIGGER ALL;

-- Insert test patients
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

-- Insert test appointments
INSERT INTO public.appointments (id, patient_id, doctor_id, scheduled_at, duration_minutes, status, notes, value, payment_status) VALUES
  (
    '770e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '2024-01-15 09:00:00+00',
    60,
    'completed',
    'Consulta de rotina - primeira vez',
    150.00,
    'paid'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '2024-01-15 10:30:00+00',
    45,
    'completed',
    'Retorno - acompanhamento glaucoma',
    120.00,
    'paid'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440003',
    '660e8400-e29b-41d4-a716-446655440003',
    '550e8400-e29b-41d4-a716-446655440002',
    '2024-01-16 14:00:00+00',
    30,
    'scheduled',
    'Consulta de rotina',
    150.00,
    'pending'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440004',
    '660e8400-e29b-41d4-a716-446655440004',
    '550e8400-e29b-41d4-a716-446655440003',
    '2024-01-17 11:00:00+00',
    60,
    'confirmed',
    'Exame de vista - renovação CNH',
    100.00,
    'pending'
  ),
  (
    '770e8400-e29b-41d4-a716-446655440005',
    '660e8400-e29b-41d4-a716-446655440005',
    '550e8400-e29b-41d4-a716-446655440002',
    '2024-01-18 15:30:00+00',
    45,
    'scheduled',
    'Consulta especializada - catarata',
    200.00,
    'pending'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test medical records for completed appointments
INSERT INTO public.medical_records (id, patient_id, doctor_id, consultation_date, chief_complaint, anamnesis, physical_exam, diagnosis, prescription) VALUES
  (
    '880e8400-e29b-41d4-a716-446655440001',
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440002',
    '2024-01-15',
    'Dificuldade para enxergar de longe',
    'Paciente relata dificuldade progressiva para enxergar objetos distantes há aproximadamente 6 meses. Nega dor ocular, vermelhidão ou secreção. Trabalha muito com computador.',
    '{"visualAcuity": {"rightEye": "20/40", "leftEye": "20/30"}, "intraocularPressure": {"rightEye": 14, "leftEye": 15}, "fundoscopy": "Fundo de olho normal bilateralmente", "biomicroscopy": "Conjuntivas normocoradas, córneas transparentes"}',
    'Miopia bilateral leve a moderada',
    'Prescrição de óculos: OD -1,25 esf; OE -1,00 esf. Retorno em 6 meses ou se houver piora dos sintomas.'
  ),
  (
    '880e8400-e29b-41d4-a716-446655440002',
    '660e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440003',
    '2024-01-15',
    'Retorno para acompanhamento de glaucoma',
    'Paciente em uso regular de colírio hipotensor (Timolol 0,5% 2x/dia). Nega sintomas visuais. Boa aderência ao tratamento.',
    '{"visualAcuity": {"rightEye": "20/25", "leftEye": "20/20"}, "intraocularPressure": {"rightEye": 16, "leftEye": 17}, "fundoscopy": "Escavação papilar 0,6 AO, sem progressão", "biomicroscopy": "Sem alterações"}',
    'Glaucoma primário de ângulo aberto controlado',
    'Manter Timolol 0,5% 2x/dia. Retorno em 3 meses para controle da pressão intraocular.'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test invoices for paid appointments
INSERT INTO public.invoices (id, appointment_id, nfse_number, amount, status, nfse_data, issued_at) VALUES
  (
    '990e8400-e29b-41d4-a716-446655440001',
    '770e8400-e29b-41d4-a716-446655440001',
    '2024000001',
    150.00,
    'issued',
    '{"municipio": "São Paulo", "codigo_servico": "1401", "descricao": "Consulta oftalmológica"}',
    '2024-01-15 10:00:00+00'
  ),
  (
    '990e8400-e29b-41d4-a716-446655440002',
    '770e8400-e29b-41d4-a716-446655440002',
    '2024000002',
    120.00,
    'issued',
    '{"municipio": "São Paulo", "codigo_servico": "1401", "descricao": "Consulta oftalmológica - retorno"}',
    '2024-01-15 11:30:00+00'
  )
ON CONFLICT (id) DO NOTHING;

-- Insert test integration logs
INSERT INTO public.integration_logs (id, service_name, operation, request_data, response_data, status, error_message) VALUES
  (
    'aa0e8400-e29b-41d4-a716-446655440001',
    'nfse_api',
    'emit_invoice',
    '{"appointment_id": "770e8400-e29b-41d4-a716-446655440001", "amount": 150.00}',
    '{"nfse_number": "2024000001", "status": "success"}',
    'success',
    null
  ),
  (
    'aa0e8400-e29b-41d4-a716-446655440002',
    'digital_signature',
    'sign_prescription',
    '{"record_id": "880e8400-e29b-41d4-a716-446655440001", "document_type": "prescription"}',
    '{"signature_id": "sig_123456", "status": "signed"}',
    'success',
    null
  ),
  (
    'aa0e8400-e29b-41d4-a716-446655440003',
    'partner_api',
    'share_prescription',
    '{"patient_cpf": "12345678901", "prescription_data": "..."}',
    '{}',
    'error',
    'Partner API temporarily unavailable'
  )
ON CONFLICT (id) DO NOTHING;