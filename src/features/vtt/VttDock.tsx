// src/features/vtt/VttDock.tsx

import { useState, useEffect } from "react";
import { useTableContext } from "@/features/table/TableContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { 
  Map as MapIcon, 
  Users, 
  Box, 
  StickyNote, 
  Swords, 
  Settings, 
  Search, 
  Plus, 
  Grid3X3 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Tipos para os itens da Dock
type DockCategory = 'scenes' | 'tokens' | 'props' | 'notes' | 'tools';

interface DockItem {
  id: string;
  name: string;
  image?: string;
  type: 'scene' | 'npc' | 'character' | 'prop';
  data?: any; // Dados extras (ex: stats do NPC)
}

export const VttDock = ({ tableId, onDragStart }: { tableId: string, onDragStart: (item: DockItem) => void }) => {
  const { isMaster } = useTableContext();
  const [activeCategory, setActiveCategory] = useState<DockCategory | null>(null);
  const [search, setSearch] = useState("");

  // --- QUERIES (Busca dados reais) ---
  const { data: scenes = [] } = useQuery({
    queryKey: ['scenes', tableId],
    queryFn: async () => (await supabase.from("scenes").select("*").eq("table_id", tableId)).data || [],
    enabled: activeCategory === 'scenes'
  });

  const { data: npcs = [] } = useQuery({
    queryKey: ['npcs', tableId],
    queryFn: async () => (await supabase.from("npcs").select("*").eq("table_id", tableId)).data || [],
    enabled: activeCategory === 'tokens'
  });

  const { data: characters = [] } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: async () => (await supabase.from("characters").select("*").eq("table_id", tableId)).data || [],
    enabled: activeCategory === 'tokens'
  });

  // --- COMBINAR DADOS PARA A LISTA ---
  const getItems = (): DockItem[] => {
      if (activeCategory === 'scenes') {
          return scenes.map(s => ({ id: s.id, name: s.name, image: s.image_url, type: 'scene' }));
      }
      if (activeCategory === 'tokens') {
          const npcItems = npcs.map(n => ({ id: n.id, name: n.name, type: 'npc' as const, data: n.data }));
          const charItems = characters.map(c => ({ id: c.id, name: c.name, type: 'character' as const, data: c.data }));
          return [...charItems, ...npcItems]; // Personagens primeiro
      }
      return []; // Props e Notas implementaremos depois se quiseres
  };

  const items = getItems().filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 w-full max-w-4xl px-4 pointer-events-none">
        
        {/* ÁREA DE CONTEÚDO (Só aparece se uma categoria estiver ativa) */}
        {activeCategory && (
            <div className="w-full bg-black/90 backdrop-blur-md border border-white/10 rounded-xl p-2 shadow-2xl animate-in slide-in-from-bottom-4 duration-200 pointer-events-auto">
                
                {/* Barra de Topo (Search + Filtros) */}
                <div className="flex items-center gap-2 mb-2 px-1">
                    <div className="relative flex-1">
                        <Search className="absolute left-2 top-1.5 w-4 h-4 text-white/50" />
                        <Input 
                            className="h-7 pl-8 bg-white/5 border-white/10 text-xs text-white focus:bg-black" 
                            placeholder={`Pesquisar ${activeCategory}...`}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-white/50 hover:text-white" onClick={() => setActiveCategory(null)}>
                        <Plus className="w-4 h-4 rotate-45" /> {/* Ícone de Fechar X */}
                    </Button>
                </div>

                {/* Lista Horizontal de Itens */}
                <ScrollArea className="w-full whitespace-nowrap">
                    <div className="flex gap-2 pb-2">
                        {items.length === 0 && (
                            <div className="w-full text-center text-xs text-white/30 py-4 italic">
                                Nada encontrado.
                            </div>
                        )}

                        {items.map(item => (
                            <div 
                                key={item.id}
                                className="group relative flex flex-col items-center gap-1 w-20 shrink-0 cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={(e) => {
                                    // Guarda dados no evento para o drop funcionar
                                    e.dataTransfer.setData("application/json", JSON.stringify(item));
                                    onDragStart(item);
                                }}
                            >
                                {/* Preview Visual */}
                                <div className="w-16 h-16 rounded-lg bg-white/10 border border-white/10 overflow-hidden group-hover:border-primary/50 transition-colors relative">
                                    {item.image ? (
                                        <img src={item.image} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20">
                                            {item.type === 'scene' && <MapIcon />}
                                            {(item.type === 'npc' || item.type === 'character') && <Users />}
                                        </div>
                                    )}
                                    {/* Badge de Tipo */}
                                    <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] px-1 text-white/70 rounded-tl-sm">
                                        {item.type.toUpperCase().substring(0,3)}
                                    </div>
                                </div>
                                {/* Nome */}
                                <span className="text-[10px] text-white/70 truncate w-full text-center group-hover:text-white">
                                    {item.name}
                                </span>
                            </div>
                        ))}
                    </div>
                    <ScrollBar orientation="horizontal" className="bg-white/10 h-2" />
                </ScrollArea>
            </div>
        )}

        {/* BARRA DE CATEGORIAS (Sempre visível) */}
        <div className="flex items-center gap-1 bg-black/80 backdrop-blur-xl p-1.5 rounded-2xl border border-white/10 shadow-2xl pointer-events-auto">
            
            <DockButton 
                icon={<MapIcon />} 
                label="Mapas & Cenas" 
                active={activeCategory === 'scenes'} 
                onClick={() => setActiveCategory(activeCategory === 'scenes' ? null : 'scenes')}
                disabled={!isMaster} // Só mestre vê cenas
            />
            
            <div className="w-px h-6 bg-white/10 mx-1" />
            
            <DockButton 
                icon={<Users />} 
                label="Tokens (Personagens & NPCs)" 
                active={activeCategory === 'tokens'} 
                onClick={() => setActiveCategory(activeCategory === 'tokens' ? null : 'tokens')}
            />
            
            <DockButton 
                icon={<Box />} 
                label="Objetos & Props" 
                active={activeCategory === 'props'} 
                onClick={() => setActiveCategory(activeCategory === 'props' ? null : 'props')}
                disabled // Futuro
            />

            <div className="w-px h-6 bg-white/10 mx-1" />

            <DockButton 
                icon={<Swords />} 
                label="Combate" 
                active={false} // Abre o Tracker original
                onClick={() => document.dispatchEvent(new CustomEvent('toggle-combat-tracker'))} // Hack simples para abrir o tracker existente
            />

             <DockButton 
                icon={<StickyNote />} 
                label="Notas" 
                active={activeCategory === 'notes'} 
                onClick={() => setActiveCategory(activeCategory === 'notes' ? null : 'notes')}
                disabled // Futuro
            />

            <div className="w-px h-6 bg-white/10 mx-1" />

            <DockButton 
                icon={<Settings />} 
                label="Definições" 
                active={false} 
                onClick={() => {}} 
            />
        </div>
    </div>
  );
};

// Pequeno componente auxiliar para botões da Dock
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
                {/* Clona o ícone para ajustar tamanho */}
                <div className="w-5 h-5">{icon}</div>
            </Button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-black text-xs border-white/10">
            {label}
        </TooltipContent>
    </Tooltip>
);