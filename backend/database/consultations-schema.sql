-- Consultations table
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'in_progress', 'completed', 'cancelled')),
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    vital_signs JSONB DEFAULT '{}',
    notes TEXT,
    diagnosis TEXT,
    treatment TEXT,
    prescription TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON consultations(appointment_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_created_at ON consultations(created_at);

-- RLS Policies
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;

-- Policy for doctors to see their own consultations
CREATE POLICY "Doctors can view their own consultations" ON consultations
    FOR SELECT USING (
        auth.uid() = doctor_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'receptionist')
        )
    );

-- Policy for creating consultations
CREATE POLICY "Doctors and admins can create consultations" ON consultations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('doctor', 'admin')
        )
    );

-- Policy for updating consultations
CREATE POLICY "Doctors can update their own consultations" ON consultations
    FOR UPDATE USING (
        auth.uid() = doctor_id OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin')
        )
    );

-- Policy for deleting consultations (admin only)
CREATE POLICY "Only admins can delete consultations" ON consultations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_consultations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_consultations_updated_at
    BEFORE UPDATE ON consultations
    FOR EACH ROW
    EXECUTE FUNCTION update_consultations_updated_at();

-- Add consultation_id to medical_records if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'medical_records' 
        AND column_name = 'consultation_id'
    ) THEN
        ALTER TABLE medical_records 
        ADD COLUMN consultation_id UUID REFERENCES consultations(id) ON DELETE SET NULL;
        
        CREATE INDEX IF NOT EXISTS idx_medical_records_consultation_id 
        ON medical_records(consultation_id);
    END IF;
END $$;