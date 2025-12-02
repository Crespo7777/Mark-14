import { useEffect, useState, useMemo, useRef } from "react";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
    X, Save, Loader2, ImagePlus, Camera, Settings2, Move 
} from "lucide-react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  NpcSheetData,
  npcSheetSchema,
  getDefaultNpcSheetData,
} from "./npc.schema";
import { NpcSheetProvider, useNpcSheet } from "./NpcSheetContext";

// Abas
import { NpcDetailsTab } from "./tabs/NpcDetailsTab";
import { NpcCombatEquipmentTab } from "./tabs/NpcCombatEquipmentTab";
import { NpcAttributesTab } from "./tabs/NpcAttributesTab";
import { NpcAbilitiesTraitsTab } from "./tabs/NpcAbilitiesTraitsTab";
import { NpcInventoryTab } from "./tabs/NpcInventoryTab"; // <--- IMPORTADO O NOVO COMPONENTE
import { NpcJournalTab } from "./tabs/NpcJournalTab";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

interface NpcSheetProps {
  initialNpc: Npc;
  onClose: () => void;
}

const NpcSheetInner = ({
  onClose,
  initialData,
}: {
  onClose: () => void;
  onSave: (data: NpcSheetData) => Promise<void>;
  initialData: NpcSheetData;
}) => {
  const { form, isReadOnly, isDirty, isSaving, saveSheet, programmaticSave, npc } = useNpcSheet();
  const { toast } = useToast();
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Estados de Upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Leitura de Dados
  const name = form.watch("name");
  const race = form.watch("race");
  const occupation = form.watch("occupation");
  const imageUrl = form.watch("image_url");

  // Configurações de Imagem (Zoom/Posição)
  const imageSettings = form.watch("data.image_settings") || { x: 50, y: 50, scale: 100 };

  const updateImageSettings = (key: string, value: number[]) => {
      const newSettings = { ...imageSettings, [key]: value[0] };
      form.setValue("data.image_settings", newSettings, { shouldDirty: true });
  };

  // Upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || isReadOnly) return;

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `npc-${npc.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `npc-portraits/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images') 
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(filePath);

      form.setValue("image_url", publicUrl, { shouldDirty: true });
      toast({ title: "Imagem atualizada!" });

    } catch (error: any) {
      console.error("Erro no upload:", error);
      toast({
        title: "Erro ao enviar imagem",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileInput = () => {
      if (!isReadOnly && fileInputRef.current) fileInputRef.current.click();
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = ""; 
      return "";
    };
    if (isDirty && !isReadOnly) window.addEventListener("beforeunload", handleBeforeUnload);
    else window.removeEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty, isReadOnly]);

  const handleCloseClick = () => {
    if (isSaving) {
      toast({ title: "Aguarde", description: "Salvamento em progresso..." });
      return;
    }
    if (isDirty && !isReadOnly) setIsCloseAlertOpen(true);
    else onClose();
  };

  const handleSaveAndClose = async () => {
    if (isSaving) return;
    await programmaticSave();
    setIsCloseAlertOpen(false);
    onClose();
  };

  const handleCloseWithoutSaving = () => {
    form.reset(initialData); 
    setIsCloseAlertOpen(false);
    onClose();
  };

  return (
    <>
      <div className="flex flex-col h-full">
        {/* HEADER NPC REFORMULADO */}
        <Card className="m-4 mb-0 p-4 border-l-4 border-l-destructive bg-card/50 flex flex-col md:flex-row gap-4 items-center md:items-start shrink-0">
             <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/png, image/jpeg, image/gif, image/webp"
                onChange={handleImageUpload}
             />

             {/* ÁREA DA IMAGEM */}
             <div className="relative group shrink-0">
                <div 
                    className={`
                        w-24 h-24 rounded-lg border-2 border-destructive shadow-lg 
                        overflow-hidden bg-muted flex items-center justify-center relative
                    `}
                >
                    {isUploading ? (
                        <Loader2 className="w-8 h-8 animate-spin text-destructive" />
                    ) : imageUrl ? (
                        <img 
                            src={imageUrl} 
                            alt={name} 
                            className="w-full h-full object-cover transition-all duration-200"
                            style={{
                                objectPosition: `${imageSettings.x}% ${imageSettings.y}%`,
                                transform: `scale(${imageSettings.scale / 100})`
                            }}
                        />
                    ) : (
                        <div 
                            onClick={triggerFileInput}
                            className="flex flex-col items-center justify-center text-muted-foreground p-2 text-center cursor-pointer w-full h-full hover:bg-muted/80 transition-colors"
                        >
                            <ImagePlus className="w-8 h-8 mb-1 opacity-50" />
                        </div>
                    )}
                    
                    {!isReadOnly && imageUrl && (
                        <div 
                            onClick={triggerFileInput}
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10"
                        >
                            <Camera className="w-6 h-6 text-white/90" />
                        </div>
                    )}
                </div>

                {/* BOTÃO DE AJUSTES (ZOOM) */}
                {!isReadOnly && imageUrl && (
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button 
                                size="icon" 
                                variant="secondary" 
                                className="absolute -bottom-2 -right-2 h-7 w-7 rounded-full shadow-md z-20 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Settings2 className="w-3.5 h-3.5" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-64 p-4" align="start">
                            <div className="space-y-4">
                                <h4 className="font-medium leading-none flex items-center gap-2">
                                    <Move className="w-4 h-4"/> Enquadramento
                                </h4>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <Label>Zoom</Label>
                                        <span>{imageSettings.scale}%</span>
                                    </div>
                                    <Slider 
                                        value={[imageSettings.scale]} 
                                        min={100} max={300} step={5}
                                        onValueChange={(val) => updateImageSettings("scale", val)} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <Label>Horizontal (X)</Label>
                                        <span>{imageSettings.x}%</span>
                                    </div>
                                    <Slider 
                                        value={[imageSettings.x]} 
                                        min={0} max={100} step={1}
                                        onValueChange={(val) => updateImageSettings("x", val)} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <Label>Vertical (Y)</Label>
                                        <span>{imageSettings.y}%</span>
                                    </div>
                                    <Slider 
                                        value={[imageSettings.y]} 
                                        min={0} max={100} step={1}
                                        onValueChange={(val) => updateImageSettings("y", val)} 
                                    />
                                </div>
                                <Button 
                                    variant="outline" size="sm" className="w-full text-xs h-7"
                                    onClick={() => form.setValue("data.image_settings", { x: 50, y: 50, scale: 100 }, { shouldDirty: true })}
                                >
                                    Resetar
                                </Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                )}
            </div>

            {/* INFO DO NPC */}
            <div className="flex-1 w-full">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-bold text-destructive">{name}</h2>
                        <div className="flex gap-2 items-center text-sm text-muted-foreground mt-1">
                            <Badge variant="outline">{race}</Badge>
                            <span>• {occupation}</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2 items-center">
                        {!isReadOnly && (
                            <div className={cn("text-xs transition-opacity duration-300 mr-2", isDirty ? "text-amber-500" : "text-muted-foreground/50")}>
                              {isSaving ? "Salvando..." : isDirty ? "Não Salvo" : "Salvo"}
                            </div>
                        )}
                        {!isReadOnly && (
                          <Button size="sm" variant={isDirty ? "default" : "outline"} onClick={saveSheet} disabled={!isDirty || isSaving}>
                            <Save className="w-4 h-4 mr-2" /> Salvar
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={handleCloseClick} disabled={isSaving}>
                          <X className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <Separator className="my-3" />
            </div>
        </Card>

        {/* ABAS */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto flex flex-col min-h-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
              <div className="px-4 pt-2 shrink-0">
                  <TabsList className="flex flex-wrap h-auto w-full justify-start">
                    <TabsTrigger value="details">Detalhes</TabsTrigger>
                    <TabsTrigger value="attributes">Atributos</TabsTrigger>
                    <TabsTrigger value="combat_equip">Combate & Equip.</TabsTrigger>
                    <TabsTrigger value="abilities_traits">Habilidades</TabsTrigger>
                    <TabsTrigger value="backpack">Mochila</TabsTrigger>
                    <TabsTrigger value="journal">Diário</TabsTrigger>
                  </TabsList>
              </div>

              <div className="flex-1 overflow-y-auto p-4 pt-2">
                 <TabsContent value="details" className="mt-0"><NpcDetailsTab /></TabsContent>
                 <TabsContent value="attributes" className="mt-0"><NpcAttributesTab /></TabsContent>
                 <TabsContent value="combat_equip" className="mt-0"><NpcCombatEquipmentTab /></TabsContent>
                 <TabsContent value="abilities_traits" className="mt-0"><NpcAbilitiesTraitsTab /></TabsContent>
                 
                 {/* SUBSTITUIÇÃO AQUI: USANDO NpcInventoryTab */}
                 <TabsContent value="backpack" className="mt-0 h-full">
                     <NpcInventoryTab />
                 </TabsContent>
                 
                 <TabsContent value="journal" className="mt-0"><NpcJournalTab /></TabsContent>
              </div>
            </Tabs>
          </form>
        </Form>
      </div>

      <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair sem Salvar?</AlertDialogTitle>
            <AlertDialogDescription>Existem alterações não salvas.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleCloseWithoutSaving} disabled={isSaving}>Sair Sem Salvar</Button>
            <AlertDialogAction className={cn(buttonVariants({ variant: "default" }))} onClick={handleSaveAndClose} disabled={isSaving}>
              {isSaving ? "Salvando..." : "Salvar e Sair"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

// --- WRAPPER PRINCIPAL ---
export const NpcSheet = ({ initialNpc, onClose }: NpcSheetProps) => {
  const queryClient = useQueryClient();

  const validatedData = useMemo(() => {
      // Proteção contra undefined
      if (!initialNpc) return null;

      const defaults = getDefaultNpcSheetData(initialNpc.name || "Novo NPC");
      const rawData = initialNpc.data as any;

      const mergedData = {
        ...defaults,
        ...rawData,
        name: initialNpc.name,
        image_url: initialNpc.image_url, 
        
        attributes: { ...defaults.attributes, ...(rawData?.attributes || {}) },
        combat: { ...defaults.combat, ...(rawData?.combat || {}) },
        armors: rawData?.armors || [],
        inventory: rawData?.inventory || [],
        weapons: rawData?.weapons || [],
        abilities: rawData?.abilities || [],
        traits: rawData?.traits || [],
      };
      
      return mergedData;
  }, [initialNpc]); 
  
  if (!initialNpc || !validatedData) return null;

  initialNpc.data = validatedData;
  
  const handleSave = async (data: NpcSheetData) => {
    const { error } = await supabase
      .from("npcs")
      .update({ 
          name: data.name,
          image_url: data.image_url, 
          data: data 
      })
      .eq("id", initialNpc.id);

    if (error) throw new Error(error.message);

    await queryClient.invalidateQueries({ queryKey: ['npcs', initialNpc.table_id] });
    await queryClient.invalidateQueries({ queryKey: ['npc', initialNpc.id] });
  };

  return (
    <NpcSheetProvider npc={initialNpc} onSave={handleSave}>
      <NpcSheetInner onClose={onClose} onSave={handleSave} initialData={validatedData as NpcSheetData} />
    </NpcSheetProvider>
  );
};