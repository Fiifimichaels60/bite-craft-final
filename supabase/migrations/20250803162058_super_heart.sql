/*
  # Food Ordering System Schema Update

  1. New Tables (if not exists)
    - `nana_admin_users` - Admin user management
    - `nana_categories` - Food categories
    - `nana_foods` - Food items with pricing
    - `nana_customers` - Customer information
    - `nana_orders` - Order management
    - `nana_order_items` - Order line items
    - `nana_chats` - Chat conversations
    - `nana_chat_messages` - Chat messages

  2. Security
    - Enable RLS on all tables
    - Add policies for public access to foods/categories
    - Add admin policies for management
    - Add customer policies for orders

  3. Functions & Triggers
    - Update timestamp function
    - Cleanup function for old orders
    - Triggers for automatic timestamp updates
*/

-- Admin users table
CREATE TABLE IF NOT EXISTS public.nana_admin_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Food categories table
CREATE TABLE IF NOT EXISTS public.nana_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foods table
CREATE TABLE IF NOT EXISTS public.nana_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  delivery_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_foods_category_id_fkey'
  ) THEN
    ALTER TABLE public.nana_foods 
    ADD CONSTRAINT nana_foods_category_id_fkey 
    FOREIGN KEY (category_id) REFERENCES public.nana_categories(id);
  END IF;
END $$;

-- Customers table
CREATE TABLE IF NOT EXISTS public.nana_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  national_id TEXT,
  email TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders table
CREATE TABLE IF NOT EXISTS public.nana_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  order_type TEXT NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_reference TEXT,
  notes TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Add constraints if they don't exist
DO $$
BEGIN
  -- Foreign key constraint
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_orders_customer_id_fkey'
  ) THEN
    ALTER TABLE public.nana_orders 
    ADD CONSTRAINT nana_orders_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.nana_customers(id);
  END IF;

  -- Check constraints
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_orders_order_type_check'
  ) THEN
    ALTER TABLE public.nana_orders 
    ADD CONSTRAINT nana_orders_order_type_check 
    CHECK (order_type IN ('delivery', 'pickup'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_orders_status_check'
  ) THEN
    ALTER TABLE public.nana_orders 
    ADD CONSTRAINT nana_orders_status_check 
    CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'rejected'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_orders_payment_status_check'
  ) THEN
    ALTER TABLE public.nana_orders 
    ADD CONSTRAINT nana_orders_payment_status_check 
    CHECK (payment_status IN ('pending', 'paid', 'failed'));
  END IF;
END $$;

-- Order items table
CREATE TABLE IF NOT EXISTS public.nana_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID,
  food_id UUID,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_order_items_order_id_fkey'
  ) THEN
    ALTER TABLE public.nana_order_items 
    ADD CONSTRAINT nana_order_items_order_id_fkey 
    FOREIGN KEY (order_id) REFERENCES public.nana_orders(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_order_items_food_id_fkey'
  ) THEN
    ALTER TABLE public.nana_order_items 
    ADD CONSTRAINT nana_order_items_food_id_fkey 
    FOREIGN KEY (food_id) REFERENCES public.nana_foods(id);
  END IF;
END $$;

-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.nana_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID,
  admin_id UUID,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_chats_customer_id_fkey'
  ) THEN
    ALTER TABLE public.nana_chats 
    ADD CONSTRAINT nana_chats_customer_id_fkey 
    FOREIGN KEY (customer_id) REFERENCES public.nana_customers(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_chats_admin_id_fkey'
  ) THEN
    ALTER TABLE public.nana_chats 
    ADD CONSTRAINT nana_chats_admin_id_fkey 
    FOREIGN KEY (admin_id) REFERENCES public.nana_admin_users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_chats_status_check'
  ) THEN
    ALTER TABLE public.nana_chats 
    ADD CONSTRAINT nana_chats_status_check 
    CHECK (status IN ('active', 'closed'));
  END IF;
