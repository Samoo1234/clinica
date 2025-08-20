-- Financial Management Functions
-- Execute this script in Supabase SQL Editor after the financial schema and views

-- Function to calculate total revenue for a period
CREATE OR REPLACE FUNCTION public.calculate_revenue(
    start_date DATE,
    end_date DATE
)
RETURNS TABLE (
    total_revenue DECIMAL(10,2),
    paid_revenue DECIMAL(10,2),
    pending_revenue DECIMAL(10,2),
    overdue_revenue DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'pending' AND p.due_date >= CURRENT_DATE THEN p.amount ELSE 0 END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN p.amount ELSE 0 END), 0) as overdue_revenue
    FROM public.payments p
    JOIN public.appointments a ON p.appointment_id = a.id
    WHERE a.scheduled_at::date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get patient financial summary
CREATE OR REPLACE FUNCTION public.get_patient_financial_summary(patient_uuid UUID)
RETURNS TABLE (
    patient_id UUID,
    patient_name TEXT,
    total_appointments BIGINT,
    total_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    pending_amount DECIMAL(10,2),
    overdue_amount DECIMAL(10,2),
    last_payment_date TIMESTAMP WITH TIME ZONE,
    next_due_date DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pt.id,
        pt.name,
        COUNT(a.id) as total_appointments,
        COALESCE(SUM(p.amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN p.status = 'pending' AND p.due_date >= CURRENT_DATE THEN p.amount ELSE 0 END), 0) as pending_amount,
        COALESCE(SUM(CASE WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN p.amount ELSE 0 END), 0) as overdue_amount,
        MAX(p.payment_date) as last_payment_date,
        MIN(CASE WHEN p.status = 'pending' THEN p.due_date ELSE NULL END) as next_due_date
    FROM public.patients pt
    LEFT JOIN public.appointments a ON pt.id = a.patient_id
    LEFT JOIN public.payments p ON a.id = p.appointment_id
    WHERE pt.id = patient_uuid
    GROUP BY pt.id, pt.name;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate payment installments
CREATE OR REPLACE FUNCTION public.calculate_installments(
    total_amount DECIMAL(10,2),
    num_installments INTEGER,
    first_due_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    installment_number INTEGER,
    amount DECIMAL(10,2),
    due_date DATE
) AS $$
DECLARE
    installment_amount DECIMAL(10,2);
    remainder DECIMAL(10,2);
    i INTEGER;
BEGIN
    -- Calculate base installment amount
    installment_amount := FLOOR(total_amount / num_installments * 100) / 100;
    remainder := total_amount - (installment_amount * num_installments);
    
    -- Return installments
    FOR i IN 1..num_installments LOOP
        RETURN QUERY SELECT 
            i,
            CASE 
                WHEN i = 1 THEN installment_amount + remainder  -- Add remainder to first installment
                ELSE installment_amount
            END,
            first_due_date + INTERVAL '1 month' * (i - 1);
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to count overdue payments
CREATE OR REPLACE FUNCTION public.count_overdue_payments()
RETURNS INTEGER AS $$
DECLARE
    overdue_count INTEGER;
BEGIN
    -- Count overdue payments (status='pending' AND due_date < CURRENT_DATE)
    SELECT COUNT(*) INTO overdue_count
    FROM public.payments 
    WHERE status = 'pending' 
    AND due_date < CURRENT_DATE;
    
    -- Log the operation
    INSERT INTO public.integration_logs (
        service_name,
        operation,
        request_data,
        response_data,
        status
    ) VALUES (
        'financial_system',
        'count_overdue_payments',
        jsonb_build_object('execution_date', CURRENT_DATE),
        jsonb_build_object('overdue_payments', overdue_count),
        'success'
    );
    
    RETURN overdue_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get financial dashboard data
CREATE OR REPLACE FUNCTION public.get_financial_dashboard(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_revenue DECIMAL(10,2),
    paid_revenue DECIMAL(10,2),
    pending_revenue DECIMAL(10,2),
    overdue_revenue DECIMAL(10,2),
    total_appointments BIGINT,
    paid_appointments BIGINT,
    pending_appointments BIGINT,
    overdue_appointments BIGINT,
    average_appointment_value DECIMAL(10,2),
    payment_rate_percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(SUM(p.amount), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) as paid_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'pending' AND p.due_date >= CURRENT_DATE THEN p.amount ELSE 0 END), 0) as pending_revenue,
        COALESCE(SUM(CASE WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN p.amount ELSE 0 END), 0) as overdue_revenue,
        COUNT(a.id) as total_appointments,
        COUNT(CASE WHEN p.status = 'paid' THEN 1 END) as paid_appointments,
        COUNT(CASE WHEN p.status = 'pending' AND p.due_date >= CURRENT_DATE THEN 1 END) as pending_appointments,
        COUNT(CASE WHEN p.status = 'pending' AND p.due_date < CURRENT_DATE THEN 1 END) as overdue_appointments,
        COALESCE(AVG(p.amount), 0) as average_appointment_value,
        CASE 
            WHEN COUNT(a.id) > 0 THEN 
                ROUND(COUNT(CASE WHEN p.status = 'paid' THEN 1 END)::numeric / COUNT(a.id) * 100, 2)
            ELSE 0
        END as payment_rate_percentage
    FROM public.appointments a
    LEFT JOIN public.payments p ON a.id = p.appointment_id
    WHERE a.scheduled_at::date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql;

