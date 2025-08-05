-- Create edge function for admin authentication
CREATE OR REPLACE FUNCTION public.admin_login(
  admin_email TEXT,
  admin_password TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  is_valid_password BOOLEAN := FALSE;
BEGIN
  -- Get admin user
  SELECT * INTO admin_record 
  FROM nana_admin_users 
  WHERE email = admin_email AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', 'Invalid credentials');
  END IF;
  
  -- For now, we'll do simple password comparison (in production, use proper hashing)
  -- This is a simplified version - you should implement proper password hashing
  IF admin_record.password_hash = admin_password THEN
    is_valid_password := TRUE;
  END IF;
  
  IF is_valid_password THEN
    -- Update last login
    UPDATE nana_admin_users 
    SET updated_at = now() 
    WHERE id = admin_record.id;
    
    RETURN json_build_object(
      'success', true, 
      'admin', json_build_object(
        'id', admin_record.id,
        'email', admin_record.email,
        'name', admin_record.name,
        'role', admin_record.role
      )
    );
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid credentials');
  END IF;
END;
$$;

-- Insert a default admin user for testing (password: admin123)
INSERT INTO nana_admin_users (email, password_hash, name, role) 
VALUES ('admin@nanafood.com', 'admin123', 'Admin User', 'admin')
ON CONFLICT (email) DO NOTHING;