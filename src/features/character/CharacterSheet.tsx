import { useState, useRef, useEffect, memo } from "react";
import { useCharacterSheet } from "./CharacterSheetContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  Save, 
  Shield, 
  Heart, 
  Swords, 
  Backpack, 
  Book, 
  User, 
  Sparkles,
  Loader2,
  Share2,
  ImagePlus,
  Camera,
  Settings2,
  Move,
  ArrowLeft
} from "lucide-react";

// --- CORREÇÃO DAS IMPORTAÇÕES ---
import { useFormContext } from "react-hook-form"; // Importado da biblioteca correta
import { Form } from "@/components/ui/form";      // Componente de UI
// --------------------------------

import { useToast } from "@/hooks/use-toast";
import { ShareDialog } from "@/components/ShareDialog";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { defaultCharacterData } from "./character.schema";

// Importação das Abas
import { DetailsTab } from "./tabs/DetailsTab";
import { AttributesTab } from "./tabs/AttributesTab";
import { AbilitiesTraitsTab } from "./tabs/AbilitiesTraitsTab";
import { CombatEquipmentTab } from "./tabs/CombatEquipmentTab";
import { BackpackTab } from "./tabs/BackpackTab";
import { CharacterJournalTab } from "./tabs/CharacterJournalTab";
import { useCharacterCalculations } from "./hooks/useCharacterCalculations";

interface CharacterSheetProps {
  isReadOnly?: boolean;
  onBack?: () => void;
}

