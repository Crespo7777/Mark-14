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
import { AttributesTab } from "./tabs/AttributesTab";
import { CombatTab } from "./tabs/CombatTab";
import { Form } from "@/components/ui/form";

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
      {/* CABEÇALHO (sem mudanças) */}
      <div className="p-4 border-b border-border/50 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">{form.watch("name")}</h2>
          <p className="text-sm text-muted-foreground">Ficha de Personagem</p>
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
        {/* A tag <form> agora está aqui */}
        <form
          onSubmit={form.handleSubmit(onSubmit, onInvalid)}
          className="flex-1 overflow-y-auto"
        >
          <Tabs defaultValue="attributes" className="w-full">
            
            {/* --- CORREÇÃO AQUI ---
              Movemos o <TabsList> para fora do <fieldset>
              Isso permite que você clique nas abas mesmo quando
              os campos estão desabilitados (isEditing === false).
            */}
            <TabsList className="m-4 ml-4">
              <TabsTrigger value="attributes">Atributos</TabsTrigger>
              <TabsTrigger value="combat">Combate</TabsTrigger>
              <TabsTrigger value="skills">Habilidades</TabsTrigger>
              <TabsTrigger value="inventory">Inventário</TabsTrigger>
            </TabsList>
            
            {/* O <fieldset> agora envolve apenas o CONTEÚDO das abas,
              que é o comportamento correto.
            */}
            <fieldset
              disabled={!isEditing || form.formState.isSubmitting}
              className="p-4 pt-0 space-y-4"
            >
              <TabsContent value="attributes">
                <AttributesTab />
              </TabsContent>
              <TabsContent value="combat">
                <CombatTab />
              </TabsContent>
              <TabsContent value="skills">
                <h3 className="text-lg font-medium">Habilidades (Em Breve)</h3>
              </TabsContent>
              <TabsContent value="inventory">
                <h3 className="text-lg font-medium">Inventário (Em Breve)</h3>
              </TabsContent>
            </fieldset>

          </Tabs>
        </form>
      </Form>
    </div>
  );
};

// Componente "Pai" (sem mudanças)
export const CharacterSheet = ({
  initialCharacter,
  onClose,
}: CharacterSheetProps) => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  if (!initialCharacter.data || Object.keys(initialCharacter.data).length === 0) {
    initialCharacter.data = getDefaultCharacterSheetData(initialCharacter.name);
  } else {
    initialCharacter.data = characterSheetSchema.parse(initialCharacter.data);
  }

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
    }
  };

  return (
    <CharacterSheetProvider
      character={initialCharacter}
      onSave={handleSave}
      isEditing={isEditing}
      setIsEditing={setIsEditing}
    >
      <CharacterSheetInner onClose={onClose} onSave={handleSave} />
    </CharacterSheetProvider>
  );
};