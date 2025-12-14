import { useState, useEffect, useRef, useCallback } from "react";
import { CharacterSheetContext } from "@/features/character/CharacterSheetContext";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCharacterStore } from "@/stores/character-store";

// Imports do Sistema Pathfinder (Schema, Contexto e Cálculos)
import { pathfinderSchema, defaultPathfinderData, PathfinderSheetData } from "./pathfinder.schema";
import { usePathfinderCalculations } from "./usePathfinderCalculations";
import { PathfinderProvider } from "./PathfinderContext";

// Componentes da Ficha (Certifique-se que todos estes arquivos existem em ./components/)
import { PathfinderHeader } from "./components/PathfinderHeader";
import { AbilitiesSection } from "./components/AbilitiesSection"; // Visual Moderno
import { GeneralStatsSection } from "./components/GeneralStatsSection";
import { SkillsSection } from "./components/SkillsSection"; // Visual Moderno
import { CombatTab } from "./components/CombatTab";
import { InventorySection } from "./components/InventorySection"; // Com Moedas e Volume
import { SpellcastingSection } from "./components/SpellcastingSection"; // Completo e sem bugs
import { BiographySection } from "./components/BiographySection"; // Detalhada
import { FeatsSection } from "./components/FeatsSection"; // Categorizada
import { ActionsTab } from "./components/ActionsTab"; // Nova aba de Ações

interface Props {
  characterId: string;
  isReadOnly?: boolean;
  onBack?: () => void;
  isNpc?: boolean;
}

