-- Setup script for security features
-- Run this after the main schema setup

-- First, run the security schema
\i security-schema.sql

-- Insert initial data and configurations
-- (Data retention policies are handled in the application code)

-- Create RLS policies for security tables

-- Audit logs - only admins can read, system can write
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.active = true
        )
    );

CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- Security alerts - only admins
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage security alerts" ON public.security_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.active = true
        )
    );

-- Data subject requests - only admins
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage data subject requests" ON public.data_subject_requests
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.active = true
        )
    );

-- Backup logs - only admins
ALTER TABLE public.backup_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup logs" ON public.backup_logs
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
            AND users.active = true
        )
    );

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_composite 
    ON public.audit_logs(user_id, action, timestamp DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_failed_logins 
    ON public.audit_logs(action, user_email, ip_address, timestamp) 
    WHERE action = 'LOGIN_FAILED';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_sensitive_access 
    ON public.audit_logs(action, user_id, timestamp) 
    WHERE action = 'SENSITIVE_DATA_ACCESS';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_security_alerts_active 
    ON public.security_alerts(status, created_at) 
    WHERE status = 'ACTIVE';

-- Create functions for automated security monitoring

-- Function to detect multiple failed logins
CREATE OR REPLACE FUNCTION detect_failed_login_attempts()
RETURNS TABLE (
    ip_address INET,
    user_email TEXT,
    attempt_count BIGINT,
    last_attempt TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.ip_address,
        al.user_email,
        COUNT(*) as attempt_count,
        MAX(al.timestamp) as last_attempt
    FROM public.audit_logs al
    WHERE al.action = 'LOGIN_FAILED'
    AND al.timestamp >= NOW() - INTERVAL '1 hour'
    AND al.ip_address IS NOT NULL
    GROUP BY al.ip_address, al.user_email
    HAVING COUNT(*) >= 5
    ORDER BY attempt_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to detect unusual data access patterns
CREATE OR REPLACE FUNCTION detect_unusual_data_access()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_email TEXT,
    access_count BIGINT,
    last_access TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.user_id,
        al.user_name,
        al.user_email,
        COUNT(*) as access_count,
        MAX(al.timestamp) as last_access
    FROM public.audit_logs al
    WHERE al.action = 'SENSITIVE_DATA_ACCESS'
    AND al.timestamp >= NOW() - INTERVAL '24 hours'
    AND al.user_id IS NOT NULL
    GROUP BY al.user_id, al.user_name, al.user_email
    HAVING COUNT(*) >= 50
    ORDER BY access_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically create security alerts
CREATE OR REPLACE FUNCTION create_security_alert(
    p_alert_type TEXT,
    p_severity alert_severity,
    p_title TEXT,
    p_description TEXT,
    p_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    alert_id UUID;
    existing_alert_id UUID;
BEGIN
    -- Check if similar alert already exists and is active
    SELECT id INTO existing_alert_id
    FROM public.security_alerts
    WHERE alert_type = p_alert_type
    AND status = 'ACTIVE'
    AND (user_id = p_user_id OR (user_id IS NULL AND p_user_id IS NULL))
    AND (ip_address = p_ip_address OR (ip_address IS NULL AND p_ip_address IS NULL))
    AND created_at >= NOW() - INTERVAL '1 hour';

    IF existing_alert_id IS NOT NULL THEN
        RETURN existing_alert_id;
    END IF;

    -- Create new alert
    INSERT INTO public.security_alerts (
        alert_type, severity, title, description, 
        user_id, ip_address, metadata, status, created_at
    ) VALUES (
        p_alert_type, p_severity, p_title, p_description,
        p_user_id, p_ip_address, p_metadata, 'ACTIVE', NOW()
    ) RETURNING id INTO alert_id;

    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically monitor failed logins
CREATE OR REPLACE FUNCTION trigger_failed_login_monitoring()
RETURNS TRIGGER AS $$
DECLARE
    failed_count INTEGER;
    alert_id UUID;
BEGIN
    -- Only process failed login attempts
    IF NEW.action = 'LOGIN_FAILED' AND NEW.ip_address IS NOT NULL THEN
        -- Count recent failed attempts from this IP
        SELECT COUNT(*) INTO failed_count
        FROM public.audit_logs
        WHERE action = 'LOGIN_FAILED'
        AND ip_address = NEW.ip_address
        AND timestamp >= NOW() - INTERVAL '1 hour';

        -- Create alert if threshold exceeded
        IF failed_count >= 5 THEN
            SELECT create_security_alert(
                'MULTIPLE_FAILED_LOGINS_IP',
                'HIGH',
                'Multiple Failed Login Attempts from IP',
                format('%s failed login attempts from IP %s in the last hour', failed_count, NEW.ip_address),
                NULL,
                NEW.ip_address,
                jsonb_build_object('failed_attempts', failed_count, 'threshold', 5)
            ) INTO alert_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_security_monitoring
    AFTER INSERT ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION trigger_failed_login_monitoring();

-- Create scheduled job for data retention (if pg_cron is available)
-- This would typically be set up separately in production
/*
SELECT cron.schedule('data-retention-cleanup', '0 2 * * 0', 'SELECT clean_old_audit_logs();');
SELECT cron.schedule('security-alert-cleanup', '0 3 * * 0', 'SELECT clean_old_security_alerts();');
*/

-- Create view for security dashboard
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
    (SELECT COUNT(*) FROM public.audit_logs WHERE action = 'LOGIN_FAILED' AND timestamp >= NOW() - INTERVAL '24 hours') as failed_logins_24h,
    (SELECT COUNT(*) FROM public.audit_logs WHERE action = 'LOGIN' AND timestamp >= NOW() - INTERVAL '24 hours') as successful_logins_24h,
    (SELECT COUNT(*) FROM public.audit_logs WHERE action = 'SENSITIVE_DATA_ACCESS' AND timestamp >= NOW() - INTERVAL '24 hours') as sensitive_access_24h,
    (SELECT COUNT(*) FROM public.security_alerts WHERE status = 'ACTIVE') as active_alerts,
    (SELECT COUNT(DISTINCT user_id) FROM public.audit_logs WHERE user_id IS NOT NULL AND timestamp >= NOW() - INTERVAL '24 hours') as unique_users_24h,
    (SELECT COUNT(*) FROM public.audit_logs WHERE action = 'EXPORT' AND timestamp >= NOW() - INTERVAL '24 hours') as data_exports_24h;

-- Grant necessary permissions
GRANT SELECT ON security_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION detect_failed_login_attempts() TO authenticated;
GRANT EXECUTE ON FUNCTION detect_unusual_data_access() TO authenticated;
GRANT EXECUTE ON FUNCTION get_security_metrics(INTEGER) TO authenticated;

-- Create notification function for critical security events
CREATE OR REPLACE FUNCTION notify_security_event()
RETURNS TRIGGER AS $$
BEGIN
    -- Send notification for critical alerts
    IF NEW.severity = 'CRITICAL' THEN
        PERFORM pg_notify('security_alert', json_build_object(
            'alert_id', NEW.id,
            'alert_type', NEW.alert_type,
            'severity', NEW.severity,
            'title', NEW.title,
            'description', NEW.description,
            'created_at', NEW.created_at
        )::text);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER security_alert_notification
    AFTER INSERT ON public.security_alerts
    FOR EACH ROW
    EXECUTE FUNCTION notify_security_event();

-- Security configuration is handled in environment variables and application code

COMMIT;