-- Setup script for External Integration
-- Run this in Supabase SQL Editor after the main schema

-- Create external partner types (if not exists)
DO $$ BEGIN
    CREATE TYPE partner_type AS ENUM ('optics', 'pharmacy', 'laboratory', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE prescription_status AS ENUM ('pending', 'shared', 'dispensed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- External partners table
CREATE TABLE IF NOT EXISTS public.external_partners (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    partner_type partner_type NOT NULL,
    cnpj TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    address JSONB DEFAULT '{}',
    api_key TEXT UNIQUE NOT NULL,
    api_secret TEXT NOT NULL,
    status partner_status NOT NULL DEFAULT 'active',
    permissions JSONB DEFAULT '{}',
    webhook_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription sharing table
CREATE TABLE IF NOT EXISTS public.prescription_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.external_partners(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    prescription_data JSONB NOT NULL,
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status prescription_status NOT NULL DEFAULT 'pending',
    dispensed_at TIMESTAMP WITH TIME ZONE,
    dispensed_by TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner access logs table
CREATE TABLE IF NOT EXISTS public.partner_access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.external_partners(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    operation TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    request_data JSONB DEFAULT '{}',
    response_data JSONB DEFAULT '{}',
    status_code INTEGER NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes (if not exists)
CREATE INDEX IF NOT EXISTS idx_external_partners_cnpj ON public.external_partners(cnpj);
CREATE INDEX IF NOT EXISTS idx_external_partners_api_key ON public.external_partners(api_key);
CREATE INDEX IF NOT EXISTS idx_external_partners_status ON public.external_partners(status);
CREATE INDEX IF NOT EXISTS idx_prescription_shares_record_id ON public.prescription_shares(record_id);
CREATE INDEX IF NOT EXISTS idx_prescription_shares_partner_id ON public.prescription_shares(partner_id);
CREATE INDEX IF NOT EXISTS idx_prescription_shares_patient_id ON public.prescription_shares(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescription_shares_status ON public.prescription_shares(status);
CREATE INDEX IF NOT EXISTS idx_partner_access_logs_partner_id ON public.partner_access_logs(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_access_logs_patient_id ON public.partner_access_logs(patient_id);
CREATE INDEX IF NOT EXISTS idx_partner_access_logs_created_at ON public.partner_access_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_partner_access_logs_operation ON public.partner_access_logs(operation);

-- Create triggers for updated_at (if not exists)
DO $$ BEGIN
    CREATE TRIGGER update_external_partners_updated_at 
        BEFORE UPDATE ON public.external_partners 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_prescription_shares_updated_at 
        BEFORE UPDATE ON public.prescription_shares 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Helper functions
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_api_secret()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(64), 'hex');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION validate_partner_permission(
    partner_uuid UUID,
    required_permission TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    partner_permissions JSONB;
BEGIN
    SELECT permissions INTO partner_permissions
    FROM public.external_partners
    WHERE id = partner_uuid AND status = 'active';
    
    IF partner_permissions IS NULL THEN
        RETURN FALSE;
    END IF;
    
    RETURN (partner_permissions->required_permission)::BOOLEAN = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO public.external_partners (
    name, 
    partner_type, 
    cnpj, 
    email, 
    phone,
    address,
    api_key,
    api_secret,
    permissions
) VALUES (
    'Ótica Exemplo',
    'optics',
    '12.345.678/0001-90',
    'contato@oticaexemplo.com',
    '(11) 99999-9999',
    '{"street": "Rua Exemplo, 123", "city": "São Paulo", "state": "SP"}',
    'sample-api-key-12345',
    'sample-api-secret-67890',
    '{"patient_access": true, "patient_search": true, "prescription_access": true}'
) ON CONFLICT (cnpj) DO NOTHING;

-- Enable RLS (Row Level Security)
ALTER TABLE public.external_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for external_partners
CREATE POLICY "Users can view all partners" ON public.external_partners
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage partners" ON public.external_partners
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- RLS Policies for prescription_shares
CREATE POLICY "Users can view prescription shares" ON public.prescription_shares
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Doctors and admins can manage prescription shares" ON public.prescription_shares
    FOR ALL USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('doctor', 'admin')
        )
    );

-- RLS Policies for partner_access_logs
CREATE POLICY "Only admins can view access logs" ON public.partner_access_logs
    FOR SELECT USING (
        auth.role() = 'authenticated' AND 
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "System can insert access logs" ON public.partner_access_logs
    FOR INSERT WITH CHECK (true);

COMMIT;