export const PathfinderCharacterSheet = ({ characterId, isReadOnly = false, onBack, isNpc = false }: Props) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [characterData, setCharacterData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [activeTab, setActiveTab] = useState("main");

  // Integração com Store Global (opcional, mas mantido para compatibilidade)
  const initializeStore = useCharacterStore((s) => s.initialize);
  const updateStore = useCharacterStore((s) => s.updateData);

  // 1. Configuração do Formulário
  const form = useForm<PathfinderSheetData>({
    resolver: zodResolver(pathfinderSchema),
    defaultValues: defaultPathfinderData,
    mode: "onChange"
  });

  // 2. Cálculos Centralizados (Hooks)
  // Observa o formulário para recalcular stats em tempo real (passado via Contexto)
  const currentValues = form.watch();
  const calculations = usePathfinderCalculations(currentValues as PathfinderSheetData);

  // 3. Carregamento de Dados (Supabase)
  useEffect(() => {
    const loadChar = async () => {
      if (!characterId) return;
      setLoading(true);

      const table = isNpc ? "npcs" : "characters";
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("id", characterId)
        .single();

      if (error) {
        console.error("Erro ao carregar:", error);
        toast({ title: "Erro", description: "Ficha não encontrada.", variant: "destructive" });
      } else if (data) {
        // Merge cuidadoso: garante que campos novos do schema (ex: magias) recebem valores padrão
        // se não existirem no banco de dados antigo.
        const mergedData = { 
            ...defaultPathfinderData, 
            ...(data.data as any),
            // Força compatibilidade de campos críticos se necessário
            spellcasting: {
                ...defaultPathfinderData.spellcasting,
                ...(data.data?.spellcasting || {})
            }
        };
        
        mergedData.name = data.name; // Nome vem da coluna raiz, não do JSON 'data'
        
        setCharacterData(data);
        initializeStore(characterId, mergedData);
        form.reset(mergedData);
      }
      setLoading(false);
    };
    loadChar();
  }, [characterId, form, initializeStore, toast, isNpc]);

  // 4. Salvamento (Manual e Auto-Save)
  const saveSheet = useCallback(async (options = { silent: false }) => {
      if (isReadOnly) return;
      setIsSaving(true);
      
      const currentData = form.getValues();
      const table = isNpc ? "npcs" : "characters";

      const updatePayload: any = { 
        data: currentData as any,
        name: currentData.name, // Atualiza nome na coluna principal também
      };

      if (!isNpc) updatePayload.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from(table)
        .update(updatePayload)
        .eq("id", characterId);

      setIsSaving(false);
      
      if (error) {
        console.error("Erro ao salvar:", error);
        if (!options.silent) toast({ title: "Erro ao salvar", variant: "destructive" });
      } else if (!options.silent) {
        toast({ title: "Salvo", description: "Ficha atualizada com sucesso." });
      }
  }, [characterId, isReadOnly, isNpc, form, toast]);

  // Efeito de Auto-Save (Debounce de 2s)
  useEffect(() => {
      const subscription = form.watch((value, { type }) => {
          // Atualiza store local para UI reativa fora do form
          if (value) updateStore((draft) => { Object.assign(draft, value); });
          
          // Auto-save apenas se não for readonly e não for blur event (opcional)
          if (!isReadOnly) {
              if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = setTimeout(() => {
                  if (form.formState.isDirty) saveSheet({ silent: true });
              }, 2000);
          }
      });
      return () => { 
        subscription.unsubscribe(); 
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); 
      };
  }, [form, saveSheet, isReadOnly, updateStore]);

  if (loading) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground animate-pulse font-medium">Abrindo Grimório...</p>
        </div>
    );
  }

  return (
    // Contexto Geral da Ficha (Dados Meta)
    <CharacterSheetContext.Provider value={{ form, characterId, isReadOnly, activeTab, character: characterData, isSaving, saveSheet }}>
      
      {/* Contexto Específico do Pathfinder (Cálculos e Mods) */}
      <PathfinderProvider calculations={calculations}>
        
        <Form {...form}>
            <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col bg-background">
                
                {/* Header Fixo (Nome, Nível, Botões Voltar/Salvar) */}
                <PathfinderHeader 
                    onBack={onBack} 
                    onSave={() => saveSheet({ silent: false })} 
                    isDirty={form.formState.isDirty} 
                    characterName={characterData?.name}
                    isReadOnly={isReadOnly}
                    sharedWith={characterData?.shared_with_players}
                    isNpc={isNpc} 
                />

                {/* Navegação Principal (Abas) */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-4 border-b bg-muted/20 shadow-sm z-10">
                        <TabsList className="h-12 bg-transparent p-0 w-full justify-start gap-6 overflow-x-auto scrollbar-none">
                            <TabsTrigger value="main" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Principal</TabsTrigger>
                            <TabsTrigger value="combat" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Combate</TabsTrigger>
                            <TabsTrigger value="actions" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Ações</TabsTrigger>
                            <TabsTrigger value="skills" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Perícias</TabsTrigger>
                            <TabsTrigger value="feats" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Talentos</TabsTrigger>
                            <TabsTrigger value="spells" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Magias</TabsTrigger>
                            <TabsTrigger value="inventory" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Inventário</TabsTrigger>
                            <TabsTrigger value="bio" className="px-1 py-3 font-bold data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary rounded-none transition-all">Biografia</TabsTrigger>
                        </TabsList>
                    </div>

                    {/* Conteúdo das Abas (Scrollável) */}
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background scrollbar-thin">
                        
                        <TabsContent value="main" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <AbilitiesSection isReadOnly={isReadOnly} />
                            <GeneralStatsSection isReadOnly={isReadOnly} />
                        </TabsContent>
                        
                        <TabsContent value="combat" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <CombatTab isReadOnly={isReadOnly} />
                        </TabsContent>

                        <TabsContent value="actions" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ActionsTab isReadOnly={isReadOnly} />
                        </TabsContent>

                        <TabsContent value="skills" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SkillsSection isReadOnly={isReadOnly} />
                        </TabsContent>

                        <TabsContent value="feats" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <FeatsSection isReadOnly={isReadOnly} />
                        </TabsContent>

                        <TabsContent value="spells" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <SpellcastingSection isReadOnly={isReadOnly} />
                        </TabsContent>

                        <TabsContent value="inventory" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <InventorySection isReadOnly={isReadOnly} />
                        </TabsContent>

                        <TabsContent value="bio" className="mt-0 h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <BiographySection isReadOnly={isReadOnly} />
                        </TabsContent>
                        
                    </div>
                </Tabs>
            </form>
        </Form>
      </PathfinderProvider>
    </CharacterSheetContext.Provider>
  );
};