END $$;

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.nana_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID,
  sender_type TEXT NOT NULL,
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_chat_messages_chat_id_fkey'
  ) THEN
    ALTER TABLE public.nana_chat_messages 
    ADD CONSTRAINT nana_chat_messages_chat_id_fkey 
    FOREIGN KEY (chat_id) REFERENCES public.nana_chats(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'nana_chat_messages_sender_type_check'
  ) THEN
    ALTER TABLE public.nana_chat_messages 
    ADD CONSTRAINT nana_chat_messages_sender_type_check 
    CHECK (sender_type IN ('customer', 'admin'));
  END IF;
END $$;

-- Enable Row Level Security (safe to run multiple times)
ALTER TABLE public.nana_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies (drop existing ones first to avoid conflicts)
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.nana_categories;
CREATE POLICY "Anyone can view active categories" ON public.nana_categories
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Anyone can view available foods" ON public.nana_foods;
CREATE POLICY "Anyone can view available foods" ON public.nana_foods
  FOR SELECT USING (is_available = true);

DROP POLICY IF EXISTS "Admins can manage everything" ON public.nana_admin_users;
CREATE POLICY "Admins can manage everything" ON public.nana_admin_users
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.nana_categories;
CREATE POLICY "Admins can manage categories" ON public.nana_categories
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage foods" ON public.nana_foods;
CREATE POLICY "Admins can manage foods" ON public.nana_foods
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage customers" ON public.nana_customers;
CREATE POLICY "Admins can manage customers" ON public.nana_customers
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage orders" ON public.nana_orders;
CREATE POLICY "Admins can manage orders" ON public.nana_orders
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage order items" ON public.nana_order_items;
CREATE POLICY "Admins can manage order items" ON public.nana_order_items
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage chats" ON public.nana_chats;
CREATE POLICY "Admins can manage chats" ON public.nana_chats
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Admins can manage chat messages" ON public.nana_chat_messages;
CREATE POLICY "Admins can manage chat messages" ON public.nana_chat_messages
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Customers can create orders" ON public.nana_orders;
CREATE POLICY "Customers can create orders" ON public.nana_orders
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can create order items" ON public.nana_order_items;
CREATE POLICY "Customers can create order items" ON public.nana_order_items
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can create customer records" ON public.nana_customers;
CREATE POLICY "Customers can create customer records" ON public.nana_customers
  FOR INSERT WITH CHECK (true);

-- Create function to update timestamps (replace if exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates (drop first to avoid conflicts)
DROP TRIGGER IF EXISTS update_nana_admin_users_updated_at ON public.nana_admin_users;
CREATE TRIGGER update_nana_admin_users_updated_at
  BEFORE UPDATE ON public.nana_admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nana_categories_updated_at ON public.nana_categories;
CREATE TRIGGER update_nana_categories_updated_at
  BEFORE UPDATE ON public.nana_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nana_foods_updated_at ON public.nana_foods;
CREATE TRIGGER update_nana_foods_updated_at
  BEFORE UPDATE ON public.nana_foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nana_customers_updated_at ON public.nana_customers;
CREATE TRIGGER update_nana_customers_updated_at
  BEFORE UPDATE ON public.nana_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nana_orders_updated_at ON public.nana_orders;
CREATE TRIGGER update_nana_orders_updated_at
  BEFORE UPDATE ON public.nana_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_nana_chats_updated_at ON public.nana_chats;
CREATE TRIGGER update_nana_chats_updated_at
  BEFORE UPDATE ON public.nana_chats
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-delete delivered/rejected orders after 3 days
CREATE OR REPLACE FUNCTION public.cleanup_old_orders()
RETURNS void AS $$
BEGIN
  DELETE FROM public.nana_orders 
  WHERE (status = 'delivered' AND delivered_at < now() - interval '3 days')
     OR (status = 'rejected' AND rejected_at < now() - interval '3 days');
END;
$$ LANGUAGE plpgsql;