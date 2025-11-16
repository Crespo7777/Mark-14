// src/features/character/CharacterSheet.tsx

import { useState, useEffect, useCallback } from "react";
import { Database } from "@/integrations/supabase/types";
import {
  CharacterSheetProvider,
  useCharacterSheet,
} from "./CharacterSheetContext";
import {
  CharacterSheetData,
  characterSheetSchema,
  getDefaultCharacterSheetData,
} from "./character.schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
// ######################################################
// ### CORREÇÃO AQUI ###
// ######################################################
import { useToast } from "@/hooks/use-toast";
// --- 1. IMPORTAR O useQueryClient ---
import { useQueryClient } from "@tanstack/react-query";
// ######################################################
// ### FIM DA CORREÇÃO ###
// ######################################################
import { supabase } from "@/integrations/supabase/client";
import { X, Save } from "lucide-react";
import { Form } from "@/components/ui/form";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { CombatTab } from "./tabs/CombatTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { TraitsTab } from "./tabs/TraitsTab";
import { BackpackTab } from "./tabs/BackpackTab";
import { ProjectilesTab } from "./tabs/ProjectilesTab";
import { CharacterJournalTab } from "./tabs/CharacterJournalTab";

type Character = Database["public"]["Tables"]["characters"]["Row"];

interface CharacterSheetProps {
  initialCharacter: Character;
  onClose: () => void;
}

