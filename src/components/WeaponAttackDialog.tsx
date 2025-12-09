import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDiceRoll, formatAttributeRoll, type DiceRoll } from "@/lib/dice-parser";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dices } from "lucide-react";
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
  const [isRolling, setIsRolling] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
      if (open) {
          setIsHidden(isMaster);
          setModifier("0");
          setAdvantage(false);
      }
  }, [open, isMaster]);

  const handleRoll = async () => {
    // --- NOVO: VALIDAÇÃO DE ATRIBUTO ---
    if (attributeValue <= 0) {
        toast({ 
            title: "Regra do Sistema", 
            description: `Não é possível atacar com ${weaponName}. O atributo ${attributeName} tem valor ${attributeValue}.`, 
            variant: "destructive" 
        });
        return; // Bloqueia e sai da função
    }

    setIsRolling(true);
    if (onConfirm) onConfirm();

    const modValue = parseInt(modifier) || 0;
    
    // Lógica de Vantagem: +2 ao Atributo
    const advantageBonus = advantage ? 2 : 0;
    const targetValue = attributeValue + modValue + advantageBonus;
    
    // Rola sempre 1d20 usando a nova engine
    const rollResult: DiceRoll | null = parseDiceRoll("1d20");
    
    if (!rollResult) { 
        toast({ title: "Erro", description: "Falha na rolagem 1d20.", variant: "destructive" });
        setIsRolling(false);
        return;
    }

    const isSuccess = rollResult.total <= targetValue && rollResult.total !== 20;
    const criticalSuccess = rollResult.total === 1;
    const criticalFailure = rollResult.total === 20;

    // 1. Feedback Visual (Toast)
    if (!isHidden || isMaster) {
        toast({
            title: isSuccess ? "Sucesso!" : "Falha!",
            description: `Rolou ${rollResult.total} vs ${targetValue} (${attributeName}${advantage ? " +2 Adv" : ""})`,
            variant: isSuccess ? "default" : "destructive",
        });
    }

    // 2. Envio para Banco de Dados e Discord
    if (tableId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            
            // Mensagem formatada para o Chat do VTT
            // Passamos weaponName como 5º argumento (contextName), suportado pela nova função formatAttributeRoll
            const chatMessage = formatAttributeRoll(characterName, attributeName, rollResult, targetValue, weaponName);

            if (isHidden && isMaster) {
                // ROLAGEM SECRETA
                await supabase.from("chat_messages").insert([
                    { table_id: tableId, user_id: user.id, message: `${characterName} realizou um ataque em segredo.`, message_type: "info" },
                    { table_id: tableId, user_id: user.id, message: chatMessage, message_type: "roll", recipient_id: masterId }
                ]);
            } else {
                // ROLAGEM PÚBLICA
                await supabase.from("chat_messages").insert({
                    table_id: tableId,
                    user_id: user.id,
                    message: chatMessage,
                    message_type: "roll"
                });

                // --- INTEGRAÇÃO COM DISCORD ---
                const discordResult = {
                    mainRoll: rollResult.total,
                    advantageRoll: null,
                    modifier: modValue + advantageBonus,
                    totalRoll: rollResult.total,
                    target: targetValue,
                    isSuccess: isSuccess,
                    isCrit: criticalSuccess,
                    isFumble: criticalFailure
                };

                const discordData = {
                    rollType: "attack",
                    weaponName,
                    attributeName,
                    result: discordResult 
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
    setIsRolling(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ataque com {weaponName}</DialogTitle>
          <DialogDescription>
            Teste de <strong>{attributeName}</strong> (Valor Base: {attributeValue})
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modifier" className="text-right">Modificador</Label>
            <Input 
                id="modifier" 
                type="number" 
                value={modifier} 
                onChange={(e) => setModifier(e.target.value)} 
                className="col-span-3" 
                placeholder="+0" 
            />
          </div>
          
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="advantage" 
                    checked={advantage} 
                    onCheckedChange={(c) => setAdvantage(!!c)} 
                />
                <Label htmlFor="advantage" className="cursor-pointer">
                    Vantagem (+2 no Atributo)
                </Label>
            </div>
          </div>
        </div>
        <DialogFooter><Button type="submit" onClick={handleRoll} disabled={isRolling}>{isRolling ? <Dices className="mr-2 h-4 w-4 animate-spin" /> : <Dices className="mr-2 h-4 w-4" />} Rolar Ataque</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};