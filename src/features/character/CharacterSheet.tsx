// src/features/character/CharacterSheet.tsx

import { useState, useEffect, useMemo } from "react";
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
import { CombatEquipmentTab } from "./tabs/CombatEquipmentTab";
import { AbilitiesTraitsTab } from "./tabs/AbilitiesTraitsTab";
import { BackpackTab } from "./tabs/BackpackTab";
import { CharacterJournalTab } from "./tabs/CharacterJournalTab";

type Character = Database["public"]["Tables"]["characters"]["Row"];

interface CharacterSheetProps {
  initialCharacter: Character;
  onClose: () => void;
}

const CharacterSheetInner = ({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData: CharacterSheetData;
}) => {
  const { form, isDirty, isSaving, saveSheet, programmaticSave } = useCharacterSheet();
  const { toast } = useToast(); 
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  
  // --- CORREÇÃO: Estado Controlado da Aba ---
  const [activeTab, setActiveTab] = useState("details"); 

  const [name, race, occupation] = form.watch(["name", "race", "occupation"]);

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
    form.reset(initialData);
    setIsCloseAlertOpen(false);
    onClose();
  };

  return (
    <>
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border/50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{name}</h2>
            <p className="text-sm text-muted-foreground">{race} | {occupation}</p>
          </div>

          <div className="flex gap-2 items-center">
            <div className={cn("text-sm transition-opacity duration-300", isDirty ? "text-amber-500" : "text-muted-foreground/70")}>
              {isSaving ? "Salvando..." : isDirty ? "Não salvo" : "Salvo"}
            </div>
            <Button size="sm" variant="default" onClick={saveSheet} disabled={!isDirty || isSaving}>
              <Save className="w-4 h-4 mr-2" /> Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCloseClick} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" /> Fechar
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto">
            {/* --- CORREÇÃO: Tabs Controladas --- */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="m-4 ml-4 flex flex-wrap h-auto">
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

      <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem Salvar?</AlertDialogTitle>
            <AlertDialogDescription>Existem alterações não salvas.</AlertDialogDescription>
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

export const CharacterSheet = ({ initialCharacter, onClose }: CharacterSheetProps) => {
  const queryClient = useQueryClient();
  
  // --- CORREÇÃO: Estabilidade dos Dados com useMemo ---
  const validatedData = useMemo(() => {
      const defaults = getDefaultCharacterSheetData(initialCharacter.name);
      const rawData = initialCharacter.data as any;

      const mergedData = { 
          ...defaults, 
          ...rawData,
          attributes: { ...defaults.attributes, ...(rawData?.attributes || {}) },
          combat: { ...defaults.combat, ...(rawData?.combat || {}) },
          money: { ...defaults.money, ...(rawData?.money || {}) },
          experience: { ...defaults.experience, ...(rawData?.experience || {}) },
          weapons: rawData?.weapons || [],
          armors: rawData?.armors || [],
          abilities: rawData?.abilities || [],
          inventory: rawData?.inventory || [],
          traits: rawData?.traits || [],
          projectiles: rawData?.projectiles || [],
      };

      if(rawData?.name) mergedData.name = rawData.name;
      else mergedData.name = initialCharacter.name;
      
      if(rawData?.race) mergedData.race = rawData.race;
      if(rawData?.occupation) mergedData.occupation = rawData.occupation;

      const parsed = characterSheetSchema.safeParse(mergedData);
      return parsed.success ? parsed.data : mergedData;
  }, [initialCharacter]); 
  
  const handleSave = async (data: CharacterSheetData) => {
    const { error } = await supabase
      .from("characters")
      .update({ data: data, name: data.name })
      .eq("id", initialCharacter.id);

    if (error) throw new Error(error.message);
    
    await queryClient.invalidateQueries({ queryKey: ['characters', initialCharacter.table_id] });
    await queryClient.invalidateQueries({ queryKey: ['character', initialCharacter.id] });
  };

  return (
    <CharacterSheetProvider character={initialCharacter} onSave={handleSave}>
      <CharacterSheetInner onClose={onClose} initialData={validatedData as CharacterSheetData} />
    </CharacterSheetProvider>
  );
};