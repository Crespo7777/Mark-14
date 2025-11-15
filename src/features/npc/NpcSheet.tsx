// src/features/npc/NpcSheet.tsx

import { useEffect, useRef, useState } from "react";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
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

// Abas do NPC
import { NpcCombatTab } from "./tabs/NpcCombatTab";
import { NpcDetailsTab } from "./tabs/NpcDetailsTab";
import { NpcAttributesTab } from "./tabs/NpcAttributesTab";
import { NpcSkillsTab } from "./tabs/NpcSkillsTab";
import { NpcTraitsTab } from "./tabs/NpcTraitsTab";
import { NpcEquipmentTab } from "./tabs/NpcEquipmentTab";
import { NpcBackpackTab } from "./tabs/NpcBackpackTab";
import { NpcJournalTab } from "./tabs/NpcJournalTab";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetProps {
  initialNpc: Npc;
  onClose: () => void;
}

// Componente "Interno"
const NpcSheetInner = ({
  onClose,
  initialData,
}: {
  onClose: () => void;
  onSave: (data: NpcSheetData) => Promise<void>; // 'onSave' é passado para o Provider
  initialData: NpcSheetData;
}) => {
  // 1. Obter tudo do novo contexto
  const { form, isReadOnly, isDirty, isSaving, saveSheet } = useNpcSheet();
  const { toast } = useToast();

  // 2. Remover todos os states e refs de salvamento
  // const { isDirty, isSubmitting } = form.formState; // REMOVIDO
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  // const debounceTimer = useRef<NodeJS.Timeout | null>(null); // REMOVIDO
  // const watchedValues = form.watch(); // REMOVIDO
  // const [onSaveSuccessCallback, setOnSaveSuccessCallback] = useState... // REMOVIDO
    
  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  // 3. Remover 'onSubmit' e 'onInvalid' locais
  // REMOVIDOS

  // 4. Remover 'useEffect[watchedValues]' (O auto-save)
  // REMOVIDO

  // 5. Manter 'useEffect[isDirty]' (Aviso de fechar a aba)
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; 
      return "";
    };

    // Só avisa se a ficha NÃO for 'somente leitura'
    if (isDirty && !isReadOnly) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, isReadOnly]); 

  // 6. Simplificar lógicas de fechar
  const handleCloseClick = () => {
    if (isDirty && !isReadOnly) { // Só perguntar se for o Mestre
      setIsCloseAlertOpen(true);
    } else {
      onClose();
    }
  };

  const handleSaveAndClose = async () => {
    await saveSheet();
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
            <p className="text-sm text-muted-foreground">
              {race} | {occupation}
            </p>
          </div>

          <div className="flex gap-2 items-center">
            {/* 7. Ligar indicador ao contexto (e esconder se for read-only) */}
            {!isReadOnly && (
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
            )}

            {/* 8. Ligar botões ao contexto (e esconder se for read-only) */}
            {!isReadOnly && (
              <Button
                size="sm"
                variant="default"
                onClick={saveSheet}
                disabled={!isDirty || isSaving}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            )}

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
            onSubmit={(e) => e.preventDefault()}
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
                <TabsTrigger value="journal">Diário</TabsTrigger>
              </TabsList>

              {/* O 'isReadOnly' agora é passado para cada aba individualmente
                  e o 'fieldset' só desabilita durante o 'isSaving'. */}
              <fieldset
                disabled={isSaving}
                className="p-4 pt-0 space-y-4"
              >
                <TabsContent value="details">
                  <NpcDetailsTab />
                </TabsContent>
                <TabsContent value="attributes">
                  <NpcAttributesTab />
                </TabsContent>
                <TabsContent value="combat">
                  <NpcCombatTab />
                </TabsContent>
                <TabsContent value="traits">
                  <NpcTraitsTab />
                </TabsContent>
                <TabsContent value="skills">
                  <NpcSkillsTab />
                </TabsContent>
                <TabsContent value="equipment">
                  <NpcEquipmentTab />
                </TabsContent>
                <TabsContent value="backpack">
                  <NpcBackpackTab />
                </TabsContent>
                <TabsContent value="journal">
                  <NpcJournalTab />
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
              className={cn(buttonVariants({ variant: "default" }))}
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

// Componente "Pai"
export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const { toast } = useToast();

  // (Lógica de merge de dados... permanece idêntica)
  const defaults = getDefaultNpcSheetData(initialNpc.name);
  const mergedData = {
    ...defaults,
    ...(initialNpc.data as any),
    attributes: {
      ...defaults.attributes,
      ...((initialNpc.data as any)?.attributes || {}),
    },
    combat: {
      ...defaults.combat,
      ...((initialNpc.data as any)?.combat || {}),
    },
    armors: (initialNpc.data as any)?.armors || defaults.armors,
    inventory: (initialNpc.data as any)?.inventory || defaults.inventory,
  };
  mergedData.name =
    (initialNpc.data as any)?.name || initialNpc.name || defaults.name;
  mergedData.race = (initialNpc.data as any)?.race || defaults.race;
  mergedData.occupation =
    (initialNpc.data as any)?.occupation || defaults.occupation;
  mergedData.shadow = (initialNpc.data as any)?.shadow || defaults.shadow;
  mergedData.personalGoal =
    (initialNpc.data as any)?.personalGoal || defaults.personalGoal;
  mergedData.importantAllies =
    (initialNpc.data as any)?.importantAllies || defaults.importantAllies;
  mergedData.notes = (initialNpc.data as any)?.notes || defaults.notes;

  const parsedData = npcSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn(
      "Aviso ao parsear dados da Ficha (NpcSheet). Aplicando dados mesclados/padrão:",
      parsedData.error.errors,
    );
  }
  const validatedData = parsedData.success ? parsedData.data : mergedData;
  initialNpc.data = validatedData;
  
  // 10. A função que o Contexto usará para salvar
  const handleSave = async (data: NpcSheetData) => {
    const { error } = await supabase
      .from("npcs")
      .update({ data: data, name: data.name })
      .eq("id", initialNpc.id);

    if (error) {
      throw new Error(error.message);
    }
  };

  return (
    <NpcSheetProvider npc={initialNpc} onSave={handleSave}>
      <NpcSheetInner
        onClose={onClose}
        onSave={handleSave}
        initialData={validatedData as NpcSheetData}
      />
    </NpcSheetProvider>
  );
};