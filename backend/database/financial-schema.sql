-- Financial Management Schema Extension
-- Execute this script in Supabase SQL Editor after the main schema

-- Create payment method enum
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'pix', 'bank_transfer', 'check', 'insurance');

-- Note: We use the existing payment_status enum without adding 'overdue'
-- Overdue payments are identified by status='pending' AND due_date < CURRENT_DATE

-- Payments table
CREATE TABLE public.payments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    payment_method payment_method NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    status payment_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    transaction_id TEXT, -- For electronic payments
    installments INTEGER DEFAULT 1,
    installment_number INTEGER DEFAULT 1,
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment installments table (for installment payments)
CREATE TABLE public.payment_installments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    installment_number INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE,
    status payment_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service prices table (for procedure pricing)
CREATE TABLE public.service_prices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    service_name TEXT NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    insurance_price DECIMAL(10,2),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Financial transactions table (for accounting)
CREATE TABLE public.financial_transactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
    transaction_type TEXT NOT NULL, -- 'income', 'expense', 'refund'
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    category TEXT,
    transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for financial tables
CREATE INDEX idx_payments_appointment_id ON public.payments(appointment_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_due_date ON public.payments(due_date);
CREATE INDEX idx_payment_installments_payment_id ON public.payment_installments(payment_id);
CREATE INDEX idx_payment_installments_due_date ON public.payment_installments(due_date);
CREATE INDEX idx_payment_installments_status ON public.payment_installments(status);
CREATE INDEX idx_service_prices_active ON public.service_prices(active);
CREATE INDEX idx_financial_transactions_transaction_date ON public.financial_transactions(transaction_date);
CREATE INDEX idx_financial_transactions_transaction_type ON public.financial_transactions(transaction_type);

-- Create triggers for updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_payment_installments_updated_at BEFORE UPDATE ON public.payment_installments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_prices_updated_at BEFORE UPDATE ON public.service_prices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default service prices
INSERT INTO public.service_prices (service_name, description, base_price, insurance_price) VALUES
('Consulta Oftalmológica', 'Consulta de rotina com oftalmologista', 150.00, 120.00),
('Exame de Refração', 'Exame para correção visual', 80.00, 60.00),
('Exame de Fundo de Olho', 'Exame de mapeamento de retina', 120.00, 90.00),
('Tonometria', 'Medição da pressão intraocular', 50.00, 40.00),
('Biomicroscopia', 'Exame com lâmpada de fenda', 70.00, 55.00),
('Campimetria', 'Exame de campo visual', 100.00, 80.00);