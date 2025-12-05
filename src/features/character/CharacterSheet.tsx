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

import { useFormContext } from "react-hook-form"; 
import { Form } from "@/components/ui/form";      

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

// --- HEADER ---
const CharacterHeader = memo(({ isReadOnly, onBack, characterName, characterId, sharedWith }: any) => {
    const { register, watch, setValue, formState: { isDirty } } = useFormContext();
    const { toast } = useToast();
    const calculations = useCharacterCalculations(); 
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { isSaving, saveSheet } = useCharacterSheet(); 

    // Watches
    const race = watch("race") || "Desconhecido";
    const occupation = watch("occupation") || "Aventureiro";
    const imageUrl = watch("image_url");
    const imageSettings = watch("data.image_settings") || { x: 50, y: 50, scale: 100 };
    const currentHp = watch("toughness.current") || 0;
    
    // Cálculos
    const currentXp = calculations.currentExperience; 
    const nextLevelXp = 100; 
    const xpPercentage = Math.min(100, Math.max(0, (currentXp / nextLevelXp) * 100));
    const maxHp = calculations.toughnessMax; 
    const hpPercentage = Math.min(100, Math.max(0, (currentHp / (maxHp || 1)) * 100));

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
    
          const { error: uploadError } = await supabase.storage.from('campaign-images').upload(filePath, file, { upsert: true });
          if (uploadError) throw uploadError;
    
          const { data: { publicUrl } } = supabase.storage.from('campaign-images').getPublicUrl(filePath);
          setValue("image_url", publicUrl, { shouldDirty: true });
          toast({ title: "Imagem atualizada!" });
    
        } catch (error: any) {
          toast({ title: "Erro ao enviar", description: error.message, variant: "destructive" });
        } finally {
          setIsUploading(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <Card className="border-none shadow-none bg-background/50 rounded-none border-b mb-2 pb-2">
            <div className="flex flex-col md:flex-row gap-4 p-4 items-center">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                {/* Avatar */}
                <div className="relative group shrink-0">
                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl border-2 border-primary/50 shadow-lg overflow-hidden bg-muted flex items-center justify-center relative">
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
                            <div onClick={() => !isReadOnly && fileInputRef.current?.click()} className="flex flex-col items-center justify-center text-muted-foreground p-2 cursor-pointer w-full h-full hover:bg-muted/80 transition-colors">
                                <User className="w-8 h-8 mb-1 opacity-50" />
                            </div>
                        )}
                        
                        {!isReadOnly && (
                            <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10">
                                <Camera className="w-5 h-5 text-white/90" />
                            </div>
                        )}
                    </div>

                    {!isReadOnly && imageUrl && (
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-6 w-6 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Settings2 className="w-3 h-3" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4" align="start">
                                <div className="space-y-4">
                                    <h4 className="font-medium leading-none flex items-center gap-2 text-xs uppercase tracking-wide"><Move className="w-3 h-3"/> Ajustar Retrato</h4>
                                    <div className="space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><Label>Zoom</Label><span>{imageSettings.scale}%</span></div><Slider value={[imageSettings.scale]} min={100} max={300} step={5} onValueChange={(val) => updateImageSettings("scale", val)} /></div>
                                    <div className="space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><Label>X</Label><span>{imageSettings.x}%</span></div><Slider value={[imageSettings.x]} min={0} max={100} step={1} onValueChange={(val) => updateImageSettings("x", val)} /></div>
                                    <div className="space-y-1.5"><div className="flex justify-between text-xs text-muted-foreground"><Label>Y</Label><span>{imageSettings.y}%</span></div><Slider value={[imageSettings.y]} min={0} max={100} step={1} onValueChange={(val) => updateImageSettings("y", val)} /></div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 w-full space-y-2">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div className="w-full">
                            <Input 
                                {...register("name")} 
                                className="text-2xl md:text-3xl font-bold tracking-tight text-primary border-none bg-transparent hover:bg-muted/30 px-0 h-auto focus-visible:ring-0 shadow-none p-0" 
                                placeholder="Nome do Personagem" 
                                readOnly={isReadOnly} 
                            />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Badge variant="secondary" className="rounded-sm font-normal">{race}</Badge>
                                <span>•</span>
                                <span className="font-medium">{occupation}</span>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                            {onBack && <Button variant="ghost" size="icon" onClick={onBack} title="Voltar"><ArrowLeft className="w-4 h-4"/></Button>}
                            
                            {!isReadOnly && (
                                <>
                                    <ShareDialog itemTitle={characterName} currentSharedWith={sharedWith || []} onSave={async () => {}}> 
                                        <Button variant="ghost" size="icon" type="button"><Share2 className="w-4 h-4"/></Button>
                                    </ShareDialog>
                                    
                                    <Button 
                                        type="button" 
                                        onClick={() => saveSheet({ silent: false })} // Salvar manual = Barulho
                                        disabled={!isDirty || isSaving} 
                                        variant={isDirty ? "default" : "secondary"} 
                                        size="sm" 
                                        className="min-w-[90px] transition-all font-semibold"
                                    >
                                        {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <Save className="w-3 h-3 mr-2"/>}
                                        {isDirty ? "Salvar" : "Salvo"}
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-2">
                        <div className="space-y-1 relative group">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                                <span className="flex items-center gap-1 text-red-500"><Heart className="w-3 h-3 fill-current"/> Vida</span>
                                <span>{currentHp} / {maxHp}</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500" style={{ width: `${hpPercentage}%` }} />
                            </div>
                        </div>
                        <div className="space-y-1 relative group">
                            <div className="flex justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">
                                <span className="flex items-center gap-1 text-yellow-500"><Sparkles className="w-3 h-3 fill-current"/> Experiência</span>
                                <span>{currentXp} XP</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-yellow-500 to-amber-300 transition-all duration-500" style={{ width: `${xpPercentage}%` }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
});
CharacterHeader.displayName = "CharacterHeader";

export const CharacterSheet = ({ isReadOnly = false, onBack }: CharacterSheetProps) => {
  const context = useCharacterSheet();
  const [activeTab, setActiveTab] = useState("details");

  if (!context || !context.character) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] gap-4 text-muted-foreground animate-in fade-in">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p>A abrir grimório...</p>
          </div>
      );
  }

  const { form, character, saveSheet } = context;

  // Sincronização
  useEffect(() => {
    if (character?.data && !form.formState.isDirty) {
        const syncedData = { ...defaultCharacterData, ...character.data };
        form.reset(syncedData, { keepDirty: false });
    }
  }, [character?.data, form]);

  // REMOVIDO O USEEFFECT DE AUTO-SAVE DAQUI. 
  // O auto-save agora é gerido 100% pelo Contexto de forma silenciosa.

  return (
    <Form {...form}>
      <form onSubmit={(e) => { e.preventDefault(); saveSheet({ silent: false }); }} className="h-full flex flex-col bg-background">
        
        <CharacterHeader 
            isReadOnly={isReadOnly} 
            onBack={onBack} 
            characterName={character.name} 
            characterId={character.id}
            sharedWith={character.shared_with_players}
        />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-4 border-b bg-muted/20">
                <TabsList className="h-10 bg-transparent p-0 w-full justify-start gap-4 overflow-x-auto scrollbar-none">
                    <TabsTrigger value="details" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 font-semibold">Detalhes</TabsTrigger>
                    <TabsTrigger value="attributes" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 font-semibold">Atributos</TabsTrigger>
                    <TabsTrigger value="combat" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 font-semibold">Combate</TabsTrigger>
                    <TabsTrigger value="abilities" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 font-semibold">Habilidades</TabsTrigger>
                    <TabsTrigger value="inventory" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 font-semibold">Mochila</TabsTrigger>
                    <TabsTrigger value="journal" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-2 font-semibold">Diário</TabsTrigger>
                </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-background">
                <div className={isReadOnly ? "pointer-events-none opacity-90 h-full" : "h-full"}>
                    <TabsContent value="details" className="mt-0 h-full space-y-4 outline-none"><DetailsTab /></TabsContent>
                    <TabsContent value="attributes" className="mt-0 h-full space-y-4 outline-none"><AttributesTab /></TabsContent>
                    <TabsContent value="combat" className="mt-0 h-full space-y-4 outline-none"><CombatEquipmentTab /></TabsContent>
                    <TabsContent value="abilities" className="mt-0 h-full space-y-4 outline-none"><AbilitiesTraitsTab /></TabsContent>
                    <TabsContent value="inventory" className="mt-0 h-full space-y-4 outline-none"><BackpackTab /></TabsContent>
                    <TabsContent value="journal" className="mt-0 h-full space-y-4 outline-none"><CharacterJournalTab /></TabsContent>
                </div>
            </div>
        </Tabs>

      </form>
    </Form>
  );
};