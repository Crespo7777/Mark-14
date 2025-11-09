// src/features/npc/NpcSheet.tsx

import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, X, RotateCcw } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

// --- NOVOS IMPORTS (FOCO NO NPC) ---
import {
  NpcSheetData,
  npcSheetSchema,
  getDefaultNpcSheetData,
} from "./npc.schema";
import { NpcSheetProvider, useNpcSheet } from "./NpcSheetContext";
// --- FIM DOS NOVOS IMPORTS ---

// --- TODAS AS ABAS DO NPC ---
import { NpcCombatTab } from "./tabs/NpcCombatTab";
import { NpcDetailsTab } from "./tabs/NpcDetailsTab";
import { NpcAttributesTab } from "./tabs/NpcAttributesTab";
import { NpcSkillsTab } from "./tabs/NpcSkillsTab";
import { NpcTraitsTab } from "./tabs/NpcTraitsTab";
import { NpcEquipmentTab } from "./tabs/NpcEquipmentTab";
import { NpcBackpackTab } from "./tabs/NpcBackpackTab"; // <-- ADICIONADO
// --- FIM DAS ABAS ---

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetProps {
  initialNpc: Npc;
  onClose: () => void;
}

// Componente "Interno"
const NpcSheetInner = ({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: NpcSheetData) => Promise<void>;
}) => {
  const { form, npc } = useNpcSheet();
  const { toast } = useToast();
  const { isDirty, isSubmitting } = form.formState;
  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  const onSubmit = async (data: NpcSheetData) => {
    await onSave(data);
    form.reset(data); 
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação do NPC:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
  };

  const onRevert = () => {
    form.reset(npc.data as NpcSheetData);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {race} | {occupation}
          </p>
        </div>
        
        <div className="flex gap-2">
          {isDirty && !isSubmitting && (
            <>
              <Button size="sm" variant="outline" onClick={onRevert}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reverter
              </Button>
              <Button
                size="sm"
                onClick={form.handleSubmit(onSubmit, onInvalid)}
              >
                <Save className="w-4 h-4 mr-2" />
                Salvar
              </Button>
            </>
          )}

          {isSubmitting && (
            <Button size="sm" disabled>
              Salvando...
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={onClose}>
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
              <TabsTrigger value="skills">Habilidades</TabsTrigger>
              <TabsTrigger value="traits">Traços</TabsTrigger>
              <TabsTrigger value="equipment">Equipamento</TabsTrigger>
              <TabsTrigger value="backpack">Mochila</TabsTrigger> {/* <-- ADICIONADO */}
            </TabsList>
            
            <fieldset
              disabled={form.formState.isSubmitting}
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
              <TabsContent value="skills">
                 <NpcSkillsTab />
              </TabsContent>
              <TabsContent value="traits">
                 <NpcTraitsTab />
              </TabsContent>
              <TabsContent value="equipment">
                 <NpcEquipmentTab />
              </TabsContent>
              <TabsContent value="backpack">
                 <NpcBackpackTab /> {/* <-- ADICIONADO */}
              </TabsContent>
            </fieldset>
          </Tabs>
        </form>
      </Form>
    </div>
  );
};

// Componente "Pai"
export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const { toast } = useToast();

  // *** ATUALIZADO: Lógica de Parse para o NOVO Schema de NPC ***
  const defaults = getDefaultNpcSheetData(initialNpc.name);
  
  const mergedData = {
    ...defaults,
    ...(initialNpc.data as any),
    // Garante que os schemas aninhados existam
    attributes: {
      ...defaults.attributes,
      ...((initialNpc.data as any)?.attributes || {}),
    },
    combat: {
      ...defaults.combat,
      ...((initialNpc.data as any)?.combat || {}),
    },
    armors: (initialNpc.data as any)?.armors || defaults.armors, 
    inventory: (initialNpc.data as any)?.inventory || defaults.inventory, // <-- ADICIONADO
  };

  mergedData.name = (initialNpc.data as any)?.name || initialNpc.name || defaults.name;
  mergedData.race = (initialNpc.data as any)?.race || defaults.race;
  mergedData.occupation = (initialNpc.data as any)?.occupation || defaults.occupation;
  
  const parsedData = npcSheetSchema.safeParse(mergedData);
  
  if (!parsedData.success) {
    console.warn("Aviso ao parsear dados da Ficha (NpcSheet). Aplicando dados mesclados/padrão:", parsedData.error.errors);
  }
  
  initialNpc.data = parsedData.success ? parsedData.data : mergedData;
  // *** FIM DA LÓGICA DE PARSE ***


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
    } else {
      toast({
        title: "NPC Salvo!",
        description: `${data.name} foi atualizado.`,
      });
      initialNpc.name = data.name;
    }
  };

  return (
    <NpcSheetProvider npc={initialNpc}>
      <NpcSheetInner onClose={onClose} onSave={handleSave} />
    </NpcSheetProvider>
  );
};