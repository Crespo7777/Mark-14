// src/pages/TableView.tsx

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { ImmersiveOverlay } from "@/components/ImmersiveOverlay";
import { TableProvider, TableMember } from "@/features/table/TableContext";
import { Loader2 } from "lucide-react";

const TableView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [table, setTable] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [isHelper, setIsHelper] = useState(false); // <--- NOVO ESTADO
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
      // 1. Carregar Mesa e Mestre
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*, master:profiles!tables_master_id_fkey(id, display_name)")
        .eq("id", tableId)
        .single();

      if (tableError || !tableData) {
        throw tableError || new Error("Mesa não encontrada");
      }

      // 2. Carregar Membros e suas permissões (is_helper)
      const { data: membersData, error: membersError } = await supabase
        .from("table_members")
        .select("is_helper, user:profiles!table_members_user_id_fkey(id, display_name)")
        .eq("table_id", tableId);

      if (membersError) {
        throw membersError;
      }

      const masterProfile = tableData.master as { id: string, display_name: string };
      const isUserMaster = tableData.master_id === user.id;

      // Descobrir se o usuário atual é um Helper
      // (Procuramos na lista de membros se o ID bate e se a coluna is_helper é true)
      const currentUserMember = membersData.find((m: any) => m.user.id === user.id);
      const isUserHelper = currentUserMember?.is_helper || false;

      // Montar a lista de membros completa para o contexto
      const memberList: TableMember[] = [
        { 
          id: masterProfile.id, 
          display_name: masterProfile.display_name, 
          isMaster: true,
          isHelper: false 
        },
        ...membersData.map((m: any) => ({
          id: m.user.id,
          display_name: m.user.display_name,
          isMaster: false,
          isHelper: m.is_helper // Mapeia do banco de dados
        }))
      ];
      
      setTable(tableData);
      setMembers(memberList);
      setIsMaster(isUserMaster);
      setIsHelper(isUserHelper); // Define o estado
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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
             <Loader2 className="h-8 w-8 animate-spin text-primary" />
             <p className="text-muted-foreground">A preparar a mesa...</p>
        </div>
      </div>
    );
  }
  
  const tableContextValue = {
    tableId: table.id,
    masterId: table.master_id,
    userId: userId,
    isMaster: isMaster,
    isHelper: isHelper, // Passa para o resto da app
    members: members,
    setMembers: setMembers,
  };

  // Se for Mestre OU Helper, recebe a visão de Mestre
  const showMasterView = isMaster || isHelper;

  return (
      <TableProvider value={tableContextValue}>
        <ImmersiveOverlay tableId={tableId!} isMaster={isMaster} />

        <div className="min-h-screen bg-background">
            {showMasterView ? (
              <MasterView tableId={tableId!} masterId={table.master_id} />
            ) : (
              <PlayerView tableId={tableId!} />
            )}
        </div>
      </TableProvider>
  );
};

export default TableView;