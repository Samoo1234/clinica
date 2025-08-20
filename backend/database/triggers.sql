-- Triggers for Appointment Management
-- Execute this script in Supabase SQL Editor after functions.sql

-- Trigger function to validate appointments before insert/update
CREATE OR REPLACE FUNCTION validate_appointment_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  validation_result TEXT;
BEGIN
  -- Validate appointment rules
  SELECT validate_appointment_rules(
    NEW.doctor_id,
    NEW.patient_id,
    NEW.scheduled_at,
    NEW.duration_minutes
  ) INTO validation_result;
  
  -- If validation fails, raise exception
  IF validation_result != 'valid' THEN
    RAISE EXCEPTION 'Appointment validation failed: %', validation_result;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for appointment validation on INSERT
CREATE TRIGGER validate_appointment_insert
  BEFORE INSERT ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION validate_appointment_trigger();

-- Create trigger for appointment validation on UPDATE
CREATE TRIGGER validate_appointment_update
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  WHEN (
    OLD.doctor_id IS DISTINCT FROM NEW.doctor_id OR
    OLD.scheduled_at IS DISTINCT FROM NEW.scheduled_at OR
    OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes
  )
  EXECUTE FUNCTION validate_appointment_trigger();

-- Trigger function to log appointment changes
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Log the change in integration_logs table
  INSERT INTO integration_logs (
    service_name,
    operation,
    request_data,
    response_data,
    status
  ) VALUES (
    'appointment_system',
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'create_appointment'
      WHEN TG_OP = 'UPDATE' THEN 'update_appointment'
      WHEN TG_OP = 'DELETE' THEN 'delete_appointment'
    END,
    CASE 
      WHEN TG_OP = 'DELETE' THEN row_to_json(OLD)
      ELSE row_to_json(NEW)
    END,
    jsonb_build_object(
      'operation', TG_OP,
      'timestamp', NOW(),
      'table', TG_TABLE_NAME
    ),
    'success'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for logging appointment changes
CREATE TRIGGER log_appointment_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION log_appointment_changes();

-- Trigger function to send notifications for appointment changes
CREATE OR REPLACE FUNCTION notify_appointment_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  notification_payload JSONB;
BEGIN
  -- Build notification payload
  notification_payload := jsonb_build_object(
    'operation', TG_OP,
    'appointment_id', COALESCE(NEW.id, OLD.id),
    'doctor_id', COALESCE(NEW.doctor_id, OLD.doctor_id),
    'patient_id', COALESCE(NEW.patient_id, OLD.patient_id),
    'scheduled_at', COALESCE(NEW.scheduled_at, OLD.scheduled_at),
    'status', COALESCE(NEW.status, OLD.status),
    'timestamp', NOW()
  );
  
  -- Send real-time notification
  PERFORM pg_notify('appointment_changes', notification_payload::text);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for real-time notifications
CREATE TRIGGER notify_appointment_changes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_appointment_changes();

-- Trigger function to automatically update appointment status based on time
CREATE OR REPLACE FUNCTION auto_update_appointment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If appointment time has passed and status is still 'scheduled' or 'confirmed'
  -- automatically mark as 'no_show' after 30 minutes
  IF NEW.scheduled_at + (NEW.duration_minutes + 30 || ' minutes')::INTERVAL < NOW() 
     AND NEW.status IN ('scheduled', 'confirmed') THEN
    NEW.status := 'no_show';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for auto-updating appointment status
CREATE TRIGGER auto_update_appointment_status_trigger
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_appointment_status();

-- Function to prevent deletion of completed appointments
CREATE OR REPLACE FUNCTION prevent_completed_appointment_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Prevent deletion of completed appointments
  IF OLD.status = 'completed' THEN
    RAISE EXCEPTION 'Cannot delete completed appointments. Please cancel instead.';
  END IF;
  
  -- Prevent deletion of appointments with associated medical records
  IF EXISTS (
    SELECT 1 FROM medical_records 
    WHERE patient_id = OLD.patient_id 
      AND doctor_id = OLD.doctor_id 
      AND consultation_date = DATE(OLD.scheduled_at)
  ) THEN
    RAISE EXCEPTION 'Cannot delete appointments with associated medical records.';
  END IF;
  
  RETURN OLD;
END;
$$;

-- Create trigger to prevent deletion of completed appointments
CREATE TRIGGER prevent_completed_appointment_deletion_trigger
  BEFORE DELETE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION prevent_completed_appointment_deletion();