// src/components/WeaponAttackDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { rollAttributeTest, formatAttackRoll } from "@/lib/dice-parser";
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
import { Dices, Crosshair } from "lucide-react"; 
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";
// --- 1. IMPORTAR O HOOK DA FICHA ---
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";

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
  const {
    isMaster,
    masterId,
    tableId: contextTableId,
  } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  // --- 2. OBTER O 'form' E O 'programmaticSave' ---
  const { form, programmaticSave, isSaving } = useCharacterSheet();

  const handleRoll = async () => {
    // --- 3. LÓGICA DE MUNIÇÃO (INÍCIO) ---
    if (projectileId && form) {
      const projectiles = form.getValues("projectiles");
      const projectileIndex = projectiles.findIndex(
        (p) => p.id === projectileId,
      );
      const projectile = projectiles[projectileIndex];

      if (projectileIndex === -1) {
        toast({
          title: "Erro de Projétil",
          description: "A munição ligada a esta arma não foi encontrada.",
          variant: "destructive",
        });
        return; 
      }

      if (projectile.quantity <= 0) {
        toast({
          title: "Sem Munição!",
          description: `Você não tem mais ${projectile.name} para disparar.`,
          variant: "destructive",
        });
        return;
      }

      const newQuantity = projectile.quantity - 1;
      form.setValue(`projectiles.${projectileIndex}.quantity`, newQuantity, {
        shouldDirty: true, 
      });

      toast({
        title: "Disparou!",
        description: (
          <div className="flex items-center gap-2">
            <Crosshair className="w-4 h-4" />
            {`${projectile.name}: ${newQuantity} restantes.`}
          </div>
        ),
      });

      // 4. SALVAR A MUDANÇA DE MUNIÇÃO
      await programmaticSave();

    }
    // --- LÓGICA DE MUNIÇÃO (FIM) ---

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

    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${
      result.target
    }) - ${
      result.isCrit
        ? "Crítico!"
        : result.isFumble
        ? "Falha Crítica!"
        : result.isSuccess
        ? "Sucesso!"
        : "Falha"
    }`;

    if (!isHidden || isMaster) {
      toast({
        title: `Ataque com ${weaponName}`,
        description: localToastDescription,
      });
    }

    const chatMessage = formatAttackRoll(
      characterName,
      weaponName,
      attributeName,
      result,
    );

    // ... (lógica de envio de chat) ...
    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `${characterName} atacou com ${weaponName} em segredo.`,
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
          userName: characterName, // <-- Enviar o nome
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
          <DialogTitle>Atacar com: {weaponName}</DialogTitle>
          <DialogDescription>
            Teste de {attributeName} (Alvo: {attributeValue}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="advantage-attack"
              checked={withAdvantage}
              onCheckedChange={(checked) => setWithAdvantage(checked as boolean)}
            />
            <Label htmlFor="advantage-attack">Vantagem (+1d4 na rolagem)</Label>
          </div>
          <div className="space-y-2">
            <Label htmlFor="modifier-attack">Modificador (no alvo)</Label>
            <Input
              id="modifier-attack"
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
                  id="hidden-roll-attack"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll-attack" className="text-purple-400">
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
            // 5. Desabilitar se a rolagem local ESTIVER acontecendo OU a ficha ESTIVER salvando
            disabled={loading || isSaving}
          >
            {loading ? "Rolando..." : (isSaving ? "Salvando..." : <><Dices className="w-4 h-4 mr-2" /> Rolar Ataque</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};