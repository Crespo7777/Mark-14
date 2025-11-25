// src/features/master/MasterSidebar.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Map as MapIcon, 
  Users, 
  Database, 
  Plus, 
  Trash2, 
  Play, 
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger, 
  DialogDescription // <-- IMPORTANTE
} from "@/components/ui/dialog";
import { MediaLibrary } from "@/components/MediaLibrary";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateNpcDialog } from "@/components/CreateNpcDialog";
import { MasterDatabaseTab } from "./MasterDatabaseTab";

export const MasterSidebar = ({ tableId, onAddToken }: { tableId: string, onAddToken: (type: 'npc'|'character', id: string) => void }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("scenes");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estados para criação rápida
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneImage, setNewSceneImage] = useState("");
  const [isCreatingScene, setIsCreatingScene] = useState(false);

  // Queries
  const { data: scenes = [] } = useQuery({ 
    queryKey: ['scenes', tableId], 
    queryFn: async () => (await supabase.from("scenes").select("*").eq("table_id", tableId)).data || [] 
  });
  const { data: npcs = [] } = useQuery({ 
    queryKey: ['npcs', tableId], 
    queryFn: async () => (await supabase.from("npcs").select("*").eq("table_id", tableId)).data || [] 
  });

  // Ações
  const handleCreateScene = async () => {
    if (!newSceneName) return;
    const { error } = await supabase.from("scenes").insert({ table_id: tableId, name: newSceneName, image_url: newSceneImage || "", grid_active: false });
    
    if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
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

  if (!isOpen) {
      return (
          <div className="absolute left-4 top-4 z-50">
              <Button size="icon" variant="secondary" onClick={() => setIsOpen(true)} className="rounded-full shadow-xl h-12 w-12 bg-black/80 border-white/10 text-white">
                  <ChevronRight />
              </Button>
          </div>
      );
  }

  return (
    <div className="absolute left-0 top-0 bottom-0 w-80 bg-black/90 backdrop-blur-md border-r border-white/10 z-50 flex flex-col animate-in slide-in-from-left duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <h2 className="font-bold text-white">Biblioteca</h2>
            <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-8 w-8 text-white/50 hover:text-white"><ChevronLeft /></Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-2 pt-2">
                <TabsList className="grid w-full grid-cols-3 bg-white/5 text-white/70">
                    <TabsTrigger value="scenes"><MapIcon className="w-4 h-4"/></TabsTrigger>
                    <TabsTrigger value="tokens"><Users className="w-4 h-4"/></TabsTrigger>
                    <TabsTrigger value="db"><Database className="w-4 h-4"/></TabsTrigger>
                </TabsList>
            </div>

            {/* CONTEÚDO: CENAS */}
            <TabsContent value="scenes" className="flex-1 flex flex-col min-h-0 p-0 m-0">
                <div className="p-4 pb-2">
                    <Dialog open={isCreatingScene} onOpenChange={setIsCreatingScene}>
                        <DialogTrigger asChild><Button className="w-full bg-green-700 hover:bg-green-600"><Plus className="w-4 h-4 mr-2"/> Nova Cena</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Nova Cena</DialogTitle>
                                {/* CORREÇÃO: Adicionada DialogDescription para resolver o erro do console */}
                                <DialogDescription>
                                    Configure o nome e a imagem de fundo da nova cena.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <Input value={newSceneName} onChange={e => setNewSceneName(e.target.value)} placeholder="Nome da Cena" />
                                <div className="flex gap-2">
                                    <Input value={newSceneImage} onChange={e => setNewSceneImage(e.target.value)} placeholder="URL da Imagem (Opcional)" />
                                    <MediaLibrary onSelect={setNewSceneImage} filter="image" />
                                </div>
                                <Button onClick={handleCreateScene} className="w-full">Criar</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                        {scenes.map(scene => (
                            <div key={scene.id} className="group flex items-center gap-2 p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 cursor-pointer transition-all">
                                <div className="h-10 w-10 rounded bg-black overflow-hidden shrink-0">
                                    {scene.image_url ? <img src={scene.image_url} className="w-full h-full object-cover" /> : <MapIcon className="w-full h-full p-2 text-white/20"/>}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <div className="font-medium truncate text-sm text-white">{scene.name}</div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-400 hover:text-green-300 hover:bg-green-900/30" onClick={() => handleActivateScene(scene.id)} title="Projetar">
                                        <Play className="w-3 h-3" />
                                    </Button>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-300 hover:bg-red-900/30" onClick={() => handleDeleteScene(scene.id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>

            {/* CONTEÚDO: TOKENS/NPCs */}
            <TabsContent value="tokens" className="flex-1 flex flex-col min-h-0 p-0 m-0">
                <div className="p-4 pb-2 flex gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-3 w-3 text-muted-foreground"/>
                        <Input placeholder="Buscar..." className="h-8 pl-7 bg-white/5 border-white/10 text-xs"/>
                     </div>
                     <CreateNpcDialog tableId={tableId} onNpcCreated={() => queryClient.invalidateQueries({queryKey: ['npcs', tableId]})}>
                        <Button size="icon" variant="secondary" className="h-8 w-8"><Plus className="w-4 h-4"/></Button>
                     </CreateNpcDialog>
                </div>
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-2">
                        {npcs.map(npc => (
                            <div key={npc.id} className="flex items-center justify-between p-2 rounded bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/20 group">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm text-white">{npc.name}</span>
                                    <span className="text-[10px] text-white/50">{(npc.data as any).race}</span>
                                </div>
                                <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-6 text-xs bg-white/10 hover:bg-white/20 text-white"
                                    onClick={() => onAddToken('npc', npc.id)}
                                >
                                    + Token
                                </Button>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </TabsContent>
            
            {/* CONTEÚDO: DATABASE */}
            <TabsContent value="db" className="flex-1 flex flex-col min-h-0 p-0 m-0 overflow-hidden">
                 <ScrollArea className="h-full">
                    <div className="p-2">
                        <MasterDatabaseTab tableId={tableId} />
                    </div>
                 </ScrollArea>
            </TabsContent>
        </Tabs>
    </div>
  );
};