-- Function to process payment and update related records
CREATE OR REPLACE FUNCTION public.process_payment(
    payment_uuid UUID,
    payment_method_param payment_method,
    transaction_id_param TEXT DEFAULT NULL,
    notes_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    success BOOLEAN,
    message TEXT,
    payment_id UUID
) AS $$
DECLARE
    payment_record RECORD;
    appointment_record RECORD;
BEGIN
    -- Get payment details
    SELECT * INTO payment_record FROM public.payments WHERE id = payment_uuid;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 'Payment not found', payment_uuid;
        RETURN;
    END IF;
    
    -- Check if payment is already processed
    IF payment_record.status = 'paid' THEN
        RETURN QUERY SELECT FALSE, 'Payment already processed', payment_uuid;
        RETURN;
    END IF;
    
    -- Update payment
    UPDATE public.payments 
    SET 
        status = 'paid',
        payment_method = payment_method_param,
        payment_date = NOW(),
        transaction_id = transaction_id_param,
        notes = notes_param,
        updated_at = NOW()
    WHERE id = payment_uuid;
    
    -- Update appointment payment status
    UPDATE public.appointments 
    SET payment_status = 'paid'
    WHERE id = payment_record.appointment_id;
    
    -- Create financial transaction record
    INSERT INTO public.financial_transactions (
        payment_id,
        transaction_type,
        amount,
        description,
        category,
        transaction_date
    ) VALUES (
        payment_uuid,
        'income',
        payment_record.amount,
        'Payment received for appointment ' || payment_record.appointment_id,
        'consultation',
        CURRENT_DATE
    );
    
    -- Log the operation
    INSERT INTO public.integration_logs (
        service_name,
        operation,
        request_data,
        response_data,
        status
    ) VALUES (
        'financial_system',
        'process_payment',
        jsonb_build_object(
            'payment_id', payment_uuid,
            'payment_method', payment_method_param,
            'transaction_id', transaction_id_param
        ),
        jsonb_build_object(
            'amount', payment_record.amount,
            'appointment_id', payment_record.appointment_id
        ),
        'success'
    );
    
    RETURN QUERY SELECT TRUE, 'Payment processed successfully', payment_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to generate payment alerts
CREATE OR REPLACE FUNCTION public.get_payment_alerts()
RETURNS TABLE (
    alert_type TEXT,
    alert_message TEXT,
    patient_name TEXT,
    patient_phone TEXT,
    amount DECIMAL(10,2),
    due_date DATE,
    days_overdue INTEGER,
    priority TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN p.due_date < CURRENT_DATE THEN 'overdue'
            WHEN p.due_date = CURRENT_DATE THEN 'due_today'
            WHEN p.due_date = CURRENT_DATE + INTERVAL '1 day' THEN 'due_tomorrow'
            WHEN p.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'due_soon'
        END as alert_type,
        CASE 
            WHEN p.due_date < CURRENT_DATE THEN 
                'Payment overdue by ' || (CURRENT_DATE - p.due_date) || ' days'
            WHEN p.due_date = CURRENT_DATE THEN 'Payment due today'
            WHEN p.due_date = CURRENT_DATE + INTERVAL '1 day' THEN 'Payment due tomorrow'
            ELSE 'Payment due in ' || (p.due_date - CURRENT_DATE) || ' days'
        END as alert_message,
        pt.name as patient_name,
        pt.phone as patient_phone,
        p.amount,
        p.due_date,
        CASE 
            WHEN p.due_date < CURRENT_DATE THEN (CURRENT_DATE - p.due_date)::INTEGER
            ELSE 0
        END as days_overdue,
        CASE 
            WHEN p.due_date < CURRENT_DATE - INTERVAL '30 days' THEN 'critical'
            WHEN p.due_date < CURRENT_DATE - INTERVAL '7 days' THEN 'high'
            WHEN p.due_date < CURRENT_DATE THEN 'medium'
            ELSE 'low'
        END as priority
    FROM public.payments p
    JOIN public.appointments a ON p.appointment_id = a.id
    JOIN public.patients pt ON a.patient_id = pt.id
    WHERE p.status = 'pending'
    AND p.due_date <= CURRENT_DATE + INTERVAL '7 days'
    ORDER BY 
        CASE 
            WHEN p.due_date < CURRENT_DATE THEN 1
            ELSE 2
        END,
        p.due_date ASC;
END;
$$ LANGUAGE plpgsql;