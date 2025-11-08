// src/features/character/CharacterSheet.tsx

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Edit, Save, X } from "lucide-react";
import { Form } from "@/components/ui/form";

import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { CombatTab } from "./tabs/CombatTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { TraitsTab } from "./tabs/TraitsTab";
import { BackpackTab } from "./tabs/BackpackTab";

type Character = Database["public"]["Tables"]["characters"]["Row"];

interface CharacterSheetProps {
  initialCharacter: Character;
  onClose: () => void;
}

// Componente "Interno"
const CharacterSheetInner = ({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: CharacterSheetData) => Promise<void>;
}) => {
  const { form, isEditing, setIsEditing, character } = useCharacterSheet();
  const { toast } = useToast();

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  const onSubmit = async (data: CharacterSheetData) => {
    await onSave(data);
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
    toast({
      title: "Erro de Validação",
      description: "Verifique os campos em vermelho.",
      variant: "destructive",
    });
  };

  const onCancel = () => {
    form.reset(character.data as CharacterSheetData);
    setIsEditing(false);
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
          {isEditing ? (
            <>
              <Button size="sm" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={form.handleSubmit(onSubmit, onInvalid)}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  "Salvando..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Salvar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button size="sm" variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </>
          )}
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
              <TabsTrigger value="backpack">Mochila</TabsTrigger>
            </TabsList>

            <fieldset
              disabled={!isEditing || form.formState.isSubmitting}
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
export const CharacterSheet = ({
  initialCharacter,
  onClose,
}: CharacterSheetProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  // *** CORREÇÃO DA LÓGICA DE PARSE ***
  // 1. Obter os valores padrão
  const defaults = getDefaultCharacterSheetData(initialCharacter.name);
  
  // 2. Mesclar os padrões com os dados do DB (dados do DB têm prioridade)
  // Usamos 'initialCharacter.data' que é o JSONB
  const mergedData = {
    ...defaults,
    ...(initialCharacter.data as any),
  };

  // 3. Garantir que os campos de Nível 1 (name, race, occupation)
  // usem os dados do JSONB se existirem, ou o nome da coluna principal.
  mergedData.name = (initialCharacter.data as any)?.name || initialCharacter.name || defaults.name;
  mergedData.race = (initialCharacter.data as any)?.race || defaults.race;
  mergedData.occupation = (initialCharacter.data as any)?.occupation || defaults.occupation;

  // 4. Validar os dados mesclados.
  const parsedData = characterSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    // Este log agora é esperado se o DB tiver dados antigos, mas não deve quebrar a UI
    console.warn("Aviso ao parsear dados da Ficha (CharacterSheet).", parsedData.error.errors);
  }

  // 5. Usar os dados mesclados (se a validação falhar) ou os dados validados (se for sucesso)
  // E o mais importante: COLOCAR NO 'initialCharacter.data' ANTES DE PASSAR PARA O PROVIDER
  initialCharacter.data = parsedData.success ? parsedData.data : mergedData;
  // *** FIM DA CORREÇÃO ***

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
    } else {
      toast({
        title: "Ficha Salva!",
        description: `${data.name} foi atualizado.`,
      });
      setIsEditing(false);
      initialCharacter.name = data.name;
    }
  };

  return (
    <CharacterSheetProvider
      character={initialCharacter} // Agora 'initialCharacter.data' está pré-processado
      onSave={handleSave}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    >
      <CharacterSheetInner onClose={onClose} onSave={handleSave} />
    </CharacterSheetProvider>
  );
};