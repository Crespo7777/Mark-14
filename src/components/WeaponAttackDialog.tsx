import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; 
import { parseDiceRoll, formatAttributeRoll } from "@/lib/dice-parser";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dices, Eye, EyeOff } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext"; 

interface WeaponAttackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  characterName: string;
  tableId?: string;
  weaponName: string;
  attributeName: string;
  attributeValue: number;
  projectileId?: string;
  onConfirm?: () => void;
}

export const WeaponAttackDialog = ({
  open,
  onOpenChange,
  characterName,
  tableId,
  weaponName,
  attributeName,
  attributeValue,
  onConfirm
}: WeaponAttackDialogProps) => {
  const { toast } = useToast();
  const { isMaster, masterId } = useTableContext(); 
  
  const [modifier, setModifier] = useState("0");
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
      if (open) {
          setIsHidden(isMaster);
          setModifier("0");
      }
  }, [open, isMaster]);

  const handleRoll = async () => {
    setIsRolling(true);
    if (onConfirm) onConfirm();

    const modValue = parseInt(modifier) || 0;
    const targetValue = attributeValue + modValue;
    
    const diceString = advantage ? "2d20kl1" : disadvantage ? "2d20kh1" : "1d20";
    const rollResult = parseDiceRoll(diceString);

    if (rollResult) {
      const isSuccess = rollResult.total <= targetValue;
      const criticalSuccess = rollResult.total === 1;
      const criticalFailure = rollResult.total === 20;

      if (!isHidden || isMaster) {
          toast({
            title: isSuccess ? "Sucesso!" : "Falha!",
            description: `Rolou ${rollResult.total} vs ${targetValue} (${attributeName})`,
            variant: isSuccess ? "default" : "destructive",
          });
      }

      if (tableId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            if (isHidden && isMaster) {
                // Escondido: Apenas Chat Privado
                await supabase.from("chat_messages").insert([
                    { table_id: tableId, user_id: user.id, message: `${characterName} realizou um ataque em segredo.`, message_type: "info" },
                    { table_id: tableId, user_id: user.id, message: formatAttributeRoll(characterName, attributeName, rollResult, targetValue, weaponName), message_type: "roll", recipient_id: masterId }
                ]);
            } else {
                // Público: Chat + Discord
                await supabase.from("chat_messages").insert({
                    table_id: tableId,
                    user_id: user.id,
                    message: formatAttributeRoll(characterName, attributeName, rollResult, targetValue, weaponName),
                    message_type: "roll"
                });

                const discordData = {
                    rollType: "attack",
                    weaponName,
                    attributeName,
                    targetValue,
                    result: rollResult,
                    isSuccess,
                    isCrit: criticalSuccess,
                    isFumble: criticalFailure
                };

                supabase.functions.invoke('discord-roll-handler', {
                    body: { 
                        tableId, 
                        rollData: discordData, 
                        userName: characterName 
                    }
                }).catch(console.error);
            }
        }
      }
    }
    setIsRolling(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ataque com {weaponName}</DialogTitle>
          <DialogDescription>
            Teste de <strong>{attributeName}</strong> (Valor: {attributeValue})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modifier" className="text-right">Modificador</Label>
            <Input id="modifier" type="number" value={modifier} onChange={(e) => setModifier(e.target.value)} className="col-span-3" placeholder="+0" />
          </div>
          <div className="flex justify-center gap-6">
            <div className="flex items-center space-x-2"><Checkbox id="advantage" checked={advantage} onCheckedChange={(c) => { setAdvantage(!!c); if(c) setDisadvantage(false); }} /><Label htmlFor="advantage">Vantagem</Label></div>
            <div className="flex items-center space-x-2"><Checkbox id="disadvantage" checked={disadvantage} onCheckedChange={(c) => { setDisadvantage(!!c); if(c) setAdvantage(false); }} /><Label htmlFor="disadvantage">Desvantagem</Label></div>
          </div>
          {isMaster && (
            <div className="flex items-center justify-between border p-3 rounded-md bg-muted/20">
                <div className="space-y-0.5"><Label className="flex items-center gap-2">{isHidden ? <EyeOff className="w-4 h-4 text-muted-foreground"/> : <Eye className="w-4 h-4 text-primary"/>} Rolar Publicamente?</Label></div>
                <Switch checked={!isHidden} onCheckedChange={(checked) => setIsHidden(!checked)} />
            </div>
          )}
        </div>
        <DialogFooter><Button type="submit" onClick={handleRoll} disabled={isRolling}>{isRolling ? <Dices className="mr-2 h-4 w-4 animate-spin" /> : <Dices className="mr-2 h-4 w-4" />} Rolar Ataque</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};