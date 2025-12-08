import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, LogOut, Trash2, Search, Clock, Play, DoorOpen, Lock, Settings, Loader2, RefreshCw, Shield, Crown } from "lucide-react";
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { JoinTableDialog } from "@/components/JoinTableDialog";
import { EditTableDialog } from "@/components/EditTableDialog";
import { Table } from "@/types/app-types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TableWithRole extends Table {
  is_owner: boolean;
  is_member: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [tableToEdit, setTableToEdit] = useState<Table | null>(null);
  const [selectedTableToJoin, setSelectedTableToJoin] = useState<Table | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  // 1. QUERY PRINCIPAL
  const { data: dashboardData, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard-tables"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const user = session.user;
      
      // CORREÇÃO: Capturar o username dos metadados gravados no registo
      const metadataUsername = user.user_metadata?.username;

      const [profileResponse, tablesResponse, membersResponse] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
        supabase.from("tables").select("*").order("created_at", { ascending: false }),
        supabase.from("table_members").select("table_id").eq("user_id", user.id)
      ]);

      let profile = profileResponse.data;
      
      // CORREÇÃO: Se não existir perfil, cria usando o metadataUsername como prioridade
      if (!profile) {
        const { data: newProfile } = await supabase.from("profiles").insert({
          id: user.id, 
          display_name: metadataUsername || user.email?.split('@')[0] || 'Jogador'
        }).select().single();
        profile = newProfile;
      }

      const allTables = tablesResponse.data || [];
      const memberTableIds = new Set(membersResponse.data?.map(m => m.table_id));

      const processedTables: TableWithRole[] = allTables.map((t: any) => ({
        ...t,
        is_owner: t.master_id === user.id,
        is_member: memberTableIds.has(t.id)
      }));

      return { user, profile, tables: processedTables };
    },
    retry: 1,
    staleTime: 1000 * 60 * 2, 
  });

  // LOGOUT SEGURO
  const handleSignOut = async () => {
    try {
        await supabase.auth.signOut();
    } catch (error) {
        console.error("Erro silencioso ao sair:", error);
    } finally {
        queryClient.clear();
        localStorage.removeItem('sb-gbxpzxwmymggsburpnjm-auth-token'); 
        navigate("/auth");
    }
  };

  const handleDeleteTable = async () => {
    if (!tableToDelete) return;
    const { error } = await supabase.from("tables").delete().eq("id", tableToDelete.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso", description: "Mesa removida." });
      queryClient.invalidateQueries({ queryKey: ["dashboard-tables"] });
    }
    setTableToDelete(null);
  };

  const handleJoinClick = (table: TableWithRole) => {
    if (table.is_owner || table.is_member) {
        navigate(`/table/${table.id}`);
    } else {
        setSelectedTableToJoin(table);
        setIsJoinDialogOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-muted-foreground animate-pulse font-medium">Invocando Tenebre...</p>
      </div>
    );
  }

  if (isError || !dashboardData) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
            <p className="text-destructive">Conexão perdida.</p>
            <Button onClick={() => refetch()} variant="outline"><RefreshCw className="mr-2 h-4 w-4"/> Reconectar</Button>
            <Button onClick={handleSignOut} variant="link">Sair</Button>
        </div>
    )
  }

  const { user, profile, tables } = dashboardData;

  // CORREÇÃO: Define o nome de exibição. Prioriza: Metadados > Perfil (DB) > Email
  const displayName = user.user_metadata?.username || profile?.display_name || user.email?.split('@')[0] || "Viajante";

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const myTables = filteredTables.filter(t => t.is_owner || t.is_member);
  const browseTables = filteredTables.filter(t => !t.is_owner && !t.is_member);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* HEADER FIXO - IDENTIDADE VISUAL ATUALIZADA */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
           <div className="flex items-center gap-3">
               {/* Logo Tenebre */}
               <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-[0_0_10px_rgba(var(--primary),0.2)]">
                  <img src="/tenebre-logo.png" alt="Logo" className="w-5 h-5 object-contain opacity-90" />
               </div>
               
               {/* Nome Tenebre VTT */}
               <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent font-mono">
                   Tenebre VTT
               </h1>
           </div>
           
           <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                 Olá, {displayName}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="w-4 h-4 mr-2" /> Sair
              </Button>
           </div>
        </div>
      </header>

      <main className="container max-w-7xl mx-auto px-4 py-8 space-y-8">
        
        {/* Barra de Controlo */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
               <h2 className="text-3xl font-bold tracking-tight">Lobby</h2>
               {/* Texto Temático Atualizado */}
               <p className="text-muted-foreground">Gerencie suas crônicas e mergulhe na escuridão.</p>
            </div>
            
            <div className="flex gap-2 w-full md:w-auto">
                <div className="relative flex-1 md:w-72">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                      placeholder="Buscar mesa..." 
                      className="pl-9 bg-secondary/50 border-secondary-foreground/10 focus:bg-background transition-colors"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                
                <CreateTableDialog onTableCreated={() => queryClient.invalidateQueries({ queryKey: ["dashboard-tables"] })}>
                   <Button className="shrink-0 gap-2 shadow-lg shadow-primary/20 bg-gradient-to-r from-primary to-primary/90 hover:opacity-90 transition-opacity">
                      <Plus className="w-4 h-4" /> Nova Mesa
                   </Button>
                </CreateTableDialog>
            </div>
        </div>

        {/* Abas */}
        <Tabs defaultValue="my-tables" className="w-full">
            <TabsList className="mb-6 bg-secondary/50 p-1 border border-border/50">
               <TabsTrigger value="my-tables" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Minhas Mesas ({myTables.length})</TabsTrigger>
               <TabsTrigger value="browse" className="px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm">Explorar ({browseTables.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="my-tables" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {myTables.length === 0 ? (
                    <div className="text-center py-20 border-2 border-dashed rounded-xl bg-secondary/5 border-muted-foreground/20">
                        <div className="mx-auto w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mb-4">
                            <Shield className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-medium mb-2">Sem missões ativas</h3>
                        <p className="text-muted-foreground mb-6 max-w-sm mx-auto">Você ainda não faz parte de nenhuma campanha.</p>
                        <CreateTableDialog onTableCreated={() => queryClient.invalidateQueries({ queryKey: ["dashboard-tables"] })}>
                           <Button variant="outline">Iniciar Jornada</Button>
                        </CreateTableDialog>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {myTables.map(table => (
                            <TableCard 
                                key={table.id} 
                                table={table} 
                                onAction={() => handleJoinClick(table)}
                                onEdit={() => setTableToEdit(table)}
                                onDelete={() => setTableToDelete(table)}
                            />
                        ))}
                    </div>
                )}
            </TabsContent>

            <TabsContent value="browse" className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {browseTables.map(table => (
                        <TableCard 
                            key={table.id} 
                            table={table} 
                            onAction={() => handleJoinClick(table)}
                        />
                    ))}
                </div>
            </TabsContent>
        </Tabs>
      </main>

      {/* --- DIÁLOGOS --- */}
      <EditTableDialog 
        table={tableToEdit}
        open={!!tableToEdit}
        onOpenChange={(open) => !open && setTableToEdit(null)}
        onTableUpdated={() => queryClient.invalidateQueries({ queryKey: ["dashboard-tables"] })}
      />

      <AlertDialog
        open={!!tableToDelete}
        onOpenChange={(open) => !open && setTableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mesa?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação é irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className={buttonVariants({ variant: "destructive" })} onClick={handleDeleteTable}>
              Excluir Definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JoinTableDialog 
         table={selectedTableToJoin}
         open={isJoinDialogOpen}
         onOpenChange={setIsJoinDialogOpen}
         onSuccess={() => queryClient.invalidateQueries({ queryKey: ["dashboard-tables"] })}
      />
    </div>
  );
};

// Card Visual
const TableCard = ({ table, onAction, onEdit, onDelete }: { table: TableWithRole, onAction: () => void, onEdit?: () => void, onDelete?: () => void }) => {
    return (
      <Card className="group overflow-hidden border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 flex flex-col h-full bg-card">
        <div className="relative h-40 overflow-hidden bg-muted/50">
            {table.image_url ? (
                <>
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent z-10" />
                   <img 
                      src={table.image_url} 
                      alt={table.name}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                   />
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-secondary/10 to-background group-hover:from-primary/20 transition-all">
                   <span className="text-4xl font-black text-foreground/5 tracking-widest select-none group-hover:text-primary/10 transition-colors">VTT</span>
                </div>
            )}
            
            <div className="absolute top-2 right-2 z-20 flex flex-col gap-1 items-end">
                {table.is_owner && <Badge className="bg-yellow-500/90 hover:bg-yellow-500 text-black font-bold shadow-sm backdrop-blur-md"><Crown className="w-3 h-3 mr-1"/> Mestre</Badge>}
                {table.is_member && !table.is_owner && <Badge className="bg-green-600/90 hover:bg-green-600 text-white shadow-sm backdrop-blur-md"><Users className="w-3 h-3 mr-1"/> Jogador</Badge>}
                {table.password && !table.is_member && !table.is_owner && <Badge variant="secondary" className="bg-black/60 text-white backdrop-blur-md"><Lock className="w-3 h-3 mr-1"/> Privada</Badge>}
            </div>
        </div>
        
        <CardHeader className="pb-2 pt-4">
          <CardTitle className="text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {table.name}
          </CardTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
             <Clock className="w-3 h-3" /> 
             {new Date(table.created_at).toLocaleDateString()}
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 pb-4 min-h-[3rem]">
           <p className="text-sm text-muted-foreground line-clamp-2">
             {table.description || "Sem descrição..."}
           </p>
        </CardContent>
  
        <CardFooter className="pt-0 flex gap-2">
          <Button 
            className={`flex-1 font-semibold shadow-sm ${table.is_owner ? "bg-primary hover:bg-primary/90" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
            onClick={onAction}
          >
            {table.is_owner ? <><Play className="w-4 h-4 mr-2" /> Jogar</> : table.is_member ? <><DoorOpen className="w-4 h-4 mr-2" /> Entrar</> : <><Users className="w-4 h-4 mr-2" /> Participar</>}
          </Button>

          {table.is_owner && (
             <>
                {onEdit && <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Configurar"><Settings className="w-4 h-4" /></Button>}
                {onDelete && <Button variant="destructive" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="Excluir"><Trash2 className="w-4 h-4" /></Button>}
             </>
          )}
        </CardFooter>
      </Card>
    );
};

export default Dashboard;