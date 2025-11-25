// src/App.tsx

import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TableView from "./pages/TableView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente interno para usar o hook useNavigate (que só funciona dentro do BrowserRouter)
const AppRoutes = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Escuta mudanças no estado de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        // Limpa a cache do React Query quando o utilizador sai
        queryClient.clear();
        navigate("/auth");
      } else if (event === 'TOKEN_REFRESH_DELETED' || event === 'USER_DELETED') {
         // Se o token for inválido ou user deletado, força o logout limpo
         await supabase.auth.signOut();
         navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/table/:tableId" element={<TableView />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;