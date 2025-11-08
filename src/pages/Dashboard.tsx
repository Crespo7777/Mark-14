import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, LogOut } from "lucide-react";
import { CreateTableDialog } from "@/components/CreateTableDialog";
import { JoinTableDialog } from "@/components/JoinTableDialog";

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
    
    // Check if profile exists, if not create it
    let { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle();
    
    if (!profileData && !profileError) {
      // Create profile if it doesn't exist
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
    // Get tables where user is master
    const { data: masterTables } = await supabase
      .from("tables")
      .select("*")
      .eq("master_id", userId);

    // Get tables where user is a member
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

    // Combine and deduplicate
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
                  className="cursor-pointer hover:shadow-glow transition-shadow border-border/50"
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
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
