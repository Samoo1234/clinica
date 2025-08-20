-- Security and Audit Database Schema
-- Execute this script in Supabase SQL Editor after the main schema

-- Create security-related types
CREATE TYPE audit_action AS ENUM (
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'CREATE', 'READ', 'UPDATE', 'DELETE',
    'EXPORT', 'IMPORT', 'BACKUP', 'RESTORE',
    'PERMISSION_CHANGE', 'PASSWORD_CHANGE',
    'DATA_ACCESS', 'SENSITIVE_DATA_ACCESS',
    'INTEGRATION_CALL', 'API_ACCESS',
    'FILE_UPLOAD', 'FILE_DOWNLOAD', 'FILE_DELETE'
);

CREATE TYPE resource_type AS ENUM (
    'USER', 'PATIENT', 'MEDICAL_RECORD', 'APPOINTMENT',
    'ATTACHMENT', 'INVOICE', 'INTEGRATION_LOG',
    'SYSTEM', 'AUTH', 'API', 'FILE'
);

CREATE TYPE alert_severity AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE alert_status AS ENUM ('ACTIVE', 'INVESTIGATING', 'RESOLVED', 'FALSE_POSITIVE');

CREATE TYPE request_type AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'PORTABILITY', 'RESTRICTION');
CREATE TYPE request_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_name TEXT NOT NULL,
    action audit_action NOT NULL,
    resource_type resource_type NOT NULL,
    resource_id UUID,
    old_values JSONB DEFAULT '{}',
    new_values JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT true,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Security alerts table
CREATE TABLE public.security_alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    alert_type TEXT NOT NULL,
    severity alert_severity NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    status alert_status NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    resolution_notes TEXT
);

-- Data subject requests table (LGPD compliance)
CREATE TABLE public.data_subject_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    request_type request_type NOT NULL,
    status request_status NOT NULL DEFAULT 'PENDING',
    requested_by TEXT NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    data_provided JSONB DEFAULT '{}'
);

-- Backup logs table
CREATE TABLE public.backup_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    backup_type TEXT NOT NULL,
    status TEXT NOT NULL,
    file_path TEXT,
    file_size BIGINT,
    checksum TEXT,
    encryption_key_id TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for security tables
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX idx_audit_logs_resource_id ON public.audit_logs(resource_id);
CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs(timestamp);
CREATE INDEX idx_audit_logs_ip_address ON public.audit_logs(ip_address);
CREATE INDEX idx_audit_logs_user_email ON public.audit_logs(user_email);

CREATE INDEX idx_security_alerts_alert_type ON public.security_alerts(alert_type);
CREATE INDEX idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX idx_security_alerts_status ON public.security_alerts(status);
CREATE INDEX idx_security_alerts_user_id ON public.security_alerts(user_id);
CREATE INDEX idx_security_alerts_created_at ON public.security_alerts(created_at);
CREATE INDEX idx_security_alerts_ip_address ON public.security_alerts(ip_address);

CREATE INDEX idx_data_subject_requests_patient_id ON public.data_subject_requests(patient_id);
CREATE INDEX idx_data_subject_requests_request_type ON public.data_subject_requests(request_type);
CREATE INDEX idx_data_subject_requests_status ON public.data_subject_requests(status);
CREATE INDEX idx_data_subject_requests_requested_at ON public.data_subject_requests(requested_at);

CREATE INDEX idx_backup_logs_backup_type ON public.backup_logs(backup_type);
CREATE INDEX idx_backup_logs_status ON public.backup_logs(status);
CREATE INDEX idx_backup_logs_started_at ON public.backup_logs(started_at);

-- Create function to automatically clean old audit logs
CREATE OR REPLACE FUNCTION clean_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete audit logs older than 7 years (2555 days)
    DELETE FROM public.audit_logs 
    WHERE timestamp < NOW() - INTERVAL '2555 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log the cleanup operation
    INSERT INTO public.audit_logs (
        user_id, user_email, user_name, action, resource_type,
        timestamp, success, metadata
    ) VALUES (
        NULL, 'system', 'SYSTEM', 'DELETE', 'SYSTEM',
        NOW(), true, 
        jsonb_build_object('operation', 'audit_log_cleanup', 'deleted_count', deleted_count)
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically clean old security alerts
CREATE OR REPLACE FUNCTION clean_old_security_alerts()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete resolved security alerts older than 1 year
    DELETE FROM public.security_alerts 
    WHERE status IN ('RESOLVED', 'FALSE_POSITIVE') 
    AND resolved_at < NOW() - INTERVAL '365 days';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get security metrics
CREATE OR REPLACE FUNCTION get_security_metrics(hours_back INTEGER DEFAULT 24)
RETURNS TABLE (
    failed_logins BIGINT,
    successful_logins BIGINT,
    sensitive_data_access BIGINT,
    api_calls BIGINT,
    unique_users BIGINT,
    active_alerts BIGINT,
    data_exports BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.audit_logs 
         WHERE action = 'LOGIN_FAILED' 
         AND timestamp >= NOW() - (hours_back || ' hours')::INTERVAL) as failed_logins,
        
        (SELECT COUNT(*) FROM public.audit_logs 
         WHERE action = 'LOGIN' 
         AND timestamp >= NOW() - (hours_back || ' hours')::INTERVAL) as successful_logins,
        
        (SELECT COUNT(*) FROM public.audit_logs 
         WHERE action = 'SENSITIVE_DATA_ACCESS' 
         AND timestamp >= NOW() - (hours_back || ' hours')::INTERVAL) as sensitive_data_access,
        
        (SELECT COUNT(*) FROM public.audit_logs 
         WHERE action = 'API_ACCESS' 
         AND timestamp >= NOW() - (hours_back || ' hours')::INTERVAL) as api_calls,
        
        (SELECT COUNT(DISTINCT user_id) FROM public.audit_logs 
         WHERE user_id IS NOT NULL 
         AND timestamp >= NOW() - (hours_back || ' hours')::INTERVAL) as unique_users,
        
        (SELECT COUNT(*) FROM public.security_alerts 
         WHERE status = 'ACTIVE') as active_alerts,
        
        (SELECT COUNT(*) FROM public.audit_logs 
         WHERE action = 'EXPORT' 
         AND timestamp >= NOW() - (hours_back || ' hours')::INTERVAL) as data_exports;
END;
$$ LANGUAGE plpgsql;