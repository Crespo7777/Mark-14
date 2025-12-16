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

// Imports do Sistema Pathfinder
import { pathfinderSchema, defaultPathfinderData, PathfinderSheetData } from "./pathfinder.schema";
import { usePathfinderCalculations } from "./usePathfinderCalculations";
import { PathfinderProvider } from "./PathfinderContext";

// --- NOVOS IMPORTS DE AUTOMAÇÃO ---
import { RollProvider } from "./context/RollContext";
import { RollLog } from "./components/RollLog";

// Componentes da Ficha
import { PathfinderHeader } from "./components/PathfinderHeader";
import { AbilitiesSection } from "./components/AbilitiesSection";
import { GeneralStatsSection } from "./components/GeneralStatsSection";
import { SkillsSection } from "./components/SkillsSection";
import { CombatTab } from "./components/CombatTab";
import { InventorySection } from "./components/InventorySection";
import { SpellcastingSection } from "./components/SpellcastingSection";
import { BiographySection } from "./components/BiographySection";
import { FeatsSection } from "./components/FeatsSection";
import { ActionsTab } from "./components/ActionsTab";

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

  const initializeStore = useCharacterStore((s) => s.initialize);
  const updateStore = useCharacterStore((s) => s.updateData);

  const form = useForm<PathfinderSheetData>({
    resolver: zodResolver(pathfinderSchema),
    defaultValues: defaultPathfinderData,
    mode: "onChange"
  });

  // Cálculos em tempo real
  const currentValues = form.watch();
  const calculations = usePathfinderCalculations(currentValues as PathfinderSheetData);

  // Carregamento de Dados
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
        const mergedData = { 
            ...defaultPathfinderData, 
            ...(data.data as any),
            spellcasting: {
                ...defaultPathfinderData.spellcasting,
                ...(data.data?.spellcasting || {})
            }
        };
        
        mergedData.name = data.name;
        
        setCharacterData(data);
        initializeStore(characterId, mergedData);
        form.reset(mergedData);
      }
      setLoading(false);
    };
    loadChar();
  }, [characterId, form, initializeStore, toast, isNpc]);

  // Salvamento
  const saveSheet = useCallback(async (options = { silent: false }) => {
      if (isReadOnly) return;
      setIsSaving(true);
      
      const currentData = form.getValues();
      const table = isNpc ? "npcs" : "characters";

      const updatePayload: any = { 
        data: currentData as any,
        name: currentData.name,
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

  // Auto-Save
  useEffect(() => {
      const subscription = form.watch((value, { type }) => {
          if (value) updateStore((draft) => { Object.assign(draft, value); });
          
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
    <CharacterSheetContext.Provider value={{ form, characterId, isReadOnly, activeTab, character: characterData, isSaving, saveSheet }}>
      <PathfinderProvider calculations={calculations}>
        {/* --- PROVEDOR DE ROLAGENS (NOVO) --- */}
        <RollProvider>
            <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="h-full flex flex-col bg-background relative">
                    
                    <PathfinderHeader 
                        onBack={onBack} 
                        onSave={() => saveSheet({ silent: false })} 
                        isDirty={form.formState.isDirty} 
                        characterName={characterData?.name}
                        isReadOnly={isReadOnly}
                        sharedWith={characterData?.shared_with_players}
                        isNpc={isNpc} 
                    />

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

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background scrollbar-thin pb-20">
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

                    {/* --- LOG DE DADOS VISUAL --- */}
                    <RollLog />
                    
                </form>
            </Form>
        </RollProvider>
      </PathfinderProvider>
    </CharacterSheetContext.Provider>
  );
};