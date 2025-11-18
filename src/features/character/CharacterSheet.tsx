// src/features/character/CharacterSheet.tsx

import { useState, useEffect } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
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

// --- IMPORTAÇÃO DAS ABAS ---
import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { CombatEquipmentTab } from "./tabs/CombatEquipmentTab"; // Aba Unificada (Combate + Equip)
import { AbilitiesTraitsTab } from "./tabs/AbilitiesTraitsTab"; // Aba Unificada (Habilidades + Traços)
import { BackpackTab } from "./tabs/BackpackTab"; // Inclui Projéteis agora
import { CharacterJournalTab } from "./tabs/CharacterJournalTab";

type Character = Database["public"]["Tables"]["characters"]["Row"];

interface CharacterSheetProps {
  initialCharacter: Character;
  onClose: () => void;
}

// --- COMPONENTE INTERNO (Lógica de UI e Tabs) ---
const CharacterSheetInner = ({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData: CharacterSheetData;
}) => {
  // 1. Obter contexto e hooks
  const { form, isDirty, isSaving, saveSheet, programmaticSave } = useCharacterSheet();
  const { toast } = useToast(); 
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);

  // 2. Observar campos para o Cabeçalho
  const [name, race, occupation] = form.watch(["name", "race", "occupation"]);

  // 3. Prevenir fecho acidental da janela
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; 
      return "";
    };
    if (isDirty) window.addEventListener("beforeunload", handleBeforeUnload);
    else window.removeEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // 4. Handlers de Ação
  const handleCloseClick = () => {
    if (isSaving) {
      toast({ title: "Aguarde", description: "Salvamento em progresso..." });
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
    await programmaticSave();
    setIsCloseAlertOpen(false);
    onClose();
  };

  const handleCloseWithoutSaving = () => {
    form.reset(initialData); // Reseta o form para o estado inicial
    setIsCloseAlertOpen(false);
    onClose();
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* --- CABEÇALHO DA FICHA --- */}
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">{race} | {occupation}</p>
          </div>

          <div className="flex gap-2 items-center">
            {/* Indicador de Estado */}
            <div className={cn("text-sm transition-opacity duration-300", isDirty ? "text-amber-500" : "text-muted-foreground/70")}>
              {isSaving ? "Salvando..." : isDirty ? "Alterações não salvas" : "Salvo"}
            </div>

            {/* Botões Principais */}
            <Button size="sm" variant="default" onClick={saveSheet} disabled={!isDirty || isSaving}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCloseClick} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" /> Fechar
            </Button>
          </div>
        </div>

        {/* --- CONTEÚDO DA FICHA (ABAS) --- */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="m-4 ml-4 flex flex-wrap h-auto">
                {/* Ordem Final Otimizada */}
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="combat_gear">Combate & Equip.</TabsTrigger>
                <TabsTrigger value="abilities_traits">Habilidades & Traços</TabsTrigger>
                <TabsTrigger value="backpack">Mochila</TabsTrigger>
                <TabsTrigger value="journal">Diário</TabsTrigger>
              </TabsList>

              <fieldset disabled={isSaving} className="p-4 pt-0 space-y-4">
                <TabsContent value="details"><DetailsTab /></TabsContent>
                <TabsContent value="attributes"><AttributesTab /></TabsContent>
                <TabsContent value="combat_gear"><CombatEquipmentTab /></TabsContent>
                <TabsContent value="abilities_traits"><AbilitiesTraitsTab /></TabsContent>
                <TabsContent value="backpack"><BackpackTab /></TabsContent>
                <TabsContent value="journal"><CharacterJournalTab /></TabsContent>
              </fieldset>
            </Tabs>
          </form>
        </Form>
      </div>

      {/* --- ALERTA DE SAÍDA SEM SALVAR --- */}
      <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem Salvar?</AlertDialogTitle>
            <AlertDialogDescription>Existem alterações não salvas. O que queres fazer?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleCloseWithoutSaving} disabled={isSaving}>Sair Sem Salvar</Button>
            <AlertDialogAction className={buttonVariants({ variant: "default" })} onClick={handleSaveAndClose} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar e Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- COMPONENTE WRAPPER (Carregamento de Dados e Provider) ---
export const CharacterSheet = ({ initialCharacter, onClose }: CharacterSheetProps) => {
  const queryClient = useQueryClient();
  
  // 1. Merge dos dados existentes com o schema padrão (para garantir que campos novos não quebrem fichas antigas)
  const defaults = getDefaultCharacterSheetData(initialCharacter.name);
  const mergedData = { ...defaults, ...(initialCharacter.data as any) };
  
  // Garante campos raiz importantes
  mergedData.name = (initialCharacter.data as any)?.name || initialCharacter.name || defaults.name;
  mergedData.race = (initialCharacter.data as any)?.race || defaults.race;
  mergedData.occupation = (initialCharacter.data as any)?.occupation || defaults.occupation;
  
  // Garante objetos aninhados (spread evita perder dados se o schema mudar)
  mergedData.attributes = { ...defaults.attributes, ...((initialCharacter.data as any)?.attributes || {}) };
  mergedData.toughness = { ...defaults.toughness, ...((initialCharacter.data as any)?.toughness || {}) };
  mergedData.money = { ...defaults.money, ...((initialCharacter.data as any)?.money || {}) };
  mergedData.experience = { ...defaults.experience, ...((initialCharacter.data as any)?.experience || {}) };

  // Validação final
  const parsedData = characterSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn("Aviso: Dados da ficha inconsistentes com o schema. A usar fallback.", parsedData.error);
  }
  const validatedData = parsedData.success ? parsedData.data : mergedData;
  
  // Atualiza a referência local (opcional, mas bom para consistência imediata)
  initialCharacter.data = validatedData;
  
  // 2. Função de Salvar
  const handleSave = async (data: CharacterSheetData) => {
    const { error } = await supabase
      .from("characters")
      .update({ data: data, name: data.name })
      .eq("id", initialCharacter.id);

    if (error) throw new Error(error.message);
    
    // Invalida caches para atualizar as listas e o próprio personagem
    await queryClient.invalidateQueries({ queryKey: ['characters', initialCharacter.table_id] });
    await queryClient.invalidateQueries({ queryKey: ['character', initialCharacter.id] });
  };

  return (
    <CharacterSheetProvider character={initialCharacter} onSave={handleSave}>
      <CharacterSheetInner onClose={onClose} initialData={validatedData as CharacterSheetData} />
    </CharacterSheetProvider>
  );
};