// src/components/NpcAbilityRollDialog.tsx

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
import { Dices } from "lucide-react";
import { useNpcSheet } from "@/features/npc/NpcSheetContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";

// --- 1. ADICIONAR NOVA PROP 'buttonText' ---
interface NpcAbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  buttonText?: string; // <-- ADICIONADO
}

export const NpcAbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
  buttonText = "Usar Habilidade", // <-- 2. VALOR PADRÃO ADICIONADO
}: NpcAbilityRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { npc } = useNpcSheet(); 
  const { isMaster, masterId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

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
      });
    }

    const chatMessage = formatAbilityTest(
      npc.name,
      abilityName,
      attributeName,
      result,
      0, 
    );

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert({
        table_id: npc.table_id,
        user_id: user.id,
        message: `${npc.name} usou ${abilityName} em segredo.`,
        message_type: "info",
        recipient_id: null,
      });
      await supabase.from("chat_messages").insert({
        table_id: npc.table_id,
        user_id: user.id,
        message: `[SECRETO] ${chatMessage}`,
        message_type: "roll",
        recipient_id: masterId,
      });
    } else {
      await supabase.from("chat_messages").insert({
        table_id: npc.table_id,
        user_id: user.id,
        message: chatMessage,
        message_type: "roll",
        recipient_id: null,
      });
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
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="modifier-npc-ability">Modificador (no alvo)</Label>
            <Input
              id="modifier-npc-ability"
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
                  id="hidden-roll-npc-ability"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll-npc-ability" className="text-purple-400">
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
            {/* --- 3. USAR A PROP 'buttonText' --- */}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};