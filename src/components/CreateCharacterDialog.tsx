import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CreateCharacterDialogProps {
  children: React.ReactNode;
  onCharacterCreated: () => void;
  tableId: string;
  masterId: string;
  members: any[];
}

export const CreateCharacterDialog = ({ 
  children, 
  onCharacterCreated,
  tableId,
  masterId,
  members 
}: CreateCharacterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [assignedPlayerId, setAssignedPlayerId] = useState<string>(masterId); // Padrão para o mestre
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({ title: "Erro", description: "O nome do personagem é obrigatório", variant: "destructive" });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from("characters").insert({
      name: name.trim(),
      table_id: tableId,
      player_id: assignedPlayerId, // Usa o ID selecionado
      data: {}, // Inicia com uma ficha vazia
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ficha criada!", description: "A ficha foi criada com sucesso." });
      setName("");
      setAssignedPlayerId(masterId); // Reseta para o mestre
      setOpen(false);
      onCharacterCreated(); // Recarrega os dados na MasterView
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Nova Ficha</DialogTitle>
          <DialogDescription>
            Crie uma nova ficha de personagem e atribua-a a um jogador (ou a você mesmo).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="char-name">Nome do Personagem</Label>
            <Input
              id="char-name"
              placeholder="Novo Aventureiro"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="player-assign">Atribuir a</Label>
            <Select onValueChange={setAssignedPlayerId} value={assignedPlayerId}>
              <SelectTrigger id="player-assign">
                <SelectValue placeholder="Atribuir a um jogador..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={masterId}>Mestre (Você)</SelectItem>
                <SelectSeparator />
                {members.map(member => (
                  <SelectItem key={member.user_id} value={member.user_id}>
                    {member.user.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Ficha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};