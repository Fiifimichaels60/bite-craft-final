import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import Index from "./pages/Index";
import CustomerLanding from "./pages/CustomerLanding";
import AdminDashboard from "./pages/AdminDashboard";
import AdminLogin from "./pages/AdminLogin";
import AuthPage from "./pages/AuthPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AdminAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<CustomerLanding />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/payment-success" element={<PaymentSuccess />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/welcome" element={<Index />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AdminAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
