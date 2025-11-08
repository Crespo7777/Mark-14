import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-2xl">
        <h1 className="mb-4 text-5xl font-bold text-primary">Symbaroum VTT</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Um hub completo para suas aventuras em Symbaroum. Gerencie suas fichas, personagens e histórias nas sombras de Davokar.
        </p>
        <Button size="lg" onClick={() => navigate("/auth")} className="shadow-glow">
          Começar Aventura
        </Button>
      </div>
    </div>
  );
};

export default Index;
