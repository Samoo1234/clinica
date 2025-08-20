-- Row Level Security Policies for VisionCare
-- Execute this script in Supabase SQL Editor after creating the schema

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID)
RETURNS user_role AS $$
BEGIN
    RETURN (SELECT role FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'admin' FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is doctor
CREATE OR REPLACE FUNCTION is_doctor(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (SELECT role = 'doctor' FROM public.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users table policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can update all users" ON public.users
    FOR UPDATE USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (is_admin(auth.uid()));

-- Patients table policies
CREATE POLICY "Authenticated users can view patients" ON public.patients
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert patients" ON public.patients
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update patients" ON public.patients
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete patients" ON public.patients
    FOR DELETE USING (is_admin(auth.uid()));

-- Medical records table policies
CREATE POLICY "Doctors can view their own medical records" ON public.medical_records
    FOR SELECT USING (doctor_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Doctors can insert medical records" ON public.medical_records
    FOR INSERT WITH CHECK (is_doctor(auth.uid()) OR is_admin(auth.uid()));

CREATE POLICY "Doctors can update their own medical records" ON public.medical_records
    FOR UPDATE USING (doctor_id = auth.uid() OR is_admin(auth.uid()));

CREATE POLICY "Admins can delete medical records" ON public.medical_records
    FOR DELETE USING (is_admin(auth.uid()));

-- Appointments table policies
CREATE POLICY "Authenticated users can view appointments" ON public.appointments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert appointments" ON public.appointments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update appointments" ON public.appointments
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete appointments" ON public.appointments
    FOR DELETE USING (is_admin(auth.uid()));

-- Attachments table policies
CREATE POLICY "Users can view attachments of accessible medical records" ON public.attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.medical_records mr 
            WHERE mr.id = record_id 
            AND (mr.doctor_id = auth.uid() OR is_admin(auth.uid()))
        )
    );

CREATE POLICY "Doctors can insert attachments to their records" ON public.attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.medical_records mr 
            WHERE mr.id = record_id 
            AND (mr.doctor_id = auth.uid() OR is_admin(auth.uid()))
        )
    );

CREATE POLICY "Doctors can update attachments of their records" ON public.attachments
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.medical_records mr 
            WHERE mr.id = record_id 
            AND (mr.doctor_id = auth.uid() OR is_admin(auth.uid()))
        )
    );

CREATE POLICY "Admins can delete attachments" ON public.attachments
    FOR DELETE USING (is_admin(auth.uid()));

-- Invoices table policies
CREATE POLICY "Authenticated users can view invoices" ON public.invoices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert invoices" ON public.invoices
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update invoices" ON public.invoices
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete invoices" ON public.invoices
    FOR DELETE USING (is_admin(auth.uid()));

-- Integration logs table policies
CREATE POLICY "Admins can view integration logs" ON public.integration_logs
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "System can insert integration logs" ON public.integration_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Admins can delete integration logs" ON public.integration_logs
    FOR DELETE USING (is_admin(auth.uid()));

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name, role)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'), 'receptionist');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user registration
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();