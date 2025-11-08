import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface JoinTableDialogProps {
  children: React.ReactNode;
  onTableJoined: () => void;
}

interface AvailableTable {
  id: string;
  name: string;
  description: string | null;
  master: {
    display_name: string;
  };
}

export const JoinTableDialog = ({ children, onTableJoined }: JoinTableDialogProps) => {
  const [open, setOpen] = useState(false);
  const [tables, setTables] = useState<AvailableTable[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadAvailableTables();
    }
  }, [open]);

  const loadAvailableTables = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("tables")
      .select(`
        id,
        name,
        description,
        master:profiles!tables_master_id_fkey(display_name)
      `)
      .neq("master_id", user.id);

    if (error) {
      console.error("Error loading tables:", error);
      return;
    }

    setTables(data || []);
  };

  const handleJoin = async (tableId: string) => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("table_members").insert({
      table_id: tableId,
      user_id: user.id,
    });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Aviso",
          description: "Você já está nesta mesa",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Sucesso!",
        description: "Você entrou na mesa",
      });
      setOpen(false);
      onTableJoined();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Entrar em Mesa</DialogTitle>
          <DialogDescription>
            Escolha uma mesa para participar como jogador
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {tables.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhuma mesa disponível no momento
            </p>
          ) : (
            tables.map((table) => (
              <Card key={table.id} className="border-border/50">
                <CardHeader>
                  <CardTitle>{table.name}</CardTitle>
                  <CardDescription>
                    Mestre: {table.master.display_name}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm mb-4">{table.description || "Sem descrição"}</p>
                  <Button
                    onClick={() => handleJoin(table.id)}
                    disabled={loading}
                    className="w-full"
                  >
                    Entrar nesta Mesa
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
