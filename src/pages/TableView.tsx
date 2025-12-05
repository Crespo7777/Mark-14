import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TableProvider, TableMember } from "@/features/table/TableContext"; 
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle, RefreshCcw } from "lucide-react";
import { Table } from "@/types/app-types";

const TableView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Query Principal da Mesa - Com Retry Automático
  const { 
    data: contextData, 
    isLoading, 
    isError, 
    error,
    refetch 
  } = useQuery({
    queryKey: ["table-view", id],
    queryFn: async () => {
      if (!id || id === "undefined") throw new Error("ID inválido");

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");
      const user = session.user;

      // Busca dados da mesa
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*, master:profiles!tables_master_id_fkey(id, display_name)")
        .eq("id", id)
        .maybeSingle();

      if (tableError) throw tableError;
      if (!tableData) throw new Error("Mesa não encontrada");

      // Busca membros
      const { data: membersData, error: membersError } = await supabase
        .from("table_members")
        .select("is_helper, user:profiles!table_members_user_id_fkey(id, display_name)")
        .eq("table_id", id);

      if (membersError) throw membersError;

      // Verifica acesso
      const isUserMaster = tableData.master_id === user.id;
      const memberRecord = membersData?.find((m: any) => m.user.id === user.id);
      
      if (!isUserMaster && !memberRecord) {
        throw new Error("Você não é membro desta mesa.");
      }

      // Prepara objeto de membros
      const masterProfile = tableData.master as unknown as { id: string, display_name: string };
      const memberList: TableMember[] = [
        { id: masterProfile.id, display_name: masterProfile.display_name, isMaster: true, isHelper: false },
        ...(membersData || []).map((m: any) => ({
          id: m.user.id, display_name: m.user.display_name, isMaster: false, isHelper: m.is_helper
        }))
      ];

      return {
        table: tableData as Table,
        user,
        isMaster: isUserMaster,
        isHelper: memberRecord?.is_helper || false,
        members: memberList
      };
    },
    enabled: !!id && id !== "undefined",
    retry: 2, // Tenta 2 vezes automaticamente se falhar (resolve o problema do "acabei de entrar")
    staleTime: 1000 * 60 * 5, // Cache por 5 minutos
  });

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Entrando no mundo...</p>
      </div>
    );
  }

  if (isError || !contextData) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 text-center gap-4">
        <div className="bg-destructive/10 p-4 rounded-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div>
            <h1 className="text-xl font-bold">Não foi possível carregar a mesa</h1>
            <p className="text-muted-foreground max-w-md mx-auto mt-2">
                {(error as Error)?.message || "Verifique sua conexão ou se você tem permissão."}
            </p>
        </div>
        <div className="flex gap-2">
            <Button onClick={() => navigate("/dashboard")} variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>
            <Button onClick={() => refetch()}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Tentar Novamente
            </Button>
        </div>
      </div>
    );
  }

  // Objeto de Contexto Pronto
  const contextValue = {
    tableId: contextData.table.id,
    masterId: contextData.table.master_id,
    userId: contextData.user.id,
    isMaster: contextData.isMaster,
    isHelper: contextData.isHelper,
    members: contextData.members,
    setMembers: () => {} // Setter vazio pois o React Query gere o estado, mas mantemos interface
  };

  return (
    <TableProvider value={contextValue as any}>
      <div className="h-screen w-screen overflow-hidden bg-background relative">
        {contextData.isMaster || contextData.isHelper ? (
          <MasterView />
        ) : (
          <PlayerView />
        )}
      </div>
    </TableProvider>
  );
};

export default TableView;