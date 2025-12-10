import { useState, useEffect } from "react";
import { BaseRollDialog } from "@/components/BaseRollDialog"; // <--- O SEGREDO
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { parseDiceRoll, formatAttributeRoll, type DiceRoll } from "@/lib/dice-parser";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
  const [loading, setLoading] = useState(false); // Mudado de isRolling para loading (padrão BaseRollDialog)

  useEffect(() => {
      if (open) {
          setModifier("0");
          setAdvantage(false);
      }
  }, [open]);

  // A função agora recebe isHidden diretamente do BaseRollDialog
  const handleRoll = async (isHidden: boolean) => {
    // 1. Validação
    if (attributeValue <= 0) {
        toast({ 
            title: "Impossível Atacar", 
            description: `Atributo ${attributeName} inválido (${attributeValue}).`, 
            variant: "destructive" 
        });
        return;
    }

    setLoading(true);
    if (onConfirm) onConfirm();

    const modValue = parseInt(modifier) || 0;
    const advantageBonus = advantage ? 2 : 0;
    const targetValue = attributeValue + modValue + advantageBonus;
    
    // 2. Rolagem
    const rollResult: DiceRoll | null = parseDiceRoll("1d20");
    if (!rollResult) { 
        setLoading(false);
        return;
    }

    const isSuccess = rollResult.total <= targetValue && rollResult.total !== 20;
    const criticalSuccess = rollResult.total === 1;
    const criticalFailure = rollResult.total === 20;
    
    // 3. Feedback Local (Toast)
    // Mostra se for público OU se eu for o mestre (mesmo que secreto)
    if (!isHidden || isMaster) {
        toast({
            title: isSuccess ? "Ataque Bem Sucedido!" : "Ataque Falhou",
            description: `Rolou ${rollResult.total} vs ${targetValue} com ${weaponName}`,
            variant: isSuccess ? "default" : "destructive",
        });
    }

    // 4. Envio para Chat
    if (tableId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const chatMessage = formatAttributeRoll(characterName, attributeName, rollResult, targetValue, weaponName);

            // Dados para Discord
            const discordResult = {
                mainRoll: rollResult.total,
                target: targetValue,
                isSuccess,
                isCrit: criticalSuccess,
                isFumble: criticalFailure
            };
            const discordData = { rollType: "attack", weaponName, attributeName, result: discordResult };

            if (isHidden && isMaster) {
                // MODO SECRETO
                await supabase.from("chat_messages").insert([
                    { 
                        table_id: tableId, 
                        user_id: user.id, 
                        message: `${characterName} realiza um ataque furtivo...`, 
                        message_type: "info" 
                    },
                    { 
                        table_id: tableId, 
                        user_id: user.id, 
                        message: `[GM] ${chatMessage}`, 
                        message_type: "roll", 
                        recipient_id: masterId 
                    }
                ]);
            } else {
                // MODO PÚBLICO
                await supabase.from("chat_messages").insert({
                    table_id: tableId,
                    user_id: user.id,
                    message: chatMessage,
                    message_type: "roll"
                });

                supabase.functions.invoke('discord-roll-handler', {
                    body: { tableId, rollData: discordData, userName: characterName }
                }).catch(() => {});
            }
        }
    }
    setLoading(false);
    onOpenChange(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Ataque com ${weaponName}`}
      description={`Teste de ${attributeName} (Base: ${attributeValue})`}
      onRoll={handleRoll}
      loading={loading}
      buttonLabel="Rolar Ataque"
    >
        {/* Conteúdo Interno (Inputs) - Igual ao de Atributos */}
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modifier" className="text-right">Modificador</Label>
            <Input 
                id="modifier" 
                type="number" 
                value={modifier} 
                onChange={(e) => setModifier(e.target.value)} 
                className="col-span-3 bg-background/50" 
                placeholder="+0" 
            />
          </div>
          
          <div className="flex justify-center pt-2">
            <div className="flex items-center space-x-2 bg-muted/30 p-2 rounded-md border border-white/5">
                <Checkbox 
                    id="advantage" 
                    checked={advantage} 
                    onCheckedChange={(c) => setAdvantage(!!c)} 
                />
                <Label htmlFor="advantage" className="cursor-pointer">Vantagem (+2)</Label>
            </div>
          </div>
        </div>
    </BaseRollDialog>
  );
};