import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TableProvider, TableMember } from "@/features/table/TableContext"; 
import { MasterView } from "@/components/MasterView";
import { PlayerView } from "@/components/PlayerView";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertCircle, RefreshCcw, Map as MapIcon, LayoutDashboard } from "lucide-react";
import { Table, Character, Combatant } from "@/types/app-types"; 
import { MapBoard } from "@/features/map/MapBoard";
import { MapSidebar } from "@/features/map/MapSidebar";
import { MapToken, FogShape } from "@/types/map-types";

// --- FUNÇÕES DE BUSCA ---
const fetchMapTokens = async (tableId: string): Promise<MapToken[]> => {
    const { data, error } = await supabase.from("map_tokens").select("*").eq("table_id", tableId);
    if (error) throw error;
    return data as MapToken[]; 
};

const fetchCharacters = async (tableId: string) => {
    const { data, error } = await supabase.from("characters").select("*").eq("table_id", tableId);
    if (error) throw error;
    return data as Character[];
};

const fetchFogShapes = async (tableId: string): Promise<FogShape[]> => {
    const { data, error } = await supabase.from("map_fog").select("*").eq("table_id", tableId);
    if (error) throw error;
    return (data || []).map((d: any) => ({ ...d, points: d.points as number[] })) as FogShape[];
};

// --- NOVO: Buscar Combatentes ---
const fetchCombatants = async (tableId: string) => {
    const { data, error } = await supabase.from("combatants").select("*").eq("table_id", tableId);
    if (error) throw error;
    return data as Combatant[];
};

const TableView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient(); 

    const [viewMode, setViewMode] = useState<"ui" | "map">("ui");
    const [mapTokens, setMapTokens] = useState<MapToken[]>([]);
    const [fogShapes, setFogShapes] = useState<FogShape[]>([]); 

    // 1. Query Principal
    const { 
        data: contextData, 
        isLoading: isLoadingContext, 
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

            const { data: tableData, error: tableError } = await supabase.from("tables").select("*").eq("id", id).maybeSingle();
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

    // 2. Queries Secundárias
    const { data: mapTokensData, isLoading: isLoadingTokens } = useQuery({
        queryKey: ['map_tokens', id], queryFn: () => fetchMapTokens(id!), enabled: !!id
    });

    const { data: characters = [], isLoading: isLoadingChars } = useQuery({
        queryKey: ["characters", id], queryFn: () => fetchCharacters(id!), enabled: !!id
    });

    const { data: fogData, isLoading: isLoadingFog } = useQuery({
        queryKey: ["map_fog", id], queryFn: () => fetchFogShapes(id!), enabled: !!id
    });

    // --- NOVA QUERY: Combatentes ---
    const { data: combatants = [], isLoading: isLoadingCombat } = useQuery({
        queryKey: ["combatants", id], queryFn: () => fetchCombatants(id!), enabled: !!id
    });

    // Sincronização
    useEffect(() => { if (mapTokensData) setMapTokens(mapTokensData); }, [mapTokensData]);
    useEffect(() => { if (fogData) setFogShapes(fogData); }, [fogData]);

    if (isLoadingContext || isLoadingTokens || isLoadingChars || isLoadingFog || isLoadingCombat) {
        return (
            <div className="h-screen w-screen flex flex-col items-center justify-center bg-background gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Carregando Mundo...</p>
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

    const contextValue = {
        tableId: contextData.table.id,
        masterId: contextData.table.master_id,
        userId: contextData.user.id,
        isMaster: contextData.isMaster,
        isHelper: contextData.isHelper,
        members: contextData.members,
        setMembers: () => {}, 
        mapTokens: mapTokens, 
        setMapTokens: setMapTokens,
        characters: characters,
        fogShapes: fogShapes,
        setFogShapes: setFogShapes,
        combatants: combatants // <--- Dados de Combate disponíveis no Mapa
    };

    return (
        <TableProvider value={contextValue as any}>
            <div className="h-screen w-screen overflow-hidden bg-background relative">
                
                {viewMode === "map" && (
                    <div className="absolute inset-0 z-0">
                        <MapBoard isMaster={contextData.isMaster} tableData={contextData.table} />
                        <div className="absolute top-4 right-4 z-10 pointer-events-auto">
                             <MapSidebar />
                        </div>
                    </div>
                )}

                {viewMode === "ui" && (
                    <div className="h-full w-full relative z-10 bg-background/95 backdrop-blur-sm">
                        {contextData.isMaster || contextData.isHelper ? <MasterView /> : <PlayerView />}
                    </div>
                )}

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
                            Mapa
                        </Button>
                    </div>
                </div>

            </div>
        </TableProvider>
    );
};

export default TableView;