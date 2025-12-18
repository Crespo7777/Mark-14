import { useState, useEffect } from "react";
// Importa o BaseRollDialog GENÉRICO
import { BaseRollDialog } from "@/components/BaseRollDialog";
import { Npc } from "@/types/database-types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTableContext } from "@/features/table/TableContext";
import { Hand } from "lucide-react";

// IMPORTAÇÕES CORRIGIDAS (Lógica Symbaroum)
import { parseDiceRoll } from "@/lib/dice-parser"; 
// Sobe dois níveis para chegar em utils
import { 
    formatAbilityTest, 
    rollAttributeTest, 
    type AttributeRollResult 
} from "../../utils/symbaroum-dice"; 
import { buildAbilityPayload, buildManualPayload } from "../../utils/symbaroum-discord";

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
    let appliedCost = 0;
    if (onApplyCorruption && corruptionCost !== "0") {
        const fixed = parseInt(corruptionCost);
        if (!isNaN(fixed) && String(fixed) === corruptionCost.trim()) {
            appliedCost = fixed;
        } else {
            const costRoll = parseDiceRoll(corruptionCost);
            if (costRoll) appliedCost = costRoll.total;
        }
        if (appliedCost > 0) onApplyCorruption(appliedCost);
    }

    // 3. Lógica de Mensagem e Payload
    let chatMessage = "";
    let discordPayload: any = null;
    const modValue = parseInt(modifier) || 0;

    if (isNoRoll) {
        // Uso Manual (Sem teste)
        chatMessage = `${npc.name} usa <span class="font-bold text-primary-foreground">${abilityName}</span>.`;
        if (appliedCost > 0) chatMessage += ` <span class="text-purple-400">(${appliedCost} Corrupção)</span>`;

        discordPayload = buildAbilityPayload(npc.name, abilityName, attributeName, null as any, appliedCost);
        
        if (!isHidden || isMaster) {
            toast({ 
                title: `${abilityName} usado`, 
                action: <div className="flex items-center gap-2 text-primary font-bold"><Hand className="w-4 h-4"/> Ativado</div> 
            });
        }
    } else {
        // LÓGICA SYMBAROUM (Roll Under)
        const result: AttributeRollResult = rollAttributeTest({ 
            attributeValue: abilityValue, 
            modifier: modValue, 
            withAdvantage: false 
        });

        chatMessage = formatAbilityTest(npc.name, abilityName, attributeName, result, appliedCost);
        
        // Payload formatado para o Discord
        discordPayload = buildAbilityPayload(npc.name, abilityName, attributeName, result, appliedCost);

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

        // Envio para a Edge Function Genérica
        supabase.functions.invoke('discord-roll-handler', { 
            body: { 
                tableId: npc.table_id, 
                discordPayload, // Payload pronto
                userName: npc.name,
                chatMessage: isNoRoll ? chatMessage : undefined // Fallback
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