// --- SUB-COMPONENTE: CABEÇALHO (Isolado para Performance) ---
const CharacterHeader = memo(({ isReadOnly, onBack, characterName, characterId, sharedWith }: any) => {
    // Agora usa o contexto corretamente importado
    const { register, watch, setValue, formState: { isDirty } } = useFormContext();
    const { toast } = useToast();
    const calculations = useCharacterCalculations(); 
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isSaving, saveSheet } = useCharacterSheet(); 

    // Watches locais
    const race = watch("race") || "Humano";
    const occupation = watch("occupation") || "Vagabundo";
    const imageUrl = watch("image_url");
    const imageSettings = watch("data.image_settings") || { x: 50, y: 50, scale: 100 };
    const currentHp = watch("toughness.current") || 0;
    
    // Cálculos
    const currentXp = calculations.currentExperience; 
    const nextLevelXp = 100;
    const xpPercentage = Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));
    const maxHp = calculations.toughnessMax; 

    const updateImageSettings = (key: string, value: number[]) => {
        const newSettings = { ...imageSettings, [key]: value[0] };
        setValue("data.image_settings", newSettings, { shouldDirty: true });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;
    
        setIsUploading(true);
        try {
          const fileExt = file.name.split('.').pop();
          const fileName = `${characterId}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `character-portraits/${fileName}`;
    
          const { error: uploadError } = await supabase.storage.from('images').upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;
    
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
          setValue("image_url", publicUrl, { shouldDirty: true });
          toast({ title: "Imagem atualizada!" });
    
        } catch (error: any) {
          toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const triggerFileInput = () => {
        if (!isReadOnly && fileInputRef.current) fileInputRef.current.click();
    };

    return (
        <Card className="p-4 border-l-4 border-l-primary bg-card/50 m-4 mb-0 shrink-0">
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/gif, image/webp" onChange={handleImageUpload} />

                {/* Avatar */}
                <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-lg border-2 border-primary shadow-lg overflow-hidden bg-muted flex items-center justify-center relative">
                        {isUploading ? (
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        ) : imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt="Retrato" 
                                className="w-full h-full object-cover transition-all duration-200"
                                style={{ objectPosition: `${imageSettings.x}% ${imageSettings.y}%`, transform: `scale(${imageSettings.scale / 100})` }}
                            />
                        ) : (
                            <div onClick={triggerFileInput} className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center cursor-pointer w-full h-full hover:bg-muted/80 transition-colors">
                                <ImagePlus className="w-8 h-8 mb-1 opacity-50" />
                            </div>
                        )}
                        
                        {!isReadOnly && imageUrl && (
                            <div onClick={triggerFileInput} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10">
                                <Camera className="w-6 h-6 text-white/90" />
                            </div>
                        )}
                    </div>

                    {!isReadOnly && imageUrl && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Settings2 className="w-3.5 h-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4" align="start">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none flex items-center gap-2"><Move className="w-4 h-4"/> Enquadramento</h4>
                                    <div className="space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><Label>Zoom</Label><span>{imageSettings.scale}%</span></div><Slider value={[imageSettings.scale]} min={100} max={300} step={5} onValueChange={(val) => updateImageSettings("scale", val)} /></div>
                                    <div className="space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><Label>X</Label><span>{imageSettings.x}%</span></div><Slider value={[imageSettings.x]} min={0} max={100} step={1} onValueChange={(val) => updateImageSettings("x", val)} /></div>
                                    <div className="space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><Label>Y</Label><span>{imageSettings.y}%</span></div><Slider value={[imageSettings.y]} min={0} max={100} step={1} onValueChange={(val) => updateImageSettings("y", val)} /></div>
                                    <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={() => setValue("data.image_settings", { x: 50, y: 50, scale: 100 }, { shouldDirty: true })}>Resetar</Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left space-y-1 w-full">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="w-full">
                            <Input 
                                {...register("name")} 
                                className="text-2xl font-bold tracking-tight text-primary border-none bg-transparent hover:bg-muted/30 px-0 h-auto focus-visible:ring-0 text-center md:text-left shadow-none" 
                                placeholder="Nome do Personagem" 
                                readOnly={isReadOnly} 
                            />
                            <div className="flex gap-2 justify-center md:justify-start text-sm text-muted-foreground items-center mt-1">
                                <Badge variant="outline">{race}</Badge>
                                <span className="flex items-center gap-1">• {occupation}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-2 md:mt-0 shrink-0">
                            {onBack && <Button variant="ghost" size="icon" onClick={onBack} title="Voltar"><ArrowLeft className="w-4 h-4"/></Button>}
                            
                            {!isReadOnly && (
                                <>
                                    <ShareDialog itemTitle={characterName} currentSharedWith={sharedWith || []} onSave={async () => {}}> 
                                        <Button variant="ghost" size="icon" type="button"><Share2 className="w-4 h-4"/></Button>
                                    </ShareDialog>
                                    
                                    <Button 
                                        type="button" 
                                        onClick={() => saveSheet()} 
                                        disabled={!isDirty || isSaving} 
                                        variant={isDirty ? "default" : "secondary"} 
                                        size="sm" 
                                        className="min-w-[100px] transition-all"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Save className="w-4 h-4 mr-2"/>}
                                        {isDirty ? "Salvar*" : "Salvo"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <span className="flex items-center gap-1 font-semibold text-red-400"><Heart className="w-3 h-3 fill-current"/> Vida</span>
                                <span>{currentHp} / {maxHp}</span>
                            </div>
                            <Progress value={(currentHp / (maxHp || 1)) * 100} className="h-1.5 bg-red-950" />
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
    );
});
CharacterHeader.displayName = "CharacterHeader";

// --- COMPONENTE PRINCIPAL ---
export const CharacterSheet = ({ isReadOnly = false, onBack }: CharacterSheetProps) => {
  const context = useCharacterSheet();
  const [activeTab, setActiveTab] = useState("details");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!context || !context.character) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-muted-foreground animate-in fade-in">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>A abrir grimório...</p>
          </div>
      );
  }

  const { form, character, saveSheet } = context;

  // Sincronização em tempo real
  useEffect(() => {
    if (character?.data && !form.formState.isDirty) {
        const syncedData = { ...defaultCharacterData, ...character.data };
        form.reset(syncedData, { keepDirty: false });
    }
  }, [character?.data, form]);

  // Auto-save Otimizado
  useEffect(() => {
    if (isReadOnly) return;
    const subscription = form.watch(() => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
      autoSaveTimeoutRef.current = setTimeout(() => {
        if (form.formState.isDirty) saveSheet();
      }, 3000);
    });
    return () => {
        subscription.unsubscribe();
        if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [form, saveSheet, isReadOnly]);

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); saveSheet(); }} className="h-full flex flex-col space-y-4">
        
        <CharacterHeader 
            isReadOnly={isReadOnly} 
            onBack={onBack} 
            characterName={character.name} 
            characterId={character.id}
            sharedWith={character.shared_with_players}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 overflow-x-auto pb-2 scrollbar-thin shrink-0">
                <TabsList className="inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-full justify-start gap-1 min-w-max">
                    <TabsTrigger value="details" className="text-xs px-3"><User className="w-3.5 h-3.5 mr-1.5"/> Detalhes</TabsTrigger>
                    <TabsTrigger value="attributes" className="text-xs px-3"><Sparkles className="w-3.5 h-3.5 mr-1.5"/> Atributos</TabsTrigger>
                    <TabsTrigger value="combat" className="text-xs px-3"><Swords className="w-3.5 h-3.5 mr-1.5"/> Combate</TabsTrigger>
                    <TabsTrigger value="abilities" className="text-xs px-3"><Shield className="w-3.5 h-3.5 mr-1.5"/> Habilidades</TabsTrigger>
                    <TabsTrigger value="inventory" className="text-xs px-3"><Backpack className="w-3.5 h-3.5 mr-1.5"/> Mochila</TabsTrigger>
                    <TabsTrigger value="journal" className="text-xs px-3"><Book className="w-3.5 h-3.5 mr-1.5"/> Diário</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4">
                <div className={isReadOnly ? "pointer-events-none opacity-90 h-full" : "h-full"}>
                    <TabsContent value="details" className="mt-0 h-full"><DetailsTab /></TabsContent>
                    <TabsContent value="attributes" className="mt-0 h-full"><AttributesTab /></TabsContent>
                    <TabsContent value="combat" className="mt-0 h-full"><CombatEquipmentTab /></TabsContent>
                    <TabsContent value="abilities" className="mt-0 h-full"><AbilitiesTraitsTab /></TabsContent>
                    <TabsContent value="inventory" className="mt-0 h-full"><BackpackTab /></TabsContent>
                    <TabsContent value="journal" className="mt-0 h-full"><CharacterJournalTab /></TabsContent>
                </div>
            </div>
        </Tabs>

      </form>
    </Form>
  );
};