// src/components/CreateNpcDialog.tsx

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDefaultCharacterSheetData } from "@/features/character/character.schema";

interface CreateNpcDialogProps {
  children: React.ReactNode;
  onNpcCreated: () => void;
  tableId: string;
}

export const CreateNpcDialog = ({
  children,
  onNpcCreated,
  tableId,
}: CreateNpcDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [race, setRace] = useState(""); // NOVO
  const [occupation, setOccupation] = useState(""); // NOVO
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do NPC é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Gerar dados padrão da ficha
    const defaultData = getDefaultCharacterSheetData(name.trim());
    // Sobrescrever com os campos do formulário se preenchidos
    if (race.trim()) defaultData.race = race.trim();
    if (occupation.trim()) defaultData.occupation = occupation.trim();

    const { error } = await supabase.from("npcs").insert({
      name: name.trim(),
      table_id: tableId,
      data: defaultData,
      is_shared: false,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "NPC criado!", description: "A ficha do NPC foi criada." });
      setName("");
      setRace("");
      setOccupation("");
      setOpen(false);
      onNpcCreated();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar Novo NPC</DialogTitle>
          <DialogDescription>
            Crie uma ficha de NPC para sua mesa.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="npc-name">Nome do NPC</Label>
            <Input
              id="npc-name"
              placeholder="Guarda do Portão"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* NOVOS CAMPOS DE RAÇA E OCUPAÇÃO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="npc-race">Raça</Label>
              <Input
                id="npc-race"
                placeholder="Goblin"
                value={race}
                onChange={(e) => setRace(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="npc-occupation">Ocupação</Label>
              <Input
                id="npc-occupation"
                placeholder="Bandido"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar NPC"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};