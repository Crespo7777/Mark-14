import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TableProvider } from "@/features/table/TableContext"; 
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { Button } from "@/components/ui/button";
import { Loader2, AlertCircle, RefreshCcw } from "lucide-react";
import { Table, Character, Combatant } from "@/types/app-types"; 
import { ChatOverlay } from "@/components/chat/ChatOverlay"; 

const fetchCharacters = async (tableId: string) => {
    const { data, error } = await supabase.from("characters").select("*").eq("table_id", tableId);
    if (error) throw error;
    return data as Character[];
};

const fetchCombatants = async (tableId: string) => {
    const { data, error } = await supabase.from("combatants").select("*").eq("table_id", tableId);
    if (error) throw error;
    return data as Combatant[];
};

const TableView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    // --- Query Principal ---
    const { 
        data: contextData, 
        isLoading: isLoadingContext, 
        isError, 
        refetch 
    } = useQuery({
        queryKey: ["table-view", id],
        queryFn: async () => {
            if (!id || id === "undefined") throw new Error("ID inválido");
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("Não autenticado");
            const user = session.user;

            // --- CORREÇÃO AQUI: system_type ---
            const { data: tableData, error: tableError } = await supabase
                .from("tables")
                .select("*, system_type") 
                .eq("id", id)
                .maybeSingle();

            if (tableError || !tableData) throw new Error("Mesa não encontrada");

            const { data: masterProfile } = await supabase.from("profiles").select("id, display_name").eq("id", tableData.master_id).single();
            const { data: membersRaw } = await supabase.from("table_members").select("user_id, is_helper").eq("table_id", id);

            let membersProfiles: any[] = [];
            if (membersRaw && membersRaw.length > 0) {
                const userIds = membersRaw.map(m => m.user_id);
                const { data: profiles } = await supabase.from("profiles").select("id, display_name").in("id", userIds);
                membersProfiles = profiles || [];
            }

            const isUserMaster = tableData.master_id === user.id;
            const memberRecord = membersRaw?.find(m => m.user_id === user.id);
            if (!isUserMaster && !memberRecord) throw new Error("Você não é membro desta mesa.");

            const masterObj = {
                id: tableData.master_id,
                display_name: masterProfile?.display_name || "Mestre",
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

            return {
                table: tableData as Table,
                user,
                isMaster: isUserMaster,
                isHelper: memberRecord?.is_helper || false,
                members: [masterObj, ...playersList]
            };
        },
        enabled: !!id && id !== "undefined",
        retry: 1
    });

    const { data: characters = [], isLoading: isLoadingChars } = useQuery({
        queryKey: ["characters", id], queryFn: () => fetchCharacters(id!), enabled: !!id
    });

    const { data: combatants = [], isLoading: isLoadingCombat } = useQuery({
        queryKey: ["combatants", id], queryFn: () => fetchCombatants(id!), enabled: !!id
    });

    if (isLoadingContext || isLoadingChars || isLoadingCombat) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Carregando Mesa...</p>
            </div>
        );
    }

    if (isError || !contextData) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4 text-center gap-4">
                <AlertCircle className="h-12 w-12 text-destructive mb-2" />
                <h1 className="text-xl font-bold">Erro ao carregar</h1>
                <Button onClick={() => refetch()}><RefreshCcw className="mr-2 h-4 w-4"/> Tentar Novamente</Button>
            </div>
        );
    }

    // --- CONTEXTO PREENCHIDO CORRETAMENTE ---
    const contextValue = {
        tableId: contextData.table.id,
        masterId: contextData.table.master_id,
        userId: contextData.user.id,
        isMaster: contextData.isMaster,
        isHelper: contextData.isHelper,
        
        // AQUI ESTÁ A CORREÇÃO QUE FAZ O PATHFINDER FUNCIONAR
        tableData: contextData.table, 
        
        members: contextData.members,
        setMembers: () => {}, 
        mapTokens: [], setMapTokens: () => {},
        fogShapes: [], setFogShapes: () => {},
        characters: characters,
        combatants: combatants
    };

    return (
        <TableProvider value={contextValue as any}>
            <div className="h-screen w-screen overflow-hidden bg-background relative flex">
                <div className="flex-1 h-full overflow-hidden relative z-10 bg-background">
                    {contextData.isMaster || contextData.isHelper ? <MasterView /> : <PlayerView />}
                </div>
                <ChatOverlay />
            </div>
        </TableProvider>
    );
};

export default TableView;