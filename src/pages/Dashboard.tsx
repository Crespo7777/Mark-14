import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button"; // Importar buttonVariants
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter, // Importar CardFooter
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, LogOut, Trash2 } from "lucide-react"; // Importar Trash2
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { JoinTableDialog } from "@/components/JoinTableDialog";
// Importar componentes do AlertDialog
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

interface Table {
  id: string;
  name: string;
  description: string | null;
  master_id: string;
  created_at: string;
}

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  // 1. Adicionar state para controlar o diálogo de exclusão
  const [tableToDelete, setTableToDelete] = useState<Table | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);
    
    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    if (!profileData && !profileError) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: session.user.id,
          display_name: session.user.email?.split('@')[0] || 'Jogador'
        })
        .select()
        .single();
      
      profileData = newProfile;
    }
    
    setProfile(profileData);
    await loadTables(session.user.id);
    setLoading(false);
  };

  const loadTables = async (userId: string) => {
    const { data: masterTables } = await supabase
      .from("tables")
      .select("*")
      .eq("master_id", userId);

    const { data: memberData } = await supabase
      .from("table_members")
      .select("table_id")
      .eq("user_id", userId);

    const memberTableIds = memberData?.map(m => m.table_id) || [];
    
    let memberTables: Table[] = [];
    if (memberTableIds.length > 0) {
      const { data } = await supabase
        .from("tables")
        .select("*")
        .in("id", memberTableIds);
      memberTables = data || [];
    }

    const allTables = [...(masterTables || []), ...memberTables];
    const uniqueTables = Array.from(
      new Map(allTables.map(t => [t.id, t])).values()
    );

    setTables(uniqueTables);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleTableCreated = () => {
    if (user) {
      loadTables(user.id);
    }
  };

  // 2. Adicionar função para excluir a mesa
  const handleDeleteTable = async () => {
    if (!tableToDelete) return;

    const { error } = await supabase
      .from("tables")
      .delete()
      .eq("id", tableToDelete.id);

    if (error) {
      toast({
        title: "Erro ao excluir mesa",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mesa excluída!",
        description: `${tableToDelete.name} foi removida permanentemente.`,
      });
      // Atualiza a UI removendo a mesa da lista
      setTables(tables.filter((t) => t.id !== tableToDelete.id));
    }
    setTableToDelete(null); // Fecha o diálogo
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-primary mb-2">Symbaroum VTT</h1>
            <p className="text-muted-foreground">Bem-vindo, {profile?.display_name}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <CreateTableDialog onTableCreated={handleTableCreated}>
            <Card className="cursor-pointer hover:shadow-glow transition-shadow border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Criar Nova Mesa
                </CardTitle>
                <CardDescription>
                  Crie uma mesa como Mestre e convide jogadores
                </CardDescription>
              </CardHeader>
            </Card>
          </CreateTableDialog>

          <JoinTableDialog onTableJoined={handleTableCreated}>
            <Card className="cursor-pointer hover:shadow-glow transition-shadow border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Entrar em Mesa
                </CardTitle>
                <CardDescription>
                  Entre em uma mesa existente como Jogador
                </CardDescription>
              </CardHeader>
            </Card>
          </JoinTableDialog>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Suas Mesas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tables.length === 0 ? (
              <p className="text-muted-foreground col-span-full text-center py-8">
                Você ainda não está em nenhuma mesa. Crie ou entre em uma!
              </p>
            ) : (
              tables.map((table) => (
                <Card
                  key={table.id}
                  className="border-border/50 flex flex-col justify-between" // Alterado para flex
                >
                  {/* 3. Agrupado o conteúdo clicável */}
                  <div
                    className="cursor-pointer hover:shadow-glow transition-shadow"
                    onClick={() => navigate(`/table/${table.id}`)}
                  >
                    <CardHeader>
                      <CardTitle>{table.name}</CardTitle>
                      <CardDescription>
                        {table.description || "Sem descrição"}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {table.master_id === user?.id ? "Você é o Mestre" : "Jogador"}
                      </p>
                    </CardContent>
                  </div>
                  
                  {/* 4. Adicionado CardFooter com o botão de excluir (só para o mestre) */}
                  {table.master_id === user?.id && (
                    <CardFooter className="p-4 pt-0">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={(e) => {
                          e.stopPropagation(); // Previne a navegação
                          setTableToDelete(table);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir Mesa
                      </Button>
                    </CardFooter>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* 5. Adicionado o Diálogo de Confirmação de Exclusão */}
        <AlertDialog
          open={!!tableToDelete}
          onOpenChange={(open) => !open && setTableToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso excluirá permanentemente a mesa{" "}
                <span className="font-bold text-destructive">{tableToDelete?.name}</span> e
                todas as suas fichas, NPCs e entradas de diário. Esta ação
                não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                className={buttonVariants({ variant: "destructive" })}
                onClick={handleDeleteTable}
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

      </div>
    </div>
  );
};

export default Dashboard;