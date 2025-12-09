import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TableProvider, TableMember } from "@/features/table/TableContext"; 
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle, RefreshCcw, Map as MapIcon, LayoutDashboard } from "lucide-react";
import { Table } from "@/types/app-types";
import { MapBoard } from "@/features/map/MapBoard"; // <--- Importação do Mapa

const TableView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient(); 

  // Estado para controlar a visualização (Interface vs Mapa)
  const [viewMode, setViewMode] = useState<"ui" | "map">("ui");

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

      // PASSO 1: Buscar a Mesa
      const { data: tableData, error: tableError } = await supabase
        .from("tables")
        .select("*") 
        .eq("id", id)
        .maybeSingle();

      if (tableError) throw tableError;
      if (!tableData) throw new Error("Mesa não encontrada");

      // PASSO 2: Buscar o Perfil do Mestre
      const { data: masterProfile, error: masterError } = await supabase
        .from("profiles")
        .select("id, display_name")
        .eq("id", tableData.master_id)
        .single();
      
      if (masterError) {
         console.warn("Erro ao buscar mestre:", masterError);
      }

      // PASSO 3: Buscar Membros
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

      // PASSO 4: Montar a lista final
      const isUserMaster = tableData.master_id === user.id;
      const memberRecord = membersRaw?.find(m => m.user_id === user.id);
      
      if (!isUserMaster && !memberRecord) {
        throw new Error("Você não é membro desta mesa.");
      }

      const masterObj = {
          id: tableData.master_id,
          display_name: masterProfile?.display_name || "Mestre Desconhecido",
          isMaster: true,
          isHelper: false
      };

      const playersList = (membersRaw || []).map(member => {
          const profile = membersProfiles.find(p => p.id === member.user_id);
          return {
              id: member.user_id,
              display_name: profile?.display_name || "Jogador",
              isMaster: false,
              isHelper: member.is_helper
          };
      }).filter(p => p.id !== masterObj.id);

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
        
        {/* MODO MAPA */}
        {viewMode === "map" && (
            <div className="absolute inset-0 z-0">
                <MapBoard isMaster={contextData.isMaster} />
            </div>
        )}

        {/* MODO INTERFACE (Master/Player Views) */}
        {viewMode === "ui" && (
            <div className="h-full w-full relative z-10 bg-background/95 backdrop-blur-sm">
                {contextData.isMaster || contextData.isHelper ? (
                  <MasterView />
                ) : (
                  <PlayerView />
                )}
            </div>
        )}

        {/* CONTROLO FLUTUANTE DE NAVEGAÇÃO */}
        <div className="absolute bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-auto">
            <div className="flex bg-black/80 backdrop-blur-md p-1 rounded-lg border border-white/10 shadow-2xl">
                <Button 
                    size="sm" 
                    variant={viewMode === "ui" ? "secondary" : "ghost"} 
                    className="gap-2 text-xs font-bold"
                    onClick={() => setViewMode("ui")}
                >
                    <LayoutDashboard className="w-4 h-4" />
                    Interface
                </Button>
                <div className="w-px bg-white/20 mx-1 my-1" />
                <Button 
                    size="sm" 
                    variant={viewMode === "map" ? "secondary" : "ghost"} 
                    className="gap-2 text-xs font-bold"
                    onClick={() => setViewMode("map")}
                >
                    <MapIcon className="w-4 h-4" />
                    Mapa VTT
                </Button>
            </div>
        </div>

      </div>
    </TableProvider>
  );
};

export default TableView;