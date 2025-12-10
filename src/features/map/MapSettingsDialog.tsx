import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  const { tableId, setFogShapes } = useTableContext(); // Importamos setFogShapes para limpar visualmente rápido
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [gridSize, setGridSize] = useState(currentSettings.gridSize || 50);
  const [gridOpacity, setGridOpacity] = useState(currentSettings.gridOpacity || 0.2);
  const [fogEnabled, setFogEnabled] = useState(currentSettings.fogEnabled || false); 
  const [uploading, setUploading] = useState(false);

  // Função auxiliar para RESETAR o Fog (Apagar tudo do DB)
  const resetFogOfWar = async () => {
      // 1. Limpa no Banco
      const { error } = await supabase
          .from("map_fog")
          .delete()
          .eq("table_id", tableId);
      
      if (!error) {
          // 2. Limpa no Estado Local (Feedback Imediato) e invalida cache
          setFogShapes([]); 
          queryClient.invalidateQueries({ queryKey: ["map_fog", tableId] });
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `maps/${tableId}-${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('campaign-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(fileName);

      await updateTableSettings({ map_background_url: publicUrl });
      
      // --- RESET AUTOMÁTICO AO TROCAR DE MAPA ---
      await resetFogOfWar();
      
      toast({ title: "Mapa carregado e nevoeiro resetado!" });

    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const updateTableSettings = async (updates: any) => {
    const { error } = await supabase
      .from('tables')
      .update(updates)
      .eq('id', tableId);

    if (error) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } else {
      queryClient.invalidateQueries({ queryKey: ["table-view", tableId] });
    }
  };

  const handleSave = async () => {
    // Verificar se o Fog foi alternado (Ligado <-> Desligado)
    // O usuário pediu: "Sempre que usar o botão para ativar ou desativar... o fog deve resetar"
    if (fogEnabled !== currentSettings.fogEnabled) {
        await resetFogOfWar();
        toast({ title: fogEnabled ? "Nevoeiro Ativado (Resetado)" : "Nevoeiro Desativado (Resetado)" });
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
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Imagem de Fundo</Label>
            <div className="flex items-center gap-4">
                <div className="relative w-20 h-20 border-2 border-dashed rounded-md flex items-center justify-center bg-muted/50 overflow-hidden group">
                    {currentSettings.url ? (
                        <img src={currentSettings.url} className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Upload className="w-6 h-6 text-white" />
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                    </label>
                </div>
                <div className="text-xs text-muted-foreground flex-1">
                    <p className="mb-1">{uploading ? <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin"/> Enviando...</span> : "Clique na imagem para alterar o mapa."}</p>
                    <p className="text-[10px] text-red-400 font-bold">*Trocar a imagem reseta o nevoeiro.</p>
                </div>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Toggle Nevoeiro de Guerra */}
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
                <Label htmlFor="fog-mode" className="flex items-center gap-2">
                    <CloudFog className="w-4 h-4 text-muted-foreground" /> 
                    Nevoeiro de Guerra
                </Label>
                <span className="text-[10px] text-muted-foreground">Ativar/Desativar reseta a exploração.</span>
            </div>
            <Switch 
                id="fog-mode" 
                checked={fogEnabled} 
                onCheckedChange={setFogEnabled} 
            />
          </div>

          <div className="h-px bg-border" />

          {/* Tamanho da Grelha */}
          <div className="space-y-2">
            <div className="flex justify-between">
                <Label>Tamanho da Grelha (px)</Label>
                <span className="text-xs text-muted-foreground">{gridSize}px</span>
            </div>
            <Slider 
                value={[gridSize]} 
                onValueChange={([v]) => setGridSize(v)} 
                min={20} 
                max={200} 
                step={5} 
            />
          </div>

          {/* Opacidade da Grelha */}
          <div className="space-y-2">
            <div className="flex justify-between">
                <Label>Opacidade das Linhas</Label>
                <span className="text-xs text-muted-foreground">{Math.round(gridOpacity * 100)}%</span>
            </div>
            <Slider 
                value={[gridOpacity]} 
                onValueChange={([v]) => setGridOpacity(v)} 
                min={0} 
                max={1} 
                step={0.05} 
            />
          </div>

        </div>

        <DialogFooter>
          <Button onClick={handleSave}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};