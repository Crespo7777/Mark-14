// src/components/AttributeRollDialog.tsx

import { useState, useEffect } from "react"; // Adicionado useEffect
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAttributeTest } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator"; 
import { useTableContext } from "@/features/table/TableContext"; 
import { BaseRollDialog } from "@/components/BaseRollDialog";

interface AttributeRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attributeName: string;
  attributeValue: number;
  characterName: string;
  tableId: string;
}

export const AttributeRollDialog = ({
  open,
  onOpenChange,
  attributeName,
  attributeValue,
  characterName,
  tableId,
}: AttributeRollDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  // CORREÇÃO: Estado inicial vazio para permitir digitar livremente
  const [modifier, setModifier] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);
  
  // Resetar estado ao abrir
  useEffect(() => {
      if (open) setModifier("");
  }, [open]);
  
  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Converte para número apenas na hora do roll
    // Se estiver vazio ou for apenas "-", considera 0
    const modValue = parseInt(modifier) || 0;

    const result = rollAttributeTest({
      attributeValue,
      modifier: modValue,
      withAdvantage,
    });

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
    const discordRollData = {
      rollType: "attribute",
      attributeName: attributeName,
      result: result
    };
    
    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert([
        { table_id: contextTableId, user_id: user.id, message: `${characterName} rolou ${attributeName} em segredo.`, message_type: "info" },
        { table_id: contextTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: chatMessage,
        message_type: "roll",
      });
      
      supabase.functions.invoke('discord-roll-handler', {
        body: { tableId: contextTableId, rollData: discordRollData, userName: characterName }
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
      title={`Teste de ${attributeName}`}
      description={`O alvo da rolagem (1d20) é ${attributeValue}.`}
      onRoll={handleRoll}
      loading={loading}
    >
      <div className="flex items-center space-x-2">
        <Checkbox
          id="advantage"
          checked={withAdvantage}
          onCheckedChange={(checked) => setWithAdvantage(checked as boolean)}
        />
        <Label htmlFor="advantage">Vantagem (+1d4 na rolagem)</Label>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="modifier">Modificador (no alvo)</Label>
        <Input
          id="modifier"
          type="number"
          // CORREÇÃO: Valor controlado como string
          value={modifier}
          onChange={(e) => setModifier(e.target.value)}
          placeholder="Ex: -2 ou 1"
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
    </BaseRollDialog>
  );
};