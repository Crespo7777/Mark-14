// src/features/character/CharacterSheet.tsx

import { useEffect, useRef, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, Save } from "lucide-react"; // <-- MUDANÇA: Importar 'Save'
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
import { cn } from "@/lib/utils"; // <-- MUDANÇA: Importar 'cn'

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

// Componente "Interno"
const CharacterSheetInner = ({
  onClose,
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (data: CharacterSheetData) => Promise<void>;
  initialData: CharacterSheetData;
}) => {
  const { form } = useCharacterSheet();
  const { toast } = useToast();

  const { isDirty, isSubmitting } = form.formState;
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  // Esta função é chamada pelo botão "Salvar" e pelo "Salvar e Sair"
  const onSubmit = async (data: CharacterSheetData) => {
    await onSave(data);
    form.reset(data); // Reseta o form para "limpo" (isDirty = false)
    toast({ title: "Ficha Salva!" }); // <-- MUDANÇA: Adicionar feedback
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
  };

  // --- MUDANÇA: O 'useEffect' do auto-save (debounce) foi REMOVIDO ---

  // --- Lógica para o botão "Fechar" (Popup) ---
  const handleCloseClick = () => {
    if (isDirty) {
      setIsCloseAlertOpen(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    await form.handleSubmit(onSubmit, onInvalid)();
    setIsCloseAlertOpen(false);
    onClose();
  };

  const handleCloseWithoutSaving = () => {
    form.reset(initialData);
    setIsCloseAlertOpen(false);
    onClose();
  };
  // --- Fim da lógica de fecho ---

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

          {/* --- MUDANÇA: Botão Salvar Adicionado --- */}
          <div className="flex gap-2 items-center">
            <div
              className={cn(
                "text-sm transition-opacity duration-300",
                isDirty ? "text-amber-500" : "text-muted-foreground/70",
              )}
            >
              {isSubmitting
                ? "Salvando..."
                : isDirty
                ? "Alterações não salvas"
                : "Salvo"}
            </div>

            <Button
              size="sm"
              variant="default" // Botão principal de salvar
              onClick={form.handleSubmit(onSubmit, onInvalid)}
              disabled={!isDirty || isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleCloseClick}
              disabled={isSubmitting}
            >
              <X className="w-4 h-4 mr-2" />
              Fechar
            </Button>
          </div>
          {/* --- FIM DA MUDANÇA --- */}
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit, onInvalid)}
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
                disabled={form.formState.isSubmitting}
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleCloseWithoutSaving}
            >
              Sair Sem Salvar
            </Button>
            <AlertDialogAction
              className={buttonVariants({ variant: "default" })}
              onClick={handleSaveAndClose}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar e Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// Componente "Pai"
export const CharacterSheet = ({
  initialCharacter,
  onClose,
}: CharacterSheetProps) => {
  const { toast } = useToast();

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

  const handleSave = async (data: CharacterSheetData) => {
    const { error } = await supabase
      .from("characters")
      .update({ data: data, name: data.name })
      .eq("id", initialCharacter.id);

    if (error) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <CharacterSheetProvider character={initialCharacter} onSave={handleSave}>
      <CharacterSheetInner
        onClose={onClose}
        onSave={handleSave}
        initialData={validatedData as CharacterSheetData}
      />
    </CharacterSheetProvider>
  );
};