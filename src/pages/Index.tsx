import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      } else {
        setCheckingSession(false);
      }
    };
    checkSession();
  }, [navigate]);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
         <Loader2 className="w-10 h-10 text-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white relative overflow-hidden">
      
      {/* 1. IMAGEM DE FUNDO */}
      <div 
        className="absolute inset-0 z-0 opacity-40 animate-in fade-in duration-1000"
        style={{
            backgroundImage: 'url("/tenebre-bg.png")', 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      />
      
      {/* Gradiente para focar no centro */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-transparent to-black/90 z-0" />

      {/* 2. CONTEÚDO PRINCIPAL */}
      <div className="relative z-10 text-center space-y-8 p-4 max-w-2xl mx-auto flex flex-col items-center">
        
        {/* LOGO GIGANTE (Aumentado para leitura perfeita) */}
        <div className="mx-auto w-64 h-64 bg-primary/5 rounded-[3rem] flex items-center justify-center border border-primary/20 shadow-[0_0_80px_rgba(var(--primary),0.2)] mb-8 animate-in zoom-in-50 duration-700 backdrop-blur-sm">
            <img 
                src="/tenebre-logo.png" 
                alt="Tenebre Logo" 
                className="w-48 h-48 object-contain drop-shadow-2xl" 
            />
        </div>

        <div className="space-y-4 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-150">
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50">
              TENEBRE VTT
            </h1>
            
            <p className="text-xl md:text-2xl text-muted-foreground font-light tracking-wide max-w-lg mx-auto">
              Gerencie suas crônicas e mergulhe na escuridão.
            </p>
        </div>

        <div className="animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
            <Button 
              size="lg" 
              className="text-lg px-12 py-8 rounded-full font-bold shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(var(--primary),0.5)] transition-all duration-300 transform hover:-translate-y-1"
              onClick={() => navigate("/auth")}
            >
              Entrar no Abismo
            </Button>
        </div>

      </div>

      {/* Rodapé */}
      <div className="absolute bottom-6 text-xs text-white/20 font-mono z-10">
         v1.0.0 • Sistema Tenebre
      </div>
    </div>
  );
};

export default Index;