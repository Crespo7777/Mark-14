import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch"; // Importado Switch
import { parseDiceRoll, formatAttributeRoll } from "@/lib/dice-parser";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dices, Eye, EyeOff } from "lucide-react";
import { useTableContext } from "@/features/table/TableContext"; // Importado Contexto

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
  const { isMaster } = useTableContext(); // Pegar isMaster
  
  const [modifier, setModifier] = useState("0");
  const [advantage, setAdvantage] = useState(false);
  const [disadvantage, setDisadvantage] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  
  // Estado de Visibilidade (Iniciado conforme Mestre/Jogador)
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
      if (open) {
          setIsHidden(isMaster); // Mestre começa escondido
          setModifier("0");
      }
  }, [open, isMaster]);

  const handleRoll = async () => {
    setIsRolling(true);
    
    if (onConfirm) {
        onConfirm();
    }

    const modValue = parseInt(modifier) || 0;
    const targetValue = attributeValue + modValue;
    
    const diceString = advantage ? "2d20kl1" : disadvantage ? "2d20kh1" : "1d20";
    const rollResult = parseDiceRoll(diceString);

    if (rollResult) {
      const isSuccess = rollResult.total <= targetValue;
      const criticalSuccess = rollResult.total === 1;
      const criticalFailure = rollResult.total === 20;

      // Feedback Local (Sempre visível para quem rola)
      toast({
        title: isSuccess ? "Sucesso!" : "Falha!",
        description: `Rolou ${rollResult.total} vs ${targetValue} (${attributeName})`,
        variant: isSuccess ? "default" : "destructive",
      });

      if (tableId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            // Salvar no Chat do Banco
            await supabase.from("chat_messages").insert({
                table_id: tableId,
                user_id: user.id,
                message: formatAttributeRoll(characterName, attributeName, rollResult, targetValue, weaponName),
                message_type: "roll",
                is_hidden: isHidden, // Usa o estado
            });

            // Enviar para Discord
            const discordData = {
                rollType: "attack",
                weaponName,
                attributeName,
                targetValue,
                result: rollResult,
                isSuccess,
                isCrit: criticalSuccess,
                isFumble: criticalFailure,
                isHidden // Envia flag para Discord handler (para saber se deve esconder ou formatar diferente)
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
            Teste de <strong>{attributeName}</strong> (Valor: {attributeValue})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="modifier" className="text-right">
              Modificador
            </Label>
            <Input
              id="modifier"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(e.target.value)}
              className="col-span-3"
              placeholder="+0"
            />
          </div>
          
          <div className="flex justify-center gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="advantage" 
                checked={advantage} 
                onCheckedChange={(c) => { 
                    setAdvantage(!!c); 
                    if(c) setDisadvantage(false); 
                }} 
              />
              <Label htmlFor="advantage">Vantagem</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="disadvantage" 
                checked={disadvantage} 
                onCheckedChange={(c) => { 
                    setDisadvantage(!!c); 
                    if(c) setAdvantage(false); 
                }} 
              />
              <Label htmlFor="disadvantage">Desvantagem</Label>
            </div>
          </div>

          {/* SWITCH DE VISIBILIDADE (Mesma lógica do BaseRollDialog) */}
          <div className="flex items-center justify-between border p-3 rounded-md bg-muted/20">
            <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                    {isHidden ? <EyeOff className="w-4 h-4 text-muted-foreground"/> : <Eye className="w-4 h-4 text-primary"/>}
                    {isMaster ? "Rolar Publicamente" : "Rolar Escondido"}
                </Label>
            </div>
            <Switch
              checked={isMaster ? !isHidden : isHidden}
              onCheckedChange={(checked) => isMaster ? setIsHidden(!checked) : setIsHidden(checked)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" onClick={handleRoll} disabled={isRolling}>
            {isRolling ? <Dices className="mr-2 h-4 w-4 animate-spin" /> : <Dices className="mr-2 h-4 w-4" />}
            Rolar Ataque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};