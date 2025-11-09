// src/components/DefenseRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatDefenseRoll,
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
// import { useCharacterSheet } from "@/features/character/CharacterSheetContext"; // <-- REMOVIDO

interface DefenseRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseValue: number;
  // --- ADICIONADO ---
  characterName: string;
  tableId: string;
  // --- FIM ---
}

export const DefenseRollDialog = ({
  open,
  onOpenChange,
  defenseValue,
  // --- ADICIONADO ---
  characterName,
  tableId,
}: DefenseRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  // const { character } = useCharacterSheet(); // <-- REMOVIDO

  const handleRoll = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Executar a lógica de rolagem (sem Vantagem)
    const result = rollAttributeTest({
      attributeValue: defenseValue,
      modifier,
      withAdvantage: false,
    });

    // 2. Formatar a notificação local (toast)
    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;

    toast({
      title: "Teste de Defesa",
      description: localToastDescription,
    });

    // 3. Formatar a mensagem do chat (USANDO PROPS)
    const chatMessage = formatDefenseRoll(
      characterName,
      result,
    );

    // 4. Enviar mensagem para o chat (USANDO PROPS)
    await supabase.from("chat_messages").insert({
      table_id: tableId,
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
          <DialogTitle>Teste de Defesa</DialogTitle>
          <DialogDescription>
            O alvo da rolagem (1d20) é {defenseValue}.
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
            Rolar Defesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};