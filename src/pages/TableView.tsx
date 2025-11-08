// src/pages/TableView.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
// Caminhos de importação corrigidos com o alias "@/"
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";

const TableView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [table, setTable] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [masterId, setMasterId] = useState<string | null>(null);

  useEffect(() => {
    loadTable();
  }, [tableId]);

  const loadTable = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data, error } = await supabase
      .from("tables")
      .select("*")
      .eq("id", tableId)
      .single();

    if (error || !data) {
      toast({
        title: "Erro",
        description: "Mesa não encontrada",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setTable(data);
    setIsMaster(data.master_id === user.id);
    setMasterId(user.id);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando mesa...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{table?.name}</h1>
              <p className="text-sm text-muted-foreground">
                {isMaster ? "Você é o Mestre" : "Jogador"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 overflow-y-auto p-6 max-w-6xl mx-auto">
          {isMaster ? (
            <MasterView tableId={tableId!} masterId={masterId!} />
          ) : (
            <PlayerView tableId={tableId!} />
          )}
        </div>
        <div className="w-96 border-l border-border/50 bg-card/30">
          <ChatPanel tableId={tableId!} />
        </div>
      </div>
    </div>
  );
};

export default TableView;