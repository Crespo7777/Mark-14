// src/features/master/MasterSidebar.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Map as MapIcon, Users, UserSquare, Plus, Play, Trash2, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaLibrary } from "@/components/MediaLibrary";
import { useToast } from "@/hooks/use-toast";
import { CreateNpcDialog } from "@/components/CreateNpcDialog";
import { CreateCharacterDialog } from "@/components/CreateCharacterDialog";
import { useTableContext } from "@/features/table/TableContext";
import { CharacterSheetSheet } from "@/components/CharacterSheetSheet";

interface MasterSidebarProps {
    tableId: string;
    isOpen: boolean;
    setIsOpen: (v: boolean) => void;
    onAddToken: (type: 'npc' | 'character', id: string) => void;
}

export const MasterSidebar = ({ tableId, isOpen, setIsOpen, onAddToken }: MasterSidebarProps) => {
  const [activeTab, setActiveTab] = useState("scenes");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { masterId, members } = useTableContext();

  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneImage, setNewSceneImage] = useState("");
  const [isCreatingScene, setIsCreatingScene] = useState(false);

  const { data: scenes = [] } = useQuery({ 
    queryKey: ['scenes', tableId], 
    queryFn: async () => (await supabase.from("scenes").select("*").eq("table_id", tableId)).data || [] 
  });
  const { data: npcs = [] } = useQuery({ 
    queryKey: ['npcs', tableId], 
    queryFn: async () => (await supabase.from("npcs").select("*").eq("table_id", tableId)).data || [] 
  });
  const { data: characters = [] } = useQuery({
    queryKey: ['characters', tableId],
    queryFn: async () => (await supabase.from("characters").select("*, player:profiles!characters_player_id_fkey(display_name)").eq("table_id", tableId)).data || []
  });

  const handleCreateScene = async () => {
    if (!newSceneName) return;
    const { error } = await supabase.from("scenes").insert({ table_id: tableId, name: newSceneName, image_url: newSceneImage || "", grid_active: false });
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
        toast({ title: "Cena Criada" });
        setNewSceneName(""); setNewSceneImage(""); setIsCreatingScene(false);
        queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
    }
  };

  const handleActivateScene = async (sceneId: string) => {
    await supabase.from("game_states").update({ current_scene_id: sceneId }).eq("table_id", tableId);
    toast({ title: "Cena Projetada!" });
  };

  const handleDeleteScene = async (id: string) => {
      if(!confirm("Apagar cena?")) return;
      await supabase.from("scenes").delete().eq("id", id);
      queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
  };

  return (
    <div className="h-full w-full bg-black/95 backdrop-blur-md border-r border-white/10 flex flex-col shadow-2xl">
        {/* Header com botão de fechar */}
        <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center h-14 shrink-0">
            <h2 className="font-bold text-white text-sm uppercase tracking-wider flex items-center gap-2">
                Biblioteca
            </h2>
            <Button 
                variant="ghost" size="icon" 
                className="h-8 w-8 hover:bg-white/10 text-white/70 hover:text-white"
                onClick={() => setIsOpen(false)}
            >
                <X className="w-4 h-4" />
            </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-2 pt-2">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 text-white/70 h-10 border border-white/5">
                    <TabsTrigger value="scenes" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white"><MapIcon className="w-4 h-4 mr-2"/>Cenas</TabsTrigger>
                    <TabsTrigger value="tokens" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white"><Users className="w-4 h-4 mr-2"/>NPCs</TabsTrigger>
                    <TabsTrigger value="chars" className="text-xs data-[state=active]:bg-white/10 data-[state=active]:text-white"><UserSquare className="w-4 h-4 mr-2"/>PCs</TabsTrigger>
                </TabsList>
            </div>

            {/* CONTEÚDO: CENAS */}
            <TabsContent value="scenes" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                <div className="p-3">
                    <Dialog open={isCreatingScene} onOpenChange={setIsCreatingScene}>
                        <DialogTrigger asChild><Button className="w-full bg-green-700 hover:bg-green-600 h-9 text-xs font-bold shadow-lg"><Plus className="w-3 h-3 mr-2"/> Nova Cena</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Criar Nova Cena</DialogTitle><DialogDescription>Configure o mapa.</DialogDescription></DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input value={newSceneName} onChange={e => setNewSceneName(e.target.value)} placeholder="Nome da Cena" />
                                <div className="flex gap-2">
                                    <Input value={newSceneImage} onChange={e => setNewSceneImage(e.target.value)} placeholder="URL da Imagem" />
                                    <MediaLibrary onSelect={setNewSceneImage} filter="image" />
                                </div>
                                <Button onClick={handleCreateScene} className="w-full">Criar</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <ScrollArea className="flex-1 p-3 pt-0">
                    <div className="space-y-2">
                        {scenes.map(scene => (
                            <div key={scene.id} className="group flex items-center gap-3 p-2 rounded-md bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 cursor-pointer transition-all">
                                <div className="h-12 w-12 rounded-md bg-black/50 overflow-hidden shrink-0 border border-white/10 relative">
                                    {scene.image_url ? <img src={scene.image_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" /> : <MapIcon className="w-full h-full p-3 text-white/20"/>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-bold text-sm text-white truncate">{scene.name}</div>
                                    <div className="text-[10px] text-white/40 uppercase">Cena</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:bg-green-900/30" onClick={() => handleActivateScene(scene.id)} title="Projetar">
                                        <Play className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:bg-red-900/30" onClick={() => handleDeleteScene(scene.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>

            {/* CONTEÚDO: NPCs (Tokens) */}
            <TabsContent value="tokens" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                <div className="p-3 pb-1 flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground"/>
                        <Input placeholder="Filtrar NPCs..." className="h-8 pl-7 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/40"/>
                     </div>
                     <CreateNpcDialog tableId={tableId} onNpcCreated={() => queryClient.invalidateQueries({queryKey: ['npcs', tableId]})}>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white"><Plus className="w-4 h-4"/></Button>
                     </CreateNpcDialog>
                </div>
                <ScrollArea className="flex-1 p-3">
                    <div className="grid grid-cols-1 gap-2">
                        {npcs.map(npc => (
                            <div key={npc.id} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 group">
                                <div className="flex flex-col overflow-hidden">
                                    <span className="font-bold text-sm text-white truncate">{npc.name}</span>
                                    <span className="text-[10px] text-white/50 truncate">{(npc.data as any).race}</span>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-7 text-[10px] bg-white/10 hover:bg-green-600 hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => onAddToken('npc', npc.id)}
                                >
                                    + Token
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
            
            {/* CONTEÚDO: PERSONAGENS (Fichas) */}
            <TabsContent value="chars" className="flex-1 flex flex-col min-h-0 p-0 m-0 data-[state=inactive]:hidden">
                <div className="p-3 pb-1 flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground"/>
                        <Input placeholder="Filtrar Personagens..." className="h-8 pl-7 bg-white/5 border-white/10 text-xs text-white placeholder:text-white/40"/>
                     </div>
                     <CreateCharacterDialog tableId={tableId} masterId={masterId} members={members} onCharacterCreated={() => queryClient.invalidateQueries({queryKey: ['characters', tableId]})}>
                        <Button size="icon" variant="secondary" className="h-8 w-8 bg-white/10 hover:bg-white/20 border border-white/10 text-white"><Plus className="w-4 h-4"/></Button>
                     </CreateCharacterDialog>
                </div>
                <ScrollArea className="flex-1 p-3">
                    <div className="grid grid-cols-1 gap-2">
                        {characters.map(char => (
                            <CharacterSheetSheet key={char.id} characterId={char.id}>
                                <div className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 group cursor-pointer">
                                    <div className="flex flex-col overflow-hidden">
                                        <span className="font-bold text-sm text-white truncate">{char.name}</span>
                                        <span className="text-[10px] text-white/50 truncate flex items-center gap-1">
                                            <UserSquare className="w-3 h-3"/> 
                                            {char.player?.display_name || "Sem Jogador"}
                                        </span>
                                    </div>
                                    <Button 
                                        size="sm" 
                                        variant="ghost" 
                                        className="h-7 text-[10px] bg-white/10 hover:bg-green-600 hover:text-white border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            onAddToken('character', char.id);
                                        }}
                                    >
                                        + Token
                                    </Button>
                                </div>
                            </CharacterSheetSheet>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
        </Tabs>
    </div>
  );
};