// Componente "Interno" (Agora muito mais simples)
const CharacterSheetInner = ({
  onClose,
  initialData, // Usado para reverter "Sair Sem Salvar"
}: {
  onClose: () => void;
  initialData: CharacterSheetData;
}) => {
  // 1. Obter tudo do contexto
  const { form, isDirty, isSaving, saveSheet, programmaticSave } = useCharacterSheet();
  const { toast } = useToast(); // Esta linha agora funciona

  // 2. Remover todos os states e refs de salvamento
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  // 5. Manter 'useEffect[isDirty]' (Aviso de fechar a aba)
  // Este é o "airbag" de segurança.
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; 
      return "";
    };

    if (isDirty) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]); // Agora só depende do 'isDirty'


  // 6. Simplificar lógicas de fechar
  const handleCloseClick = () => {
    if (isSaving) {
      toast({ title: "Aguarde", description: "Salvamento automático em progresso..." });
      return; 
    }
    if (isDirty) {
      setIsCloseAlertOpen(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    if (isSaving) return;
    await programmaticSave(); // 1. Salva
    setIsCloseAlertOpen(false); // 2. Fecha o pop-up
    onClose(); // 3. Fecha o sheet
  };

  const handleCloseWithoutSaving = () => {
    form.reset(initialData); // Reseta para os dados originais
    setIsCloseAlertOpen(false);
    onClose();
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">
              {race} | {occupation}
            </p>
          </div>

          <div className="flex gap-2 items-center">
            {/* 7. Ligar indicador ao contexto */}
            <div
              className={cn(
                "text-sm transition-opacity duration-300",
                isDirty ? "text-amber-500" : "text-muted-foreground/70",
              )}
            >
              {isSaving
                ? "Salvando..."
                : isDirty
                ? "Alterações não salvas"
                : "Salvo"}
            </div>

            {/* 8. Ligar botões ao contexto */}
            <Button
              size="sm"
              variant="default"
              onClick={saveSheet}
              disabled={!isDirty || isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCloseClick}
              disabled={isSaving} 
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form
            onSubmit={(e) => e.preventDefault()} // Não precisamos de submit HTML
            className="flex-1 overflow-y-auto"
          >
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="m-4 ml-4">
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="combat">Combate</TabsTrigger>
                <TabsTrigger value="traits">Traços</TabsTrigger>
                <TabsTrigger value="skills">Habilidades</TabsTrigger>
                <TabsTrigger value="equipment">Equipamento</TabsTrigger>
                <TabsTrigger value="backpack">Mochila</TabsTrigger>
                <TabsTrigger value="projectiles">Projéteis</TabsTrigger>
                <TabsTrigger value="journal">Diário</TabsTrigger>
              </TabsList>

              <fieldset
                disabled={isSaving} // Desabilita tudo enquanto salva
                className="p-4 pt-0 space-y-4"
              >
                <TabsContent value="details">
                  <DetailsTab />
                </TabsContent>
                <TabsContent value="attributes">
                  <AttributesTab />
                </TabsContent>
                <TabsContent value="combat">
                  <CombatTab />
                </TabsContent>
                <TabsContent value="traits">
                  <TraitsTab />
                </TabsContent>
                <TabsContent value="skills">
                  <SkillsTab />
                </TabsContent>
                <TabsContent value="equipment">
                  <EquipmentTab />
                </TabsContent>
                <TabsContent value="backpack">
                  <BackpackTab />
                </TabsContent>
                <TabsContent value="projectiles">
                  <ProjectilesTab />
                </TabsContent>
                <TabsContent value="journal">
                  <CharacterJournalTab />
                </TabsContent>
              </fieldset>
            </Tabs>
          </form>
        </Form>
      </div>

      {/* 9. Ligar AlertDialog ao 'isSaving' */}
      <AlertDialog
        open={isCloseAlertOpen}
        onOpenChange={setIsCloseAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem Salvar?</AlertDialogTitle>
            <AlertDialogDescription>
              Existem alterações não salvas. O que queres fazer?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleCloseWithoutSaving}
              disabled={isSaving}
            >
              Sair Sem Salvar
            </Button>
            <AlertDialogAction
              className={buttonVariants({ variant: "default" })}
              onClick={handleSaveAndClose}
              disabled={isSaving} 
            >
              {isSaving ? "Salvando..." : "Salvar e Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Componente "Pai" (Wrapper)
export const CharacterSheet = ({
  initialCharacter,
  onClose,
}: CharacterSheetProps) => {
  const { toast } = useToast(); // Esta linha (linha 231) agora funciona
  // --- 2. INICIAR O queryClient ---
  const queryClient = useQueryClient();

  // (Lógica de merge de dados permanece idêntica)
  const defaults = getDefaultCharacterSheetData(initialCharacter.name);
  const mergedData = {
    ...defaults,
    ...(initialCharacter.data as any),
  };
  mergedData.name =
    (initialCharacter.data as any)?.name ||
    initialCharacter.name ||
    defaults.name;
  mergedData.race = (initialCharacter.data as any)?.race || defaults.race;
  mergedData.occupation =
    (initialCharacter.data as any)?.occupation || defaults.occupation;
  mergedData.shadow = (initialCharacter.data as any)?.shadow || defaults.shadow;
  mergedData.personalGoal =
    (initialCharacter.data as any)?.personalGoal || defaults.personalGoal;
  mergedData.importantAllies =
    (initialCharacter.data as any)?.importantAllies || defaults.importantAllies;
  mergedData.notes = (initialCharacter.data as any)?.notes || defaults.notes;

  const parsedData = characterSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn(
      "Aviso ao parsear dados da Ficha (CharacterSheet).",
      parsedData.error.errors,
    );
  }
  const validatedData = parsedData.success ? parsedData.data : mergedData;
  initialCharacter.data = validatedData;
  
  // 10. Esta é a função que o Contexto usará para salvar
  const handleSave = async (data: CharacterSheetData) => {
    const { error } = await supabase
      .from("characters")
      .update({ data: data, name: data.name })
      .eq("id", initialCharacter.id);

    if (error) {
      // O 'toast' de erro já é disparado pelo contexto
      throw new Error(error.message);
    }
    
    // --- 3. INVALIDAR OS CACHES APÓS SALVAR ---
    // Invalida a lista principal de personagens
    await queryClient.invalidateQueries({
      queryKey: ['characters', initialCharacter.table_id]
    });
    // Invalida a cache desta ficha específica (se houver)
    await queryClient.invalidateQueries({
      queryKey: ['character', initialCharacter.id]
    });
  };

  return (
    <CharacterSheetProvider character={initialCharacter} onSave={handleSave}>
      <CharacterSheetInner
        onClose={onClose}
        initialData={validatedData as CharacterSheetData}
      />
    </CharacterSheetProvider>
  );
};