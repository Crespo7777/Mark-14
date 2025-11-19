import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { ChatPanel } from "@/components/ChatPanel";
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { ImmersiveOverlay } from "@/components/ImmersiveOverlay";
import { TableProvider, TableMember } from "@/features/table/TableContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const TableView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [table, setTable] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [members, setMembers] = useState<TableMember[]>([]);

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

    try {
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*, master:profiles!tables_master_id_fkey(id, display_name)")
        .eq("id", tableId)
        .single();

      if (tableError || !tableData) {
        throw tableError || new Error("Mesa não encontrada");
      }

      const { data: membersData, error: membersError } = await supabase
        .from("table_members")
        .select("user:profiles!table_members_user_id_fkey(id, display_name)")
        .eq("table_id", tableId);

      if (membersError) {
        throw membersError;
      }

      const masterProfile = tableData.master as { id: string, display_name: string };
      
      const memberList: TableMember[] = [
        { 
          id: masterProfile.id, 
          display_name: masterProfile.display_name, 
          isMaster: true 
        },
        ...membersData.map((m: any) => ({
          id: m.user.id,
          display_name: m.user.display_name,
          isMaster: false,
        }))
      ];
      
      setTable(tableData);
      setMembers(memberList);
      setIsMaster(tableData.master_id === user.id);
      setLoading(false);

    } catch (error: any) {
      console.error("Erro ao carregar dados da mesa:", error);
      toast({
        title: "Erro",
        description: error.message || "Mesa não encontrada",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  };

  if (loading || !table || !userId || members.length === 0) {
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
    members: members,
    setMembers: setMembers,
  };

  return (
    <Sheet>
      <TableProvider value={tableContextValue}>
        <div className="min-h-screen bg-background relative">
          
          <ImmersiveOverlay tableId={tableId!} isMaster={isMaster} />

          <div className="w-96 h-screen fixed right-0 top-0 border-l border-border bg-card hidden md:flex z-20">
            <ChatPanel tableId={tableId!} />
          </div>

          <div className="md:mr-96 relative z-10">
            <div className="border-b border-border bg-card/50 backdrop-blur top-0 z-10 sticky">
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

            <div className="p-4 md:p-6">
              <div className="max-w-6xl mx-auto">
                {isMaster ? (
                  <MasterView tableId={tableId!} masterId={table.master_id} />
                ) : (
                  <PlayerView tableId={tableId!} />
                )}
              </div>
            </div>
          </div>

          <SheetTrigger asChild>
            <Button
              variant="default"
              size="icon"
              className="fixed bottom-4 right-4 h-14 w-14 rounded-full shadow-lg md:hidden z-50"
            >
              <MessageSquare className="w-6 h-6" />
              <span className="sr-only">Abrir Chat</span>
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="p-0 w-full max-w-sm sm:max-w-sm h-full">
            <ChatPanel tableId={tableId!} />
          </SheetContent>
          
        </div>
      </TableProvider>
    </Sheet>
  );
};

export default TableView;