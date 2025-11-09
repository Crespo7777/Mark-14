// src/components/WeaponAttackDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAttackRoll,
} from "@/lib/dice-parser";
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

interface WeaponAttackDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weaponName: string;
  attributeName: string;
  attributeValue: number;
  // --- ADICIONADO ---
  characterName: string; 
  tableId: string;
  // --- FIM ---
}

export const WeaponAttackDialog = ({
  open,
  onOpenChange,
  weaponName,
  attributeName,
  attributeValue,
  // --- ADICIONADO ---
  characterName,
  tableId,
}: WeaponAttackDialogProps) => {
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

    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage,
    });

    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;

    toast({
      title: `Ataque com ${weaponName}`,
      description: localToastDescription,
    });

    const chatMessage = formatAttackRoll(
      characterName, // <-- USA PROP
      weaponName,
      attributeName,
      result,
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
          <DialogTitle>Atacar com: {weaponName}</DialogTitle>
          <DialogDescription>
            Teste de {attributeName} (Alvo: {attributeValue}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            Rolar Ataque
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};