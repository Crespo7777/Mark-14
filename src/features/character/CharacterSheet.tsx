// src/features/character/CharacterSheet.tsx

import { useEffect, useRef } from "react"; // 1. IMPORTAR useEffect e useRef
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
import { Save, X, RotateCcw } from "lucide-react"; // Os ícones antigos ainda são usados (ou podemos removê-los)
import { Form } from "@/components/ui/form";

import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { CombatTab } from "./tabs/CombatTab";
import { SkillsTab } from "./tabs/SkillsTab";
import { EquipmentTab } from "./tabs/EquipmentTab";
import { TraitsTab } from "./tabs/TraitsTab";
import { BackpackTab } from "./tabs/BackpackTab";
import { ProjectilesTab } from "./tabs/ProjectilesTab"; 
import { CharacterJournalTab } from "./tabs/CharacterJournalTab"; 

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
  const { form, character } = useCharacterSheet();
  const { toast } = useToast();

  // 2. OBSERVAR O ESTADO DO FORMULÁRIO
  const { isDirty, isSubmitting } = form.formState;

  const [name, race, occupation] = form.watch([
    "name",
    "race",
    "occupation",
  ]);

  // 3. FUNÇÃO DE SUBMISSÃO (AGORA USADA PELO AUTO-SAVE)
  const onSubmit = async (data: CharacterSheetData) => {
    await onSave(data); // Salva no Supabase (vem do PAI)
    form.reset(data); // Reseta o form para limpar o 'isDirty'
  };

  const onInvalid = (errors: any) => {
    console.error("Erros de validação:", errors);
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
    // Se o formulário tiver mudanças (isDirty)
    if (isDirty) {
      // Limpa qualquer timer anterior
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      // Inicia um novo timer
      debounceTimer.current = setTimeout(() => {
        // Aciona o submit do react-hook-form, que chama 'onSubmit' ou 'onInvalid'
        form.handleSubmit(onSubmit, onInvalid)();
      }, 1500); // Salva 1.5 segundos após a última alteração
    }

    // Limpa o timer se o componente for desmontado
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [watchedData, isDirty, form, onSubmit, onInvalid]); // Dependências do useEffect


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
          
          {/* Indicador de Salvamento */}
          <div className="text-sm text-muted-foreground transition-opacity duration-300">
            {isSubmitting ? (
              <span>Salvando...</span>
            ) : !isDirty ? (
              <span className="opacity-70">Salvo</span>
            ) : (
              <span className="opacity-50 italic">...</span> 
            )}
          </div>
          
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
              <TabsTrigger value="projectiles">Projéteis</TabsTrigger>
              <TabsTrigger value="journal">Diário</TabsTrigger> 
            </TabsList>
            {/* --- FIM DA ATUALIZAÇÃO --- */}

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

              {/* --- 7. ORDEM DO CONTEÚDO ATUALIZADA --- */}
              <TabsContent value="traits">
                <TraitsTab />
              </TabsContent>
              <TabsContent value="skills">
                <SkillsTab />
              </TabsContent>
              {/* --- FIM DA ATUALIZAÇÃO --- */}

              <TabsContent value="equipment">
                <EquipmentTab />
              </TabsContent>
              <TabsContent value="backpack">
                <BackpackTab />
              </TabsContent>
              <TabsContent value="projectiles">
                <ProjectilesTab />
              </TabsContent>
              <TabsContent value="journal">
                <CharacterJournalTab />
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
  
  mergedData.shadow = (initialCharacter.data as any)?.shadow || defaults.shadow;
  mergedData.personalGoal = (initialCharacter.data as any)?.personalGoal || defaults.personalGoal;
  mergedData.importantAllies = (initialCharacter.data as any)?.importantAllies || defaults.importantAllies;
  mergedData.notes = (initialCharacter.data as any)?.notes || defaults.notes; 

  const parsedData = characterSheetSchema.safeParse(mergedData);
  if (!parsedData.success) {
    console.warn(
      "Aviso ao parsear dados da Ficha (CharacterSheet).",
      parsedData.error.errors,
    );
  }
  initialCharacter.data = parsedData.success ? parsedData.data : mergedData;

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
      // Já não mostramos o toast "Salvo!", o indicador de UI é suficiente
      // toast({
      //   title: "Ficha Salva!",
      //   description: `${data.name} foi atualizado.`,
      // });
      initialCharacter.name = data.name;
    }
  };

  return (
    <CharacterSheetProvider character={initialCharacter} onSave={handleSave}>
      <CharacterSheetInner onClose={onClose} onSave={handleSave} />
    </CharacterSheetProvider>
  );
};