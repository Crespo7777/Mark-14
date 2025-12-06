import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { JoinTableDialog } from "@/components/JoinTableDialog";
import { Table } from "@/types/app-types";
import { LogOut, Search, Users, Crown, Clock, Shield, Play, DoorOpen, Lock, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  has_pending_request: boolean;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [tables, setTables] = useState<TableWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [profile, setProfile] = useState<any>(null);
  
  // Controle de Diálogos
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [isJoinDialogOpen, setIsJoinDialogOpen] = useState(false);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
         navigate("/auth");
         return;
      }

      // 0. Buscar Perfil
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      setProfile(profileData);

      // 1. Buscar todas as mesas
      const { data: tablesData, error: tablesError } = await supabase
        .from("tables")
        .select("*")
        .order("created_at", { ascending: false });

      if (tablesError) throw tablesError;

      // 2. Buscar onde sou participante
      const { data: myParticipations } = await supabase
        .from("table_members")
        .select("table_id")
        .eq("user_id", user.id);

      const myTableIds = new Set(myParticipations?.map(p => p.table_id));

      // 3. Buscar minhas solicitações pendentes
      const { data: myRequests } = await supabase
        .from("table_join_requests")
        .select("table_id")
        .eq("user_id", user.id)
        .eq("status", "pending");

      const myPendingIds = new Set(myRequests?.map(r => r.table_id));

      const enrichedTables: TableWithRole[] = tablesData.map((table: any) => ({
        ...table,
        is_owner: table.master_id === user.id,
        is_member: myTableIds.has(table.id),
        has_pending_request: myPendingIds.has(table.id)
      }));

      setTables(enrichedTables);
    } catch (error: any) {
      toast.error("Erro ao carregar mesas");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleEnterTable = (tableId: string) => {
    navigate(`/table/${tableId}`);
  };

  const handleTableAction = (table: TableWithRole) => {
    if (table.is_owner || table.is_member) {
      handleEnterTable(table.id);
    } else if (table.has_pending_request) {
      toast.info("Aguardando aprovação do Mestre.");
    } else {
      setSelectedTable(table);
      setIsJoinDialogOpen(true);
    }
  };
  
  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    const { error } = await supabase
      .from("tables")
      .delete()
      .eq("id", tableToDelete.id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Mesa excluída!");
      fetchTables();
    }
    setTableToDelete(null);
  };

  const filteredTables = tables.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const myTables = filteredTables.filter(t => t.is_owner || t.is_member);
  const availableTables = filteredTables.filter(t => !t.is_owner && !t.is_member);

  if (loading) {
      return <div className="min-h-screen flex items-center justify-center bg-black text-white">Carregando Tenebre...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
               <img src="/tenebre-logo.png" alt="Logo" className="w-6 h-6 object-contain opacity-80" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground">Tenebre VTT</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="text-sm text-muted-foreground hidden md:block">
                {profile?.display_name || "Viajante"}
             </div>
             <Button variant="ghost" size="icon" onClick={handleLogout} title="Sair">
               <LogOut className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Salão de Aventuras</h1>
            <p className="text-muted-foreground">Onde as histórias começam e terminam.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar mesas..." 
                className="pl-9 bg-secondary/50 border-border/50" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <CreateTableDialog onTableCreated={fetchTables} />
          </div>
        </div>

        <Tabs defaultValue="my-tables" className="w-full">
          <TabsList className="mb-6 bg-secondary/30">
            <TabsTrigger value="my-tables">Minhas Mesas ({myTables.length})</TabsTrigger>
            <TabsTrigger value="browse">Explorar ({availableTables.length})</TabsTrigger>
          </TabsList>

          {/* VIEW: MINHAS MESAS */}
          <TabsContent value="my-tables" className="space-y-6">
             {myTables.length === 0 ? (
               <div className="text-center py-20 border-2 border-dashed rounded-xl bg-secondary/5">
                 <h3 className="text-xl font-semibold mb-2">Nenhuma aventura ativa</h3>
                 <p className="text-muted-foreground mb-6">Você ainda não participa de nenhuma mesa.</p>
                 <CreateTableDialog onTableCreated={fetchTables} />
               </div>
             ) : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                 {myTables.map((table) => (
                   <TableCard 
                     key={table.id} 
                     table={table} 
                     onAction={() => handleTableAction(table)}
                     onDelete={() => setTableToDelete(table)} 
                   />
                 ))}
               </div>
             )}
          </TabsContent>

          {/* VIEW: EXPLORAR */}
          <TabsContent value="browse">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {availableTables.map((table) => (
                 <TableCard 
                   key={table.id} 
                   table={table} 
                   onAction={() => handleTableAction(table)} 
                 />
               ))}
            </div>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Diálogos */}
      <JoinTableDialog 
        table={selectedTable}
        open={isJoinDialogOpen}
        onOpenChange={setIsJoinDialogOpen}
        onSuccess={fetchTables}
      />

      <AlertDialog
        open={!!tableToDelete}
        onOpenChange={(open) => !open && setTableToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Mesa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apagará permanentemente a mesa <strong>{tableToDelete?.name}</strong> e todos os dados associados (fichas, chat, imagens).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleDeleteTable}
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

