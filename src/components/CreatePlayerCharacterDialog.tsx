// src/components/CreatePlayerCharacterDialog.tsx

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

interface CreatePlayerCharacterDialogProps {
  children: React.ReactNode;
  onCharacterCreated: () => void;
  tableId: string;
}

export const CreatePlayerCharacterDialog = ({
  children,
  onCharacterCreated,
  tableId,
}: CreatePlayerCharacterDialogProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [race, setRace] = useState("");
  const [occupation, setOccupation] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim()) {
      toast({
        title: "Erro",
        description: "O nome do personagem é obrigatório",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Gerar dados padrão da ficha
    const defaultData = getDefaultCharacterSheetData(name.trim());
    if (race.trim()) defaultData.race = race.trim();
    if (occupation.trim()) defaultData.occupation = occupation.trim();

    const { error } = await supabase.from("characters").insert({
      name: name.trim(),
      table_id: tableId,
      player_id: user.id, // Atribui a ficha ao usuário logado
      data: defaultData,
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Ficha criada!", description: "A ficha foi criada com sucesso." });
      setName("");
      setRace("");
      setOccupation("");
      setOpen(false);
      onCharacterCreated();
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
            Crie sua nova ficha de personagem para esta mesa.
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="char-race">Raça</Label>
              <Input
                id="char-race"
                placeholder="Humano"
                value={race}
                onChange={(e) => setRace(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-occupation">Ocupação</Label>
              <Input
                id="char-occupation"
                placeholder="Aventureiro"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
          </div>

          {/* O dropdown "Atribuir a" foi removido */}

          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Ficha"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};