// src/components/GlobalSearchDialog.tsx

import { useState, useEffect } from "react";
import { 
  CommandDialog, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList, 
  CommandSeparator 
} from "@/components/ui/command";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  Search, Sword, Shield, User, Map as MapIcon, 
  Package, Zap, FileText, ExternalLink 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

// Tipos para os resultados
type SearchResult = {
  id: string;
  type: 'item' | 'npc' | 'scene' | 'character';
  title: string;
  subtitle?: string;
  data?: any; // Para mostrar detalhes rápidos
};

interface GlobalSearchDialogProps {
  tableId: string;
  trigger?: React.ReactNode; // Botão opcional para abrir
}

export const GlobalSearchDialog = ({ tableId, trigger }: GlobalSearchDialogProps) => {
  const [open, setOpen] = useState(false);
  const [previewItem, setPreviewItem] = useState<SearchResult | null>(null);
  const navigate = useNavigate();

  // Atalho de Teclado (Ctrl+K ou Cmd+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Busca Unificada (Executa quando abre o modal para pré-carregar ou usa search term)
  // Nota: Para grandes bases de dados, idealmente faríamos a busca no servidor (RPC).
  // Como é uma mesa específica, buscar tudo e filtrar no cliente é geralmente rápido o suficiente (até ~5000 itens).
  const { data: results = [] } = useQuery({
    queryKey: ['global_search', tableId],
    queryFn: async () => {
        // 1. Buscar Itens do Compêndio
        const { data: items } = await supabase
            .from("items")
            .select("id, name, type, description, data")
            .eq("table_id", tableId);

        // 2. Buscar NPCs
        const { data: npcs } = await supabase
            .from("npcs")
            .select("id, name, data")
            .eq("table_id", tableId);

        // 3. Buscar Cenas
        const { data: scenes } = await supabase
            .from("scenes")
            .select("id, name")
            .eq("table_id", tableId);

        const mappedItems = (items || []).map((i: any) => ({
            id: i.id,
            type: 'item' as const,
            title: i.name,
            subtitle: i.type,
            data: i // Guardamos tudo para o preview
        }));

        const mappedNpcs = (npcs || []).map((n: any) => ({
            id: n.id,
            type: 'npc' as const,
            title: n.name,
            subtitle: (n.data as any)?.race || "NPC",
            data: n.data
        }));

        const mappedScenes = (scenes || []).map((s: any) => ({
            id: s.id,
            type: 'scene' as const,
            title: s.name,
            subtitle: "Mapa",
            data: {}
        }));

        return [...mappedItems, ...mappedNpcs, ...mappedScenes];
    },
    enabled: open, // Só busca quando abre o diálogo
    staleTime: 1000 * 60 * 5 // Cache de 5 minutos
  });

  const handleSelect = (result: SearchResult) => {
      setOpen(false);
      
      // Ação baseada no tipo
      if (result.type === 'scene') {
          // Exemplo: Navegar ou ativar cena (depende da tua lógica de routing)
          // supabase.from("game_states").update({ current_scene_id: result.id }).eq("table_id", tableId);
          // toast({ title: "Cena localizada" });
      } else {
          // Para Itens e NPCs, abrimos um "Preview Rápido"
          setPreviewItem(result);
      }
  };

  const getIcon = (type: string) => {
      switch(type) {
          case 'item': return <Package className="mr-2 h-4 w-4" />;
          case 'npc': return <User className="mr-2 h-4 w-4" />;
          case 'scene': return <MapIcon className="mr-2 h-4 w-4" />;
          default: return <Search className="mr-2 h-4 w-4" />;
      }
  };

  return (
    <>
      {/* Gatilho (Botão) */}
      <div onClick={() => setOpen(true)} className="cursor-pointer">
          {trigger || (
            <Button variant="outline" className="text-muted-foreground text-xs h-8 px-2 w-full justify-between bg-muted/50 border-muted">
                <span className="flex items-center gap-2"><Search className="w-3 h-3"/> Pesquisar...</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>
          )}
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Digite para pesquisar itens, npcs, regras..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          
          {/* GRUPO: ITENS */}
          <CommandGroup heading="Itens & Compêndio">
            {results.filter(r => r.type === 'item').map((result) => (
                <CommandItem key={result.id} value={`${result.title} ${result.subtitle}`} onSelect={() => handleSelect(result)}>
                    {getIcon(result.type)}
                    <span>{result.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground capitalize">{result.subtitle}</span>
                </CommandItem>
            ))}
          </CommandGroup>
          
          <CommandSeparator />

          {/* GRUPO: PERSONAGENS */}
          <CommandGroup heading="Personagens & NPCs">
            {results.filter(r => r.type === 'npc').map((result) => (
                <CommandItem key={result.id} value={result.title} onSelect={() => handleSelect(result)}>
                    {getIcon(result.type)}
                    <span>{result.title}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{result.subtitle}</span>
                </CommandItem>
            ))}
          </CommandGroup>

          <CommandSeparator />

          {/* GRUPO: CENAS */}
          <CommandGroup heading="Cenas">
            {results.filter(r => r.type === 'scene').map((result) => (
                <CommandItem key={result.id} value={result.title} onSelect={() => handleSelect(result)}>
                    {getIcon(result.type)}
                    <span>{result.title}</span>
                </CommandItem>
            ))}
          </CommandGroup>

        </CommandList>
      </CommandDialog>

      {/* DIÁLOGO DE PREVIEW (Detalhes Rápidos) */}
      <Dialog open={!!previewItem} onOpenChange={(o) => !o && setPreviewItem(null)}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      {previewItem && getIcon(previewItem.type)}
                      {previewItem?.title}
                  </DialogTitle>
                  <DialogDescription>
                      {previewItem?.subtitle}
                  </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                  {previewItem?.type === 'item' && (
                      <div className="text-sm space-y-2">
                          <div className="bg-muted p-3 rounded-md border text-muted-foreground italic">
                              {previewItem.data?.description?.replace(/<[^>]*>?/gm, '') || "Sem descrição."}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                              {previewItem.data.data?.damage && <div className="border p-2 rounded text-xs"><span className="font-bold">Dano:</span> {previewItem.data.data.damage}</div>}
                              {previewItem.data.data?.protection && <div className="border p-2 rounded text-xs"><span className="font-bold">Proteção:</span> {previewItem.data.data.protection}</div>}
                              {previewItem.data.data?.price && <div className="border p-2 rounded text-xs"><span className="font-bold">Preço:</span> {previewItem.data.data.price}</div>}
                              {previewItem.data.weight > 0 && <div className="border p-2 rounded text-xs"><span className="font-bold">Peso:</span> {previewItem.data.weight}</div>}
                          </div>
                      </div>
                  )}

                  {previewItem?.type === 'npc' && (
                      <div className="text-sm">
                          <p>Ficha rápida não disponível neste preview.</p>
                          <Button variant="link" className="px-0" onClick={() => {/* Lógica para abrir ficha completa */}}>
                              Abrir Ficha Completa <ExternalLink className="ml-2 w-3 h-3"/>
                          </Button>
                      </div>
                  )}
              </div>
          </DialogContent>
      </Dialog>
    </>
  );
};