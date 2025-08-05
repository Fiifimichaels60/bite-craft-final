-- Rename existing tables to start with "nana_" prefix
-- First, let's rename the profiles table to nana_profiles
ALTER TABLE public.profiles RENAME TO nana_profiles;

-- Rename cart table to nana_cart  
ALTER TABLE public.cart RENAME TO nana_cart;

-- Rename orders table to nana_orders_new (since nana_orders already exists)
-- We'll need to merge the data later
CREATE TABLE public.nana_orders_merged AS
SELECT 
  id,
  user_id as customer_id,
  total_amount,
  0 as delivery_fee,
  'delivery' as order_type,
  CASE 
    WHEN status = 'pending' THEN 'pending'
    WHEN status = 'processing' THEN 'preparing'
    WHEN status = 'shipped' THEN 'out_for_delivery'
    WHEN status = 'delivered' THEN 'delivered'
    WHEN status = 'cancelled' THEN 'cancelled'
    ELSE 'pending'
  END as status,
  CASE 
    WHEN payment_status = 'pending' THEN 'pending'
    WHEN payment_status = 'completed' THEN 'completed'
    WHEN payment_status = 'failed' THEN 'failed'
    WHEN payment_status = 'refunded' THEN 'refunded'
    ELSE 'pending'
  END as payment_status,
  payment_reference,
  null as notes,
  shipping_address::text as delivery_address,
  created_at,
  updated_at,
  CASE WHEN status = 'delivered' THEN updated_at ELSE null END as delivered_at,
  CASE WHEN status = 'cancelled' THEN updated_at ELSE null END as rejected_at
FROM public.orders;

-- Drop old orders table and rename the new one
DROP TABLE public.orders;
DROP TABLE public.nana_orders; -- Remove the old nana_orders
ALTER TABLE public.nana_orders_merged RENAME TO nana_orders;

-- Rename order_items to nana_order_items_merged
CREATE TABLE public.nana_order_items_merged AS
SELECT 
  id,
  order_id,
  product_id as food_id,
  quantity,
  price as unit_price,
  (price * quantity) as total_price,
  created_at
FROM public.order_items;

-- Drop old order_items and nana_order_items, rename new one
DROP TABLE public.order_items;
DROP TABLE public.nana_order_items;
ALTER TABLE public.nana_order_items_merged RENAME TO nana_order_items;

-- Rename products to nana_products (this will be foods)
CREATE TABLE public.nana_foods_merged AS
SELECT 
  id,
  name,
  description,
  price,
  0 as delivery_price,
  null as category_id,
  CASE WHEN images IS NOT NULL AND jsonb_array_length(images) > 0 
       THEN images->0->>'url' 
       ELSE null END as image_url,
  is_active as is_available,
  created_at,
  updated_at
FROM public.products;

-- Drop old tables
DROP TABLE public.products;
DROP TABLE public.nana_foods;
ALTER TABLE public.nana_foods_merged RENAME TO nana_foods;

-- Rename categories to nana_categories_merged
CREATE TABLE public.nana_categories_merged AS
SELECT 
  id,
  name,
  description,
  image_url,
  true as is_active,
  created_at,
  updated_at
FROM public.categories;

DROP TABLE public.categories;
DROP TABLE public.nana_categories;
ALTER TABLE public.nana_categories_merged RENAME TO nana_categories;