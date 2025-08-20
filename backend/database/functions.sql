-- Supabase Functions for Appointment Management
-- Execute this script in Supabase SQL Editor

-- Function to check appointment time conflicts
CREATE OR REPLACE FUNCTION check_appointment_conflict(
  p_doctor_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  conflict_count INTEGER;
  start_time TIMESTAMP WITH TIME ZONE;
  end_time TIMESTAMP WITH TIME ZONE;
BEGIN
  start_time := p_scheduled_at;
  end_time := p_scheduled_at + (p_duration_minutes || ' minutes')::INTERVAL;
  
  SELECT COUNT(*)
  INTO conflict_count
  FROM appointments
  WHERE doctor_id = p_doctor_id
    AND status IN ('scheduled', 'confirmed', 'in_progress')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (
      -- Check for overlapping time slots
      (scheduled_at < end_time AND (scheduled_at + (duration_minutes || ' minutes')::INTERVAL) > start_time)
    );
  
  RETURN conflict_count > 0;
END;
$$;

-- Function to get available time slots for a doctor on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(
  p_doctor_id UUID,
  p_date DATE,
  p_slot_duration INTEGER DEFAULT 30
)
RETURNS TABLE(slot_time TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
AS $$
DECLARE
  working_start INTEGER := 8;  -- 8:00 AM
  working_end INTEGER := 18;   -- 6:00 PM
  lunch_start INTEGER := 12;   -- 12:00 PM
  lunch_end INTEGER := 13;     -- 1:00 PM
  current_slot TIMESTAMP WITH TIME ZONE;
  slot_end TIMESTAMP WITH TIME ZONE;
  has_conflict BOOLEAN;
BEGIN
  -- Start from 8:00 AM on the given date
  current_slot := p_date + (working_start || ' hours')::INTERVAL;
  
  WHILE EXTRACT(HOUR FROM current_slot) < working_end LOOP
    -- Skip lunch time
    IF EXTRACT(HOUR FROM current_slot) >= lunch_start AND EXTRACT(HOUR FROM current_slot) < lunch_end THEN
      current_slot := current_slot + (p_slot_duration || ' minutes')::INTERVAL;
      CONTINUE;
    END IF;
    
    -- Check if this slot conflicts with existing appointments
    SELECT check_appointment_conflict(p_doctor_id, current_slot, p_slot_duration)
    INTO has_conflict;
    
    -- If no conflict, add to available slots
    IF NOT has_conflict THEN
      slot_time := current_slot;
      RETURN NEXT;
    END IF;
    
    -- Move to next slot
    current_slot := current_slot + (p_slot_duration || ' minutes')::INTERVAL;
  END LOOP;
  
  RETURN;
END;
$$;

-- Function to validate appointment business rules
CREATE OR REPLACE FUNCTION validate_appointment_rules(
  p_doctor_id UUID,
  p_patient_id UUID,
  p_scheduled_at TIMESTAMP WITH TIME ZONE,
  p_duration_minutes INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  doctor_exists BOOLEAN;
  patient_exists BOOLEAN;
  is_working_hours BOOLEAN;
  appointment_hour INTEGER;
BEGIN
  -- Check if doctor exists and is active
  SELECT EXISTS(
    SELECT 1 FROM users 
    WHERE id = p_doctor_id 
      AND role IN ('doctor', 'admin') 
      AND active = true
  ) INTO doctor_exists;
  
  IF NOT doctor_exists THEN
    RETURN 'Doctor not found or inactive';
  END IF;
  
  -- Check if patient exists
  SELECT EXISTS(
    SELECT 1 FROM patients WHERE id = p_patient_id
  ) INTO patient_exists;
  
  IF NOT patient_exists THEN
    RETURN 'Patient not found';
  END IF;
  
  -- Check if appointment is within working hours
  appointment_hour := EXTRACT(HOUR FROM p_scheduled_at);
  is_working_hours := appointment_hour >= 8 AND appointment_hour < 18 
                     AND NOT (appointment_hour >= 12 AND appointment_hour < 13);
  
  IF NOT is_working_hours THEN
    RETURN 'Appointment must be scheduled within working hours (8:00 AM - 6:00 PM, excluding lunch 12:00 PM - 1:00 PM)';
  END IF;
  
  -- Check if appointment is in the future
  IF p_scheduled_at <= NOW() THEN
    RETURN 'Appointment must be scheduled in the future';
  END IF;
  
  -- Check for time conflicts
  IF check_appointment_conflict(p_doctor_id, p_scheduled_at, p_duration_minutes) THEN
    RETURN 'Time conflict detected. The selected time slot is not available';
  END IF;
  
  RETURN 'valid';
END;
$$;

-- Function to get doctor's schedule for a date range
CREATE OR REPLACE FUNCTION get_doctor_schedule(
  p_doctor_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE(
  appointment_id UUID,
  patient_name TEXT,
  patient_phone TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status appointment_status,
  notes TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    p.name,
    p.phone,
    a.scheduled_at,
    a.duration_minutes,
    a.status,
    a.notes
  FROM appointments a
  JOIN patients p ON a.patient_id = p.id
  WHERE a.doctor_id = p_doctor_id
    AND DATE(a.scheduled_at) BETWEEN p_start_date AND p_end_date
    AND a.status != 'cancelled'
  ORDER BY a.scheduled_at;
END;
$$;

-- Function to get appointment statistics
CREATE OR REPLACE FUNCTION get_appointment_stats(
  p_doctor_id UUID DEFAULT NULL,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_appointments BIGINT,
  completed_appointments BIGINT,
  cancelled_appointments BIGINT,
  no_show_appointments BIGINT,
  completion_rate NUMERIC
)
LANGUAGE plpgsql
AS $$
DECLARE
  where_clause TEXT := '';
BEGIN
  -- Build dynamic WHERE clause
  IF p_doctor_id IS NOT NULL THEN
    where_clause := where_clause || ' AND doctor_id = ''' || p_doctor_id || '''';
  END IF;
  
  IF p_start_date IS NOT NULL THEN
    where_clause := where_clause || ' AND DATE(scheduled_at) >= ''' || p_start_date || '''';
  END IF;
  
  IF p_end_date IS NOT NULL THEN
    where_clause := where_clause || ' AND DATE(scheduled_at) <= ''' || p_end_date || '''';
  END IF;
  
  -- Remove leading ' AND'
  IF where_clause != '' THEN
    where_clause := 'WHERE ' || SUBSTRING(where_clause FROM 6);
  END IF;
  
  RETURN QUERY EXECUTE '
    SELECT 
      COUNT(*) as total_appointments,
      COUNT(*) FILTER (WHERE status = ''completed'') as completed_appointments,
      COUNT(*) FILTER (WHERE status = ''cancelled'') as cancelled_appointments,
      COUNT(*) FILTER (WHERE status = ''no_show'') as no_show_appointments,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          ROUND((COUNT(*) FILTER (WHERE status = ''completed'')::NUMERIC / COUNT(*)::NUMERIC) * 100, 2)
        ELSE 0 
      END as completion_rate
    FROM appointments ' || where_clause;
END;
$$;