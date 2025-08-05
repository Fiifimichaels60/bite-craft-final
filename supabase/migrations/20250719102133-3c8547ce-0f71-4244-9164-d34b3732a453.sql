-- Step 1: Rename profiles table to nana_profiles
ALTER TABLE public.profiles RENAME TO nana_profiles;

-- Step 2: Update the handle_new_user function to work with nana_profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.nana_profiles (id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name'
  );
  RETURN new;
END;
$$;

-- Step 3: Rename cart table to nana_cart
ALTER TABLE public.cart RENAME TO nana_cart;

-- Step 4: Update RLS policies for renamed tables
-- Drop old policies and create new ones for nana_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.nana_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.nana_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.nana_profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.nana_profiles;

CREATE POLICY "Admins can view all profiles" ON public.nana_profiles
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.nana_profiles profiles_1
    WHERE profiles_1.id = auth.uid() AND profiles_1.is_admin = true
  )
);

CREATE POLICY "Users can insert their own profile" ON public.nana_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.nana_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own profile" ON public.nana_profiles
FOR SELECT USING (auth.uid() = id);

-- Update RLS policies for nana_cart
DROP POLICY IF EXISTS "Users can manage their own cart" ON public.nana_cart;
DROP POLICY IF EXISTS "Users can view their own cart" ON public.nana_cart;

CREATE POLICY "Users can manage their own cart" ON public.nana_cart
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cart" ON public.nana_cart
FOR SELECT USING (auth.uid() = user_id);