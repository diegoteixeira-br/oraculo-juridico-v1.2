-- Fix security warnings: Set search_path for all database functions
-- This prevents function search path mutable security issues

-- Fix search_path for vector functions
ALTER FUNCTION public.match_documents SET search_path = public;
ALTER FUNCTION public.update_legal_documents_updated_at SET search_path = public;
ALTER FUNCTION public.process_refund SET search_path = public;
ALTER FUNCTION public.reset_daily_credits_if_needed SET search_path = public;
ALTER FUNCTION public.use_credits SET search_path = public;
ALTER FUNCTION public.add_credits_to_user SET search_path = public;
ALTER FUNCTION public.use_tokens SET search_path = public;
ALTER FUNCTION public.add_tokens_to_user SET search_path = public;
ALTER FUNCTION public.reset_daily_tokens_if_needed SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;
ALTER FUNCTION public.handle_new_user SET search_path = public;

-- Create indexes for better performance on legal_commitments
CREATE INDEX IF NOT EXISTS idx_legal_commitments_date_status 
ON public.legal_commitments (commitment_date, status) 
WHERE status = 'pendente';

CREATE INDEX IF NOT EXISTS idx_legal_commitments_user_date 
ON public.legal_commitments (user_id, commitment_date);

-- Create indexes for better performance on query_history
CREATE INDEX IF NOT EXISTS idx_query_history_session 
ON public.query_history (session_id, created_at);

-- Create indexes for better performance on credit_transactions
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_type 
ON public.credit_transactions (user_id, transaction_type, created_at);

-- Create usage analytics table for monitoring
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  feature_name TEXT NOT NULL,
  feature_data JSONB,
  tokens_consumed INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on feature_usage
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for feature_usage
CREATE POLICY "Users can view their own usage data" 
ON public.feature_usage 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert usage data" 
ON public.feature_usage 
FOR INSERT 
WITH CHECK (true);

-- Create index for feature usage analytics
CREATE INDEX IF NOT EXISTS idx_feature_usage_analytics 
ON public.feature_usage (feature_name, created_at, user_id);

-- Create function to log feature usage
CREATE OR REPLACE FUNCTION public.log_feature_usage(
  p_user_id UUID,
  p_feature_name TEXT,
  p_feature_data JSONB DEFAULT '{}',
  p_tokens_consumed INTEGER DEFAULT 0
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.feature_usage (
    user_id,
    feature_name,
    feature_data,
    tokens_consumed
  ) VALUES (
    p_user_id,
    p_feature_name,
    p_feature_data,
    p_tokens_consumed
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;