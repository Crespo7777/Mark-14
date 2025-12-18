import { useState, useEffect } from "react";
import { BaseRollDialog } from "@/components/BaseRollDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTableContext } from "@/features/table/TableContext";

// Imports específicos do Symbaroum
import { 
    rollAttributeTest, 
    formatAttributeRoll, 
    type AttributeRollResult 
} from "../utils/symbaroum-dice"; 
import { buildAttributePayload } from "../utils/symbaroum-discord";

interface AttributeRollDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
  attributeName: string;
  attributeValue: number;
  modifier?: number;
  characterName?: string;
  tableId?: string;
}

export const AttributeRollDialog = ({
  open,
  onOpenChange,
  trigger,
  attributeName,
  attributeValue,
  modifier = 0,
  characterName = "Personagem",
  tableId
}: AttributeRollDialogProps) => {
  const [mod, setMod] = useState(modifier.toString());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();

  // Atualiza o modificador se a prop mudar
  useEffect(() => {
      setMod(modifier.toString());
  }, [modifier, open]);

  const handleRoll = async (isHidden: boolean) => {
    setLoading(true);
    
    const finalMod = parseInt(mod) || 0;
    const finalTableId = tableId || contextTableId;

    // 1. Executa a Lógica de Dados (Symbaroum Dice)
    const result: AttributeRollResult = rollAttributeTest({
        attributeValue,
        modifier: finalMod,
        withAdvantage: false 
    });

    // 2. Feedback Visual Local
    if (!isHidden || isMaster) {
        toast({
            title: result.isSuccess ? "Sucesso!" : "Falha!",
            description: `Rolou ${result.totalRoll} (Alvo: ${result.target})`,
            variant: result.isSuccess ? "default" : "destructive"
        });
    }

    // 3. Persistência e Chat
    if (finalTableId) {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
            // Formata HTML para o Chat Interno
            const chatMessage = formatAttributeRoll(characterName, attributeName, result);
            
            // Constrói JSON rico para o Discord
            const discordPayload = buildAttributePayload(characterName, attributeName, result);

            if (isHidden && isMaster) {
                // ROLAGEM SECRETA (GM Only)
                await supabase.from("chat_messages").insert([
                    { 
                        table_id: finalTableId, 
                        user_id: user.id, 
                        message: `${characterName} faz um teste secreto...`, 
                        message_type: "info" 
                    },
                    { 
                        table_id: finalTableId, 
                        user_id: user.id, 
                        message: `[GM] ${chatMessage}`, 
                        message_type: "roll", 
                        recipient_id: masterId 
                    }
                ]);
            } else {
                // ROLAGEM PÚBLICA
                await supabase.from("chat_messages").insert({
                    table_id: finalTableId,
                    user_id: user.id,
                    message: chatMessage,
                    message_type: "roll"
                });

                // Envia para o Discord via Edge Function
                supabase.functions.invoke('discord-roll-handler', {
                    body: { 
                        tableId: finalTableId, 
                        discordPayload, // Payload pronto
                        userName: characterName 
                    }
                }).catch(console.error);
            }
        }
    }

    setLoading(false);
    if (onOpenChange) onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      trigger={trigger}
      title={`Testar ${attributeName}`}
      description={`Valor Base: ${attributeValue}`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar"
    >
      <div className="space-y-2 py-2">
        <Label htmlFor="mod">Modificador</Label>
        <Input 
            id="mod" 
            type="number" 
            value={mod} 
            onChange={(e) => setMod(e.target.value)} 
            className="text-center font-bold"
            placeholder="+0" 
        />
      </div>
    </BaseRollDialog>
  );
};