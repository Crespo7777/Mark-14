import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAttributeRoll } from "@/lib/dice-parser";
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
  const [disadvantage, setDisadvantage] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const { isMaster, masterId } = useTableContext();

  // REMOVIDO: const [isHidden, setIsHidden] = useState... (O BaseRollDialog trata disso)

  useEffect(() => {
      if (open) setModifier("0");
  }, [open]);

  // Agora recebe isHidden como argumento
  const handleRoll = async (isHidden: boolean) => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const modValue = parseInt(modifier) || 0;
    
    // Cálculo da rolagem
    let diceString = "1d20";
    if (advantage) diceString = "2d20kl1";
    if (disadvantage) diceString = "2d20kh1";

    const rollResult = rollAttributeTest({ attributeValue, modifier: modValue, withAdvantage: advantage, withDisadvantage: disadvantage });

    // Feedback local
    if (!isHidden || isMaster) {
        toast({ title: isMaster ? "Rolagem (Mestre)" : "Rolagem", description: `Resultado: ${rollResult.totalRoll}` });
    }

    const chatMessage = formatAttributeRoll(characterName, attributeName, { total: rollResult.totalRoll, rolls: rollResult.rolls } as any, rollResult.target);
    
    // Discord Data
    const discordRollData = { 
        rollType: "attribute", 
        attributeName, 
        targetValue: rollResult.target, 
        result: { total: rollResult.totalRoll, rolls: rollResult.rolls },
        isHidden 
    };

    if (isHidden && isMaster) {
      // Mensagem Secreta
      await supabase.from("chat_messages").insert([
        { table_id: tableId, user_id: user.id, message: `${characterName} rolou ${attributeName} em segredo.`, message_type: "info" },
        { table_id: tableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
      ]);
    } else {
      // Mensagem Pública
      await supabase.from("chat_messages").insert({ 
          table_id: tableId, 
          user_id: user.id, 
          message: chatMessage, 
          message_type: "roll",
          is_hidden: isHidden 
      });
      
      supabase.functions.invoke('discord-roll-handler', { 
          body: { tableId, rollData: discordRollData, userName: characterName } 
      }).catch(console.error);
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
      onRoll={handleRoll} // Passa a função que aceita o argumento
      loading={loading}
      buttonLabel="Rolar Atributo"
    >
      <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="attr-mod" className="text-right">Modificador</Label>
            <Input id="attr-mod" value={modifier} onChange={(e) => setModifier(e.target.value)} className="col-span-3" placeholder="+0" type="number" />
          </div>
          
          <div className="flex justify-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="attr-adv" checked={advantage} onCheckedChange={(c) => { setAdvantage(!!c); if(c) setDisadvantage(false); }} />
              <Label htmlFor="attr-adv">Vantagem</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="attr-dis" checked={disadvantage} onCheckedChange={(c) => { setDisadvantage(!!c); if(c) setAdvantage(false); }} />
              <Label htmlFor="attr-dis">Desvantagem</Label>
            </div>
          </div>
      </div>
      {/* REMOVIDO: O bloco de switch manual que estava aqui */}
    </BaseRollDialog>
  );
};