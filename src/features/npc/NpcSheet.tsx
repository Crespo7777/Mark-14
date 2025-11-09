// src/features/npc/NpcSheet.tsx

import { useState } from "react"; // Removido
import { Database } from "@/integrations/supabase/types";
import { NpcSheetProvider, useNpcSheet } from "./NpcSheetContext";
import {
  CharacterSheetData,
  characterSheetSchema,
  getDefaultCharacterSheetData,
} from "@/features/character/character.schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Save, X, RotateCcw } from "lucide-react"; // Trocamos Edit por RotateCcw
import { Form } from "@/components/ui/form";

// REUTILIZAMOS AS ABAS DA FICHA DE PERSONAGEM
import { DetailsTab } from "@/features/character/tabs/DetailsTab";
import { AttributesTab } from "@/features/character/tabs/AttributesTab";
import { CombatTab } from "@/features/character/tabs/CombatTab";
import { SkillsTab } from "@/features/character/tabs/SkillsTab";
import { EquipmentTab } from "@/features/character/tabs/EquipmentTab";
import { TraitsTab } from "@/features/character/tabs/TraitsTab";
import { BackpackTab } from "@/features/character/tabs/BackpackTab";

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
  onSave: (data: CharacterSheetData) => Promise<void>;
}) => {
  // ATUALIZADO: isEditing e setIsEditing removidos
  const { form, npc } = useNpcSheet();
  const { toast } = useToast();

  const { isDirty, isSubmitting } = form.formState;

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  const onSubmit = async (data: CharacterSheetData) => {
    await onSave(data);
    form.reset(data); // Marca o formulário como "não sujo"
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
  };

  // ATUALIZADO: onCancel agora é onRevert
  const onRevert = () => {
    form.reset(npc.data as CharacterSheetData);
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
        
        {/* --- LÓGICA DE BOTÕES ATUALIZADA --- */}
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
        {/* --- FIM DA LÓGICA DE BOTÕES --- */}
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
              <TabsTrigger value="backpack">Mochila</TabsTrigger>
            </TabsList>
            {/* ATUALIZADO: fieldset só desabilitado durante o envio */}
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
              <TabsContent value="skills">
                <SkillsTab />
              </TabsContent>
              <TabsContent value="traits">
                <TraitsTab />
              </TabsContent>
              <TabsContent value="equipment">
                <EquipmentTab />
              </TabsContent>
              <TabsContent value="backpack">
                <BackpackTab />
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
  // ATUALIZADO: Remover estado de 'isEditing'
  // const [isEditing, setIsEditing] = useState(false); // Removido

  // *** LÓGICA DE PARSE (Permanece a mesma) ***
  const defaults = getDefaultCharacterSheetData(initialNpc.name);
  const mergedData = {
    ...defaults,
    ...(initialNpc.data as any),
  };
  mergedData.name = (initialNpc.data as any)?.name || initialNpc.name || defaults.name;
  mergedData.race = (initialNpc.data as any)?.race || defaults.race;
  mergedData.occupation = (initialNpc.data as any)?.occupation || defaults.occupation;
  
  const parsedData = characterSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn("Aviso ao parsear dados da Ficha (NpcSheet):", parsedData.error.errors);
  }
  initialNpc.data = parsedData.success ? parsedData.data : mergedData;
  // *** FIM DA LÓGICA DE PARSE ***

  const handleSave = async (data: CharacterSheetData) => {
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
      // ATUALIZADO: Não precisamos mais de setIsEditing(false)
      initialNpc.name = data.name;
    }
  };

  return (
    // ATUALIZADO: Remover props 'isEditing' e 'setIsEditing'
    <NpcSheetProvider
      npc={initialNpc}
    >
      <NpcSheetInner onClose={onClose} onSave={handleSave} />
    </NpcSheetProvider>
  );
};