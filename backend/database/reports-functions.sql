-- VisionCare Reports Functions
-- Execute this script in Supabase SQL Editor after reports-views.sql

-- Function to get appointment report with filters
CREATE OR REPLACE FUNCTION get_appointment_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    doctor_id_filter UUID DEFAULT NULL,
    status_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
    appointment_id UUID,
    patient_name TEXT,
    patient_cpf TEXT,
    doctor_name TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE,
    status appointment_status,
    value DECIMAL(10,2),
    payment_status payment_status,
    consultation_date DATE,
    diagnosis TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as appointment_id,
        p.name as patient_name,
        p.cpf as patient_cpf,
        u.name as doctor_name,
        a.scheduled_at,
        a.status,
        a.value,
        a.payment_status,
        mr.consultation_date,
        mr.diagnosis
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN users u ON a.doctor_id = u.id
    LEFT JOIN medical_records mr ON a.patient_id = mr.patient_id 
        AND DATE(a.scheduled_at) = mr.consultation_date
    WHERE 
        (start_date IS NULL OR DATE(a.scheduled_at) >= start_date)
        AND (end_date IS NULL OR DATE(a.scheduled_at) <= end_date)
        AND (doctor_id_filter IS NULL OR a.doctor_id = doctor_id_filter)
        AND (status_filter IS NULL OR a.status::TEXT = status_filter)
    ORDER BY a.scheduled_at DESC;
END;
$$;

