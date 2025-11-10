// src/components/AttributeRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAttributeTest,
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
import { Checkbox } from "@/components/ui/checkbox";
import { Dices } from "lucide-react";
import { Separator } from "@/components/ui/separator"; 
import { useTableContext } from "@/features/table/TableContext"; 

// --- 1. PROPS REVERTIDAS ---
interface AttributeRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  attributeValue: number;
  characterName: string;
  tableId: string;
  // 'obstructivePenalty' REMOVIDO
}
// --- FIM DA REVERSÃO ---

export const AttributeRollDialog = ({
  open,
  onOpenChange,
  attributeName,
  attributeValue,
  characterName,
  tableId,
}: AttributeRollDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, userId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);
  
  // --- 2. 'applyObstructive' REMOVIDO ---

  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // --- 3. LÓGICA DE 'finalModifier' REMOVIDA ---
    const result = rollAttributeTest({
      attributeValue,
      modifier: modifier, // Voltamos a usar o modificador simples
      withAdvantage,
    });
    // --- FIM DA REVERSÃO ---

    if (!isHidden || isMaster) {
      const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
        result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
      }`;
      toast({
        title: `Teste de ${attributeName}`,
        description: localToastDescription,
      });
    }

    const chatMessage = formatAttributeTest(characterName, attributeName, result);
    
    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `${characterName} rolou ${attributeName} em segredo.`,
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
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: chatMessage,
        message_type: "roll",
        recipient_id: null,
      });
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false); 
    // 'setApplyObstructive(false)' REMOVIDO
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Teste de {attributeName}</DialogTitle>
          <DialogDescription>
            O alvo da rolagem (1d20) é {attributeValue}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advantage"
              checked={withAdvantage}
              onCheckedChange={(checked) => setWithAdvantage(checked as boolean)}
            />
            <Label htmlFor="advantage">Vantagem (+1d4 na rolagem)</Label>
          </div>

          {/* --- 4. CHECKBOX DE DESVANTAGEM REMOVIDO --- */}
          
          <div className="space-y-2">
            <Label htmlFor="modifier">Modificador (no alvo)</Label>
            <Input
              id="modifier"
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
                  id="hidden-roll"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll" className="text-purple-400">
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
            Rolar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};