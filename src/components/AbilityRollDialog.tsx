// src/components/AbilityRollDialog.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  rollAttributeTest,
  formatAbilityTest,
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
import { Dices, ShieldAlert, AlertTriangle, AlertOctagon } from "lucide-react"; // Ícones novos
import { useCharacterSheet } from "@/features/character/CharacterSheetContext";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useTableContext } from "@/features/table/TableContext";
import { useCharacterCalculations } from "@/features/character/hooks/useCharacterCalculations";
// --- 1. IMPORTAR O COMPONENTE DE ALERTA ---
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface AbilityRollDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  abilityName: string;
  attributeName: string;
  attributeValue: number;
  corruptionCost: number;
  characterName: string;
  tableId: string;
}

export const AbilityRollDialog = ({
  open,
  onOpenChange,
  abilityName,
  attributeName,
  attributeValue,
  corruptionCost,
  characterName,
  tableId,
}: AbilityRollDialogProps) => {
  const [modifier, setModifier] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { form, programmaticSave, isSaving } = useCharacterSheet();
  const { corruptionThreshold } = useCharacterCalculations();
  
  const { isMaster, masterId, tableId: contextTableId } = useTableContext();
  const [isHidden, setIsHidden] = useState(false);

  // --- 2. CÁLCULOS DE PREVISÃO (EM TEMPO REAL) ---
  // Observa o valor atual no formulário
  const currentTempCorruption = form.watch("corruption.temporary") || 0;
  const projectedCorruption = currentTempCorruption + corruptionCost;

  // Define o estado de perigo para a UI
  const isOverThreshold = projectedCorruption > corruptionThreshold;
  const isAtThreshold = projectedCorruption === corruptionThreshold;
  const isNearThreshold = !isOverThreshold && !isAtThreshold && (projectedCorruption >= corruptionThreshold - 1);
  // -----------------------------------------------

  const handleRoll = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !form) {
      setLoading(false);
      return;
    }

    // Aplica o custo de corrupção (sem avisos pop-up, o aviso já está na tela)
    if (corruptionCost > 0) {
      form.setValue(
        "corruption.temporary",
        projectedCorruption, // Usa o valor já calculado
        { shouldDirty: true },
      );
      await programmaticSave(); 
    }

    const result = rollAttributeTest({
      attributeValue,
      modifier,
      withAdvantage: false,
    });

    const localToastDescription = `Rolagem: ${result.totalRoll} (Alvo: ${result.target}) - ${
      result.isCrit ? "Crítico!" : result.isFumble ? "Falha Crítica!" : result.isSuccess ? "Sucesso!" : "Falha"
    }`;
    
    if (!isHidden || isMaster) {
      toast({
        title: `Teste de ${abilityName}`,
        description: localToastDescription,
        action: (corruptionCost > 0) ? (
          <div className="flex items-center gap-2 text-purple-400 font-bold">
            <ShieldAlert className="w-4 h-4" /> +{corruptionCost} Corrupção
          </div>
        ) : undefined,
      });
    }

    const chatMessage = formatAbilityTest(
      characterName,
      abilityName,
      attributeName,
      result,
      corruptionCost,
    );

    const discordRollData = {
      rollType: "ability",
      abilityName: abilityName,
      attributeName: attributeName,
      corruptionCost: corruptionCost,
      result: result
    };

    if (isHidden && isMaster) {
      await supabase.from("chat_messages").insert({
        table_id: contextTableId,
        user_id: user.id,
        message: `${characterName} usou ${abilityName} em segredo.`,
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

      supabase.functions.invoke('discord-roll-handler', {
        body: {
          tableId: contextTableId,
          rollData: discordRollData,
          userName: characterName, 
        }
      }).catch(console.error);
    }

    setLoading(false);
    onOpenChange(false);
    setIsHidden(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Usar: {abilityName}</DialogTitle>
          <DialogDescription>
            Teste de {attributeName} (Alvo: {attributeValue}).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          
          {/* --- 3. ALERTAS VISUAIS (DENTRO DO DIÁLOGO) --- */}
          {corruptionCost > 0 && (
            <div className="space-y-3">
              {isOverThreshold && (
                <Alert variant="destructive" className="border-red-600 bg-red-900/20 text-red-200">
                  <AlertOctagon className="h-4 w-4" />
                  <AlertTitle>PERIGO EXTREMO: LIMIAR EXCEDIDO!</AlertTitle>
                  <AlertDescription>
                    Sua corrupção ({projectedCorruption}) vai passar o Limiar ({corruptionThreshold}).
                    <strong> Você terá de rolar 1d4 para ver se adquire um Estigma!</strong>
                  </AlertDescription>
                </Alert>
              )}

              {isAtThreshold && (
                <Alert variant="destructive" className="border-orange-600 bg-orange-900/20 text-orange-200">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Cuidado: Limiar Atingido</AlertTitle>
                  <AlertDescription>
                    Sua corrupção vai atingir exatamente o Limiar ({corruptionThreshold}). 
                    Qualquer ponto extra será perigoso.
                  </AlertDescription>
                </Alert>
              )}

              {isNearThreshold && (
                <Alert className="border-yellow-600 bg-yellow-900/10 text-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-400" />
                  <AlertTitle>Atenção: Perto do Limite</AlertTitle>
                  <AlertDescription>
                    Você vai ficar a 1 ponto do seu Limiar ({projectedCorruption}/{corruptionThreshold}).
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Mostrador Simples se estiver seguro */}
              {!isOverThreshold && !isAtThreshold && !isNearThreshold && (
                 <div className="text-sm text-muted-foreground flex justify-between px-2 border rounded py-2 bg-muted/30">
                    <span>Custo: <span className="text-purple-400">+{corruptionCost} Corrupção</span></span>
                    <span>Novo Total: {projectedCorruption} / {corruptionThreshold}</span>
                 </div>
              )}
            </div>
          )}
          {/* --- FIM DOS ALERTAS --- */}

          <div className="space-y-2">
            <Label htmlFor="modifier-ability">Modificador (no alvo)</Label>
            <Input
              id="modifier-ability"
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
                  id="hidden-roll-ability"
                  checked={isHidden}
                  onCheckedChange={(checked) => setIsHidden(checked as boolean)}
                />
                <Label htmlFor="hidden-roll-ability" className="text-purple-400">
                  Rolar Escondido (Apenas Mestre)
                </Label>
              </div>
            </>
          )}

        </div>
        <DialogFooter>
          <Button
            type="button"
            className={isOverThreshold ? "w-full bg-red-600 hover:bg-red-700" : "w-full"} // Botão vermelho se perigo
            onClick={handleRoll}
            disabled={loading || isSaving}
          >
            {loading ? "Rolando..." : (isSaving ? "Salvando..." : <><Dices className="w-4 h-4 mr-2" /> {isOverThreshold ? "Aceitar Risco e Rolar" : "Usar Habilidade"}</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};