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

// --- 1. IMPORTAÇÕES CORRIGIDAS ---
// Importar o schema e o default data do NPC, não do Character
import {
  getDefaultNpcSheetData,
  npcSheetSchema,
} from "@/features/npc/npc.schema";
// --- FIM DA CORREÇÃO ---

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
  const [race, setRace] = useState("");
  const [occupation, setOccupation] = useState("");
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

    // --- 2. LÓGICA DE CRIAÇÃO CORRIGIDA ---
    // Usar a função correta para gerar os dados padrão do NPC
    const defaultData = getDefaultNpcSheetData(name.trim());

    // Sobrescrever com os campos do formulário se preenchidos
    if (race.trim()) defaultData.race = race.trim();
    if (occupation.trim()) defaultData.occupation = occupation.trim();

    // Validação final com o schema do NPC (opcional, mas recomendado)
    const parsedData = npcSheetSchema.safeParse(defaultData);

    if (!parsedData.success) {
      console.error("Erro de validação ao criar NPC:", parsedData.error);
      toast({
        title: "Erro de Schema",
        description: "Os dados padrão do NPC falharam na validação.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }
    // --- FIM DA CORREÇÃO ---

    const { error } = await supabase.from("npcs").insert({
      name: name.trim(),
      table_id: tableId,
      data: parsedData.data, // Salva os dados validados
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
            {/* --- 3. LABEL CORRIGIDO --- */}
            <div className="space-y-2">
              <Label htmlFor="npc-occupation">Resistência</Label>
              <Input
                id="npc-occupation"
                placeholder="Ex: Normal, Fraco"
                value={occupation}
                onChange={(e) => setOccupation(e.target.value)}
              />
            </div>
            {/* --- FIM DA CORREÇÃO --- */}
          </div>

          <Button onClick={handleCreate} disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar NPC"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};