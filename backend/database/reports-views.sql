-- VisionCare Reports Views and Functions
-- Execute this script in Supabase SQL Editor after main schema

-- View for appointment statistics
CREATE OR REPLACE VIEW appointment_stats AS
SELECT 
    DATE_TRUNC('month', scheduled_at) as month,
    DATE_TRUNC('week', scheduled_at) as week,
    DATE_TRUNC('day', scheduled_at) as day,
    doctor_id,
    u.name as doctor_name,
    status,
    payment_status,
    COUNT(*) as appointment_count,
    SUM(value) as total_value,
    AVG(value) as average_value
FROM appointments a
JOIN users u ON a.doctor_id = u.id
WHERE u.role = 'doctor'
GROUP BY 
    DATE_TRUNC('month', scheduled_at),
    DATE_TRUNC('week', scheduled_at),
    DATE_TRUNC('day', scheduled_at),
    doctor_id, u.name, status, payment_status;

-- View for patient demographics
CREATE OR REPLACE VIEW patient_demographics AS
SELECT 
    DATE_TRUNC('month', created_at) as registration_month,
    COUNT(*) as new_patients,
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) as age_group,
    CASE 
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) < 18 THEN 'Menor de 18'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 18 AND 30 THEN '18-30'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 31 AND 50 THEN '31-50'
        WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date)) BETWEEN 51 AND 70 THEN '51-70'
        ELSE 'Acima de 70'
    END as age_range
FROM patients
GROUP BY 
    DATE_TRUNC('month', created_at),
    EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date));

-- View for financial summary
CREATE OR REPLACE VIEW financial_summary AS
SELECT 
    DATE_TRUNC('month', scheduled_at) as month,
    DATE_TRUNC('day', scheduled_at) as day,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_appointments,
    COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_appointments,
    SUM(value) as total_revenue,
    SUM(CASE WHEN payment_status = 'paid' THEN value ELSE 0 END) as received_revenue,
    SUM(CASE WHEN payment_status = 'pending' THEN value ELSE 0 END) as pending_revenue
FROM appointments
WHERE value IS NOT NULL
GROUP BY 
    DATE_TRUNC('month', scheduled_at),
    DATE_TRUNC('day', scheduled_at);

-- View for doctor performance
CREATE OR REPLACE VIEW doctor_performance AS
SELECT 
    u.id as doctor_id,
    u.name as doctor_name,
    DATE_TRUNC('month', a.scheduled_at) as month,
    COUNT(*) as total_appointments,
    COUNT(CASE WHEN a.status = 'completed' THEN 1 END) as completed_appointments,
    COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END) as cancelled_appointments,
    COUNT(CASE WHEN a.status = 'no_show' THEN 1 END) as no_show_appointments,
    SUM(a.value) as total_revenue,
    AVG(a.value) as average_consultation_value,
    COUNT(mr.id) as medical_records_created
FROM users u
LEFT JOIN appointments a ON u.id = a.doctor_id
LEFT JOIN medical_records mr ON u.id = mr.doctor_id 
    AND DATE_TRUNC('month', mr.created_at) = DATE_TRUNC('month', a.scheduled_at)
WHERE u.role = 'doctor'
GROUP BY u.id, u.name, DATE_TRUNC('month', a.scheduled_at);

-- View for consultation types analysis
CREATE OR REPLACE VIEW consultation_analysis AS
SELECT 
    DATE_TRUNC('month', mr.consultation_date) as month,
    CASE 
        WHEN mr.diagnosis ILIKE '%miopia%' THEN 'Miopia'
        WHEN mr.diagnosis ILIKE '%hipermetropia%' THEN 'Hipermetropia'
        WHEN mr.diagnosis ILIKE '%astigmatismo%' THEN 'Astigmatismo'
        WHEN mr.diagnosis ILIKE '%catarata%' THEN 'Catarata'
        WHEN mr.diagnosis ILIKE '%glaucoma%' THEN 'Glaucoma'
        WHEN mr.diagnosis ILIKE '%retinopatia%' THEN 'Retinopatia'
        WHEN mr.diagnosis IS NOT NULL AND mr.diagnosis != '' THEN 'Outros'
        ELSE 'Não especificado'
    END as diagnosis_category,
    COUNT(*) as consultation_count,
    COUNT(DISTINCT mr.patient_id) as unique_patients
FROM medical_records mr
GROUP BY 
    DATE_TRUNC('month', mr.consultation_date),
    CASE 
        WHEN mr.diagnosis ILIKE '%miopia%' THEN 'Miopia'
        WHEN mr.diagnosis ILIKE '%hipermetropia%' THEN 'Hipermetropia'
        WHEN mr.diagnosis ILIKE '%astigmatismo%' THEN 'Astigmatismo'
        WHEN mr.diagnosis ILIKE '%catarata%' THEN 'Catarata'
        WHEN mr.diagnosis ILIKE '%glaucoma%' THEN 'Glaucoma'
        WHEN mr.diagnosis ILIKE '%retinopatia%' THEN 'Retinopatia'
        WHEN mr.diagnosis IS NOT NULL AND mr.diagnosis != '' THEN 'Outros'
        ELSE 'Não especificado'
    END;

-- View for monthly KPIs
CREATE OR REPLACE VIEW monthly_kpis AS
SELECT 
    DATE_TRUNC('month', COALESCE(a.scheduled_at, p.created_at, mr.consultation_date)) as month,
    COUNT(DISTINCT p.id) as total_patients,
    COUNT(DISTINCT CASE WHEN p.created_at >= DATE_TRUNC('month', CURRENT_DATE) THEN p.id END) as new_patients_this_month,
    COUNT(DISTINCT a.id) as total_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END) as completed_appointments,
    COUNT(DISTINCT CASE WHEN a.status = 'cancelled' OR a.status = 'no_show' THEN a.id END) as missed_appointments,
    ROUND(
        COUNT(DISTINCT CASE WHEN a.status = 'completed' THEN a.id END)::numeric / 
        NULLIF(COUNT(DISTINCT a.id), 0) * 100, 2
    ) as completion_rate,
    SUM(a.value) as total_revenue,
    SUM(CASE WHEN a.payment_status = 'paid' THEN a.value ELSE 0 END) as collected_revenue,
    COUNT(DISTINCT mr.id) as medical_records_created
FROM patients p
FULL OUTER JOIN appointments a ON p.id = a.patient_id
FULL OUTER JOIN medical_records mr ON p.id = mr.patient_id
GROUP BY DATE_TRUNC('month', COALESCE(a.scheduled_at, p.created_at, mr.consultation_date))
ORDER BY month DESC;