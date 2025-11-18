// src/features/npc/NpcSheet.tsx

import { useEffect, useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Save } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

import {
  NpcSheetData,
  npcSheetSchema,
  getDefaultNpcSheetData,
} from "./npc.schema";
import { NpcSheetProvider, useNpcSheet } from "./NpcSheetContext";

// Abas Atualizadas
import { NpcDetailsTab } from "./tabs/NpcDetailsTab";
import { NpcCombatEquipmentTab } from "./tabs/NpcCombatEquipmentTab";
import { NpcAttributesTab } from "./tabs/NpcAttributesTab";
import { NpcAbilitiesTraitsTab } from "./tabs/NpcAbilitiesTraitsTab";
import { SharedInventoryList } from "@/components/SharedInventoryList";
import { NpcJournalTab } from "./tabs/NpcJournalTab";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetProps {
  initialNpc: Npc;
  onClose: () => void;
}

const NpcSheetInner = ({
  onClose,
  initialData,
}: {
  onClose: () => void;
  onSave: (data: NpcSheetData) => Promise<void>;
  initialData: NpcSheetData;
}) => {
  const { form, isReadOnly, isDirty, isSaving, saveSheet, programmaticSave } = useNpcSheet();
  const { toast } = useToast();
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  const [name, race, occupation] = form.watch(["name", "race", "occupation"]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; 
      return "";
    };
    if (isDirty && !isReadOnly) window.addEventListener("beforeunload", handleBeforeUnload);
    else window.removeEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isReadOnly]);

  const handleCloseClick = () => {
    if (isSaving) {
      toast({ title: "Aguarde", description: "Salvamento em progresso..." });
      return;
    }
    if (isDirty && !isReadOnly) setIsCloseAlertOpen(true);
    else onClose();
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
            {!isReadOnly && (
              <div className={cn("text-sm transition-opacity duration-300", isDirty ? "text-amber-500" : "text-muted-foreground/70")}>
                {isSaving ? "Salvando..." : isDirty ? "Alterações não salvas" : "Salvo"}
              </div>
            )}
            {!isReadOnly && (
              <Button size="sm" variant="default" onClick={saveSheet} disabled={!isDirty || isSaving}>
                <Save className="w-4 h-4 mr-2" /> Salvar
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={handleCloseClick} disabled={isSaving}>
              <X className="w-4 h-4 mr-2" /> Fechar
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="m-4 ml-4 flex flex-wrap h-auto">
                {/* --- ORDEM DO MENU CORRIGIDA --- */}
                <TabsTrigger value="details">Detalhes</TabsTrigger>
                <TabsTrigger value="attributes">Atributos</TabsTrigger>
                <TabsTrigger value="combat_equip">Combate & Equip.</TabsTrigger>
                <TabsTrigger value="abilities_traits">Habilidades & Traços</TabsTrigger>
                <TabsTrigger value="backpack">Mochila</TabsTrigger>
                <TabsTrigger value="journal">Diário</TabsTrigger>
              </TabsList>

              <fieldset disabled={isSaving} className="p-4 pt-0 space-y-4">
                <TabsContent value="details"><NpcDetailsTab /></TabsContent>
                <TabsContent value="attributes"><NpcAttributesTab /></TabsContent>
                <TabsContent value="combat_equip"><NpcCombatEquipmentTab /></TabsContent>
                <TabsContent value="abilities_traits"><NpcAbilitiesTraitsTab /></TabsContent>
                <TabsContent value="backpack">
                    <SharedInventoryList control={form.control} name="inventory" isReadOnly={isReadOnly} />
                </TabsContent>
                <TabsContent value="journal"><NpcJournalTab /></TabsContent>
              </fieldset>
            </Tabs>
          </form>
        </Form>
      </div>

      <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem Salvar?</AlertDialogTitle>
            <AlertDialogDescription>Existem alterações não salvas. O que queres fazer?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleCloseWithoutSaving} disabled={isSaving}>Sair Sem Salvar</Button>
            <AlertDialogAction className={cn(buttonVariants({ variant: "default" }))} onClick={handleSaveAndClose} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar e Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const queryClient = useQueryClient();

  const defaults = getDefaultNpcSheetData(initialNpc.name);
  const mergedData = {
    ...defaults,
    ...(initialNpc.data as any),
    attributes: { ...defaults.attributes, ...((initialNpc.data as any)?.attributes || {}) },
    combat: { ...defaults.combat, ...((initialNpc.data as any)?.combat || {}) },
    armors: (initialNpc.data as any)?.armors || defaults.armors,
    inventory: (initialNpc.data as any)?.inventory || defaults.inventory,
  };
  mergedData.name = (initialNpc.data as any)?.name || initialNpc.name || defaults.name;
  mergedData.race = (initialNpc.data as any)?.race || defaults.race;
  mergedData.occupation = (initialNpc.data as any)?.occupation || defaults.occupation;

  const parsedData = npcSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn("Aviso ao parsear dados NPC.", parsedData.error.errors);
  }
  const validatedData = parsedData.success ? parsedData.data : mergedData;
  initialNpc.data = validatedData;
  
  const handleSave = async (data: NpcSheetData) => {
    const { error } = await supabase
      .from("npcs")
      .update({ data: data, name: data.name })
      .eq("id", initialNpc.id);

    if (error) throw new Error(error.message);

    await queryClient.invalidateQueries({ queryKey: ['npcs', initialNpc.table_id] });
    await queryClient.invalidateQueries({ queryKey: ['npc', initialNpc.id] });
  };

  return (
    <NpcSheetProvider npc={initialNpc} onSave={handleSave}>
      <NpcSheetInner onClose={onClose} onSave={handleSave} initialData={validatedData as NpcSheetData} />
    </NpcSheetProvider>
  );
};