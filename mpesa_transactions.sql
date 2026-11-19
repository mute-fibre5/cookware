-- Create the mpesa_transactions table to store M-Pesa payment information

CREATE TABLE public.mpesa_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    checkout_request_id text NOT NULL,
    merchant_request_id text NOT NULL,
    mpesa_receipt_number text,
    phone_number text NOT NULL,
    amount numeric NOT NULL,
    status text NOT NULL DEFAULT 'pending'::text,
    result_code integer,
    result_desc text,
    order_id text, -- Link to your orders table if you have one
    user_id uuid REFERENCES auth.users(id), -- Link to the user who made the transaction
    CONSTRAINT mpesa_transactions_pkey PRIMARY KEY (id),
    CONSTRAINT mpesa_transactions_checkout_request_id_key UNIQUE (checkout_request_id),
    CONSTRAINT mpesa_transactions_merchant_request_id_key UNIQUE (merchant_request_id)
);

-- Add comments to the columns for clarity
COMMENT ON COLUMN public.mpesa_transactions.id IS 'Unique identifier for each transaction';
COMMENT ON COLUMN public.mpesa_transactions.created_at IS 'Timestamp when the transaction was created';
COMMENT ON COLUMN public.mpesa_transactions.checkout_request_id IS 'The unique ID for the STK push request returned by M-Pesa';
COMMENT ON COLUMN public.mpesa_transactions.merchant_request_id IS 'The unique ID for the transaction sent to M-Pesa';
COMMENT ON COLUMN public.mpesa_transactions.mpesa_receipt_number IS 'The M-Pesa transaction code upon successful payment';
COMMENT ON COLUMN public.mpesa_transactions.phone_number IS 'The customer''s phone number used for the transaction';
COMMENT ON COLUMN public.mpesa_transactions.amount IS 'The transaction amount';
COMMENT ON COLUMN public.mpesa_transactions.status IS 'The status of the transaction (e.g., pending, completed, failed, cancelled)';
COMMENT ON COLUMN public.mpesa_transactions.result_code IS 'The result code from the M-Pesa callback';
COMMENT ON COLUMN public.mpesa_transactions.result_desc IS 'The result description from the M-Pesa callback';
COMMENT ON COLUMN public.mpesa_transactions.order_id IS 'Optional: A reference to an order ID in your system';
COMMENT ON COLUMN public.mpesa_transactions.user_id IS 'The ID of the user who initiated the transaction';

-- Enable Row Level Security (RLS) on the table
ALTER TABLE public.mpesa_transactions ENABLE ROW LEVEL SECURITY;

-- Drop insecure policy if it exists
DROP POLICY IF EXISTS "Enable all access for all users" ON public.mpesa_transactions;

-- Secure Policies:

-- 1. Allow users to see only their own transactions
CREATE POLICY "Users can view own transactions" 
ON public.mpesa_transactions
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Allow the admin to see all transactions
-- Replace 'kamundia2020@gmail.com' with your actual admin email if different
CREATE POLICY "Admin can view all transactions"
ON public.mpesa_transactions
FOR SELECT
USING (auth.jwt() ->> 'email' = 'kamundia2020@gmail.com');

-- 3. Allow service_role (Edge Functions) to do everything
-- This is technically handled by service_role bypassing RLS, 
-- but explicit policies for other roles can be added if needed.