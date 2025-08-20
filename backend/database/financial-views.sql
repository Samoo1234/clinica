-- Financial Management Views
-- Execute this script in Supabase SQL Editor after the financial schema

-- View for accounts receivable with patient and appointment details
CREATE OR REPLACE VIEW public.accounts_receivable AS
SELECT 
    p.id,
    p.appointment_id,
    p.amount,
    p.payment_method,
    p.status,
    p.due_date,
    p.created_at,
    a.scheduled_at,
    a.notes as appointment_notes,
    pt.name as patient_name,
    pt.cpf as patient_cpf,
    pt.phone as patient_phone,
    u.name as doctor_name,
    CASE 
        WHEN p.due_date < CURRENT_DATE AND p.status = 'pending' THEN 'overdue'
        WHEN p.due_date = CURRENT_DATE AND p.status = 'pending' THEN 'due_today'
        ELSE p.status::text
    END as payment_status_extended,
    CASE 
        WHEN p.due_date < CURRENT_DATE AND p.status = 'pending' THEN 
            CURRENT_DATE - p.due_date
        ELSE 0
    END as days_overdue
FROM public.payments p
JOIN public.appointments a ON p.appointment_id = a.id
JOIN public.patients pt ON a.patient_id = pt.id
JOIN public.users u ON a.doctor_id = u.id
WHERE p.status = 'pending'
ORDER BY p.due_date ASC;

-- View for financial summary by period
CREATE OR REPLACE VIEW public.financial_summary_daily AS
SELECT 
    ft.transaction_date,
    ft.transaction_type,
    SUM(ft.amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(ft.amount) as average_amount
FROM public.financial_transactions ft
GROUP BY ft.transaction_date, ft.transaction_type
ORDER BY ft.transaction_date DESC, ft.transaction_type;

-- View for payment history with full details
CREATE OR REPLACE VIEW public.payment_history AS
SELECT 
    p.id,
    p.appointment_id,
    p.amount,
    p.payment_method,
    p.payment_date,
    p.status,
    p.notes,
    p.transaction_id,
    p.installments,
    p.installment_number,
    p.created_at,
    a.scheduled_at,
    a.value as appointment_value,
    pt.name as patient_name,
    pt.cpf as patient_cpf,
    u.name as doctor_name,
    sp.service_name,
    sp.description as service_description
FROM public.payments p
JOIN public.appointments a ON p.appointment_id = a.id
JOIN public.patients pt ON a.patient_id = pt.id
JOIN public.users u ON a.doctor_id = u.id
LEFT JOIN public.service_prices sp ON sp.base_price = a.value AND sp.active = true
ORDER BY p.created_at DESC;

-- View for overdue payments with alert information
CREATE OR REPLACE VIEW public.overdue_payments AS
SELECT 
    p.id,
    p.appointment_id,
    p.amount,
    p.due_date,
    p.created_at,
    pt.name as patient_name,
    pt.cpf as patient_cpf,
    pt.phone as patient_phone,
    pt.email as patient_email,
    u.name as doctor_name,
    a.scheduled_at,
    CURRENT_DATE - p.due_date as days_overdue,
    CASE 
        WHEN CURRENT_DATE - p.due_date <= 7 THEN 'recent'
        WHEN CURRENT_DATE - p.due_date <= 30 THEN 'moderate'
        ELSE 'critical'
    END as overdue_severity
FROM public.payments p
JOIN public.appointments a ON p.appointment_id = a.id
JOIN public.patients pt ON a.patient_id = pt.id
JOIN public.users u ON a.doctor_id = u.id
WHERE p.status = 'pending' AND p.due_date < CURRENT_DATE
ORDER BY days_overdue DESC;

-- View for monthly financial performance
CREATE OR REPLACE VIEW public.monthly_financial_performance AS
SELECT 
    DATE_TRUNC('month', ft.transaction_date) as month,
    ft.transaction_type,
    SUM(ft.amount) as total_amount,
    COUNT(*) as transaction_count,
    AVG(ft.amount) as average_amount,
    MIN(ft.amount) as min_amount,
    MAX(ft.amount) as max_amount
FROM public.financial_transactions ft
GROUP BY DATE_TRUNC('month', ft.transaction_date), ft.transaction_type
ORDER BY month DESC, ft.transaction_type;

-- View for patient payment history
CREATE OR REPLACE VIEW public.patient_payment_summary AS
SELECT 
    pt.id as patient_id,
    pt.name as patient_name,
    pt.cpf as patient_cpf,
    COUNT(p.id) as total_payments,
    SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN p.amount ELSE 0 END) as total_overdue,
    MAX(p.payment_date) as last_payment_date,
    MIN(CASE WHEN p.status = 'pending' THEN p.due_date ELSE NULL END) as next_due_date
FROM public.patients pt
LEFT JOIN public.appointments a ON pt.id = a.patient_id
LEFT JOIN public.payments p ON a.id = p.appointment_id
GROUP BY pt.id, pt.name, pt.cpf
HAVING COUNT(p.id) > 0
ORDER BY total_overdue DESC, total_pending DESC;

-- View for service performance analysis
CREATE OR REPLACE VIEW public.service_performance AS
SELECT 
    sp.id,
    sp.service_name,
    sp.description,
    sp.base_price,
    sp.insurance_price,
    COUNT(a.id) as appointments_count,
    SUM(a.value) as total_revenue,
    AVG(a.value) as average_price,
    COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_appointments,
    COUNT(CASE WHEN p.status = 'pending' THEN 1 END) as pending_appointments,
    ROUND(
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END)::numeric / 
        NULLIF(COUNT(a.id), 0) * 100, 2
    ) as payment_rate_percentage
FROM public.service_prices sp
LEFT JOIN public.appointments a ON a.value = sp.base_price
LEFT JOIN public.payments p ON a.id = p.appointment_id
WHERE sp.active = true
GROUP BY sp.id, sp.service_name, sp.description, sp.base_price, sp.insurance_price
ORDER BY total_revenue DESC NULLS LAST;