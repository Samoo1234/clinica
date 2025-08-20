-- Setup script for consultations functionality
-- Run this script to set up the consultations table and related functionality

-- Load the consultations schema

-- Insert some test data for consultations (optional)
DO $$
DECLARE
    test_patient_id UUID;
    test_doctor_id UUID;
    test_appointment_id UUID;
BEGIN
    -- Get a test patient
    SELECT id INTO test_patient_id FROM patients LIMIT 1;
    
    -- Get a test doctor
    SELECT id INTO test_doctor_id FROM users WHERE role = 'doctor' LIMIT 1;
    
    -- Get a test appointment
    SELECT id INTO test_appointment_id FROM appointments LIMIT 1;
    
    -- Only insert test data if we have the required records
    IF test_patient_id IS NOT NULL AND test_doctor_id IS NOT NULL AND test_appointment_id IS NOT NULL THEN
        -- Insert a sample consultation
        INSERT INTO consultations (
            appointment_id,
            patient_id,
            doctor_id,
            status,
            start_time,
            vital_signs,
            notes,
            created_at,
            updated_at
        ) VALUES (
            test_appointment_id,
            test_patient_id,
            test_doctor_id,
            'completed',
            NOW() - INTERVAL '2 hours',
            '{"bloodPressure": "120/80", "heartRate": 72, "temperature": 36.5, "weight": 70, "height": 175}',
            'Consulta de rotina realizada com sucesso. Paciente apresenta boa saúde geral.',
            NOW() - INTERVAL '2 hours',
            NOW() - INTERVAL '1 hour'
        ) ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample consultation data inserted successfully';
    ELSE
        RAISE NOTICE 'Skipping test data insertion - missing required records (patients, doctors, or appointments)';
    END IF;
END $$;

-- Consultations setup completed!

-- Show table info
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE tablename = 'consultations';

-- Show column info
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultations'
ORDER BY ordinal_position;