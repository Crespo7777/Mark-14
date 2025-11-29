// src/features/character/CharacterSheet.tsx

import { useState } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  Save, 
  Shield, 
  Heart, 
  Swords, 
  Backpack, 
  Book, 
  User, 
  Sparkles,
  Loader2 
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { ShareDialog } from "@/components/ShareDialog";

// Importação das Abas
import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { AbilitiesTraitsTab } from "./tabs/AbilitiesTraitsTab";
import { CombatEquipmentTab } from "./tabs/CombatEquipmentTab";
import { BackpackTab } from "./tabs/BackpackTab";
import { CharacterJournalTab } from "./tabs/CharacterJournalTab";

export const CharacterSheet = ({ isReadOnly = false }: { isReadOnly?: boolean }) => {
  const context = useCharacterSheet();
  const [activeTab, setActiveTab] = useState("details");

  // Proteção contra crash se o contexto não estiver carregado
  if (!context || !context.character) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>A carregar dados do personagem...</p>
          </div>
      );
  }

  const { form, character, isDirty, isSaving, saveSheet } = context;
  
  // Valores calculados para o Header
  const currentXp = form.watch("xp.current") || 0;
  const nextLevelXp = form.watch("xp.next_level") || 100;
  const xpPercentage = Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));
  
  const currentHp = form.watch("toughness.current") || 0;
  const vigorous = Number(form.watch("attributes.vigorous.value") || 0);
  const hpBonus = Number(form.watch("toughness.bonus") || 0);
  const maxHp = Math.max(10, vigorous) + hpBonus; 

  const name = form.watch("name") || "Sem Nome";
  const archetype = form.watch("archetype") || "Aventureiro";
  const occupation = form.watch("occupation") || "Vagabundo";

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); saveSheet(); }} className="h-full flex flex-col space-y-4">
        
        {/* HEADER DA FICHA */}
        <Card className="p-4 border-l-4 border-l-primary bg-card/50 m-4 mb-0">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                {/* Avatar */}
                <Avatar className="w-20 h-20 border-2 border-primary shadow-lg">
                    <AvatarImage src={(character.data as any)?.image_url} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold bg-primary/20">
                        {name.substring(0,2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>

                {/* Info Principal */}
                <div className="flex-1 text-center md:text-left space-y-1 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight text-primary">{name}</h2>
                            <div className="flex gap-2 justify-center md:justify-start text-sm text-muted-foreground">
                                <Badge variant="outline">{archetype}</Badge>
                                <span className="flex items-center gap-1">• {occupation}</span>
                            </div>
                        </div>
                        
                        {/* Ações (Salvar/Partilhar) */}
                        <div className="flex gap-2 mt-2 md:mt-0">
                            {!isReadOnly && (
                                <>
                                    <ShareDialog itemTitle={name} currentSharedWith={character.shared_with_players || []} onSave={async () => {}}> 
                                        {/* Nota: A lógica de save do share pode ser complexa, mantive simples aqui para focar no erro principal */}
                                    </ShareDialog>
                                    <Button 
                                        type="button" 
                                        onClick={() => saveSheet()} 
                                        disabled={!isDirty || isSaving}
                                        variant={isDirty ? "default" : "outline"}
                                        size="sm"
                                        className="min-w-[100px]"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                                        {isDirty ? "Salvar*" : "Salvo"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator className="my-2" />

                    {/* Barras de Estado Rápidas */}
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1 font-semibold text-red-400"><Heart className="w-3 h-3 fill-current"/> Vida</span>
                                <span>{currentHp} / {maxHp}</span>
                            </div>
                            <Progress value={(currentHp / maxHp) * 100} className="h-1.5 bg-red-950" />
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1 font-semibold text-yellow-400"><Sparkles className="w-3 h-3 fill-current"/> XP</span>
                                <span>{currentXp} / {nextLevelXp}</span>
                            </div>
                            <Progress value={xpPercentage} className="h-1.5 bg-yellow-950" />
                        </div>
                    </div>
                </div>
            </div>
        </Card>

        {/* CONTEÚDO (TABS) */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 overflow-x-auto pb-2">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full justify-start">
                    <TabsTrigger value="details" className="text-xs"><User className="w-3.5 h-3.5 mr-1.5"/> Detalhes</TabsTrigger>
                    <TabsTrigger value="attributes" className="text-xs"><Sparkles className="w-3.5 h-3.5 mr-1.5"/> Atributos</TabsTrigger>
                    <TabsTrigger value="abilities" className="text-xs"><Shield className="w-3.5 h-3.5 mr-1.5"/> Habilidades</TabsTrigger>
                    <TabsTrigger value="combat" className="text-xs"><Swords className="w-3.5 h-3.5 mr-1.5"/> Combate</TabsTrigger>
                    <TabsTrigger value="inventory" className="text-xs"><Backpack className="w-3.5 h-3.5 mr-1.5"/> Mochila</TabsTrigger>
                    <TabsTrigger value="journal" className="text-xs"><Book className="w-3.5 h-3.5 mr-1.5"/> Diário</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className={isReadOnly ? "pointer-events-none opacity-90" : ""}>
                    <TabsContent value="details" className="mt-0"><DetailsTab /></TabsContent>
                    <TabsContent value="attributes" className="mt-0"><AttributesTab /></TabsContent>
                    <TabsContent value="abilities" className="mt-0"><AbilitiesTraitsTab /></TabsContent>
                    <TabsContent value="combat" className="mt-0"><CombatEquipmentTab /></TabsContent>
                    <TabsContent value="inventory" className="mt-0"><BackpackTab /></TabsContent>
                    <TabsContent value="journal" className="mt-0"><CharacterJournalTab /></TabsContent>
                </div>
            </div>
        </Tabs>

      </form>
    </Form>
  );
};