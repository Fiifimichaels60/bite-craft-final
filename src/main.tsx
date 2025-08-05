import { StrictMode } from "react";
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { Toaster } from "@/components/ui/toaster";
import App from './App.tsx'
import './index.css'

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <AuthProvider>
          <AdminAuthProvider>
            <App />
            <Toaster />
          </AdminAuthProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>
);
