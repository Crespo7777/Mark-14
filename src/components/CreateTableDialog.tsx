import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateTableDialogProps {
  children: React.ReactNode;
  onTableCreated: () => void;
}

export const CreateTableDialog = ({ children, onTableCreated }: CreateTableDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome da mesa é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("tables").insert({
      name: name.trim(),
      description: description.trim() || null,
      master_id: user.id,
    });

    if (error) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mesa criada!",
        description: "Sua mesa foi criada com sucesso.",
      });
      setName("");
      setDescription("");
      setOpen(false);
      onTableCreated();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Mesa</DialogTitle>
          <DialogDescription>
            Crie uma nova mesa de RPG e convide seus jogadores
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="table-name">Nome da Mesa</Label>
            <Input
              id="table-name"
              placeholder="A Floresta de Davokar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="table-description">Descrição (opcional)</Label>
            <Textarea
              id="table-description"
              placeholder="Uma campanha épica nas profundezas de Davokar..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Mesa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
