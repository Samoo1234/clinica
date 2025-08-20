-- Notifications and Reminders Schema
-- Execute this script in Supabase SQL Editor

-- Create notification types
CREATE TYPE notification_type AS ENUM ('appointment_reminder', 'appointment_confirmation', 'appointment_cancellation', 'payment_reminder', 'custom');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed', 'cancelled');
CREATE TYPE notification_channel AS ENUM ('email', 'sms', 'both');

-- User notification preferences table
CREATE TABLE public.user_notification_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    appointment_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    appointment_reminders_channel notification_channel NOT NULL DEFAULT 'email',
    reminder_hours_before INTEGER NOT NULL DEFAULT 24,
    payment_reminders_enabled BOOLEAN NOT NULL DEFAULT true,
    custom_notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure either user_id or patient_id is set, but not both
    CONSTRAINT check_user_or_patient CHECK (
        (user_id IS NOT NULL AND patient_id IS NULL) OR 
        (user_id IS NULL AND patient_id IS NOT NULL)
    )
);

-- Notification templates table
CREATE TABLE public.notification_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    variables JSONB DEFAULT '[]', -- Array of variable names that can be replaced
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications queue table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    type notification_type NOT NULL,
    channel notification_channel NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status notification_status NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    
    -- Related entities
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- Metadata
    template_id UUID REFERENCES public.notification_templates(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure we have recipient information
    CONSTRAINT check_recipient CHECK (
        recipient_email IS NOT NULL OR recipient_phone IS NOT NULL
    )
);

-- Create indexes for better performance
CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences(user_id);
CREATE INDEX idx_user_notification_preferences_patient_id ON public.user_notification_preferences(patient_id);
CREATE INDEX idx_notification_templates_type ON public.notification_templates(type);
CREATE INDEX idx_notification_templates_active ON public.notification_templates(active);
CREATE INDEX idx_notifications_status ON public.notifications(status);
CREATE INDEX idx_notifications_scheduled_at ON public.notifications(scheduled_at);
CREATE INDEX idx_notifications_appointment_id ON public.notifications(appointment_id);
CREATE INDEX idx_notifications_patient_id ON public.notifications(patient_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);

-- Create triggers for updated_at
CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON public.user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON public.notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();