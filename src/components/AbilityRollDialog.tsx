import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAbilityTest, parseDiceRoll } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, AlertOctagon, Hand } from "lucide-react";
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
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
  // NOVO: Callback para aplicar a corrupção na ficha pai
  onApplyCorruption?: (amount: number) => void;
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
  buttonText = "Usar Habilidade",
  onApplyCorruption
}: AbilityRollDialogProps) => {
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  // Hooks de contexto (Opcionais se o callback for usado, mas mantidos para compatibilidade)
  const context = useCharacterSheet();
  const form = context?.form;
  const programmaticSave = context?.programmaticSave;
  
  const { corruptionThreshold } = useCharacterCalculations();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  // Lê a corrupção atual (do form se disponível, senão assume 0 para não quebrar)
  const currentTempCorruption = form ? (form.watch("corruption.temporary") || 0) : 0;
  const isNoRoll = attributeName === "Nenhum";

  useEffect(() => {
      if (open) setModifier("");
  }, [open]);

  // Analisa o custo (Fixo vs Dado)
  const parsedCost = useMemo(() => {
    const fixed = parseInt(corruptionCost);
    if (!isNaN(fixed) && String(fixed) === corruptionCost.trim()) {
        return { type: 'fixed', value: fixed };
    }
    const dice = parseDiceRoll(corruptionCost);
    if (dice) return { type: 'dice', value: corruptionCost };
    return { type: 'none', value: 0 };
  }, [corruptionCost]);

  // Cálculos de Projeção (Alerta visual)
  const projectedCorruption = parsedCost.type === 'fixed' ? currentTempCorruption + (parsedCost.value as number) : null;
  const isOverThreshold = projectedCorruption !== null && projectedCorruption > corruptionThreshold;
  const isAtThreshold = projectedCorruption !== null && projectedCorruption === corruptionThreshold;

  const handleRoll = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 1. Calcular Custo Real
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

    // 2. Aplicar Corrupção (Prioriza o callback novo, fallback para o método antigo)
    if (appliedCost > 0) {
      if (onApplyCorruption) {
          onApplyCorruption(appliedCost);
          // O alerta de Limiar é feito pelo componente pai ou aqui visualmente
          if (currentTempCorruption + appliedCost > corruptionThreshold) {
             toast({ title: "LIMIAR EXCEDIDO!", description: "Verifique marcas de estigma.", variant: "destructive" });
          }
      } else if (form && programmaticSave) {
          const newTotal = currentTempCorruption + appliedCost;
          form.setValue("corruption.temporary", newTotal, { shouldDirty: true });
          if (newTotal > corruptionThreshold) {
            toast({ title: "LIMIAR DE CORRUPÇÃO EXCEDIDO!", description: `Novo total: ${newTotal}. Role 1d4 para marcas de estigma!`, variant: "destructive" });
          }
          await programmaticSave(); 
      }
    }

    // 3. Executar Ação (Rolagem ou Uso Direto)
    const modValue = parseInt(modifier) || 0;
    let chatMessage = "";
    let discordRollData: any = null;

    if (isNoRoll) {
       chatMessage = `${characterName} usou <span class="text-primary-foreground font-bold">${abilityName}</span>.`;
       if (appliedCost > 0) chatMessage += `\n<span class="text-purple-400">(Recebeu +${appliedCost} Corrupção Temporária${costMessage})</span>`;
       
       discordRollData = { rollType: "manual", command: `usou ${abilityName}`, result: { rolls: [], modifier: 0, total: 0 } };
       
       toast({ 
           title: `${abilityName} usado`, 
           description: appliedCost > 0 ? `+${appliedCost} Corrupção aplicada.` : "Sem custo.", 
           action: <div className="flex items-center gap-2 text-primary font-bold"><Hand className="w-4 h-4"/> Usado</div> 
       });
    } else {
       const result = rollAttributeTest({ attributeValue, modifier: modValue, withAdvantage: false });
       chatMessage = formatAbilityTest(characterName, abilityName, attributeName, result, appliedCost) + (costMessage ? `\n🎲 Corrupção: ${costMessage}` : "");
       discordRollData = { rollType: "ability", abilityName, attributeName, corruptionCost: appliedCost, result };
       
       if (!isHidden || isMaster) {
           toast({ title: `Teste de ${abilityName}`, description: `Resultado: ${result.totalRoll} (Alvo: ${result.target})` });
       }
    }

    // 4. Enviar para Chat / Discord
    const targetTableId = tableId || contextTableId; // Garante que temos um ID de mesa

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
          { table_id: targetTableId, user_id: user.id, message: `${characterName} usou ${abilityName} em segredo.`, message_type: "info" },
          { table_id: targetTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({ table_id: targetTableId, user_id: user.id, message: chatMessage, message_type: "roll" });
      supabase.functions.invoke('discord-roll-handler', { 
          body: { tableId: targetTableId, rollData: discordRollData, userName: characterName, chatMessage: isNoRoll ? chatMessage : undefined } 
      }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={isNoRoll ? `Usar: ${abilityName}` : `Testar: ${abilityName}`}
      description={isNoRoll ? "Esta habilidade não requer teste de atributo." : `Teste de ${attributeName} (Alvo: ${attributeValue}).`}
      onRoll={handleRoll}
      loading={loading || isSaving}
      buttonLabel={isOverThreshold ? "Aceitar Risco e Usar" : (isNoRoll ? "Confirmar Uso" : buttonText)}
      actionColorClass={isOverThreshold ? "bg-red-600 hover:bg-red-700" : ""}
    >
      {/* Exibição do Custo de Corrupção */}
      {parsedCost.type !== 'none' && (
        <div className="space-y-3">
          {isOverThreshold && (
            <Alert variant="destructive" className="border-red-600 bg-red-900/20 text-red-200">
                <AlertOctagon className="h-4 w-4" /><AlertTitle>PERIGO EXTREMO!</AlertTitle><AlertDescription>Limiar excedido.</AlertDescription>
            </Alert>
          )}
          {isAtThreshold && (
            <Alert variant="destructive" className="border-orange-600 bg-orange-900/20 text-orange-200">
                <AlertTriangle className="h-4 w-4" /><AlertTitle>Cuidado</AlertTitle><AlertDescription>Limiar atingido.</AlertDescription>
            </Alert>
          )}
          {!isOverThreshold && !isAtThreshold && (
             <div className="text-sm text-muted-foreground flex justify-between items-center px-2 border rounded py-2 bg-muted/30">
                <span>Custo: <span className="text-purple-400 font-bold">{corruptionCost}</span></span>
                {parsedCost.type === 'fixed' && <span>Novo: {projectedCorruption} / {corruptionThreshold}</span>}
                {parsedCost.type === 'dice' && <span>Atual: {currentTempCorruption} / {corruptionThreshold}</span>}
             </div>
          )}
        </div>
      )}

      {/* Input de Modificador (Apenas se tiver teste) */}
      {!isNoRoll && (
          <div className="space-y-2">
            <Label htmlFor="modifier-ability">Modificador (no alvo)</Label>
            <Input id="modifier-ability" type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} placeholder="+0" />
          </div>
      )}

      {/* Opção do Mestre (Rolar Escondido) */}
      {isMaster && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <Checkbox id="hidden-roll-ability" checked={isHidden} onCheckedChange={(c) => setIsHidden(c as boolean)} />
            <Label htmlFor="hidden-roll-ability" className="text-purple-400">{isNoRoll ? "Usar em Segredo" : "Rolar Escondido"}</Label>
          </div>
        </>
      )}
    </BaseRollDialog>
  );
};