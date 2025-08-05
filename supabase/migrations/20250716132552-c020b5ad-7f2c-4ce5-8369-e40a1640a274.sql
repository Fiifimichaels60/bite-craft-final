-- Create food ordering system tables

-- Admin users table
CREATE TABLE public.nana_admin_users (
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
CREATE TABLE public.nana_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Foods table
CREATE TABLE public.nana_foods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  delivery_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  category_id UUID REFERENCES public.nana_categories(id),
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Customers table
CREATE TABLE public.nana_customers (
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
CREATE TABLE public.nana_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.nana_customers(id),
  order_type TEXT NOT NULL CHECK (order_type IN ('delivery', 'pickup')),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'rejected')),
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  payment_reference TEXT,
  notes TEXT,
  delivery_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Order items table
CREATE TABLE public.nana_order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.nana_orders(id) ON DELETE CASCADE,
  food_id UUID REFERENCES public.nana_foods(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat conversations table
CREATE TABLE public.nana_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES public.nana_customers(id),
  admin_id UUID REFERENCES public.nana_admin_users(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chat messages table
CREATE TABLE public.nana_chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID REFERENCES public.nana_chats(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('customer', 'admin')),
  sender_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.nana_admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nana_chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (customers can view foods and categories)
CREATE POLICY "Anyone can view active categories" ON public.nana_categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view available foods" ON public.nana_foods
  FOR SELECT USING (is_available = true);

-- Admin policies (will be updated when we implement admin auth)
CREATE POLICY "Admins can manage everything" ON public.nana_admin_users
  FOR ALL USING (true);

CREATE POLICY "Admins can manage categories" ON public.nana_categories
  FOR ALL USING (true);

CREATE POLICY "Admins can manage foods" ON public.nana_foods
  FOR ALL USING (true);

CREATE POLICY "Admins can manage customers" ON public.nana_customers
  FOR ALL USING (true);

CREATE POLICY "Admins can manage orders" ON public.nana_orders
  FOR ALL USING (true);

CREATE POLICY "Admins can manage order items" ON public.nana_order_items
  FOR ALL USING (true);

CREATE POLICY "Admins can manage chats" ON public.nana_chats
  FOR ALL USING (true);

CREATE POLICY "Admins can manage chat messages" ON public.nana_chat_messages
  FOR ALL USING (true);

-- Customer policies for orders
CREATE POLICY "Customers can create orders" ON public.nana_orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can create order items" ON public.nana_order_items
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Customers can create customer records" ON public.nana_customers
  FOR INSERT WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_nana_admin_users_updated_at
  BEFORE UPDATE ON public.nana_admin_users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nana_categories_updated_at
  BEFORE UPDATE ON public.nana_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nana_foods_updated_at
  BEFORE UPDATE ON public.nana_foods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nana_customers_updated_at
  BEFORE UPDATE ON public.nana_customers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nana_orders_updated_at
  BEFORE UPDATE ON public.nana_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

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