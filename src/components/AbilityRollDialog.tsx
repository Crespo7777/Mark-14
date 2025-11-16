// src/components/AbilityRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAbilityTest,
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
// --- 1. IMPORTAR O HOOK DA FICHA ---
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";

interface AbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: number;
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
  // --- 2. OBTER O 'form' E O 'programmaticSave' ---
  const { form, programmaticSave, isSaving } = useCharacterSheet();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form) {
      setLoading(false);
      return;
    }

    // --- 3. LÓGICA DE SALVAMENTO IMEDIATO ---
    if (corruptionCost > 0) {
      const currentCorruption = form.getValues("corruption.temporary");
      form.setValue(
        "corruption.temporary",
        currentCorruption + corruptionCost,
        { shouldDirty: true }, // Marca como "sujo"
      );
      
      // Salva programaticamente
      // Não precisamos de 'await' se não quisermos bloquear a UI
      // Mas vamos adicionar para garantir que salvou antes de rolar
      await programmaticSave(); 
    }
    // --- FIM DA LÓGICA DE SALVAMENTO ---

    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage: false,
    });

    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;
    
    if (!isHidden || isMaster) {
      toast({
        title: `Teste de ${abilityName}`,
        description: localToastDescription,
        action: (corruptionCost > 0) ? (
          <div className="flex items-center gap-2 text-purple-400">
            <ShieldAlert className="w-4 h-4" /> +{corruptionCost} Corrupção
          </div>
        ) : undefined,
      });
    }

    const chatMessage = formatAbilityTest(
      characterName,
      abilityName,
      attributeName,
      result,
      corruptionCost,
    );

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `${characterName} usou ${abilityName} em segredo.`,
        message_type: "info",
        recipient_id: null,
      });
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `[SECRETO] ${chatMessage}`,
        message_type: "roll",
        recipient_id: masterId,
      });
    } else {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: chatMessage,
        message_type: "roll",
        recipient_id: null,
      });

      // --- INÍCIO DA MODIFICAÇÃO (DISCORD) ---
      supabase.functions.invoke('discord-roll-handler', {
        body: {
          tableId: contextTableId,
          chatMessage: chatMessage,
        }
      }).catch(console.error);
      // --- FIM DA MODIFICAÇÃO (DISCORD) ---
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
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
            <Label htmlFor="modifier-ability">Modificador (no alvo)</Label>
            <Input
              id="modifier-ability"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
              placeholder="Ex: -2 ou +1"
            />
          </div>

          {isMaster && (
            <>
              <Separator className="my-4" />
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hidden-roll-ability"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll-ability" className="text-purple-400">
                  Rolar Escondido (Apenas Mestre)
                </Label>
              </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button
            type="button"
            className="w-full"
            onClick={handleRoll}
            // 4. Desabilitar se a rolagem local ESTIVER acontecendo OU a ficha ESTIVER salvando
            disabled={loading || isSaving}
          >
            {loading ? "Rolando..." : (isSaving ? "Salvando..." : <><Dices className="w-4 h-4 mr-2" /> Usar Habilidade</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};