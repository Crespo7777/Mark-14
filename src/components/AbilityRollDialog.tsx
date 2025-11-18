// src/components/AbilityRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAbilityTest } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldAlert, AlertTriangle, AlertOctagon } from "lucide-react";
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";
import { useCharacterCalculations } from "@/features/character/hooks/useCharacterCalculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BaseRollDialog } from "@/components/BaseRollDialog"; // <-- IMPORTADO

interface AbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: number;
  characterName: string;
  tableId: string;
  buttonText?: string;
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
  buttonText = "Usar Habilidade"
}: AbilityRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { form, programmaticSave, isSaving } = useCharacterSheet();
  const { corruptionThreshold } = useCharacterCalculations();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  const currentTempCorruption = form.watch("corruption.temporary") || 0;
  const projectedCorruption = currentTempCorruption + corruptionCost;
  const isOverThreshold = projectedCorruption > corruptionThreshold;
  const isAtThreshold = projectedCorruption === corruptionThreshold;
  const isNearThreshold = !isOverThreshold && !isAtThreshold && (projectedCorruption >= corruptionThreshold - 1);

  const handleRoll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form) {
      setLoading(false);
      return;
    }

    if (corruptionCost > 0) {
      form.setValue("corruption.temporary", projectedCorruption, { shouldDirty: true });
      await programmaticSave(); 
    }

    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage: false,
    });

    // (Lógica de Toast e Chat idêntica ao AttributeRoll, mas com abilityName)
    // ... (Omitido para brevidade, mas deves manter a lógica de envio de mensagem)
    
    // --- SIMPLIFICADO PARA O EXEMPLO, MANTEM A LOGICA ORIGINAL AQUI ---
    const chatMessage = formatAbilityTest(characterName, abilityName, attributeName, result, corruptionCost);
    const discordRollData = { rollType: "ability", abilityName, attributeName, corruptionCost, result };

    if (!isHidden || isMaster) {
        toast({
            title: `Teste de ${abilityName}`,
            description: `Resultado: ${result.totalRoll} (Alvo: ${result.target})`,
            action: (corruptionCost > 0) ? <div className="flex items-center gap-2 text-purple-400 font-bold"><ShieldAlert className="w-4 h-4"/> +{corruptionCost} Corr.</div> : undefined
        });
    }

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
          { table_id: contextTableId, user_id: user.id, message: `${characterName} usou ${abilityName} em segredo.`, message_type: "info" },
          { table_id: contextTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ table_id: contextTableId, user_id: user.id, message: chatMessage, message_type: "roll" });
      supabase.functions.invoke('discord-roll-handler', { body: { tableId: contextTableId, rollData: discordRollData, userName: characterName } }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Usar: ${abilityName}`}
      description={`Teste de ${attributeName} (Alvo: ${attributeValue}).`}
      onRoll={handleRoll}
      loading={loading || isSaving}
      buttonLabel={isOverThreshold ? "Aceitar Risco e Rolar" : buttonText}
      actionColorClass={isOverThreshold ? "bg-red-600 hover:bg-red-700" : ""}
    >
      {corruptionCost > 0 && (
        <div className="space-y-3">
          {isOverThreshold && (
            <Alert variant="destructive" className="border-red-600 bg-red-900/20 text-red-200">
              <AlertOctagon className="h-4 w-4" />
              <AlertTitle>PERIGO EXTREMO!</AlertTitle>
              <AlertDescription>Limiar excedido. Rolar 1d4 para Estigma!</AlertDescription>
            </Alert>
          )}
          {isAtThreshold && (
            <Alert variant="destructive" className="border-orange-600 bg-orange-900/20 text-orange-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Cuidado: Limiar Atingido</AlertTitle>
              <AlertDescription>Corrupção atingirá o limite exato.</AlertDescription>
            </Alert>
          )}
          {!isOverThreshold && !isAtThreshold && (
             <div className="text-sm text-muted-foreground flex justify-between px-2 border rounded py-2 bg-muted/30">
                <span>Custo: <span className="text-purple-400">+{corruptionCost}</span></span>
                <span>Novo: {projectedCorruption} / {corruptionThreshold}</span>
             </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="modifier-ability">Modificador (no alvo)</Label>
        <Input id="modifier-ability" type="number" value={modifier} onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)} />
      </div>

      {isMaster && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <Checkbox id="hidden-roll-ability" checked={isHidden} onCheckedChange={(c) => setIsHidden(c as boolean)} />
            <Label htmlFor="hidden-roll-ability" className="text-purple-400">Rolar Escondido</Label>
          </div>
        </>
      )}
    </BaseRollDialog>
  );
};