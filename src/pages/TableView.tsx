import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
  const queryClient = useQueryClient(); 

  // Query Principal "À Prova de Bala" (Sem Joins complexos)
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

      // PASSO 1: Buscar a Mesa (Sem tentar buscar o perfil do mestre ainda)
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*") 
        .eq("id", id)
        .maybeSingle();

      if (tableError) throw tableError;
      if (!tableData) throw new Error("Mesa não encontrada");

      // PASSO 2: Buscar o Perfil do Mestre separadamente
      // Isto evita o erro 400 de relação ambígua
      const { data: masterProfile, error: masterError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", tableData.master_id)
        .single();
      
      if (masterError) {
         console.warn("Erro ao buscar mestre:", masterError);
         // Se falhar, usa um fallback para não travar a mesa
      }

      // PASSO 3: Buscar Membros e os seus perfis
      // Primeiro buscamos a relação
      const { data: membersRaw, error: membersError } = await supabase
        .from("table_members")
        .select("user_id, is_helper")
        .eq("table_id", id);

      if (membersError) throw membersError;

      // Se houver membros, buscamos os nomes deles
      let membersProfiles: any[] = [];
      if (membersRaw && membersRaw.length > 0) {
          const userIds = membersRaw.map(m => m.user_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, display_name")
            .in("id", userIds);
          membersProfiles = profiles || [];
      }

      // PASSO 4: Montar a lista final combinando os dados
      const isUserMaster = tableData.master_id === user.id;
      const memberRecord = membersRaw?.find(m => m.user_id === user.id);
      
      if (!isUserMaster && !memberRecord) {
        throw new Error("Você não é membro desta mesa.");
      }

      // Construir objeto do Mestre
      const masterObj = {
          id: tableData.master_id,
          display_name: masterProfile?.display_name || "Mestre Desconhecido",
          isMaster: true,
          isHelper: false
      };

      // Construir lista de membros (Jogadores)
      const playersList = (membersRaw || []).map(member => {
          const profile = membersProfiles.find(p => p.id === member.user_id);
          return {
              id: member.user_id,
              display_name: profile?.display_name || "Jogador",
              isMaster: false,
              isHelper: member.is_helper
          };
      }).filter(p => p.id !== masterObj.id); // Remove o mestre se ele estiver na lista de membros também

      const finalMemberList: TableMember[] = [masterObj, ...playersList];

      return {
        table: tableData as Table,
        user,
        isMaster: isUserMaster,
        isHelper: memberRecord?.is_helper || false,
        members: finalMemberList
      };
    },
    enabled: !!id && id !== "undefined",
    retry: 1, 
    staleTime: 1000 * 60 * 5, 
    onError: (err) => {
      console.error("Erro ao carregar mesa:", err);
      if (err.message.includes("Mesa não encontrada")) {
        queryClient.invalidateQueries({ queryKey: ["dashboard-tables"] });
      }
    }
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
                {(error as Error)?.message || "Verifique sua conexão."}
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

  const contextValue = {
    tableId: contextData.table.id,
    masterId: contextData.table.master_id,
    userId: contextData.user.id,
    isMaster: contextData.isMaster,
    isHelper: contextData.isHelper,
    members: contextData.members,
    setMembers: () => {} 
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