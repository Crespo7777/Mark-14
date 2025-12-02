import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAbilityTest, parseDiceRoll } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertOctagon, Hand } from "lucide-react";
import { useNpcSheet } from "@/features/npc/NpcSheetContext";
import { useTableContext } from "@/features/table/TableContext";
import { useCharacterCalculations } from "@/features/character/hooks/useCharacterCalculations";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface AbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: string; 
  characterName: string;
  tableId: string;
  buttonText?: string;
  onApplyCorruption?: (amount: number) => void;
}

export const NpcAbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
  corruptionCost,
  characterName,
  tableId,
  buttonText = "Usar Habilidade",
  onApplyCorruption
}: AbilityRollDialogProps) => {
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const context = useNpcSheet();
  const form = context?.form;
  const programmaticSave = context?.programmaticSave;
  const isSaving = context?.isSaving;
  
  const { corruptionThreshold } = useCharacterCalculations();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  
  const currentTempCorruption = form ? (form.watch("corruption.temporary") || 0) : 0;
  const isNoRoll = attributeName === "Nenhum";

  useEffect(() => {
      if (open) setModifier("");
  }, [open]);

  const parsedCost = useMemo(() => {
    const fixed = parseInt(corruptionCost);
    if (!isNaN(fixed) && String(fixed) === corruptionCost.trim()) {
        return { type: 'fixed', value: fixed };
    }
    const dice = parseDiceRoll(corruptionCost);
    if (dice) return { type: 'dice', value: corruptionCost };
    return { type: 'none', value: 0 };
  }, [corruptionCost]);

  const projectedCorruption = parsedCost.type === 'fixed' ? currentTempCorruption + (parsedCost.value as number) : null;
  const isOverThreshold = projectedCorruption !== null && projectedCorruption > corruptionThreshold;
  const isAtThreshold = projectedCorruption !== null && projectedCorruption === corruptionThreshold;

  const handleRoll = async (isHidden: boolean) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    let appliedCost = 0;
    let costMessage = "";

    if (parsedCost.type === 'fixed') {
        appliedCost = parsedCost.value as number;
    } else if (parsedCost.type === 'dice') {
        const roll = parseDiceRoll(corruptionCost);
        if (roll) {
            appliedCost = roll.total;
            costMessage = ` (Rolado: ${corruptionCost} = ${roll.total})`;
        }
    }

    if (appliedCost > 0) {
      if (onApplyCorruption) {
          onApplyCorruption(appliedCost);
      } else if (form && programmaticSave) {
          const newTotal = currentTempCorruption + appliedCost;
          form.setValue("corruption.temporary", newTotal, { shouldDirty: true });
          if (newTotal > corruptionThreshold) {
            toast({ title: "LIMIAR EXCEDIDO!", description: "Verifique marcas de estigma.", variant: "destructive" });
          }
          await programmaticSave(); 
      }
    }

    const modValue = parseInt(modifier) || 0;
    let chatMessage = "";
    let discordRollData: any = null;

    if (isNoRoll) {
       chatMessage = `${characterName} usou <span class="text-primary-foreground font-bold">${abilityName}</span>.`;
       if (appliedCost > 0) chatMessage += `\n<span class="text-purple-400">(Recebeu +${appliedCost} Corrupção Temporária${costMessage})</span>`;
       
       discordRollData = { rollType: "manual", command: `usou ${abilityName}`, result: { rolls: [], modifier: 0, total: 0 } };
       
       if (!isHidden || isMaster) {
           toast({ 
               title: `${abilityName} usado`, 
               description: appliedCost > 0 ? `+${appliedCost} Corrupção aplicada.` : "Sem custo.", 
               action: <div className="flex items-center gap-2 text-primary font-bold"><Hand className="w-4 h-4"/> Usado</div> 
           });
       }
    } else {
       const result = rollAttributeTest({ attributeValue, modifier: modValue, withAdvantage: false });
       chatMessage = formatAbilityTest(characterName, abilityName, attributeName, result, appliedCost) + (costMessage ? `\n🎲 Corrupção: ${costMessage}` : "");
       
       const discordResult = { total: result.totalRoll, ...result };
       const isSuccess = result.totalRoll <= result.target;

       discordRollData = { rollType: "ability", abilityName, attributeName, corruptionCost: appliedCost, result: discordResult };
       
       if (!isHidden || isMaster) {
           toast({ 
               title: isSuccess ? "Sucesso!" : "Falha!",
               description: `Rolou ${result.totalRoll} vs ${result.target}`,
               variant: isSuccess ? "default" : "destructive" 
           });
       }
    }

    const targetTableId = tableId || contextTableId;

    if (isHidden && isMaster) {
      // 1. ESCONDIDO: Chat Privado (recipient_id = masterId)
      await supabase.from("chat_messages").insert([
          { table_id: targetTableId, user_id: user.id, message: `${characterName} usou ${abilityName} em segredo.`, message_type: "info" },
          { table_id: targetTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      // 2. PÚBLICO: Chat Público (sem is_hidden, sem recipient_id)
      await supabase.from("chat_messages").insert({ 
          table_id: targetTableId, 
          user_id: user.id, 
          message: chatMessage, 
          message_type: "roll"
      });
      // Discord chamado apenas se público
      supabase.functions.invoke('discord-roll-handler', { 
          body: { tableId: targetTableId, rollData: discordRollData, userName: characterName, chatMessage: isNoRoll ? chatMessage : undefined } 
      }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNoRoll ? `Usar: ${abilityName}` : `Testar: ${abilityName}`}
      description={isNoRoll ? "Sem teste necessário." : `Teste de ${attributeName} (Alvo: ${attributeValue}).`}
      onRoll={handleRoll}
      loading={loading || isSaving}
      buttonLabel={isOverThreshold ? "Aceitar Risco e Usar" : (isNoRoll ? "Confirmar Uso" : buttonText)}
      actionColorClass={isOverThreshold ? "bg-red-600 hover:bg-red-700" : ""}
    >
      {parsedCost.type !== 'none' && (
        <div className="space-y-3">
          {isOverThreshold && <Alert variant="destructive" className="border-red-600 bg-red-900/20 text-red-200"><AlertOctagon className="h-4 w-4" /><AlertTitle>PERIGO!</AlertTitle><AlertDescription>Limiar excedido.</AlertDescription></Alert>}
          {!isOverThreshold && !isAtThreshold && <div className="text-sm text-muted-foreground flex justify-between items-center px-2 border rounded py-2 bg-muted/30"><span>Custo: <span className="text-purple-400 font-bold">{corruptionCost}</span></span>{parsedCost.type === 'fixed' && <span>Novo: {projectedCorruption}</span>}</div>}
        </div>
      )}
      {!isNoRoll && (
          <div className="space-y-2">
            <Label htmlFor="mod-npc">Modificador</Label>
            <Input id="mod-npc" type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} placeholder="+0" />
          </div>
      )}
    </BaseRollDialog>
  );
};