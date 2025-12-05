import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { TableProvider, TableMember } from "@/features/table/TableContext";

const TableView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [table, setTable] = useState<any>(null);
  const [isMaster, setIsMaster] = useState(false);
  const [isHelper, setIsHelper] = useState(false);
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
      // Carregar Mesa
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*, master:profiles!tables_master_id_fkey(id, display_name)")
        .eq("id", tableId)
        .single();

      if (tableError || !tableData) throw tableError || new Error("Mesa não encontrada");

      // Carregar Membros
      const { data: membersData, error: membersError } = await supabase
        .from("table_members")
        .select("is_helper, user:profiles!table_members_user_id_fkey(id, display_name)")
        .eq("table_id", tableId);

      if (membersError) throw membersError;

      const masterProfile = tableData.master as { id: string, display_name: string };
      const isUserMaster = tableData.master_id === user.id;
      const currentUserMember = membersData.find((m: any) => m.user.id === user.id);
      const isUserHelper = currentUserMember?.is_helper || false;

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
          isHelper: m.is_helper
        }))
      ];
      
      setTable(tableData);
      setMembers(memberList);
      setIsMaster(isUserMaster);
      setIsHelper(isUserHelper);
      setLoading(false);

    } catch (error: any) {
      console.error("Erro ao carregar:", error);
      toast({ title: "Erro", description: "Mesa não encontrada", variant: "destructive" });
      navigate("/dashboard");
    }
  };

  if (loading || !table || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  const tableContextValue = {
    tableId: table.id,
    masterId: table.master_id,
    userId: userId,
    isMaster: isMaster,
    isHelper: isHelper,
    members: members,
    setMembers: setMembers,
  };

  return (
      <TableProvider value={tableContextValue}>
          <div className="min-h-screen bg-background text-foreground">
              {isMaster || isHelper ? (
                <MasterView tableId={tableId!} masterId={table.master_id} />
              ) : (
                <PlayerView tableId={tableId!} />
              )}
          </div>
      </TableProvider>
  );
};

export default TableView;