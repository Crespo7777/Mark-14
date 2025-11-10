// src/pages/TableView.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare } from "lucide-react"; // --- MUDANÇA: Importado 'MessageSquare'
import { ChatPanel } from "@/components/ChatPanel";
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { TableProvider } from "@/features/table/TableContext";

// --- MUDANÇA: Importado Sheet para o chat mobile ---
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
// --- FIM DA MUDANÇA ---

const TableView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [table, setTable] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    loadTable();
  }, [tableId]);

  const loadTable = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUserId(user.id);

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
    setLoading(false);
  };

  if (loading || !table || !userId) { 
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando mesa...</p>
      </div>
    );
  }
  
  const tableContextValue = {
    tableId: table.id,
    masterId: table.master_id,
    userId: userId,
    isMaster: isMaster,
  };

  return (
    // --- MUDANÇA: A página agora é um <Sheet> para o chat mobile ---
    <Sheet>
      <TableProvider value={tableContextValue}>
        <div className="min-h-screen bg-background">
          {/* O Header não muda */}
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

          {/* --- MUDANÇA: Layout principal modificado --- */}
          <div className="flex h-[calc(100vh-80px)]">
            
            {/* 1. Conteúdo Principal */}
            {/* Em telas médias (md) ou maiores, tem um padding à direita (pr-6) para não colar no chat */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <div className="max-w-6xl mx-auto">
                {isMaster ? (
                  <MasterView tableId={tableId!} masterId={table.master_id} />
                ) : (
                  <PlayerView tableId={tableId!} />
                )}
              </div>
            </div>

            {/* 2. Chat Lateral (Desktop) */}
            {/* 'hidden' = Escondido por padrão (mobile)
              'md:flex' = Vira 'flex' em telas médias (md) ou maiores
            */}
            <div className="w-96 border-l border-border/50 bg-card/30 hidden md:flex">
              <ChatPanel tableId={tableId!} />
            </div>

            {/* 3. Botão Flutuante (Mobile) */}
            {/* 'md:hidden' = Fica escondido em telas médias (md) ou maiores
              'fixed' = Fica flutuando na tela
            */}
            <SheetTrigger asChild>
              <Button
                variant="primary"
                size="icon"
                className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
              >
                <MessageSquare className="w-6 h-6" />
                <span className="sr-only">Abrir Chat</span>
              </Button>
            </SheetTrigger>

          </div>
          {/* --- FIM DA MUDANÇA --- */}

          {/* 4. Conteúdo do Chat (Mobile) */}
          {/* O <ChatPanel> agora é renderizado dentro de um <SheetContent> */}
          <SheetContent side="right" className="p-0 w-full max-w-sm sm:max-w-sm">
            <ChatPanel tableId={tableId!} />
          </SheetContent>
          
        </div>
      </TableProvider>
    </Sheet>
    // --- FIM DA MUDANÇA ---
  );
};

export default TableView;