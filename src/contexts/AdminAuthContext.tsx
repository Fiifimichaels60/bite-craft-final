import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoLogout } from '@/hooks/useAutoLogout';

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AdminAuthContextType {
  admin: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const signOut = () => {
    setAdmin(null);
    localStorage.removeItem('nana_admin');
  };

  // Auto logout functionality
  useAutoLogout({
    onLogout: signOut,
    timeoutMinutes: 10
  });

  useEffect(() => {
    // Check for stored admin session
    const storedAdmin = localStorage.getItem('nana_admin');
    if (storedAdmin) {
      try {
        setAdmin(JSON.parse(storedAdmin));
      } catch (error) {
        localStorage.removeItem('nana_admin');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.rpc('admin_login', {
        admin_email: email,
        admin_password: password
      });

      if (error) throw error;

      const response = data as unknown as { success: boolean; admin?: AdminUser; message?: string };
      
      if (response.success && response.admin) {
        setAdmin(response.admin);
        localStorage.setItem('nana_admin', JSON.stringify(response.admin));
        return { error: null };
      } else {
        return { error: { message: response.message || 'Login failed' } };
      }
    } catch (error: any) {
      return { error };
    }
  };

  const value = {
    admin,
    loading,
    signIn,
    signOut,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}