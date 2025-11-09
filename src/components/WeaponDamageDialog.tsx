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
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";

interface WeaponDamageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weaponName: string;
  damageString: string; // Ex: "1d8"
}

export const WeaponDamageDialog = ({
  open,
  onOpenChange,
  weaponName,
  damageString,
}: WeaponDamageDialogProps) => {
  const [withAdvantage, setWithAdvantage] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { character } = useCharacterSheet(); // Para pegar o nome e tableId

  const handleRoll = async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // 1. Rolar o dano base (ex: "1d8")
    const baseRoll = parseDiceRoll(damageString);
    if (!baseRoll) {
      toast({ title: "Erro", description: `Dado de dano inválido: ${damageString}`, variant: "destructive" });
      setLoading(false);
      return;
    }

    // 2. Rolar a Vantagem/Crítico (1d4) se marcado
    const advantageRoll = withAdvantage ? parseDiceRoll("1d4") : null;

    // 3. Calcular total
    const totalDamage =
      baseRoll.total +
      (advantageRoll ? advantageRoll.total : 0) +
      modifier;

    // 4. Formatar a notificação local (toast)
    toast({
      title: `Dano com ${weaponName}`,
      description: `Total: ${totalDamage} de Dano`,
    });

    // 5. Formatar a mensagem do chat
    const chatMessage = formatDamageRoll(
      character.name,
      weaponName,
      baseRoll,
      advantageRoll,
      modifier,
      totalDamage,
    );

    // 6. Enviar mensagem para o chat
    await supabase.from("chat_messages").insert({
      table_id: character.table_id,
      user_id: user.id,
      message: chatMessage,
      message_type: "roll",
    });

    setLoading(false);
    onOpenChange(false); // Fechar o diálogo
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