-- Function to get financial report
CREATE OR REPLACE FUNCTION get_financial_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    group_by_period TEXT DEFAULT 'month' -- 'day', 'week', 'month'
)
RETURNS TABLE (
    period TEXT,
    total_appointments BIGINT,
    completed_appointments BIGINT,
    total_revenue DECIMAL(10,2),
    paid_revenue DECIMAL(10,2),
    pending_revenue DECIMAL(10,2),
    completion_rate DECIMAL(5,2),
    payment_rate DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    EXECUTE format('
        SELECT 
            TO_CHAR(DATE_TRUNC(%L, scheduled_at), %L) as period,
            COUNT(*)::BIGINT as total_appointments,
            COUNT(CASE WHEN status = ''completed'' THEN 1 END)::BIGINT as completed_appointments,
            COALESCE(SUM(value), 0) as total_revenue,
            COALESCE(SUM(CASE WHEN payment_status = ''paid'' THEN value ELSE 0 END), 0) as paid_revenue,
            COALESCE(SUM(CASE WHEN payment_status = ''pending'' THEN value ELSE 0 END), 0) as pending_revenue,
            ROUND(
                COUNT(CASE WHEN status = ''completed'' THEN 1 END)::numeric / 
                NULLIF(COUNT(*), 0) * 100, 2
            ) as completion_rate,
            ROUND(
                COUNT(CASE WHEN payment_status = ''paid'' THEN 1 END)::numeric / 
                NULLIF(COUNT(*), 0) * 100, 2
            ) as payment_rate
        FROM appointments
        WHERE 
            (%L IS NULL OR DATE(scheduled_at) >= %L)
            AND (%L IS NULL OR DATE(scheduled_at) <= %L)
        GROUP BY DATE_TRUNC(%L, scheduled_at)
        ORDER BY DATE_TRUNC(%L, scheduled_at) DESC
    ', 
    group_by_period,
    CASE 
        WHEN group_by_period = 'day' THEN 'YYYY-MM-DD'
        WHEN group_by_period = 'week' THEN 'YYYY-"W"WW'
        ELSE 'YYYY-MM'
    END,
    start_date, start_date,
    end_date, end_date,
    group_by_period, group_by_period);
END;
$$;

-- Function to get doctor performance report
CREATE OR REPLACE FUNCTION get_doctor_performance_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL,
    doctor_id_filter UUID DEFAULT NULL
)
RETURNS TABLE (
    doctor_id UUID,
    doctor_name TEXT,
    total_appointments BIGINT,
    completed_appointments BIGINT,
    cancelled_appointments BIGINT,
    no_show_appointments BIGINT,
    total_revenue DECIMAL(10,2),
    average_consultation_value DECIMAL(10,2),
    completion_rate DECIMAL(5,2),
    medical_records_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as doctor_id,
        u.name as doctor_name,
        COUNT(a.id)::BIGINT as total_appointments,
        COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::BIGINT as completed_appointments,
        COUNT(CASE WHEN a.status = 'cancelled' THEN 1 END)::BIGINT as cancelled_appointments,
        COUNT(CASE WHEN a.status = 'no_show' THEN 1 END)::BIGINT as no_show_appointments,
        COALESCE(SUM(a.value), 0) as total_revenue,
        COALESCE(AVG(a.value), 0) as average_consultation_value,
        ROUND(
            COUNT(CASE WHEN a.status = 'completed' THEN 1 END)::numeric / 
            NULLIF(COUNT(a.id), 0) * 100, 2
        ) as completion_rate,
        COUNT(DISTINCT mr.id)::BIGINT as medical_records_count
    FROM users u
    LEFT JOIN appointments a ON u.id = a.doctor_id
        AND (start_date IS NULL OR DATE(a.scheduled_at) >= start_date)
        AND (end_date IS NULL OR DATE(a.scheduled_at) <= end_date)
    LEFT JOIN medical_records mr ON u.id = mr.doctor_id
        AND (start_date IS NULL OR mr.consultation_date >= start_date)
        AND (end_date IS NULL OR mr.consultation_date <= end_date)
    WHERE 
        u.role = 'doctor'
        AND u.active = true
        AND (doctor_id_filter IS NULL OR u.id = doctor_id_filter)
    GROUP BY u.id, u.name
    ORDER BY total_appointments DESC;
END;
$$;

-- Function to get consultation types report
CREATE OR REPLACE FUNCTION get_consultation_types_report(
    start_date DATE DEFAULT NULL,
    end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    diagnosis_category TEXT,
    consultation_count BIGINT,
    unique_patients BIGINT,
    percentage DECIMAL(5,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH diagnosis_stats AS (
        SELECT 
            CASE 
                WHEN mr.diagnosis ILIKE '%miopia%' THEN 'Miopia'
                WHEN mr.diagnosis ILIKE '%hipermetropia%' THEN 'Hipermetropia'
                WHEN mr.diagnosis ILIKE '%astigmatismo%' THEN 'Astigmatismo'
                WHEN mr.diagnosis ILIKE '%catarata%' THEN 'Catarata'
                WHEN mr.diagnosis ILIKE '%glaucoma%' THEN 'Glaucoma'
                WHEN mr.diagnosis ILIKE '%retinopatia%' THEN 'Retinopatia'
                WHEN mr.diagnosis IS NOT NULL AND mr.diagnosis != '' THEN 'Outros'
                ELSE 'Não especificado'
            END as category,
            COUNT(*) as count,
            COUNT(DISTINCT mr.patient_id) as unique_count
        FROM medical_records mr
        WHERE 
            (start_date IS NULL OR mr.consultation_date >= start_date)
            AND (end_date IS NULL OR mr.consultation_date <= end_date)
        GROUP BY 
            CASE 
                WHEN mr.diagnosis ILIKE '%miopia%' THEN 'Miopia'
                WHEN mr.diagnosis ILIKE '%hipermetropia%' THEN 'Hipermetropia'
                WHEN mr.diagnosis ILIKE '%astigmatismo%' THEN 'Astigmatismo'
                WHEN mr.diagnosis ILIKE '%catarata%' THEN 'Catarata'
                WHEN mr.diagnosis ILIKE '%glaucoma%' THEN 'Glaucoma'
                WHEN mr.diagnosis ILIKE '%retinopatia%' THEN 'Retinopatia'
                WHEN mr.diagnosis IS NOT NULL AND mr.diagnosis != '' THEN 'Outros'
                ELSE 'Não especificado'
            END
    ),
    total_consultations AS (
        SELECT SUM(count) as total FROM diagnosis_stats
    )
    SELECT 
        ds.category as diagnosis_category,
        ds.count::BIGINT as consultation_count,
        ds.unique_count::BIGINT as unique_patients,
        ROUND((ds.count::numeric / tc.total * 100), 2) as percentage
    FROM diagnosis_stats ds
    CROSS JOIN total_consultations tc
    ORDER BY ds.count DESC;
END;
$$;

-- Function to get dashboard KPIs
CREATE OR REPLACE FUNCTION get_dashboard_kpis(
    period_months INTEGER DEFAULT 12
)
RETURNS TABLE (
    total_patients BIGINT,
    new_patients_this_month BIGINT,
    total_appointments_this_month BIGINT,
    completed_appointments_this_month BIGINT,
    completion_rate DECIMAL(5,2),
    total_revenue_this_month DECIMAL(10,2),
    pending_revenue DECIMAL(10,2),
    average_consultation_value DECIMAL(10,2),
    active_doctors BIGINT,
    medical_records_this_month BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_month_start DATE := DATE_TRUNC('month', CURRENT_DATE);
    current_month_end DATE := DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day';
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*)::BIGINT FROM patients) as total_patients,
        (SELECT COUNT(*)::BIGINT FROM patients 
         WHERE created_at >= current_month_start) as new_patients_this_month,
        (SELECT COUNT(*)::BIGINT FROM appointments 
         WHERE DATE(scheduled_at) >= current_month_start 
         AND DATE(scheduled_at) <= current_month_end) as total_appointments_this_month,
        (SELECT COUNT(*)::BIGINT FROM appointments 
         WHERE DATE(scheduled_at) >= current_month_start 
         AND DATE(scheduled_at) <= current_month_end 
         AND status = 'completed') as completed_appointments_this_month,
        (SELECT ROUND(
            COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / 
            NULLIF(COUNT(*), 0) * 100, 2
        ) FROM appointments 
         WHERE DATE(scheduled_at) >= current_month_start 
         AND DATE(scheduled_at) <= current_month_end) as completion_rate,
        (SELECT COALESCE(SUM(value), 0) FROM appointments 
         WHERE DATE(scheduled_at) >= current_month_start 
         AND DATE(scheduled_at) <= current_month_end 
         AND payment_status = 'paid') as total_revenue_this_month,
        (SELECT COALESCE(SUM(value), 0) FROM appointments 
         WHERE payment_status = 'pending') as pending_revenue,
        (SELECT COALESCE(AVG(value), 0) FROM appointments 
         WHERE DATE(scheduled_at) >= current_month_start 
         AND DATE(scheduled_at) <= current_month_end 
         AND value IS NOT NULL) as average_consultation_value,
        (SELECT COUNT(*)::BIGINT FROM users 
         WHERE role = 'doctor' AND active = true) as active_doctors,
        (SELECT COUNT(*)::BIGINT FROM medical_records 
         WHERE consultation_date >= current_month_start 
         AND consultation_date <= current_month_end) as medical_records_this_month;
END;
$$;