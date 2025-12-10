import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom"; // <--- Adicionado useLocation
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import TableView from "./pages/TableView";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// ProtectedRoute Inteligente: Salva de onde vieste
const ProtectedRoute = ({ session, children }: { session: Session | null, children: React.ReactNode }) => {
  const location = useLocation();
  
  if (!session) {
    // Redireciona para login, mas guarda a página atual no "state"
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// AuthRoute Inteligente: Devolve-te para onde estavas
const AuthRoute = ({ session }: { session: Session | null }) => {
  const location = useLocation();
  
  if (session) {
    // Se já existe sessão, verifica se viemos de algum lugar específico
    // Se não, vai para o dashboard por defeito
    const from = location.state?.from?.pathname || "/dashboard";
    return <Navigate to={from} replace />;
  }
  
  return <Auth />;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<string | null>(null);

  useEffect(() => {
    // 1. Busca sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        sessionRef.current = session.access_token;
        setSession(session);
      }
      setLoading(false);
    });

    // 2. Listener de Auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        sessionRef.current = null;
        setSession(null);
        queryClient.clear();
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.access_token !== sessionRef.current) {
            sessionRef.current = session?.access_token || null;
            setSession(session);
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">Carregando...</div>; 
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Rota de Auth agora usa o componente inteligente */}
            <Route path="/auth" element={<AuthRoute session={session} />} />
            
            <Route path="/reset-password" element={<ResetPassword />} />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute session={session}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/table/:id"
              element={
                <ProtectedRoute session={session}>
                  <TableView />
                </ProtectedRoute>
              }
            />
            
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;