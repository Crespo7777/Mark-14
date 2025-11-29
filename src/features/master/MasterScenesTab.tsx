// src/features/master/MasterScenesTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Scene } from "@/types/map-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// CORREÇÃO: Importar DialogDescription
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Map as MapIcon, Play, Trash2, UserPlus, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { MediaLibrary } from "@/components/MediaLibrary"; 
import { SceneBoard } from "@/features/map/SceneBoard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Helper para buscar listas
const fetchList = async (table: string, tableId: string) => {
  const { data } = await supabase.from(table).select("*").eq("table_id", tableId);
  return data || [];
};

export const MasterScenesTab = ({ tableId }: { tableId: string }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isCreating, setIsCreating] = useState(false);
  const [newSceneName, setNewSceneName] = useState("");
  const [newSceneImage, setNewSceneImage] = useState("");
  
  const [activeSceneId, setActiveSceneId] = useState<string | null>(null); 
  const [tokenToAdd, setTokenToAdd] = useState<{ type: 'character'|'npc', id: string } | null>(null);

  // Queries
  const { data: scenes = [] } = useQuery({ 
    queryKey: ['scenes', tableId], 
    queryFn: () => fetchList('scenes', tableId) as Promise<Scene[]> 
  });
  
  const { data: characters = [] } = useQuery({ queryKey: ['characters', tableId], queryFn: () => fetchList('characters', tableId) });
  const { data: npcs = [] } = useQuery({ queryKey: ['npcs', tableId], queryFn: () => fetchList('npcs', tableId) });

  // Criação de Cena
  const handleCreateScene = async () => {
    if (!newSceneName || !newSceneImage) return;
    
    const { error } = await supabase.from("scenes").insert({
        table_id: tableId,
        name: newSceneName,
        image_url: newSceneImage,
        grid_active: false
    });

    if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Cena criada!" });
        setNewSceneName(""); 
        setNewSceneImage(""); 
        setIsCreating(false);
        queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
    }
  };

  const handleActivateGlobal = async (sceneId: string) => {
     await supabase.from("game_states").update({ current_scene_id: sceneId }).eq("table_id", tableId);
     toast({ title: "Cena Ativada!", description: "Jogadores agora veem este mapa." });
  };

  const handleStopGlobal = async () => {
     await supabase.from("game_states").update({ current_scene_id: null }).eq("table_id", tableId);
     toast({ title: "Cena Oculta", description: "Jogadores veem o teatro da mente." });
  };

  const handleAddToken = async () => {
     if (!activeSceneId || !tokenToAdd) return;
     
     const payload: any = {
         scene_id: activeSceneId,
         x: 50, y: 50, scale: 1
     };

     if (tokenToAdd.type === 'character') payload.character_id = tokenToAdd.id;
     else payload.npc_id = tokenToAdd.id;

     const { error } = await supabase.from("scene_tokens").insert(payload);
     if (error) toast({ title: "Erro", description: error.message });
     else toast({ title: "Token adicionado ao centro do mapa." });
  };

  const handleDeleteScene = async (id: string) => {
      if (!confirm("Apagar esta cena e todos os tokens?")) return;
      await supabase.from("scenes").delete().eq("id", id);
      if (activeSceneId === id) setActiveSceneId(null);
      queryClient.invalidateQueries({ queryKey: ['scenes', tableId] });
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
           <h3 className="text-lg font-semibold flex items-center gap-2"><MapIcon /> Mapas & Cenas</h3>
           
           <Dialog open={isCreating} onOpenChange={setIsCreating}>
               <DialogTrigger asChild>
                   <Button><Plus className="w-4 h-4 mr-2"/> Nova Cena</Button>
               </DialogTrigger>
               <DialogContent>
                   <DialogHeader>
                       <DialogTitle>Criar Cena</DialogTitle>
                       {/* ADICIONADO DESCRIÇÃO */}
                       <DialogDescription>
                           Configure o nome e a imagem de fundo do seu novo mapa tático ou cenário.
                       </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-4 py-4">
                       <div className="space-y-2">
                           <Label>Nome</Label>
                           <Input value={newSceneName} onChange={e => setNewSceneName(e.target.value)} placeholder="Ex: Masmorra Nível 1"/>
                       </div>
                       
                       <div className="space-y-2">
                           <Label>Imagem de Fundo (Mapa)</Label>
                           
                           {newSceneImage && (
                               <div className="relative aspect-video rounded border overflow-hidden mb-2 group">
                                   <img src={newSceneImage} className="w-full h-full object-cover" />
                                   <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setNewSceneImage("")}>
                                       <Trash2 className="w-3 h-3" />
                                   </Button>
                               </div>
                           )}

                           <div className="flex gap-2">
                               <Input 
                                   value={newSceneImage} 
                                   onChange={e => setNewSceneImage(e.target.value)} 
                                   placeholder="URL manual ou selecione..."
                                   className="flex-1"
                               />
                               <MediaLibrary 
                                   onSelect={(url) => setNewSceneImage(url)} 
                                   filter="image" 
                                   trigger={<Button variant="secondary">Biblioteca</Button>}
                               />
                           </div>
                       </div>
                       
                       <Button onClick={handleCreateScene} className="w-full" disabled={!newSceneName || !newSceneImage}>
                           Criar Cena
                       </Button>
                   </div>
               </DialogContent>
           </Dialog>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
           {/* Lista de Cenas */}
           <Card className="col-span-1 flex flex-col">
               <CardHeader><CardTitle className="text-sm">Biblioteca de Cenas</CardTitle></CardHeader>
               <CardContent className="flex-1 overflow-y-auto space-y-2 p-2">
                   {scenes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sem cenas.</p>}
                   
                   {scenes.map(scene => (
                       <div 
                           key={scene.id} 
                           className={`p-3 rounded border flex flex-col gap-2 cursor-pointer hover:bg-accent/50 transition-colors ${activeSceneId === scene.id ? "border-primary bg-accent/20" : ""}`} 
                           onClick={() => setActiveSceneId(scene.id)}
                       >
                           <div className="flex justify-between items-center">
                               <span className="font-bold truncate text-sm">{scene.name}</span>
                               <div className="flex gap-1">
                                   <Button size="icon" variant="ghost" className="h-6 w-6 text-green-500 hover:text-green-400 hover:bg-green-900/20" title="Projetar para Jogadores" onClick={(e) => {e.stopPropagation(); handleActivateGlobal(scene.id);}}>
                                      <Play className="w-3 h-3" />
                                   </Button>
                                   <Button size="icon" variant="ghost" className="h-6 w-6 text-destructive hover:text-red-400 hover:bg-red-900/20" onClick={(e) => {e.stopPropagation(); handleDeleteScene(scene.id);}}>
                                      <Trash2 className="w-3 h-3" />
                                   </Button>
                               </div>
                           </div>
                           <div className="h-24 w-full bg-black/40 rounded overflow-hidden border border-white/5">
                               <img src={scene.image_url} className="w-full h-full object-cover opacity-80" loading="lazy" />
                           </div>
                       </div>
                   ))}
                   
                   <Button variant="outline" className="w-full mt-4 border-dashed" onClick={handleStopGlobal}>
                       <Eye className="w-4 h-4 mr-2" /> Ocultar Cena Global
                   </Button>
               </CardContent>
           </Card>

           {/* Editor de Cena */}
           <Card className="col-span-1 lg:col-span-2 flex flex-col bg-muted/5 border-dashed">
               {activeSceneId ? (
                   <>
                     <div className="p-2 border-b flex items-center gap-2 justify-between bg-card rounded-t-lg">
                         <div className="flex items-center gap-2">
                             <Select onValueChange={(v) => {
                                 const [type, id] = v.split(':');
                                 setTokenToAdd({ type: type as any, id });
                             }}>
                                <SelectTrigger className="w-[200px] h-8 text-xs"><SelectValue placeholder="Escolher Token..." /></SelectTrigger>
                                <SelectContent>
                                    {characters.map(c => <SelectItem key={c.id} value={`character:${c.id}`}>PJ: {c.name}</SelectItem>)}
                                    {npcs.map(n => <SelectItem key={n.id} value={`npc:${n.id}`}>NPC: {n.name}</SelectItem>)}
                                </SelectContent>
                             </Select>
                             <Button size="sm" variant="secondary" className="h-8 text-xs" onClick={handleAddToken} disabled={!tokenToAdd}>
                                 <UserPlus className="w-3 h-3 mr-2"/> Add Token
                             </Button>
                         </div>
                         <div className="text-xs text-muted-foreground font-mono">
                             {scenes.find(s => s.id === activeSceneId)?.name}
                         </div>
                     </div>
                     <div className="flex-1 relative overflow-hidden p-2 bg-black/50">
                         <SceneBoard sceneId={activeSceneId} isMaster={true} className="rounded border border-white/10" />
                     </div>
                   </>
               ) : (
                   <div className="flex-1 flex flex-col gap-2 items-center justify-center text-muted-foreground">
                       <MapIcon className="w-12 h-12 opacity-20" />
                       <p>Selecione uma cena à esquerda para editar.</p>
                   </div>
               )}
           </Card>
       </div>
    </div>
  );
};