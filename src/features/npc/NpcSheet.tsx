// src/features/npc/NpcSheet.tsx

// --- MUDANÇA: Importar useEffect e useRef ---
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

import { useTableContext } from "@/features/table/TableContext";

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
  onSave,
  initialData,
}: {
  onClose: () => void;
  onSave: (data: NpcSheetData) => Promise<void>;
  initialData: NpcSheetData;
}) => {
  const { form } = useNpcSheet();
  const { toast } = useToast();

  const { isDirty, isSubmitting } = form.formState;
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);

  // --- INÍCIO DA CORREÇÃO (LÓGICA IDÊNTICA À DO CHARACTER) ---
  
  // Ref para o timer do auto-save
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  
  // Observa todos os valores do formulário
  const watchedValues = form.watch(); 
  
  // Estado para o callback de "Salvar e Sair"
  const [onSaveSuccessCallback, setOnSaveSuccessCallback] =
    useState<(() => void) | null>(null);
    
  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  const { isMaster } = useTableContext();

  // Esta é a ÚNICA função que salva
  const onSubmit = async (data: NpcSheetData) => {
    try {
      await onSave(data);
      form.reset(data); // "Limpa" o formulário (isDirty = false)
      toast({ title: "Ficha de NPC Salva!" });

      if (onSaveSuccessCallback) {
        onSaveSuccessCallback();
        setOnSaveSuccessCallback(null); // Limpa a ação
      }
    } catch (error) {
      console.error("Falha no submit do NPC:", error);
      if (onSaveSuccessCallback) {
        setOnSaveSuccessCallback(null);
      }
    }
  };

  // Função chamada em caso de erro de validação (Zod)
  const onInvalid = (errors: any) => {
    console.error("Erros de validação do NPC:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
    if (onSaveSuccessCallback) {
      setOnSaveSuccessCallback(null);
    }
  };


  // --- CAMADA 1: AUTO-SAVE (O "Cinto de Segurança") ---
  useEffect(() => {
    // O Mestre é o único que pode salvar
    if (isDirty && !isSubmitting && isMaster) {
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        console.log("Auto-save (NPC): Disparando o salvamento...");
        form.handleSubmit(onSubmit, onInvalid)();
      }, 2500); // 2.5 segundos de espera
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  
  }, [watchedValues, isDirty, isSubmitting, isMaster, form.handleSubmit, onSubmit, onInvalid]);


  // --- CAMADA 2: AVISO DE FECHO DE ABA (O "Airbag") ---
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; 
      return "";
    };

    // Só ativa o aviso se for o Mestre E a ficha tiver alterações
    if (isDirty && isMaster) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    } else {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    }

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty, isMaster]); // Depende se a ficha tem alterações E se é o Mestre

  // --- FIM DA CORREÇÃO ---


  // --- Lógica para o botão "Fechar" (Popup) ---
  const handleCloseClick = () => {
    if (isDirty && isMaster) { // Só o Mestre vê o popup
      setIsCloseAlertOpen(true);
    } else {
      onClose();
    }
  };

  // Lógica para "Salvar e Sair" (agora funciona com o onSubmit)
  const handleSaveAndClose = () => {
    // 1. Define a ação de fecho
    setOnSaveSuccessCallback(() => {
      return () => {
        setIsCloseAlertOpen(false);
        onClose();
      };
    });
    // 2. Dispara o submit
    form.handleSubmit(onSubmit, onInvalid)();
  };

  // Lógica para "Sair Sem Salvar"
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

          <div className="flex gap-2 items-center">
            {isMaster && ( // Só mostra o indicador para o Mestre
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
            )}

            {isMaster && ( // Só mostra o botão "Salvar" para o Mestre
              <Button
                size="sm"
                variant="default"
                onClick={form.handleSubmit(onSubmit, onInvalid)}
                disabled={!isDirty || isSubmitting}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            )}

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
                <TabsTrigger value="journal">Diário</TabsTrigger>
              </TabsList>

              <fieldset
                disabled={isSubmitting || !isMaster} // Desativa se estiver salvando OU se não for o Mestre
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
            <AlertDialogCancel disabled={isSubmitting}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleCloseWithoutSaving}
              disabled={isSubmitting}
            >
              Sair Sem Salvar
            </Button>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "default" }))}
              onClick={handleSaveAndClose}
              disabled={isSubmitting} // Usa o estado de loading nativo
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
export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const { toast } = useToast();

  const defaults = getDefaultNpcSheetData(initialNpc.name);

  // ... (toda a lógica de merge de dados permanece igual) ...
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
  
  // Função de salvar principal
  const handleSave = async (data: NpcSheetData) => {
    const { error } = await supabase
      .from("npcs")
      .update({ data: data, name: data.name })
      .eq("id", initialNpc.id);

    if (error) {
      toast({
        title: "Erro ao salvar NPC",
        description: error.message,
        variant: "destructive",
      });
      // Lança o erro para o 'onSubmit' saber que falhou
      throw new Error(error.message);
    }
  };

  return (
    <NpcSheetProvider npc={initialNpc}>
      <NpcSheetInner
        onClose={onClose}
        onSave={handleSave}
        initialData={validatedData as NpcSheetData}
      />
    </NpcSheetProvider>
  );
};