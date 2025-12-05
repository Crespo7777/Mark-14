import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table } from "@/types/app-types";
import { Lock, DoorOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface JoinTableDialogProps {
  table: Table | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const JoinTableDialog = ({ table, open, onOpenChange, onSuccess }: JoinTableDialogProps) => {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!table) return null;

  const handleJoin = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // 1. Verificação de Senha
      if (table.password && table.password !== "") {
        if (password !== table.password) {
          toast({
            title: "Acesso Negado",
            description: "Senha incorreta.",
            variant: "destructive"
          });
          setIsLoading(false);
          return;
        }
      }

      // 2. Inserir
      const { error } = await supabase.from("table_members").insert({
          table_id: table.id,
          user_id: user.id
      });

      if (error && error.code !== "23505") throw error;

      toast({ title: "Bem-vindo!", description: `Você entrou na mesa ${table.name}.` });
      
      setPassword("");
      onOpenChange(false);
      onSuccess(); // Dispara o refresh do React Query no Dashboard

    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Entrar em "{table.name}"</DialogTitle>
          <DialogDescription>
            {table.password ? "Esta mesa requer senha." : "Deseja entrar nesta mesa?"}
          </DialogDescription>
        </DialogHeader>

        {table.password && (
            <div className="space-y-2 py-4">
              <Label>Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Digite a senha..."
                  className="pl-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleJoin} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <DoorOpen className="h-4 w-4 mr-2" />}
            Entrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};