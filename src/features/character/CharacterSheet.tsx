// src/features/character/CharacterSheet.tsx

import { useState } from "react"; // useState não é mais usado aqui, mas pode ser necessário em breve
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
import { Save, X, RotateCcw } from "lucide-react"; // Trocamos Edit por RotateCcw (Reverter)
import { Form } from "@/components/ui/form";

import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { CombatTab } from "./tabs/CombatTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { TraitsTab } from "./tabs/TraitsTab";
import { BackpackTab } from "./tabs/BackpackTab";
// --- NOVO ---
import { ProjectilesTab } from "./tabs/ProjectilesTab"; // 1. IMPORTAR A NOVA ABA
// --- FIM DO NOVO ---

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
  // ATUALIZADO: isEditing e setIsEditing removidos
  const { form, character } = useCharacterSheet();
  const { toast } = useToast();

  // Observa o estado 'dirty' (se o formulário tem mudanças não salvas)
  const { isDirty, isSubmitting } = form.formState;

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  const onSubmit = async (data: CharacterSheetData) => {
    await onSave(data);
    // Reseta o formulário para o novo estado salvo, marcando como "não sujo"
    form.reset(data);
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
    // Reseta o formulário para os dados originais (como estava quando abriu)
    form.reset(character.data as CharacterSheetData);
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
          {/* Só mostra Salvar e Reverter se houver mudanças */}
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

          {/* Mostra "Salvando..." durante o envio */}
          {isSubmitting && (
            <Button size="sm" disabled>
              Salvando...
            </Button>
          )}

          {/* Botão Fechar sempre visível */}
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
            {/* --- ATUALIZADO --- */}
            <TabsList className="m-4 ml-4">
              <TabsTrigger value="details">Detalhes</TabsTrigger>
              <TabsTrigger value="attributes">Atributos</TabsTrigger>
              <TabsTrigger value="combat">Combate</TabsTrigger>
              <TabsTrigger value="skills">Habilidades</TabsTrigger>
              <TabsTrigger value="traits">Traços</TabsTrigger>
              <TabsTrigger value="equipment">Equipamento</TabsTrigger>
              <TabsTrigger value="backpack">Mochila</TabsTrigger>
              <TabsTrigger value="projectiles">Projéteis</TabsTrigger>{" "}
              {/* 2. ADICIONAR O BOTÃO DA ABA */}
            </TabsList>
            {/* --- FIM DA ATUALIZAÇÃO --- */}

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
              
              {/* --- NOVO --- */}
              {/* 3. ADICIONAR O CONTEÚDO DA ABA */}
              <TabsContent value="projectiles">
                <ProjectilesTab />
              </TabsContent>
              {/* --- FIM DO NOVO --- */}

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
  // ATUALIZADO: Remover estado de 'isEditing'
  // const [isEditing, setIsEditing] = useState(false); // Removido

  // *** CORREÇÃO DA LÓGICA DE PARSE ***
  // (Esta parte permanece a mesma)
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

  const parsedData = characterSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn(
      "Aviso ao parsear dados da Ficha (CharacterSheet).",
      parsedData.error.errors,
    );
  }
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
      // ATUALIZADO: Não precisamos mais de setIsEditing(false)
      initialCharacter.name = data.name;
    }
  };

  return (
    // ATUALIZADO: Remover props 'isEditing' e 'setIsEditing'
    <CharacterSheetProvider character={initialCharacter} onSave={handleSave}>
      <CharacterSheetInner onClose={onClose} onSave={handleSave} />
    </CharacterSheetProvider>
  );
};