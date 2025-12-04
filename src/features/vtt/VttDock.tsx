import { useState } from "react";
import { useTableContext } from "@/features/table/TableContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Map as MapIcon, Users, Swords, Settings, Search, Image as ImageIcon, X, Upload, Loader2, Plus, Music, LayoutGrid, FileText, MonitorPlay, CloudFog, Play, Eye, EyeOff, Trash2,
  Gamepad2, // Ícone do Jogo de Cartas
  Book      // Ícone do Livro de Regras
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { QuickCreateDialog } from "./QuickCreateDialog";

// --- Importações dos Painéis Novos ---
import { CardTablePanel } from "../cards/CardTablePanel";
import { RulesBookPanel } from "../rules/RulesBookPanel";

type DockCategory = 'scenes' | 'tokens';

interface DockItem {
  id: string; name: string; image: string; type: 'scene' | 'token-image'; isActive?: boolean; fogActive?: boolean;
}

const BUCKET_NAME = "campaign-media";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const VttDock = ({ tableId, onDragStart }: { tableId: string, onDragStart: (item: DockItem) => void }) => {
  const { isMaster } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeCategory, setActiveCategory] = useState<DockCategory | null>(null);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // --- Novos Estados para os Painéis ---
  const [showCards, setShowCards] = useState(false);
  const [showRules, setShowRules] = useState(false);

  const { data: gameState } = useQuery({ queryKey: ['game_state', tableId], queryFn: async () => (await supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).single()).data });
  const { data: scenes = [] } = useQuery({ queryKey: ['scenes', tableId], queryFn: async () => (await supabase.from("scenes").select("*").eq("table_id", tableId).order("created_at", { ascending: false })).data || [], enabled: activeCategory === 'scenes' });
  const { data: tokenImages = [] } = useQuery({ queryKey: ['dock-token-images'], queryFn: async () => { const { data } = await supabase.storage.from(BUCKET_NAME).list('tokens', { limit: 100, offset: 0, sortBy: { column: 'created_at', order: 'desc' } }); if (!data) return []; return data.filter(f => f.metadata?.mimetype?.startsWith('image')).map(f => ({ id: f.name, name: f.name.split('.')[0], image: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/tokens/${f.name}`, type: 'token-image' as const })); }, enabled: activeCategory === 'tokens' });

  const toggleSceneActivation = async (sceneId: string, currentActive: boolean) => {
      const newId = currentActive ? null : sceneId;
      await supabase.from("game_states").update({ current_scene_id: newId }).eq("table_id", tableId);
      queryClient.invalidateQueries({ queryKey: ['game_state', tableId] });
      toast({ title: currentActive ? "Mesa Oculta" : "Mapa Ativado!" });
  };

  const toggleSceneFog = async (sceneId: string, currentFog: boolean) => {
      await supabase.from("scenes").update({ fog_active: !currentFog }).eq("id", sceneId);
      queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
      toast({ title: !currentFog ? "Névoa Ativada" : "Névoa Desativada" });
  };

  const deleteScene = async (sceneId: string) => {
      if(!confirm("Apagar este mapa?")) return;
      await supabase.from("scenes").delete().eq("id", sceneId);
      queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
      toast({ title: "Mapa Apagado" });
  };

  // --- UPLOAD & DROP NA DOCK ---
  const handleUpload = async (files: FileList | File[], type: 'scene' | 'token') => {
      if (!files || files.length === 0) return;
      setIsUploading(true);
      
      const file = files[0]; 
      try {
          const folder = type === 'scene' ? 'maps' : 'tokens';
          const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
          if (uploadError) throw uploadError;
          
          const { data: publicUrl } = supabase.storage.from("campaign-media").getPublicUrl(fileName);
          
          if (type === 'scene') {
              await supabase.from("scenes").insert({ table_id: tableId, name: file.name.split('.')[0], image_url: publicUrl.publicUrl, grid_active: true });
              queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
              toast({ title: "Mapa Salvo!", description: "Agora podes arrastá-lo para a mesa." });
          } else {
              queryClient.invalidateQueries({ queryKey: ['dock-token-images'] });
              toast({ title: "Token Salvo!", description: "Disponível na aba Tokens." });
          }
      } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); } 
      finally { setIsUploading(false); }
  };

  const handleDockDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && activeCategory) {
          const type = activeCategory === 'scenes' ? 'scene' : 'token';
          handleUpload(e.dataTransfer.files, type);
      }
  };

  const getItems = (): DockItem[] => {
      if (activeCategory === 'scenes') return scenes.map(s => ({ id: s.id, name: s.name, image: s.image_url, type: 'scene', isActive: gameState?.current_scene_id === s.id, fogActive: s.fog_active }));
      if (activeCategory === 'tokens') return tokenImages;
      return []; 
  };

  const items = getItems().filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
    {/* --- Renderização dos Painéis Flutuantes --- */}
    {showCards && <CardTablePanel roomId={tableId} />}
    {showRules && <RulesBookPanel roomId={tableId} />}

    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-4xl px-4 pointer-events-none">
        
        {/* Painel Expansível de Mapas/Tokens */}
        {activeCategory && (
            <div 
                className={cn(
                    "w-full bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto transition-colors",
                    isUploading && "opacity-50 pointer-events-none"
                )}
                onDrop={handleDockDrop} 
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
            >
                <div className="flex items-center gap-2 mb-2 px-1">
                    {isMaster && (
                        <div className="relative">
                            <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleUpload(e.target.files!, activeCategory === 'scenes' ? 'scene' : 'token')} disabled={isUploading} />
                            <Button size="icon" variant="secondary" className="h-7 w-7 bg-primary hover:bg-primary/90 text-white shadow-lg">{isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}</Button>
                        </div>
                    )}
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1.5 w-4 h-4 text-white/50" />
                        <Input className="h-7 pl-8 bg-white/5 border-white/10 text-xs text-white focus:bg-black transition-colors" placeholder={`Pesquisar ${activeCategory === 'scenes' ? 'Mapas' : 'Tokens'}...`} value={search} onChange={e => setSearch(e.target.value)} autoFocus />
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10" onClick={() => setActiveCategory(null)}><X className="w-4 h-4" /></Button>
                </div>

                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                        {items.length === 0 && <div className="w-full text-center text-xs text-white/30 py-4 italic">{activeCategory === 'scenes' ? "Arrasta imagens para aqui para criar MAPAS." : "Arrasta imagens para aqui para criar TOKENS."}</div>}
                        
                        {items.map(item => (
                            <div key={item.id} className="group relative flex flex-col items-center gap-1 w-28 shrink-0 cursor-grab active:cursor-grabbing" draggable onDragStart={(e) => { e.dataTransfer.setData("application/json", JSON.stringify(item)); onDragStart(item); }}>
                                <div className={cn("w-28 h-20 rounded-lg border overflow-hidden transition-all relative shadow-md", item.isActive ? "border-green-500 ring-2 ring-green-500/20" : "border-white/10 bg-white/5 group-hover:border-primary/50")}>
                                    <img src={item.image} className={cn("w-full h-full", item.type === 'token-image' ? "object-contain p-1" : "object-cover opacity-80 group-hover:opacity-100")} loading="lazy" />
                                    
                                    {item.type === 'scene' && isMaster && (
                                        <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                                            <Button size="icon" variant="ghost" className={cn("h-6 w-6 rounded-full", item.isActive ? "text-green-400 bg-green-900/20" : "text-white hover:text-green-400")} onClick={(e) => { e.stopPropagation(); toggleSceneActivation(item.id, !!item.isActive); }} title={item.isActive ? "Ocultar Mapa" : "Projetar Mapa"}><MonitorPlay className="w-3 h-3"/></Button>
                                            <Button size="icon" variant="ghost" className={cn("h-6 w-6 rounded-full", item.fogActive ? "text-blue-400 bg-blue-900/20" : "text-white/50 hover:text-blue-400")} onClick={(e) => { e.stopPropagation(); toggleSceneFog(item.id, !!item.fogActive); }} title="Névoa de Guerra"><CloudFog className="w-3 h-3"/></Button>
                                            <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full text-white/50 hover:text-red-500" onClick={(e) => { e.stopPropagation(); deleteScene(item.id); }} title="Apagar Mapa"><Trash2 className="w-3 h-3"/></Button>
                                        </div>
                                    )}
                                    {item.isActive && <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />}
                                </div>
                                <span className={cn("text-[10px] truncate w-full text-center font-medium", item.isActive ? "text-green-400" : "text-white/70 group-hover:text-white")}>{item.name}</span>
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="bg-white/10 h-2" />
                </ScrollArea>
            </div>
        )}

        {/* --- DOCK PRINCIPAL (BOTÕES) --- */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto transition-all hover:bg-black/90">
            
            {/* Esquerda: Gestão de Mapas e Tokens */}
            <DockButton icon={<MapIcon />} label="Meus Mapas (Drop Aqui)" active={activeCategory === 'scenes'} onClick={() => setActiveCategory(activeCategory === 'scenes' ? null : 'scenes')} disabled={!isMaster} />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <DockButton icon={<ImageIcon />} label="Tokens (Imagens)" active={activeCategory === 'tokens'} onClick={() => setActiveCategory(activeCategory === 'tokens' ? null : 'tokens')} />
            
            {/* Centro: Ferramentas de Jogo */}
            <div className="w-px h-6 bg-white/10 mx-1" />
            <DockButton icon={<FileText />} label="Acesso Rápido (Fichas)" active={false} onClick={() => document.dispatchEvent(new CustomEvent('toggle-quick-access'))} />
            <DockButton icon={<LayoutGrid />} label="Gestão Completa" active={false} onClick={() => document.dispatchEvent(new CustomEvent('toggle-master-panel'))} disabled={!isMaster} />
            <div className="w-px h-6 bg-white/10 mx-1" />
            
            {/* Direita: Funcionalidades Especiais */}
            <DockButton icon={<Swords />} label="Combate" active={false} onClick={() => document.dispatchEvent(new CustomEvent('toggle-combat-tracker'))} />
            
            {/* NOVOS BOTÕES */}
            <DockButton 
                icon={<Gamepad2 />} 
                label="Mesa de Cartas" 
                active={showCards} 
                onClick={() => { setShowCards(!showCards); setShowRules(false); }} 
            />
            
            <DockButton 
                icon={<Book />} 
                label="Livro de Regras" 
                active={showRules} 
                onClick={() => { setShowRules(!showRules); setShowCards(false); }} 
            />

            <DockButton icon={<MonitorPlay />} label="Prios (Projetor)" active={false} onClick={() => document.dispatchEvent(new CustomEvent('toggle-prios-panel'))} disabled={!isMaster} />
            <DockButton icon={<Music />} label="O Bardo" active={false} onClick={() => document.dispatchEvent(new CustomEvent('toggle-bard-panel'))} />
            
            <div className="w-px h-6 bg-white/10 mx-1" />
            <DockButton icon={<Settings />} label="Definições" active={false} onClick={() => document.dispatchEvent(new CustomEvent('toggle-vtt-settings'))} />
        </div>
    </div>
    </>
  );
};

// Componente auxiliar para os botões (para manter o código limpo)
const DockButton = ({ icon, label, active, onClick, disabled }: any) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className={cn("w-10 h-10 rounded-xl transition-all duration-200", active ? "bg-primary text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-110" : "text-white/60 hover:text-white hover:bg-white/10", disabled && "opacity-30 grayscale cursor-not-allowed")} onClick={onClick} disabled={disabled}>
                <div className="w-5 h-5">{icon}</div>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black text-xs border-white/10 shadow-xl">{label}</TooltipContent>
    </Tooltip>
);