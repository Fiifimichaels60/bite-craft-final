import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

export default function ProtectedAdminRoute({ children }: ProtectedAdminRouteProps) {
  const { admin, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-food-primary" />
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}