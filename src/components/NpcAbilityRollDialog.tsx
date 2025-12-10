import { useState, useEffect } from "react";
import { BaseRollDialog } from "@/components/BaseRollDialog";
import { Npc } from "@/types/database-types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { parseDiceRoll, formatAbilityTest, type DiceRoll, type AttributeRollResult, rollAttributeTest } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTableContext } from "@/features/table/TableContext";
import { Hand } from "lucide-react";

interface NpcAbilityRollDialogProps {
  npc: Npc;
  abilityName: string;
  attributeName: string;
  abilityValue: number;
  corruptionCost?: string;
  onApplyCorruption?: (amount: number) => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NpcAbilityRollDialog({
  npc,
  abilityName,
  attributeName,
  abilityValue,
  corruptionCost = "0",
  onApplyCorruption,
  trigger,
  open,
  onOpenChange,
}: NpcAbilityRollDialogProps) {
  const { toast } = useToast();
  // CORREÇÃO 1: Importar isMaster para usar na lógica de exibição
  const { masterId, isMaster } = useTableContext();
  
  const [internalOpen, setInternalOpen] = useState(false);
  const show = open !== undefined ? open : internalOpen;
  const setShow = onOpenChange || setInternalOpen;

  const [modifier, setModifier] = useState("0");
  const [loading, setLoading] = useState(false);

  const isNoRoll = attributeName === "Nenhum";

  useEffect(() => {
      if (show) setModifier("0");
  }, [show]);

  const handleRoll = async (isHidden: boolean) => {
    // 1. Validação
    if (!isNoRoll && !npc.table_id) {
        toast({ title: "Erro", description: "NPC sem mesa associada.", variant: "destructive" });
        return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 2. Corrupção
    if (onApplyCorruption && corruptionCost !== "0") {
        let cost = 0;
        const fixed = parseInt(corruptionCost);
        if (!isNaN(fixed) && String(fixed) === corruptionCost.trim()) {
            cost = fixed;
        } else {
            const costRoll = parseDiceRoll(corruptionCost);
            if (costRoll) cost = costRoll.total;
        }
        if (cost > 0) onApplyCorruption(cost);
    }

    // 3. Lógica de Mensagem e Resultado
    let chatMessage = "";
    let discordRollData: any = null;
    const modValue = parseInt(modifier) || 0;

    if (isNoRoll) {
        chatMessage = `${npc.name} usa <span class="font-bold text-primary-foreground">${abilityName}</span>.`;
        discordRollData = { 
            rollType: "manual", 
            command: `usou ${abilityName}`, 
            result: { total: 0 },
            isNpc: true,
            characterName: npc.name 
        };
        
        // CORREÇÃO 2: Mostrar Toast se for público OU se for Mestre
        if (!isHidden || isMaster) {
            toast({ 
                title: `${abilityName} usado`, 
                action: <div className="flex items-center gap-2 text-primary font-bold"><Hand className="w-4 h-4"/> Ativado</div> 
            });
        }
    } else {
        const result: AttributeRollResult = rollAttributeTest({ 
            attributeValue: abilityValue, 
            modifier: modValue, 
            withAdvantage: false 
        });

        chatMessage = formatAbilityTest(npc.name, abilityName, attributeName, result, 0);
        discordRollData = { 
            rollType: "ability", 
            abilityName, 
            attributeName,
            characterName: npc.name, 
            isNpc: true, 
            result 
        };

        // CORREÇÃO 3: Mostrar Toast se for público OU se for Mestre
        if (!isHidden || isMaster) {
            toast({ 
                title: result.isSuccess ? "Sucesso!" : "Falha!", 
                description: `Rolou ${result.totalRoll} (Alvo: ${result.target})`,
                variant: result.isSuccess ? "default" : "destructive" 
            });
        }
    }

    // 4. Envio
    if (isHidden) {
        await supabase.from("chat_messages").insert([
            { table_id: npc.table_id, user_id: user.id, message: `${npc.name} usa uma habilidade misteriosa...`, message_type: "info" },
            { table_id: npc.table_id, user_id: user.id, message: `[GM] ${chatMessage}`, message_type: "roll", recipient_id: masterId || user.id }
        ]);
    } else {
        await supabase.from("chat_messages").insert({ 
            table_id: npc.table_id, 
            user_id: user.id, 
            message: chatMessage, 
            message_type: "roll" 
        });

        supabase.functions.invoke('discord-roll-handler', { 
            body: { 
                tableId: npc.table_id, 
                rollData: discordRollData, 
                userName: npc.name,
                chatMessage: isNoRoll ? chatMessage : undefined
            } 
        }).catch(console.error);
    }

    setLoading(false);
    setShow(false);
  };

  return (
    <BaseRollDialog
      open={show}
      onOpenChange={setShow}
      trigger={trigger}
      title={isNoRoll ? `Usar: ${abilityName}` : `Teste: ${abilityName}`}
      description={isNoRoll ? "Habilidade sem teste de atributo." : `Teste de ${attributeName} (${abilityValue})`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel={isNoRoll ? "Confirmar Uso" : "Rolar Habilidade"}
      actionColorClass="bg-purple-600 hover:bg-purple-700"
    >
        {!isNoRoll && (
            <div className="space-y-2 mt-2">
                <Label htmlFor="npc-mod">Modificador</Label>
                <Input 
                    id="npc-mod" 
                    type="number" 
                    value={modifier} 
                    onChange={(e) => setModifier(e.target.value)} 
                    placeholder="+0" 
                    className="bg-background/50"
                />
            </div>
        )}
    </BaseRollDialog>
  );
}