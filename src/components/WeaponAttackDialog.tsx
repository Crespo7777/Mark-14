import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAttackRoll } from "@/lib/dice-parser";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Crosshair } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { BaseRollDialog } from "@/components/BaseRollDialog"; // <-- IMPORTADO

interface WeaponAttackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weaponName: string;
  attributeName: string;
  attributeValue: number;
  characterName: string;
  tableId: string;
  projectileId?: string;
}

export const WeaponAttackDialog = ({
  open,
  onOpenChange,
  weaponName,
  attributeName,
  attributeValue,
  characterName,
  tableId,
  projectileId,
}: WeaponAttackDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);
  const { form, programmaticSave, isSaving } = useCharacterSheet();

  const handleRoll = async () => {
    // Lógica de Munição
    if (projectileId && form) {
      const projectiles = form.getValues("projectiles");
      const pIndex = projectiles.findIndex((p) => p.id === projectileId);
      if (pIndex === -1) {
        toast({ title: "Erro", description: "Munição não encontrada.", variant: "destructive" });
        return;
      }
      if (projectiles[pIndex].quantity <= 0) {
        toast({ title: "Sem Munição!", variant: "destructive" });
        return;
      }
      form.setValue(`projectiles.${pIndex}.quantity`, projectiles[pIndex].quantity - 1, { shouldDirty: true });
      toast({ description: <div className="flex items-center gap-2"><Crosshair className="w-4 h-4"/> {projectiles[pIndex].name}: -1</div> });
      await programmaticSave();
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const result = rollAttributeTest({ attributeValue, modifier, withAdvantage });

    if (!isHidden || isMaster) {
      toast({
        title: `Ataque com ${weaponName}`,
        description: `Rolagem: ${result.totalRoll} (Alvo: ${result.target})`,
      });
    }

    const chatMessage = formatAttackRoll(characterName, weaponName, attributeName, result);
    const discordRollData = { rollType: "attack", weaponName, attributeName, result };

    if (isHidden && isMaster) {
        await supabase.from("chat_messages").insert([
            { table_id: contextTableId, user_id: user.id, message: `${characterName} atacou com ${weaponName} em segredo.`, message_type: "info" },
            { table_id: contextTableId, user_id: user.id, message: `[SECRETO] ${chatMessage}`, message_type: "roll", recipient_id: masterId }
        ]);
    } else {
        await supabase.from("chat_messages").insert({ table_id: contextTableId, user_id: user.id, message: chatMessage, message_type: "roll" });
        supabase.functions.invoke('discord-roll-handler', { body: { tableId: contextTableId, rollData: discordRollData, userName: characterName } }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
  };

  return (
    <BaseRollDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Atacar com: ${weaponName}`}
      description={`Teste de ${attributeName} (Alvo: ${attributeValue}).`}
      onRoll={handleRoll}
      loading={loading || isSaving}
      buttonLabel="Rolar Ataque"
    >
      <div className="flex items-center space-x-2">
        <Checkbox id="adv-atk" checked={withAdvantage} onCheckedChange={(c) => setWithAdvantage(c as boolean)} />
        <Label htmlFor="adv-atk">Vantagem (+1d4)</Label>
      </div>
      <div className="space-y-2">
        <Label htmlFor="mod-atk">Modificador</Label>
        <Input id="mod-atk" type="number" value={modifier} onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)} placeholder="Ex: -2" />
      </div>
      {isMaster && (
        <>
          <Separator className="my-4" />
          <div className="flex items-center space-x-2">
            <Checkbox id="hide-atk" checked={isHidden} onCheckedChange={(c) => setIsHidden(c as boolean)} />
            <Label htmlFor="hide-atk" className="text-purple-400">Rolar Escondido</Label>
          </div>
        </>
      )}
    </BaseRollDialog>
  );
};