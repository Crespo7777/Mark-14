// src/features/npc/NpcSheet.tsx

import { useEffect, useRef } from "react"; // 1. IMPORTAR useEffect e useRef
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, X, RotateCcw } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

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
}: {
  onClose: () => void;
  onSave: (data: NpcSheetData) => Promise<void>;
}) => {
  const { form, npc } = useNpcSheet();
  const { toast } = useToast();
  
  // 2. OBSERVAR O ESTADO DO FORMULÁRIO
  const { isDirty, isSubmitting } = form.formState;

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  const { isMaster } = useTableContext();

  // 3. FUNÇÃO DE SUBMISSÃO (AGORA USADA PELO AUTO-SAVE)
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

  // 4. LÓGICA DE AUTO-SAVE (DEBOUNCING)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const watchedData = form.watch(); // Observa TODAS as mudanças

  useEffect(() => {
    // Apenas o mestre pode salvar
    if (isDirty && isMaster) {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(() => {
        form.handleSubmit(onSubmit, onInvalid)();
      }, 1500); // Salva 1.5 segundos após a última alteração
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [watchedData, isDirty, isMaster, form, onSubmit, onInvalid]); // Dependências do useEffect


  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{name}</h2>
          <p className="text-sm text-muted-foreground">
            {race} | {occupation}
          </p>
        </div>
        
        {/* --- 5. LÓGICA DE BOTÕES ATUALIZADA --- */}
        <div className="flex gap-2 items-center">
          
          {/* Mostra indicador de salvamento APENAS para o Mestre */}
          {isMaster && (
            <div className="text-sm text-muted-foreground transition-opacity duration-300">
              {isSubmitting ? (
                <span>Salvando...</span>
              ) : !isDirty ? (
                <span className="opacity-70">Salvo</span>
              ) : (
                <span className="opacity-50 italic">...</span> 
              )}
            </div>
          )}
          
          {/* Botões "Salvar" e "Reverter" REMOVIDOS */}
          
          {/* Botão Fechar (desabilitado enquanto salva) */}
          <Button size="sm" variant="outline" onClick={onClose} disabled={isSubmitting}>
            <X className="w-4 h-4 mr-2" />
            Fechar
          </Button>
        </div>
        {/* --- FIM DA LÓGICA DE BOTÕES --- */}
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="flex-1 overflow-y-auto"
        >
          <Tabs defaultValue="details" className="w-full"> 
            
            {/* --- 6. ORDEM DAS ABAS ATUALIZADA --- */}
            <TabsList className="m-4 ml-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="attributes">Atributos</TabsTrigger>
              <TabsTrigger value="combat">Combate</TabsTrigger>
              <TabsTrigger value="traits">Traços</TabsTrigger> {/* VEIO PRIMEIRO */}
              <TabsTrigger value="skills">Habilidades</TabsTrigger> {/* VEIO DEPOIS */}
              <TabsTrigger value="equipment">Equipamento</TabsTrigger>
              <TabsTrigger value="backpack">Mochila</TabsTrigger>
              <TabsTrigger value="journal">Diário</TabsTrigger>
            </TabsList>
            {/* --- FIM DA ATUALIZAÇÃO --- */}
            
            <fieldset
              // Desabilita TUDO se for Jogador, ou se o Mestre estiver salvando
              disabled={isSubmitting || !isMaster}
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

              {/* --- 7. ORDEM DO CONTEÚDO ATUALIZADA --- */}
              <TabsContent value="traits">
                 <NpcTraitsTab />
              </TabsContent>
              <TabsContent value="skills">
                 <NpcSkillsTab />
              </TabsContent>
              {/* --- FIM DA ATUALIZAÇÃO --- */}

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
  );
};

// Componente "Pai"
export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const { toast } = useToast();

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

  mergedData.name = (initialNpc.data as any)?.name || initialNpc.name || defaults.name;
  mergedData.race = (initialNpc.data as any)?.race || defaults.race;
  mergedData.occupation = (initialNpc.data as any)?.occupation || defaults.occupation;
  
  mergedData.shadow = (initialNpc.data as any)?.shadow || defaults.shadow;
  mergedData.personalGoal = (initialNpc.data as any)?.personalGoal || defaults.personalGoal;
  mergedData.importantAllies = (initialNpc.data as any)?.importantAllies || defaults.importantAllies;
  mergedData.notes = (initialNpc.data as any)?.notes || defaults.notes;
  
  const parsedData = npcSheetSchema.safeParse(mergedData);
  
  if (!parsedData.success) {
    console.warn("Aviso ao parsear dados da Ficha (NpcSheet). Aplicando dados mesclados/padrão:", parsedData.error.errors);
  }
  
  initialNpc.data = parsedData.success ? parsedData.data : mergedData;

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
      // O indicador de UI é suficiente, não precisamos de toast.
      // toast({
      //   title: "NPC Salvo!",
      //   description: `${data.name} foi atualizado.`,
      // });
      initialNpc.name = data.name;
    }
  };

  return (
    <NpcSheetProvider npc={initialNpc}>
      <NpcSheetInner onClose={onClose} onSave={handleSave} />
    </NpcSheetProvider>
  );
};