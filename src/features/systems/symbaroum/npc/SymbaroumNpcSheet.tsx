import { useEffect, useState, useMemo, useRef } from "react";
import { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X, Save, Loader2, ImagePlus, Camera, Settings2, Move, Heart } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button, buttonVariants } from "@/components/ui/button"; 
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useFormContext } from "react-hook-form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { NpcSheetData, getDefaultNpcSheetData } from "./npc.schema";
import { SymbaroumNpcSheetProvider, useSymbaroumNpcSheet } from "./SymbaroumNpcSheetContext";

import { NpcDetailsTab } from "./tabs/NpcDetailsTab";
import { NpcCombatEquipmentTab } from "./tabs/NpcCombatEquipmentTab";
import { NpcAttributesTab } from "./tabs/NpcAttributesTab";
import { NpcAbilitiesTraitsTab } from "./tabs/NpcAbilitiesTraitsTab";
import { NpcInventoryTab } from "./tabs/NpcInventoryTab"; 
import { NpcJournalTab } from "./tabs/NpcJournalTab";

type Npc = Database["public"]["Tables"]["npcs"]["Row"];

const NpcHeader = ({ isReadOnly, onClose, onSave, isDirty, isSaving }: any) => {
    const { register, watch, setValue } = useFormContext();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { npc } = useSymbaroumNpcSheet();

    const imageUrl = watch("image_url");
    const imageSettings = watch("image_settings") || { x: 50, y: 50, scale: 100 };

    const currentHp = Number(watch("combat.toughness_current")) || 0;
    const totalMax = Number(watch("combat.toughness_max")) || 10;
    const hpPercentage = Math.min(100, Math.max(0, (currentHp / (totalMax || 1)) * 100));

    const updateImageSettings = (key: string, value: number[]) => {
        const newSettings = { ...imageSettings, [key]: value[0] };
        setValue("image_settings", newSettings, { shouldDirty: true });
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || isReadOnly) return;
        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `npc-${npc.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('campaign-images').upload(`npc-portraits/${fileName}`, file, { upsert: true });
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('campaign-images').getPublicUrl(`npc-portraits/${fileName}`);
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
            <div className="flex flex-col md:flex-row gap-4 p-4 items-start">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-lg border-2 border-destructive shadow-lg overflow-hidden bg-muted flex items-center justify-center relative">
                        {isUploading ? <Loader2 className="w-8 h-8 animate-spin text-destructive" /> : imageUrl ? (
                            <img src={imageUrl} alt="Retrato" className="w-full h-full object-cover" style={{ objectPosition: `${imageSettings.x}% ${imageSettings.y}%`, transform: `scale(${imageSettings.scale / 100})` }} />
                        ) : (
                            <div onClick={() => !isReadOnly && fileInputRef.current?.click()} className="flex flex-col items-center justify-center text-muted-foreground cursor-pointer w-full h-full hover:bg-muted/80"><ImagePlus className="w-8 h-8 opacity-50" /></div>
                        )}
                        {!isReadOnly && <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center z-10"><Camera className="w-6 h-6 text-white/90" /></div>}
                    </div>
                </div>
                <div className="flex-1 w-full space-y-3">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-2">
                        <div className="w-full">
                            {/* AJUSTE: px-3 para evitar corte lateral e tracking-normal */}
                            <Input 
                                {...register("name")} 
                                className="text-2xl md:text-3xl font-black tracking-normal text-destructive border-none bg-transparent hover:bg-muted/30 px-3 h-auto focus-visible:ring-0 shadow-none py-2 uppercase w-full" 
                                placeholder="NOME DO MONSTRO" 
                                readOnly={isReadOnly} 
                            />
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 px-3">
                                <Badge variant="outline" className="rounded-sm font-mono border-destructive/30 text-destructive/80">{watch("race") || "Raça"}</Badge>
                                <span className="text-xs font-bold uppercase tracking-wide">{watch("occupation") || "Tipo"}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                            {!isReadOnly && (
                                <Button size="sm" variant={isDirty ? "default" : "outline"} onClick={onSave} disabled={!isDirty || isSaving} className="min-w-[90px]">
                                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2"/> : <Save className="w-3 h-3 mr-2"/>}
                                    {isDirty ? "Salvar" : "Salvo"}
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="mx-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                             <div className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                <Heart className="w-3 h-3 text-red-500 fill-red-500"/> Vitalidade
                             </div>
                             <div className="text-lg font-black text-red-600 leading-none">
                                {currentHp} / {totalMax} 
                             </div>
                        </div>
                        <Progress value={hpPercentage} className="h-2 bg-red-950" indicatorClassName="bg-red-600 transition-all duration-300" />
                    </div>
                </div>
            </div>
        </Card>
    );
};

const NpcSheetInner = ({ onClose, initialData }: { onClose: () => void; initialData: NpcSheetData; }) => {
  const { form, isReadOnly, isDirty, isSaving, saveSheet, programmaticSave } = useSymbaroumNpcSheet();
  const { toast } = useToast();
  const [isCloseAlertOpen, setIsCloseAlertOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("combat_equip");

  useEffect(() => {
    if (!isDirty && initialData) {
      form.reset(initialData, { keepValues: true });
    }
  }, [initialData, isDirty, form]);

  const handleCloseClick = () => {
    if (isSaving) { toast({ title: "Aguarde", description: "Salvando..." }); return; }
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
      <div className="flex flex-col h-full bg-background overflow-hidden">
        <Form {...form}>
          <div className="flex flex-col h-full">
            <NpcHeader isReadOnly={isReadOnly} onClose={handleCloseClick} onSave={saveSheet} isDirty={isDirty} isSaving={isSaving} />
            <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto flex flex-col min-h-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
                <div className="px-4 border-b bg-muted/20">
                    <TabsList className="h-9 bg-transparent p-0 w-full justify-start gap-2 overflow-x-auto scrollbar-none">
                        <TabsTrigger value="combat_equip" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none font-bold">Combate</TabsTrigger>
                        <TabsTrigger value="attributes" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none">Atributos</TabsTrigger>
                        <TabsTrigger value="abilities_traits" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none">Habilidades</TabsTrigger>
                        <TabsTrigger value="backpack" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none">Inventário</TabsTrigger>
                        <TabsTrigger value="details" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none">Detalhes</TabsTrigger>
                        <TabsTrigger value="journal" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-destructive rounded-none">Anotações</TabsTrigger>
                    </TabsList>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <TabsContent value="combat_equip" className="mt-0 h-full"><NpcCombatEquipmentTab /></TabsContent>
                    <TabsContent value="attributes" className="mt-0 h-full"><NpcAttributesTab /></TabsContent>
                    <TabsContent value="abilities_traits" className="mt-0 h-full"><NpcAbilitiesTraitsTab /></TabsContent>
                    <TabsContent value="backpack" className="mt-0 h-full"><NpcInventoryTab /></TabsContent>
                    <TabsContent value="details" className="mt-0 h-full"><NpcDetailsTab /></TabsContent>
                    <TabsContent value="journal" className="mt-0 h-full"><NpcJournalTab /></TabsContent>
                </div>
                </Tabs>
            </form>
          </div>
        </Form>
      </div>
      <AlertDialog open={isCloseAlertOpen} onOpenChange={setIsCloseAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Sair sem Salvar?</AlertDialogTitle><AlertDialogDescription>Alterações serão perdidas.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancelar</AlertDialogCancel>
            <Button variant="outline" onClick={handleCloseWithoutSaving} disabled={isSaving}>Sair Sem Salvar</Button>
            <AlertDialogAction className={cn(buttonVariants({ variant: "default" }))} onClick={handleSaveAndClose} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar e Sair"}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const SymbaroumNpcSheet = ({ initialNpc, onClose }: { initialNpc: Npc, onClose: () => void }) => {
  const queryClient = useQueryClient();

  const validatedData = useMemo(() => {
      if (!initialNpc) return null;
      const defaults = getDefaultNpcSheetData(initialNpc.name || "Novo NPC");
      const rawData = (initialNpc.data as any) || {};
      
      return {
        ...defaults,
        ...rawData,
        name: initialNpc.name,
        image_url: initialNpc.image_url, 
        combat: { 
            ...defaults.combat, 
            ...(rawData?.combat || {}),
            toughness_max: Number(rawData?.combat?.toughness_max || defaults.combat.toughness_max),
            toughness_max_modifier: 0,
            toughness_temp: 0
        },
      };
  }, [initialNpc]); 
  
  if (!initialNpc || !validatedData) return null;

  const handleSave = async (data: NpcSheetData) => {
    const { error } = await supabase.from("npcs").update({ 
        name: data.name, 
        image_url: data.image_url, 
        data: data 
    }).eq("id", initialNpc.id);
    
    if (error) throw new Error(error.message);
    
    await queryClient.invalidateQueries({ queryKey: ['npcs', initialNpc.table_id] });
    await queryClient.invalidateQueries({ queryKey: ['npc', initialNpc.id] });
  };

  return (
    <SymbaroumNpcSheetProvider npc={initialNpc} onSave={handleSave}>
      <NpcSheetInner onClose={onClose} initialData={validatedData as NpcSheetData} />
    </SymbaroumNpcSheetProvider>
  );
};