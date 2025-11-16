// src/components/DefenseRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatDefenseRoll,
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
import { Dices } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";

interface DefenseRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defenseValue: number;
  characterName: string;
  tableId: string;
}

export const DefenseRollDialog = ({
  open,
  onOpenChange,
  defenseValue,
  characterName,
  tableId,
}: DefenseRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, userId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  const handleRoll = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const result = rollAttributeTest({
      attributeValue: defenseValue,
      modifier,
      withAdvantage: false,
    });

    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;

    if (!isHidden || isMaster) {
      toast({
        title: "Teste de Defesa",
        description: localToastDescription,
      });
    }

    // Mensagem para o chat da APLICAÇÃO (HTML)
    const chatMessage = formatDefenseRoll(
      characterName,
      result,
    );

    // Objeto de dados para o DISCORD
    const discordRollData = {
      rollType: "defense",
      result: result
    };

    if (isHidden && isMaster) {
      // (Mensagens para o chat da app)
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `${characterName} fez um teste de Defesa em segredo.`,
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
      // (Mensagem pública para o chat da app)
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
          rollData: discordRollData, // Envia o JSON
          userName: characterName, 
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
          <DialogTitle>Teste de Defesa</DialogTitle>
          <DialogDescription>
            O alvo da rolagem (1d20) é {defenseValue}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="modifier-defense">Modificador (no alvo)</Label>
            <Input
              id="modifier-defense"
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
                  id="hidden-roll-defense"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll-defense" className="text-purple-400">
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
            disabled={loading}
          >
            {loading ? "Rolando..." : <Dices className="w-4 h-4 mr-2" />}
            Rolar Defesa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};