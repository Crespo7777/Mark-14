// src/components/WeaponDamageDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatDamageRoll } from "@/lib/dice-parser";
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

interface WeaponDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weaponName: string;
  damageString: string;
  characterName: string;
  tableId: string;
}

export const WeaponDamageDialog = ({
  open,
  onOpenChange,
  weaponName,
  damageString,
  characterName,
  tableId,
}: WeaponDamageDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
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

    const baseRoll = parseDiceRoll(damageString);
    if (!baseRoll) {
      toast({ title: "Erro", description: `Dado de dano inválido: ${damageString}`, variant: "destructive" });
      setLoading(false);
      return;
    }

    const advantageRoll = withAdvantage ? parseDiceRoll("1d4") : null;

    const totalDamage =
      baseRoll.total +
      (advantageRoll ? advantageRoll.total : 0) +
      modifier;

    if (!isHidden || isMaster) {
      toast({
        title: `Dano com ${weaponName}`,
        description: `Total: ${totalDamage} de Dano`,
      });
    }

    const chatMessage = formatDamageRoll(
      characterName,
      weaponName,
      baseRoll,
      advantageRoll,
      modifier,
      totalDamage,
    );

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `${characterName} rolou dano com ${weaponName} em segredo.`,
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

      // --- INÍCIO DA MODIFICAÇÃO (DISCORD) ---
      supabase.functions.invoke('discord-roll-handler', {
        body: {
          tableId: contextTableId,
          chatMessage: chatMessage,
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
          <DialogTitle>Rolar Dano: {weaponName}</DialogTitle>
          <DialogDescription>
            Rolagem base: {damageString}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advantage-crit"
              checked={withAdvantage}
              onCheckedChange={(checked) => setWithAdvantage(checked as boolean)}
            />
            <Label htmlFor="advantage-crit">Vantagem / Crítico (+1d4)</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="modifier-damage">Modificador de Dano</Label>
            <Input
              id="modifier-damage"
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
                  id="hidden-roll-damage"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll-damage" className="text-purple-400">
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
            Rolar Dano
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};