-- Setup Notifications System
-- Execute this script in Supabase SQL Editor after running notifications-schema.sql

-- Insert default notification templates
INSERT INTO public.notification_templates (name, type, channel, subject, body, variables) VALUES
(
    'appointment_reminder_email_24h',
    'appointment_reminder',
    'email',
    'Lembrete: Consulta agendada para amanhã - VisionCare',
    'Olá {{patient_name}},

Este é um lembrete de que você tem uma consulta agendada para amanhã:

📅 Data: {{appointment_date}}
🕐 Horário: {{appointment_time}}
👨‍⚕️ Médico: {{doctor_name}}
📍 Local: Clínica VisionCare

Por favor, chegue com 15 minutos de antecedência e traga:
- Documento de identidade
- Cartão do convênio (se aplicável)
- Exames anteriores relacionados

Em caso de necessidade de cancelamento ou reagendamento, entre em contato conosco o quanto antes.

Atenciosamente,
Equipe VisionCare
📞 (11) 1234-5678
📧 contato@visioncare.com.br',
    '["patient_name", "appointment_date", "appointment_time", "doctor_name"]'
),
(
    'appointment_reminder_sms_24h',
    'appointment_reminder',
    'sms',
    'Lembrete VisionCare',
    'Olá {{patient_name}}! Lembrete: consulta amanhã {{appointment_date}} às {{appointment_time}} com {{doctor_name}}. Chegue 15min antes. Dúvidas: (11) 1234-5678',
    '["patient_name", "appointment_date", "appointment_time", "doctor_name"]'
),
(
    'appointment_confirmation_email',
    'appointment_confirmation',
    'email',
    'Consulta confirmada - VisionCare',
    'Olá {{patient_name}},

Sua consulta foi confirmada com sucesso!

📅 Data: {{appointment_date}}
🕐 Horário: {{appointment_time}}
👨‍⚕️ Médico: {{doctor_name}}
📍 Local: Clínica VisionCare

Informações importantes:
- Chegue com 15 minutos de antecedência
- Traga documento de identidade
- Traga cartão do convênio (se aplicável)
- Traga exames anteriores relacionados

Você receberá um lembrete 24 horas antes da consulta.

Atenciosamente,
Equipe VisionCare
📞 (11) 1234-5678
📧 contato@visioncare.com.br',
    '["patient_name", "appointment_date", "appointment_time", "doctor_name"]'
),
(
    'appointment_cancellation_email',
    'appointment_cancellation',
    'email',
    'Consulta cancelada - VisionCare',
    'Olá {{patient_name}},

Informamos que sua consulta foi cancelada:

📅 Data: {{appointment_date}}
🕐 Horário: {{appointment_time}}
👨‍⚕️ Médico: {{doctor_name}}

{{cancellation_reason}}

Para reagendar sua consulta, entre em contato conosco:
📞 (11) 1234-5678
📧 contato@visioncare.com.br

Atenciosamente,
Equipe VisionCare',
    '["patient_name", "appointment_date", "appointment_time", "doctor_name", "cancellation_reason"]'
),
(
    'payment_reminder_email',
    'payment_reminder',
    'email',
    'Lembrete de Pagamento - VisionCare',
    'Olá {{patient_name}},

Este é um lembrete sobre o pagamento pendente da sua consulta:

📅 Data da consulta: {{appointment_date}}
👨‍⚕️ Médico: {{doctor_name}}
💰 Valor: R$ {{amount}}
📋 Status: {{payment_status}}

Para efetuar o pagamento ou esclarecer dúvidas, entre em contato conosco:
📞 (11) 1234-5678
📧 contato@visioncare.com.br

Atenciosamente,
Equipe VisionCare',
    '["patient_name", "appointment_date", "doctor_name", "amount", "payment_status"]'
);

-- Insert default notification preferences for existing users
INSERT INTO public.user_notification_preferences (user_id, appointment_reminders_enabled, appointment_reminders_channel, reminder_hours_before)
SELECT 
    id,
    true,
    'email'::notification_channel,
    24
FROM public.users
ON CONFLICT DO NOTHING;

-- Insert default notification preferences for existing patients
INSERT INTO public.user_notification_preferences (patient_id, appointment_reminders_enabled, appointment_reminders_channel, reminder_hours_before)
SELECT 
    id,
    true,
    CASE 
        WHEN email IS NOT NULL AND email != '' THEN 'email'::notification_channel
        ELSE 'sms'::notification_channel
    END,
    24
FROM public.patients
ON CONFLICT DO NOTHING;