// --- COMPONENTE DE CARD "POSTER" (IMAGEM TOTAL) ---
const TableCard = ({ 
  table, 
  onAction, 
  onDelete 
}: { 
  table: TableWithRole, 
  onAction: () => void, 
  onDelete?: () => void 
}) => {
  return (
    <Card 
      className="group relative overflow-hidden h-80 border-0 shadow-lg cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 bg-black"
      onClick={onAction}
    >
      {/* 1. Imagem de Fundo (Full Size) */}
      <div className="absolute inset-0 z-0">
         <img 
            src={table.image_url || "/preview-banner.png"} 
            alt={table.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
            onError={(e) => {
               (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?auto=format&fit=crop&q=80&w=800";
            }}
         />
         {/* Overlay Gradiente para Leitura */}
         <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent opacity-90 group-hover:opacity-80 transition-opacity" />
      </div>

      {/* 2. Badges de Status (Topo Direita) */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-2 items-end">
         {table.is_owner && (
           <Badge className="bg-yellow-500 text-black font-bold border-none shadow-md backdrop-blur-md">
             <Crown className="w-3 h-3 mr-1" /> Mestre
           </Badge>
         )}
         {table.is_member && !table.is_owner && (
           <Badge className="bg-green-600 text-white font-bold border-none shadow-md backdrop-blur-md">
             <Users className="w-3 h-3 mr-1" /> Jogador
           </Badge>
         )}
         {table.password && (
            <Badge variant="outline" className="bg-black/50 text-white border-white/20 backdrop-blur-md">
              <Lock className="w-3 h-3 mr-1" /> Privada
            </Badge>
         )}
      </div>
      
      {/* 3. Botão de Delete (Topo Esquerda - Só Mestre) */}
      {table.is_owner && onDelete && (
         <div className="absolute top-3 left-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              size="icon" 
              variant="destructive" 
              className="h-8 w-8 rounded-full shadow-md"
              onClick={(e) => {
                 e.stopPropagation();
                 onDelete();
              }}
            >
               <Trash2 className="w-4 h-4" />
            </Button>
         </div>
      )}

      {/* 4. Conteúdo de Texto (Rodapé) */}
      <div className="absolute bottom-0 left-0 right-0 p-5 z-20 flex flex-col gap-2">
        <div className="space-y-1">
           <h3 className="text-xl font-bold text-white leading-tight line-clamp-1 group-hover:text-primary transition-colors text-shadow">
             {table.name}
           </h3>
           <div className="flex items-center gap-2 text-xs text-gray-300">
              <Clock className="w-3 h-3" /> 
              {new Date(table.created_at).toLocaleDateString()}
              {table.requires_approval && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-orange-300"><Shield className="w-3 h-3"/> Mod.</span>
                  </>
              )}
           </div>
        </div>

        <Button 
          className={`w-full font-bold mt-2 shadow-lg transition-transform active:scale-95 ${
             table.is_owner ? "bg-primary hover:bg-primary/90 text-primary-foreground" : 
             table.is_member ? "bg-green-600 hover:bg-green-700 text-white" : 
             "bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm border border-white/10"
          }`}
        >
          {table.is_owner ? (
            <> <Play className="w-4 h-4 mr-2" /> Iniciar </>
          ) : table.is_member ? (
            <> <DoorOpen className="w-4 h-4 mr-2" /> Entrar </>
          ) : table.has_pending_request ? (
            <> <Clock className="w-4 h-4 mr-2" /> Aguardando </>
          ) : (
            <> <Users className="w-4 h-4 mr-2" /> Participar </>
          )}
        </Button>
      </div>
    </Card>
  );
};

export default Dashboard;