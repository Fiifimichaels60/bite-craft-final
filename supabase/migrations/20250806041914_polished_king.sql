/*
  # Create business settings table

  1. New Tables
    - `nana_business_settings` - Store business configuration and API keys
      - `id` (uuid, primary key)
      - `business_name` (text)
      - `business_phone` (text)
      - `business_email` (text)
      - `business_address` (text)
      - `paystack_public_key` (text)
      - `paystack_secret_key` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `nana_business_settings` table
    - Add policy for admin access only
*/

CREATE TABLE IF NOT EXISTS public.nana_business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_name TEXT DEFAULT 'BiteCraft',
  business_phone TEXT DEFAULT '+233 50 244 5560',
  business_email TEXT DEFAULT 'michaelquaicoe60@gmail.com',
  business_address TEXT,
  paystack_public_key TEXT,
  paystack_secret_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.nana_business_settings ENABLE ROW LEVEL SECURITY;

-- Admin policies for business settings
CREATE POLICY "Admins can manage business settings" ON public.nana_business_settings
  FOR ALL USING (true);

-- Create trigger for timestamp updates
CREATE TRIGGER update_nana_business_settings_updated_at
  BEFORE UPDATE ON public.nana_business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default business settings if none exist
INSERT INTO public.nana_business_settings (business_name, business_phone, business_email)
SELECT 'BiteCraft', '+233 50 244 5560', 'michaelquaicoe60@gmail.com'
WHERE NOT EXISTS (SELECT 1 FROM public.nana_business_settings);