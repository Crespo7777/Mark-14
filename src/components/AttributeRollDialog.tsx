// src/components/AttributeRollDialog.tsx

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatAttributeRoll, type DiceRoll } from "@/lib/dice-parser"; 
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useTableContext } from "@/features/table/TableContext";
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface AttributeRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName: string;
  attributeName: string;
  attributeValue: number;
  tableId: string;
}

export const AttributeRollDialog = ({
  open,
  onOpenChange,
  characterName,
  attributeName,
  attributeValue,
  tableId,
}: AttributeRollDialogProps) => {
  const [modifier, setModifier] = useState("0");
  const [advantage, setAdvantage] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { isMaster, masterId } = useTableContext();

  useEffect(() => {
    if (open) {
      setModifier("0");
      setAdvantage(false);
    }
  }, [open]);

  const handleRoll = async (isHidden: boolean) => {
    // 1. Validação de Regra
    if (attributeValue <= 0) {
        toast({ 
            title: "Ação Inválida", 
            description: `O atributo ${attributeName} é zero ou negativo.`, 
            variant: "destructive" 
        });
        return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    // 2. Cálculos Matemáticos
    const modValue = parseInt(modifier) || 0;
    const advantageBonus = advantage ? 2 : 0; // Regra da Casa: Vantagem = +2
    const targetValue = attributeValue + modValue + advantageBonus;
    
    // Rolagem (Engine)
    const rollResult: DiceRoll | null = parseDiceRoll("1d20");
    
    if (!rollResult) { 
        toast({ title: "Erro Crítico", description: "Falha ao rolar dados.", variant: "destructive" });
        setLoading(false);
        return;
    }
    
    // 3. Determinar Sucesso/Falha
    const isSuccess = rollResult.total <= targetValue && rollResult.total !== 20;
    const criticalSuccess = rollResult.total === 1;
    const criticalFailure = rollResult.total === 20;

    // 4. Feedback Local (Toast)
    if (!isHidden || isMaster) {
        toast({ 
            title: isSuccess ? "Sucesso!" : "Falha!", 
            description: `Rolou ${rollResult.total} vs ${targetValue} (${attributeName})`,
            variant: isSuccess ? "default" : "destructive" 
        });
    }

    // 5. Preparar Mensagem para o Chat
    const chatMessage = formatAttributeRoll(characterName, attributeName, rollResult, targetValue);
    
    // Dados estruturados para o Discord/Logs
    const discordResult = {
        mainRoll: rollResult.total,
        modifier: modValue + advantageBonus,
        target: targetValue,
        isSuccess,
        isCrit: criticalSuccess,
        isFumble: criticalFailure
    };
    const discordRollData = { rollType: "attribute", attributeName, result: discordResult };

    // 6. Enviar para Base de Dados (Chat)
    try {
        if (isHidden && isMaster) {
            // MODO SECRETO: 
            // 1. Mensagem pública genérica
            await supabase.from("chat_messages").insert({ 
                table_id: tableId, 
                user_id: user.id, 
                message: `${characterName} rola dados misteriosamente...`, 
                message_type: "info" 
            });
            // 2. Mensagem real apenas para o Mestre (recipient_id)
            if (masterId) {
                await supabase.from("chat_messages").insert({ 
                    table_id: tableId, 
                    user_id: user.id, 
                    message: `[SECRETO] ${chatMessage}`, 
                    message_type: "roll", 
                    recipient_id: masterId 
                });
            }
        } else {
            // MODO PÚBLICO
            await supabase.from("chat_messages").insert({ 
                table_id: tableId, 
                user_id: user.id, 
                message: chatMessage, 
                message_type: "roll"
            });

            // Disparar Webhook Discord (apenas se público)
            supabase.functions.invoke('discord-roll-handler', { 
                body: { tableId, rollData: discordRollData, userName: characterName } 
            }).catch(console.error);
        }
    } catch (err) {
        console.error("Erro ao enviar chat:", err);
        toast({ title: "Erro de Chat", description: "A rolagem aconteceu, mas não foi enviada para o chat.", variant: "destructive" });
    }

    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Teste de ${attributeName}`}
      description={`Valor base: ${attributeValue}`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar Atributo"
    >
      <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="attr-mod" className="text-right">Modificador</Label>
            <Input 
                id="attr-mod" 
                value={modifier} 
                onChange={(e) => setModifier(e.target.value)} 
                className="col-span-3 bg-background/50" 
                placeholder="+0" 
                type="number" 
            />
          </div>
          <div className="flex justify-center pt-2">
            <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md border border-white/5">
                <Checkbox id="attr-adv" checked={advantage} onCheckedChange={(c) => setAdvantage(!!c)} />
                <Label htmlFor="attr-adv" className="cursor-pointer">Vantagem (+2 no Atributo)</Label>
            </div>
          </div>
      </div>
    </BaseRollDialog>
  );
};