/*
  # Fix table structure and consolidate existing tables

  1. Tables to handle
    - Check if old tables exist before renaming
    - Merge data from old tables into existing nana_ tables
    - Clean up any duplicate or conflicting tables

  2. Security
    - Maintain existing RLS policies
    - Preserve existing constraints and indexes
*/

-- Only rename profiles table if it exists and nana_profiles doesn't
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') 
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'nana_profiles' AND table_schema = 'public') THEN
    ALTER TABLE public.profiles RENAME TO nana_profiles;
  END IF;
END $$;

-- Only handle cart table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart' AND table_schema = 'public') THEN
    -- Create nana_cart if it doesn't exist
    CREATE TABLE IF NOT EXISTS public.nana_cart (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL,
      product_id uuid NOT NULL,
      quantity integer DEFAULT 1,
      size text,
      color text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    -- Copy data from cart to nana_cart if cart exists
    INSERT INTO public.nana_cart (id, user_id, product_id, quantity, size, color, created_at, updated_at)
    SELECT id, user_id, product_id, quantity, size, color, created_at, updated_at
    FROM public.cart
    ON CONFLICT (id) DO NOTHING;
    
    -- Drop the old cart table
    DROP TABLE public.cart;
  END IF;
END $$;

-- Handle orders table migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders' AND table_schema = 'public') THEN
    -- Insert data from old orders into existing nana_orders
    INSERT INTO public.nana_orders (
      id, customer_id, total_amount, delivery_fee, order_type, status, payment_status, 
      payment_reference, notes, delivery_address, created_at, updated_at, delivered_at, rejected_at
    )
    SELECT 
      id,
      user_id,
      total_amount,
      0,
      'delivery',
      CASE 
        WHEN status = 'pending' THEN 'pending'
        WHEN status = 'processing' THEN 'preparing'
        WHEN status = 'shipped' THEN 'ready'
        WHEN status = 'delivered' THEN 'delivered'
        WHEN status = 'cancelled' THEN 'rejected'
        ELSE 'pending'
      END,
      CASE 
        WHEN payment_status = 'pending' THEN 'pending'
        WHEN payment_status = 'completed' THEN 'paid'
        WHEN payment_status = 'failed' THEN 'failed'
        WHEN payment_status = 'refunded' THEN 'failed'
        ELSE 'pending'
      END,
      payment_reference,
      null,
      shipping_address::text,
      created_at,
      updated_at,
      CASE WHEN status = 'delivered' THEN updated_at ELSE null END,
      CASE WHEN status = 'cancelled' THEN updated_at ELSE null END
    FROM public.orders
    ON CONFLICT (id) DO NOTHING;
    
    -- Drop old orders table
    DROP TABLE public.orders;
  END IF;
END $$;

-- Handle order_items table migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items' AND table_schema = 'public') THEN
    -- Insert data from old order_items into existing nana_order_items
    INSERT INTO public.nana_order_items (
      id, order_id, food_id, quantity, unit_price, total_price, created_at
    )
    SELECT 
      id,
      order_id,
      product_id,
      quantity,
      price,
      (price * quantity),
      created_at
    FROM public.order_items
    ON CONFLICT (id) DO NOTHING;
    
    -- Drop old order_items table
    DROP TABLE public.order_items;
  END IF;
END $$;

-- Handle products table migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products' AND table_schema = 'public') THEN
    -- Insert data from old products into existing nana_foods
    INSERT INTO public.nana_foods (
      id, name, description, price, delivery_price, category_id, image_url, is_available, created_at, updated_at
    )
    SELECT 
      id,
      name,
      description,
      price,
      0,
      category_id,
      CASE WHEN images IS NOT NULL AND jsonb_array_length(images) > 0 
           THEN images->0->>'url' 
           ELSE null END,
      COALESCE(is_active, true),
      created_at,
      updated_at
    FROM public.products
    ON CONFLICT (id) DO NOTHING;
    
    -- Drop old products table
    DROP TABLE public.products;
  END IF;
END $$;

-- Handle categories table migration
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories' AND table_schema = 'public') THEN
    -- Insert data from old categories into existing nana_categories
    INSERT INTO public.nana_categories (
      id, name, description, image_url, is_active, created_at, updated_at
    )
    SELECT 
      id,
      name,
      description,
      image_url,
      true,
      created_at,
      updated_at
    FROM public.categories
    ON CONFLICT (id) DO NOTHING;
    
    -- Drop old categories table
    DROP TABLE public.categories;
  END IF;
END $$;