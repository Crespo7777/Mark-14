// src/features/map/MapSettingsDialog.tsx

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog"; 
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch"; 
import { supabase } from "@/integrations/supabase/client";
import { useTableContext } from "@/features/table/TableContext";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, Image as ImageIcon, CloudFog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MapSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentSettings: {
    url: string | null;
    gridSize: number;
    gridOpacity: number;
    fogEnabled: boolean; 
  };
}

export const MapSettingsDialog = ({ open, onOpenChange, currentSettings }: MapSettingsDialogProps) => {
  const { tableId, setFogShapes } = useTableContext();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [gridSize, setGridSize] = useState(currentSettings.gridSize || 50);
  const [gridOpacity, setGridOpacity] = useState(currentSettings.gridOpacity || 0.2);
  const [fogEnabled, setFogEnabled] = useState(currentSettings.fogEnabled || false); 
  const [uploading, setUploading] = useState(false);

  const resetFogOfWar = async () => {
      // Otimista: Limpa UI já
      setFogShapes([]); 
      const { error } = await supabase.from("map_fog").delete().eq("table_id", tableId);
      if (!error) {
          queryClient.invalidateQueries({ queryKey: ["map_fog", tableId] });
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tableId}-${Date.now()}.${fileExt}`;

      // BUCKET: map-images (ISOLADO)
      const { error: uploadError } = await supabase.storage
        .from('map-images') 
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('map-images')
        .getPublicUrl(fileName);

      await updateTableSettings({ map_background_url: publicUrl });
      
      // Reseta nevoeiro ao trocar mapa (para evitar formas fora do sitio)
      await resetFogOfWar();
      
      toast({ title: "Mapa carregado com sucesso!" });

    } catch (error: any) {
      console.error(error);
      toast({ 
          title: "Erro no upload", 
          description: "Verifique se o bucket 'map-images' existe no Supabase.", 
          variant: "destructive" 
      });
    } finally {
      setUploading(false);
    }
  };

  const updateTableSettings = async (updates: any) => {
    const { error } = await supabase.from('tables').update(updates).eq('id', tableId);
    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["table-view", tableId] });
    }
  };

  const handleSave = async () => {
    // Se o user ligou/desligou o nevoeiro, resetamos para estado limpo
    if (fogEnabled !== currentSettings.fogEnabled) {
        await resetFogOfWar();
        toast({ title: fogEnabled ? "Nevoeiro Ativado" : "Nevoeiro Desativado" });
    }

    await updateTableSettings({
      map_grid_size: gridSize,
      map_grid_opacity: gridOpacity,
      map_fog_enabled: fogEnabled 
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Configuração da Cena</DialogTitle>
          <DialogDescription>Ajuste o mapa, grelha e visibilidade.</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Imagem de Fundo do Tabuleiro</Label>
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50 overflow-hidden group">
                    {currentSettings.url ? (
                        <img src={currentSettings.url} className="w-full h-full object-cover" alt="Mapa" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
                <div className="text-xs text-muted-foreground flex-1">
                    <p className="mb-1">{uploading ? <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Enviando...</span> : "Clique para alterar o mapa."}</p>
                    <p className="text-[10px] text-blue-400 font-bold">*Guardado em 'map-images'.</p>
                </div>
            </div>
          </div>
          
          <div className="h-px bg-border" />
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1"><Label htmlFor="fog">Nevoeiro</Label></div>
            <Switch id="fog" checked={fogEnabled} onCheckedChange={setFogEnabled} />
          </div>
          <div className="space-y-2"><Label>Grelha ({gridSize}px)</Label><Slider value={[gridSize]} onValueChange={([v]) => setGridSize(v)} min={20} max={200} step={5} /></div>
          <div className="space-y-2"><Label>Opacidade ({Math.round(gridOpacity * 100)}%)</Label><Slider value={[gridOpacity]} onValueChange={([v]) => setGridOpacity(v)} min={0} max={1} step={0.05} /></div>
        </div>
        <DialogFooter><Button onClick={handleSave}>Salvar</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};