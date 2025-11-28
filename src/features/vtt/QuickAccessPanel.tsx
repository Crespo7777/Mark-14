// src/features/vtt/QuickAccessPanel.tsx

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Folder, FileText, Search, X, Users, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface QuickAccessPanelProps {
  tableId: string;
  onOpenSheet: (type: 'character' | 'npc', id: string, name: string) => void;
  onClose: () => void;
}

export const QuickAccessPanel = ({ tableId, onOpenSheet, onClose }: QuickAccessPanelProps) => {
  const [search, setSearch] = useState("");

  // Buscar Dados
  const { data: folders = [] } = useQuery({
      queryKey: ['folders', tableId],
      queryFn: async () => (await supabase.from("folders").select("*").eq("table_id", tableId).order("name")).data || []
  });

  const { data: characters = [] } = useQuery({
      queryKey: ['characters', tableId],
      queryFn: async () => (await supabase.from("characters").select("id, name, folder_id").eq("table_id", tableId).order("name")).data || []
  });

  const { data: npcs = [] } = useQuery({
      queryKey: ['npcs', tableId],
      queryFn: async () => (await supabase.from("npcs").select("id, name, folder_id").eq("table_id", tableId).order("name")).data || []
  });

  // Organizar por Pastas
  const organizedData = () => {
      const items = [
          ...characters.map(c => ({ ...c, type: 'character' as const })), 
          ...npcs.map(n => ({ ...n, type: 'npc' as const }))
      ].filter(i => i.name.toLowerCase().includes(search.toLowerCase()));

      const folderMap: Record<string, typeof items> = {};
      const noFolder: typeof items = [];

      items.forEach(item => {
          if (item.folder_id) {
              if (!folderMap[item.folder_id]) folderMap[item.folder_id] = [];
              folderMap[item.folder_id].push(item);
          } else {
              noFolder.push(item);
          }
      });

      return { folderMap, noFolder };
  };

  const { folderMap, noFolder } = organizedData();

  return (
    <Card className="w-80 h-[500px] bg-black/90 border-white/20 backdrop-blur-xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-5">
        <CardHeader className="p-3 border-b border-white/10 flex flex-row items-center justify-between shrink-0">
            <CardTitle className="text-sm flex items-center gap-2 text-white">
                <FileText className="w-4 h-4 text-yellow-500" /> Acesso Rápido
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white" onClick={onClose}>
                <X className="w-3 h-3" />
            </Button>
        </CardHeader>
        
        <div className="p-2 border-b border-white/10 bg-white/5">
            <div className="relative">
                <Search className="absolute left-2 top-1.5 w-3 h-3 text-white/50" />
                <Input 
                    placeholder="Filtrar..." 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    className="h-7 pl-7 text-xs bg-black/50 border-white/10"
                />
            </div>
        </div>

        <CardContent className="p-0 flex-1 overflow-hidden">
            <ScrollArea className="h-full">
                <div className="p-2 space-y-1">
                    {/* Itens Sem Pasta */}
                    {noFolder.map(item => (
                        <div 
                            key={item.id} 
                            className="flex items-center gap-2 p-2 rounded-md hover:bg-white/10 cursor-pointer transition-colors group"
                            onClick={() => onOpenSheet(item.type, item.id, item.name)}
                        >
                            {item.type === 'character' ? <User className="w-3 h-3 text-blue-400"/> : <Users className="w-3 h-3 text-red-400"/>}
                            <span className="text-sm text-white/90 truncate flex-1">{item.name}</span>
                        </div>
                    ))}

                    {/* Pastas (Accordion) */}
                    <Accordion type="multiple" className="w-full">
                        {folders.map(folder => {
                            const contents = folderMap[folder.id];
                            if (!contents || contents.length === 0) return null; // Esconde pastas vazias no filtro

                            return (
                                <AccordionItem key={folder.id} value={folder.id} className="border-none">
                                    <AccordionTrigger className="py-2 px-2 hover:bg-white/5 hover:no-underline rounded-md text-sm text-yellow-500/90 font-normal">
                                        <div className="flex items-center gap-2">
                                            <Folder className="w-3.5 h-3.5 fill-current" />
                                            {folder.name}
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-1 pl-4">
                                        {contents.map(item => (
                                            <div 
                                                key={item.id} 
                                                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-white/10 cursor-pointer transition-colors"
                                                onClick={() => onOpenSheet(item.type, item.id, item.name)}
                                            >
                                                {item.type === 'character' ? <User className="w-3 h-3 text-blue-400"/> : <Users className="w-3 h-3 text-red-400"/>}
                                                <span className="text-xs text-white/80 truncate">{item.name}</span>
                                            </div>
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            );
                        })}
                    </Accordion>

                    {noFolder.length === 0 && Object.keys(folderMap).length === 0 && (
                        <p className="text-center text-xs text-white/30 py-8">Nada encontrado.</p>
                    )}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
  );
};