import { useState } from "react";
import { useTableContext } from "@/features/table/TableContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Map as MapIcon, 
  Users, 
  Swords, 
  Settings, 
  Search, 
  Image as ImageIcon, 
  X,
  Upload,
  Loader2,
  Music,
  LayoutGrid, // Ícone para Gestão Completa
  FileText,   // Ícone para Acesso Rápido
  MonitorPlay // Ícone para Prios
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// Categorias visuais da Dock
type DockCategory = 'scenes' | 'tokens';

interface DockItem {
  id: string;
  name: string;
  image: string;
  type: 'scene' | 'token-image'; 
}

const BUCKET_NAME = "campaign-media";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export const VttDock = ({ 
    tableId, 
    onDragStart 
}: { 
    tableId: string, 
    onDragStart: (item: DockItem) => void
}) => {
  const { isMaster } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeCategory, setActiveCategory] = useState<DockCategory | null>(null);
  const [search, setSearch] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // --- 1. BUSCAR MAPAS (CENAS SALVAS) ---
  const { data: scenes = [] } = useQuery({ 
    queryKey: ['scenes', tableId], 
    queryFn: async () => (await supabase.from("scenes").select("*").eq("table_id", tableId).order("created_at", { ascending: false })).data || [], 
    enabled: activeCategory === 'scenes' 
  });

  // --- 2. BUSCAR TOKENS (APENAS IMAGENS DO STORAGE) ---
  const { data: tokenImages = [] } = useQuery({ 
    queryKey: ['dock-token-images'], 
    queryFn: async () => { 
        // Lista ficheiros na pasta "tokens"
        const { data } = await supabase.storage.from(BUCKET_NAME).list('tokens', {
            limit: 100,
            offset: 0,
            sortBy: { column: 'created_at', order: 'desc' },
        }); 

        if (!data) return []; 
        
        return data
            .filter(f => f.metadata?.mimetype?.startsWith('image'))
            .map(f => ({ 
                id: f.name, 
                name: f.name.split('.')[0], // Remove extensão para o nome
                image: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/tokens/${f.name}`, 
                type: 'token-image' as const 
            })); 
    }, 
    enabled: activeCategory === 'tokens' 
  });

  // --- FUNÇÃO DE UPLOAD ---
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'scene' | 'token') => {
      if (!e.target.files || e.target.files.length === 0) return;
      setIsUploading(true);
      const file = e.target.files[0];
      
      try {
          // Define a pasta: 'maps' para Cenas, 'tokens' para Tokens
          const folder = type === 'scene' ? 'maps' : 'tokens';
          // Nome único para evitar conflitos
          const fileName = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
          
          const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
          if (uploadError) throw uploadError;
          
          const { data: publicUrl } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
          
          if (type === 'scene') {
              // Se for mapa, cria logo a entrada na tabela de cenas
              await supabase.from("scenes").insert({ 
                  table_id: tableId, 
                  name: file.name.split('.')[0], 
                  image_url: publicUrl.publicUrl, 
                  grid_active: true 
              });
              queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
              toast({ title: "Mapa Criado!", description: "Adicionado à tua lista de mapas." });
          } else {
              // Se for token, apenas atualiza a lista de imagens
              queryClient.invalidateQueries({ queryKey: ['dock-token-images'] });
              toast({ title: "Token Adicionado!", description: "Pronto para arrastar para a mesa." });
          }
      } catch (err: any) { 
          toast({ title: "Erro no upload", description: err.message, variant: "destructive" }); 
      } finally { 
          setIsUploading(false); 
      }
  };

  const getItems = (): DockItem[] => {
      if (activeCategory === 'scenes') {
          return scenes.map(s => ({ id: s.id, name: s.name, image: s.image_url, type: 'scene' }));
      }
      if (activeCategory === 'tokens') {
          return tokenImages;
      }
      return []; 
  };

  const items = getItems().filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-4xl px-4 pointer-events-none">
        
        {/* ÁREA DE CONTEÚDO (DROPDOWN) - Só aparece se uma categoria estiver ativa */}
        {activeCategory && (
            <div className="w-full bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
                <div className="flex items-center gap-2 mb-2 px-1">
                    
                    {/* BOTÃO DE UPLOAD (Apenas para o Mestre) */}
                    {isMaster && (
                        <div className="relative">
                            <input 
                                type="file" 
                                accept="image/*" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => handleUpload(e, activeCategory === 'scenes' ? 'scene' : 'token')} 
                                disabled={isUploading} 
                            />
                            <Button size="icon" variant="secondary" className="h-7 w-7 bg-primary hover:bg-primary/90 text-white shadow-lg" title={activeCategory === 'scenes' ? "Novo Mapa" : "Novo Token"}>
                                {isUploading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                            </Button>
                        </div>
                    )}

                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1.5 w-4 h-4 text-white/50" />
                        <Input 
                            className="h-7 pl-8 bg-white/5 border-white/10 text-xs text-white focus:bg-black transition-colors" 
                            placeholder={`Pesquisar ${activeCategory === 'scenes' ? 'Mapas' : 'Tokens'}...`} 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            autoFocus 
                        />
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-white hover:bg-white/10" onClick={() => setActiveCategory(null)}>
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                        {items.length === 0 && (
                            <div className="w-full text-center text-xs text-white/30 py-4 italic">
                                {activeCategory === 'scenes' ? "Sem mapas salvos." : "Sem imagens de tokens."}
                            </div>
                        )}

                        {items.map(item => (
                            <div 
                                key={item.id}
                                className="group relative flex flex-col items-center gap-1 w-24 shrink-0 cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                                draggable
                                onDragStart={(e) => { 
                                    e.dataTransfer.setData("application/json", JSON.stringify(item)); 
                                    onDragStart(item); 
                                }}
                            >
                                <div className="w-24 h-16 rounded-lg bg-white/5 border border-white/10 overflow-hidden group-hover:border-primary/50 transition-colors relative shadow-md">
                                    <img 
                                        src={item.image} 
                                        className={cn(
                                            "w-full h-full", 
                                            item.type === 'token-image' ? "object-contain p-1" : "object-cover"
                                        )} 
                                        loading="lazy" 
                                    />
                                    {/* Badge de Tipo */}
                                    <div className={cn(
                                        "absolute bottom-0 right-0 text-[8px] px-1.5 py-0.5 text-white/90 rounded-tl-sm font-bold uppercase backdrop-blur-sm",
                                        item.type === 'scene' ? "bg-blue-600/80" : "bg-purple-600/80"
                                    )}>
                                        {item.type === 'scene' ? 'MAPA' : 'TOKEN'}
                                    </div>
                                </div>
                                <span className="text-[10px] text-white/70 truncate w-full text-center group-hover:text-white font-medium">
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="bg-white/10 h-2" />
                </ScrollArea>
            </div>
        )}

        {/* BARRA DE FERRAMENTAS PRINCIPAL */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto transition-all hover:bg-black/90">
            
            {/* 1. VISUAIS (Mapas e Tokens) */}
            <DockButton 
                icon={<MapIcon />} 
                label="Meus Mapas" 
                active={activeCategory === 'scenes'} 
                onClick={() => setActiveCategory(activeCategory === 'scenes' ? null : 'scenes')} 
                disabled={!isMaster} 
            />
            
            <DockButton 
                icon={<ImageIcon />} 
                label="Tokens (Imagens)" 
                active={activeCategory === 'tokens'} 
                onClick={() => setActiveCategory(activeCategory === 'tokens' ? null : 'tokens')} 
            />
            
            <div className="w-px h-6 bg-white/10 mx-1" />
            
            {/* 2. GESTÃO E FICHAS (Popups) */}
            <DockButton 
                icon={<FileText />} 
                label="Acesso Rápido (Fichas)" 
                active={false} 
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-quick-access'))} 
            />

            <DockButton 
                icon={<LayoutGrid />} 
                label="Gestão Completa (Painel do Mestre)" 
                active={false} 
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-master-panel'))} 
                disabled={!isMaster} 
            />

            <div className="w-px h-6 bg-white/10 mx-1" />

            {/* 3. UTILITÁRIOS */}
            <DockButton 
                icon={<Swords />} 
                label="Combate" 
                active={false} 
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-combat-tracker'))} 
            />
            <DockButton 
                icon={<MonitorPlay />} 
                label="Prios (Projetor)" 
                active={false} 
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-prios-panel'))} 
                disabled={!isMaster} 
            />
            <DockButton 
                icon={<Music />} 
                label="O Bardo" 
                active={false} 
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-bard-panel'))} 
            />
            
            <div className="w-px h-6 bg-white/10 mx-1" />
            
            <DockButton 
                icon={<Settings />} 
                label="Definições" 
                active={false} 
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-vtt-settings'))} 
            />
        </div>
    </div>
  );
};

const DockButton = ({ icon, label, active, onClick, disabled }: any) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "w-10 h-10 rounded-xl transition-all duration-200", 
                    active ? "bg-primary text-white shadow-[0_0_15px_rgba(34,197,94,0.5)] scale-110" : "text-white/60 hover:text-white hover:bg-white/10", 
                    disabled && "opacity-30 grayscale cursor-not-allowed"
                )} 
                onClick={onClick} 
                disabled={disabled}
            >
                <div className="w-5 h-5">{icon}</div>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black text-xs border-white/10 shadow-xl">
            {label}
        </TooltipContent>
    </Tooltip>
);