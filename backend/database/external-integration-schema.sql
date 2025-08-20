-- External Integration Schema
-- Schema for managing external partner integrations

-- Create external partner types
CREATE TYPE partner_type AS ENUM ('optics', 'pharmacy', 'laboratory', 'other');
CREATE TYPE partner_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE prescription_status AS ENUM ('pending', 'shared', 'dispensed', 'cancelled');

-- External partners table
CREATE TABLE public.external_partners (
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
    permissions JSONB DEFAULT '{}', -- What data they can access
    webhook_url TEXT, -- For receiving notifications
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescription sharing table
CREATE TABLE public.prescription_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES public.external_partners(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    prescription_data JSONB NOT NULL, -- Shared prescription data
    shared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status prescription_status NOT NULL DEFAULT 'pending',
    dispensed_at TIMESTAMP WITH TIME ZONE,
    dispensed_by TEXT, -- Partner employee who dispensed
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner access logs table (extends integration_logs for partner-specific tracking)
CREATE TABLE public.partner_access_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    partner_id UUID NOT NULL REFERENCES public.external_partners(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
    operation TEXT NOT NULL, -- 'patient_lookup', 'prescription_share', 'dispensing_confirm'
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

-- Create indexes
CREATE INDEX idx_external_partners_cnpj ON public.external_partners(cnpj);
CREATE INDEX idx_external_partners_api_key ON public.external_partners(api_key);
CREATE INDEX idx_external_partners_status ON public.external_partners(status);
CREATE INDEX idx_prescription_shares_record_id ON public.prescription_shares(record_id);
CREATE INDEX idx_prescription_shares_partner_id ON public.prescription_shares(partner_id);
CREATE INDEX idx_prescription_shares_patient_id ON public.prescription_shares(patient_id);
CREATE INDEX idx_prescription_shares_status ON public.prescription_shares(status);
CREATE INDEX idx_partner_access_logs_partner_id ON public.partner_access_logs(partner_id);
CREATE INDEX idx_partner_access_logs_patient_id ON public.partner_access_logs(patient_id);
CREATE INDEX idx_partner_access_logs_created_at ON public.partner_access_logs(created_at);
CREATE INDEX idx_partner_access_logs_operation ON public.partner_access_logs(operation);

-- Create triggers for updated_at
CREATE TRIGGER update_external_partners_updated_at 
    BEFORE UPDATE ON public.external_partners 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescription_shares_updated_at 
    BEFORE UPDATE ON public.prescription_shares 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate API keys
CREATE OR REPLACE FUNCTION generate_api_key()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(32), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate API secrets
CREATE OR REPLACE FUNCTION generate_api_secret()
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(64), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to validate partner permissions
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