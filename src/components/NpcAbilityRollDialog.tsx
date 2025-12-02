import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { BaseRollDialog } from "./BaseRollDialog"; // Verifica o caminho correto
import { Npc } from "@/types/database-types"; // Verifica o caminho correto
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface NpcAbilityRollDialogProps {
  npc: Npc;
  abilityName: string;
  abilityValue: number;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NpcAbilityRollDialog({
  npc,
  abilityName,
  abilityValue,
  trigger,
  open,
  onOpenChange,
}: NpcAbilityRollDialogProps) {
  const { toast } = useToast();
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isControlled = open !== undefined;
  const show = isControlled ? open : internalOpen;
  const setShow = isControlled ? onOpenChange : setInternalOpen;

  const handleRoll = async (result: number, total: number, formula: string, isCritical: boolean, isFumble: boolean) => {
    try {
      // 1. Obter Utilizador Atual (para saber quem rolou)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // ⚠️ AQUI ESTÁ A CORREÇÃO PRINCIPAL: Usar npc.table_id
      if (!npc.table_id) {
        console.error("NPC sem table_id associado!", npc);
        toast({
            title: "Erro na Rolagem",
            description: "Este NPC não está associado a uma mesa corretamente.",
            variant: "destructive"
        });
        return;
      }

      // 2. Enviar para o Chat (DB)
      const { error: chatError } = await supabase.from("chat_messages").insert({
        table_id: npc.table_id, // Obrigatório para o RLS funcionar (resolve o erro 403)
        user_id: user.id,
        message: `rolou ${abilityName}: ${total} (${formula})`, // Mensagem simples de fallback
        message_type: "roll",
        data: {
            rollType: "ability",
            characterName: npc.name,
            abilityName: abilityName,
            result: result,
            total: total,
            formula: formula,
            isCritical: isCritical,
            isFumble: isFumble,
            isNpc: true // Marcador importante
        }
      });

      if (chatError) {
        console.error("Erro ao salvar no chat:", chatError);
        // Não damos throw aqui para tentar enviar para o Discord mesmo assim
      }

      // 3. Enviar para o Discord (Edge Function)
      // Resolve o erro 400 enviando o tableId
      const { error: discordError } = await supabase.functions.invoke('discord-roll-handler', {
        body: {
          rollType: "ability",
          characterName: npc.name,
          playerName: user.email?.split('@')[0] || "Mestre", // Nome de quem rolou
          rollResult: total,
          rollFormula: formula,
          isCritical: isCritical,
          isFumble: isFumble,
          tableId: npc.table_id, // <--- OBRIGATÓRIO PARA O DISCORD FUNCIONAR
          metadata: {
            abilityName: abilityName
          }
        }
      });

      if (discordError) {
        console.error("Erro ao enviar para Discord:", discordError);
      } else {
        toast({
            title: "Rolagem enviada",
            description: `Resultado: ${total}`,
        });
      }

    } catch (error) {
      console.error("Erro fatal na rolagem:", error);
      toast({
        title: "Erro",
        description: "Falha ao processar a rolagem.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={show} onOpenChange={setShow}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <BaseRollDialog
          title={`Rolar ${abilityName}`}
          entityName={npc.name}
          baseModifier={abilityValue}
          onRoll={handleRoll}
          onClose={() => setShow?.(false)}
        />
      </DialogContent>
    </Dialog>
  );
}