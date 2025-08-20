-- Digital Signature Integration Schema
-- Execute this script in Supabase SQL Editor after main schema

-- Create digital signature status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE signature_status AS ENUM ('pending', 'sent', 'signed', 'failed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Digital signatures table (create only if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.digital_signatures (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    record_id UUID NOT NULL REFERENCES public.medical_records(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL, -- 'prescription', 'report', 'certificate'
    document_content TEXT NOT NULL,
    signature_provider TEXT NOT NULL, -- 'docusign', 'adobe_sign', etc.
    external_signature_id TEXT, -- ID from external signature service
    signature_url TEXT, -- URL for signing
    status signature_status NOT NULL DEFAULT 'pending',
    signed_document_path TEXT, -- Path to signed document
    signature_data JSONB DEFAULT '{}', -- Metadata from signature service
    signer_email TEXT NOT NULL,
    signer_name TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    signed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_digital_signatures_record_id ON public.digital_signatures(record_id);
CREATE INDEX idx_digital_signatures_status ON public.digital_signatures(status);
CREATE INDEX idx_digital_signatures_external_id ON public.digital_signatures(external_signature_id);
CREATE INDEX idx_digital_signatures_created_at ON public.digital_signatures(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_digital_signatures_updated_at 
    BEFORE UPDATE ON public.digital_signatures 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE public.digital_signatures ENABLE ROW LEVEL SECURITY;

-- Policy for doctors to manage their own signatures
CREATE POLICY "Doctors can manage their signatures" ON public.digital_signatures
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.medical_records mr
            JOIN public.users u ON mr.doctor_id = u.id
            WHERE mr.id = digital_signatures.record_id
            AND u.id = auth.uid()
            AND u.role = 'doctor'
        )
    );

-- Policy for admins to view all signatures
CREATE POLICY "Admins can view all signatures" ON public.digital_signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );