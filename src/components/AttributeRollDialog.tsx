// src/components/AttributeRollDialog.tsx

import { useState } from "react"; // <-- CORRIGIDO AQUI
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAttributeTest,
  AttributeRollResult,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dices } from "lucide-react";

interface AttributeRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  attributeValue: number;
  characterName: string;
  tableId: string;
}

export const AttributeRollDialog = ({
  open,
  onOpenChange,
  attributeName,
  attributeValue,
  characterName,
  tableId,
}: AttributeRollDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRoll = async () => {
    setLoading(true);

    // 1. Obter o ID do usuário logado (quem está rolando)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 2. Executar a lógica de rolagem
    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage,
    });

    // 3. Formatar a notificação local (toast)
    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;

    toast({
      title: `Teste de ${attributeName}`,
      description: localToastDescription,
    });

    // 4. Formatar a mensagem do chat
    const chatMessage = formatAttributeTest(characterName, attributeName, result);

    // 5. Enviar mensagem para o chat
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
          <DialogTitle>Teste de {attributeName}</DialogTitle>
          <DialogDescription>
            O alvo da rolagem (1d20) é {attributeValue}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advantage"
              checked={withAdvantage}
              onCheckedChange={(checked) => setWithAdvantage(checked as boolean)}
            />
            <Label htmlFor="advantage">Vantagem (+1d4 na rolagem)</Label>
          </div>
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
            Rolar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};