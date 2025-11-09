// src/components/NpcAbilityRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAbilityTest, // Reutilizamos a formatação (ela lida com 0 de corrupção)
} from "@/lib/dice-parser";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dices } from "lucide-react";
import { useNpcSheet } from "@/features/npc/NpcSheetContext"; // <-- IMPORTANTE: Usa o hook do NPC

// Propriedades simplificadas, sem corrupção
interface NpcAbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string; // O nome do atributo (ex: "Resoluto")
  attributeValue: number; // O valor do atributo (ex: 13)
}

export const NpcAbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
}: NpcAbilityRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Pegamos o 'npc' do contexto para nome e tableId
  const { npc } = useNpcSheet(); 

  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Lógica de rolagem (sem Vantagem e sem corrupção)
    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage: false,
    });

    // 2. Notificação local (toast)
    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;

    toast({
      title: `Teste de ${abilityName}`,
      description: localToastDescription,
      // Nenhuma ação de corrupção
    });

    // 3. Formatar a mensagem do chat (passando 0 para corrupção)
    const chatMessage = formatAbilityTest(
      npc.name,
      abilityName,
      attributeName,
      result,
      0, // Custo de corrupção é sempre 0 para NPCs
    );

    // 4. Enviar mensagem para o chat
    await supabase.from("chat_messages").insert({
      table_id: npc.table_id,
      user_id: user.id,
      message: chatMessage,
      message_type: "roll",
    });

    setLoading(false);
    onOpenChange(false); // Fechar o diálogo
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usar: {abilityName}</DialogTitle>
          <DialogDescription>
            Teste de {attributeName} (Alvo: {attributeValue}).
            {/* Nenhuma menção a corrupção */}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="modifier">Modificador (no alvo)</Label>
            <Input
              id="modifier"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
              placeholder="Ex: -2 ou +1"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleRoll}
            disabled={loading}
          >
            {loading ? "Rolando..." : <Dices className="w-4 h-4 mr-2" />}
            Usar Habilidade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};