// src/components/AbilityRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAbilityTest, // Usaremos a nova função
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
import { Dices, ShieldAlert } from "lucide-react";
import { useCharacterSheet } from "@/features/character/CharacterSheetContext"; // Importar o contexto

// Propriedades que o diálogo de rolagem de habilidade precisa
interface AbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string; // O nome do atributo (ex: "Resoluto")
  attributeValue: number; // O valor do atributo (ex: 13)
  corruptionCost: number; // O custo de corrupção (ex: 1)
  characterName: string;
  tableId: string;
}

export const AbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
  corruptionCost,
  characterName,
  tableId,
}: AbilityRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Pegamos o 'form' do contexto para atualizar a corrupção
  const { form } = useCharacterSheet(); 

  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form) {
      setLoading(false);
      return;
    }

    // 1. Aplicar Custo de Corrupção
    if (corruptionCost > 0) {
      const currentCorruption = form.getValues("corruption.temporary");
      form.setValue(
        "corruption.temporary",
        currentCorruption + corruptionCost,
        { shouldDirty: true }, // Marca o formulário como "sujo" para salvar
      );
    }

    // 2. Executar a lógica de rolagem (sem Vantagem)
    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage: false, // Habilidades não usam Vantagem
    });

    // 3. Formatar a notificação local (toast)
    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;

    toast({
      title: `Teste de ${abilityName}`,
      description: localToastDescription,
      action: (corruptionCost > 0) ? (
        <div className="flex items-center gap-2 text-purple-400">
          <ShieldAlert className="w-4 h-4" /> +{corruptionCost} Corrupção
        </div>
      ) : undefined,
    });

    // 4. Formatar a mensagem do chat
    const chatMessage = formatAbilityTest(
      characterName,
      abilityName,
      attributeName,
      result,
      corruptionCost,
    );

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
          <DialogTitle>Usar: {abilityName}</DialogTitle>
          <DialogDescription>
            Teste de {attributeName} (Alvo: {attributeValue}).
            {corruptionCost > 0 && (
              <span className="text-purple-400 block mt-1">
                Custo: +{corruptionCost} Corrupção Temporária.
              </span>
            )}
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