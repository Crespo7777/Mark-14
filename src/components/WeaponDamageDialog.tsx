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
// import { useCharacterSheet } from "@/features/character/CharacterSheetContext"; // <-- REMOVIDO

interface WeaponDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weaponName: string;
  damageString: string; // Ex: "1d8"
  // --- ADICIONADO ---
  characterName: string;
  tableId: string;
  // --- FIM ---
}

export const WeaponDamageDialog = ({
  open,
  onOpenChange,
  weaponName,
  damageString,
  // --- ADICIONADO ---
  characterName,
  tableId,
}: WeaponDamageDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  // const { character } = useCharacterSheet(); // <-- REMOVIDO

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

    toast({
      title: `Dano com ${weaponName}`,
      description: `Total: ${totalDamage} de Dano`,
    });

    const chatMessage = formatDamageRoll(
      characterName, // <-- USA PROP
      weaponName,
      baseRoll,
      advantageRoll,
      modifier,
      totalDamage,
    );

    await supabase.from("chat_messages").insert({
      table_id: tableId, // <-- USA PROP
      user_id: user.id,
      message: chatMessage,
      message_type: "roll",
    });

    setLoading(false);
    onOpenChange(false);
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
            <Label htmlFor="modifier">Modificador de Dano</Label>
            <Input
              id="modifier"
              type="number"
              value={modifier}
              onChange={(e) => setModifier(parseInt(e.target.value, 10) || 0)}
              placeholder="Ex: -2 ou +1"
            />
          </div>
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