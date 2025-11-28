// src/features/map/SceneBoard.tsx

import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scene, SceneToken } from "@/types/map-types";
import { MapToken } from "./MapToken";
import { useToast } from "@/hooks/use-toast";
import { 
  Loader2, Eye, EyeOff, MapPin, Map as MapIcon, 
  Plus, ZoomIn, ZoomOut, Move, Skull, Lock, 
  FileText, Trash2, Copy, Settings, Eraser, Maximize, User, 
  CloudFog, MonitorPlay, MoreVertical 
} from "lucide-react";
import { cn } from "@/lib/utils"; 
import { FogLayer } from "./FogLayer"; 
import { MapCursors } from "./MapCursors";
import { Button } from "@/components/ui/button"; 
import { useTableContext } from "@/features/table/TableContext"; 
import { 
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, 
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle 
} from "@/components/ui/alert-dialog";

interface SceneBoardProps {
  sceneId: string | null;
  isMaster: boolean;
  className?: string;
}

const CURSOR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

export const SceneBoard = ({ sceneId, isMaster, className }: SceneBoardProps) => {
  const { tableId } = useTableContext();
  const { toast } = useToast();
  
  // --- ESTADOS DE DADOS ---
  const [scene, setScene] = useState<Scene | null>(null);
  const [tokens, setTokens] = useState<SceneToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [globalSceneId, setGlobalSceneId] = useState<string | null>(null); // Para saber se o mapa está "No Ar"
  
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const isPanningRef = useRef(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // --- ESTADOS DE INTERAÇÃO ---
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [activePings, setActivePings] = useState<{id: number, x: number, y: number, color: string}[]>([]);
  
  // --- PRESENÇA (Realtime) ---
  const [otherCursors, setOtherCursors] = useState<Record<string, any>>({});
  const [myColor] = useState(() => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  // --- MENU DE CONTEXTO (HUD) ---
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tokenId?: string, mapX?: number, mapY?: number } | null>(null);

  // --- REFS (Performance) ---
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const channelRef = useRef<any>(null);
  const userInfoRef = useRef<{ id: string, name: string } | null>(null);
  const lastCursorUpdate = useRef(0);

  // 1. INICIALIZAÇÃO (User)
  useEffect(() => {
      const fetchUser = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) userInfoRef.current = { id: user.id, name: user.email?.split('@')[0] || "User" };
      };
      fetchUser();
  }, []);

  // 2. MONITORIZAR ESTADO GLOBAL (Saber se a cena está ativa)
  useEffect(() => {
      if (!tableId) return;
      const fetchState = async () => {
          const { data } = await supabase.from("game_states").select("current_scene_id").eq("table_id", tableId).single();
          if(data) setGlobalSceneId(data.current_scene_id);
      };
      fetchState();

      const channel = supabase.channel(`scene-board-global:${tableId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
        (payload: any) => setGlobalSceneId(payload.new.current_scene_id))
        .subscribe();

      return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // 3. FUNÇÃO AUXILIAR (Buscar Token Novo)
  const fetchNewToken = async (id: string) => {
      const { data } = await supabase.from("scene_tokens").select(`*, character:characters(name, data), npc:npcs(name, data)`).eq("id", id).single();
      if (data) setTokens(prev => prev.find(t => t.id === data.id) ? prev : [...prev, data as any]);
  };

  // 4. REALTIME (Cursores e Pings)
  useEffect(() => {
      if (!tableId || !sceneId) return;
      
      const channel = supabase.channel(`scene_tracking:${sceneId}`, { config: { presence: { key: (Math.random() + 1).toString(36).substring(7) } } });
      
      channel
        .on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            const cursors: Record<string, any> = {};
            Object.values(newState).forEach((presences: any) => { 
                presences.forEach((p: any) => { 
                    if (p.cursor && p.user_id !== userInfoRef.current?.id) cursors[p.user_id] = p.cursor; 
                }); 
            });
            setOtherCursors(cursors);
        })
        .on('broadcast', { event: 'ping' }, (payload) => triggerPingVisual(payload.payload.x, payload.payload.y, payload.payload.color))
        .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && userInfoRef.current) {
                await channel.track({ user_id: userInfoRef.current.id, online_at: new Date().toISOString(), cursor: null });
            }
        });

      channelRef.current = channel;
      return () => { supabase.removeChannel(channel); };
  }, [sceneId, tableId]);

  // 5. CARREGAR DADOS DA CENA E TOKENS
  useEffect(() => {
    if (!sceneId) { setScene(null); setTokens([]); return; }
    
    const fetchData = async () => {
       setLoading(true);
       const { data: sceneData } = await supabase.from("scenes").select("*").eq("id", sceneId).maybeSingle();
       if(sceneData) {
           setScene(sceneData as Scene);
           const { data: tokensData } = await supabase.from("scene_tokens").select(`*, character:characters(name, data), npc:npcs(name, data)`).eq("scene_id", sceneId);
           if (tokensData) setTokens(tokensData as any);
           setScale(1); setPan({ x: 0, y: 0 }); // Reset Zoom ao mudar de cena
       }
       setLoading(false);
    };
    fetchData();

    const dbChannel = supabase.channel(`scene-db:${sceneId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scenes', filter: `id=eq.${sceneId}` }, (payload) => setScene(payload.new as Scene))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scene_tokens', filter: `scene_id=eq.${sceneId}` }, (payload) => {
         if (payload.eventType === 'INSERT') { 
             const newToken = payload.new as any; 
             if (newToken.character_id || newToken.npc_id) fetchNewToken(newToken.id); 
             else setTokens(prev => [...prev, newToken]); 
         } 
         else if (payload.eventType === 'DELETE') setTokens(prev => prev.filter(t => t.id !== payload.old.id));
         else if (payload.eventType === 'UPDATE') setTokens(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
      })
      .subscribe();

    return () => { supabase.removeChannel(dbChannel); };
  }, [sceneId]);
  
  // 6. DIMENSÕES
  useEffect(() => { 
      const updateDimensions = () => { 
          if (imageRef.current) setDimensions({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight }); 
      }; 
      window.addEventListener('resize', updateDimensions); 
      const timer = setTimeout(updateDimensions, 200); 
      return () => { window.removeEventListener('resize', updateDimensions); clearTimeout(timer); }; 
  }, [scene?.image_url]);

  // --- NAVEGAÇÃO (Pan & Zoom) ---
  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.1, scale + (-e.deltaY * zoomSensitivity)), 5); 
      setScale(newScale);
      setContextMenu(null);
  };

  const startPan = (e: React.MouseEvent) => {
      if (contextMenu) setContextMenu(null);
      // Ignorar clique em botões
      if ((e.target as HTMLElement).closest('button, input')) return;

      // Botão Esquerdo ou Meio
      if (e.button === 0 || e.button === 1) {
          setIsPanning(true);
          isPanningRef.current = false;
          setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
  };

  const doPan = (e: React.MouseEvent) => {
      if (isPanning) {
          e.preventDefault();
          // Threshold para distinguir clique de arrasto
          if (!isPanningRef.current && (Math.abs(e.clientX - (pan.x + panStart.x)) > 5 || Math.abs(e.clientY - (pan.y + panStart.y)) > 5)) {
             isPanningRef.current = true;
          }
          setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
      } else {
          handleMouseMove(e);
      }
  };

  const endPan = () => { 
      setIsPanning(false); 
      setTimeout(() => { isPanningRef.current = false; }, 100); 
  };

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!contentRef.current || !channelRef.current || !userInfoRef.current) return;
      const now = Date.now();
      if (now - lastCursorUpdate.current < 50) return; // Throttle
      lastCursorUpdate.current = now;
      
      const rect = contentRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) { 
          channelRef.current.track({ user_id: userInfoRef.current.id, cursor: { x, y, color: myColor, name: userInfoRef.current.name } }); 
      }
  };

  // --- MENU DE CONTEXTO (HUD) ---
  
  const openMapMenu = (clientX: number, clientY: number) => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      const y = ((clientY - rect.top) / rect.height) * 100;
      setContextMenu({ x: clientX, y: clientY, mapX: x, mapY: y });
  };

  const handleMapDoubleClick = (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest('button, input')) return;
      e.preventDefault(); e.stopPropagation();
      openMapMenu(e.clientX, e.clientY);
  };

  const handleTokenDoubleClick = (id: string, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      setContextMenu({ x: e.clientX, y: e.clientY, tokenId: id });
  };

  // --- AÇÕES DO MENU ---
  const updateTokenState = async (id: string, updates: any) => {
      setTokens(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      await supabase.from("scene_tokens").update(updates).eq("id", id);
      setContextMenu(null);
  };

  const handleDuplicateToken = async (id: string) => {
      const original = tokens.find(t => t.id === id);
      if (!original) return;
      const { error } = await supabase.from("scene_tokens").insert({
          scene_id: sceneId,
          x: original.x + 2, y: original.y + 2, scale: original.scale, label: original.label, custom_image_url: original.custom_image_url, character_id: original.character_id, npc_id: original.npc_id,
          // @ts-ignore 
          is_hidden: original.is_hidden, is_locked: original.is_locked
      });
      if(!error) toast({ title: "Token Duplicado" });
      setContextMenu(null);
  };

  const handleAddNpcHere = async () => {
      if (!contextMenu?.mapX || !sceneId) return;
      await supabase.from("scene_tokens").insert({ scene_id: sceneId, x: contextMenu.mapX, y: contextMenu.mapY, scale: 1, label: "Inimigo" });
      toast({ title: "NPC Criado" });
      setContextMenu(null);
  };

  const handleClearBackground = async () => {
      if (!scene) return;
      if (!confirm("Tem a certeza? O mapa ficará vazio.")) return;
      await supabase.from("scenes").update({ image_url: "" }).eq("id", scene.id);
      toast({ title: "Fundo Removido" });
      setContextMenu(null);
  };

  const handleToggleGrid = async () => {
      if (!scene) return;
      const newState = !scene.grid_active;
      setScene(prev => prev ? { ...prev, grid_active: newState } : null);
      await supabase.from("scenes").update({ grid_active: newState }).eq("id", scene.id);
      setContextMenu(null);
  };

  // Novas Ações de Mapa
  const handleToggleGlobalActive = async () => {
      if(!scene) return;
      const isActive = globalSceneId === scene.id;
      const newId = isActive ? null : scene.id;
      await supabase.from("game_states").update({ current_scene_id: newId }).eq("table_id", tableId);
      toast({ title: isActive ? "Mesa Oculta" : "Mapa Projetado" });
      setContextMenu(null);
  };

  const handleToggleSceneFog = async () => {
      if(!scene) return;
      const newState = !scene.fog_active;
      setScene(prev => prev ? { ...prev, fog_active: newState } : null);
      await supabase.from("scenes").update({ fog_active: newState }).eq("id", scene.id);
      toast({ title: newState ? "Névoa Ativada" : "Névoa Desativada" });
      setContextMenu(null);
  };

  // --- DRAG & DROP (Simplificado) ---
  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      if (!isMaster) return;
      const container = containerRef.current; if (!container) return;
      
      // 1. Ficheiro do PC
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (!file.type.startsWith('image/')) return toast({ title: "Apenas imagens", variant: "destructive" });
          setIsUploading(true);
          try {
              const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
              await supabase.storage.from("campaign-media").upload(fileName, file);
              const { data: publicUrl } = supabase.storage.from("campaign-media").getPublicUrl(fileName);
              
              if (!sceneId) {
                  await createSceneFromImage(publicUrl.publicUrl, file.name);
              } else {
                  // Insere Token diretamente
                  const rect = contentRef.current?.getBoundingClientRect();
                  let x = 50, y = 50;
                  if(rect) {
                      x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                  }
                  await supabase.from("scene_tokens").insert({ scene_id: sceneId, x, y, scale: 1, label: file.name.split('.')[0], custom_image_url: publicUrl.publicUrl });
                  toast({ title: "Token Criado" });
              }
          } catch (err: any) { toast({ title: "Erro no upload", description: err.message, variant: "destructive" }); } finally { setIsUploading(false); }
          return;
      }

      // 2. Item da Dock
      try {
          const dataStr = e.dataTransfer.getData("application/json");
          if (!dataStr) return;
          const item = JSON.parse(dataStr);
          
          if (item.type === 'scene') {
              if (tableId) { await supabase.from("game_states").update({ current_scene_id: item.id }).eq("table_id", tableId); toast({ title: "Mapa Carregado" }); }
              return;
          }
          if (!sceneId) { toast({ title: "Sem Mapa", description: "Arraste um mapa primeiro.", variant: "destructive" }); return; }
          
          // Insere Token
          const rect = contentRef.current?.getBoundingClientRect();
          let x = 50, y = 50;
          if (rect) {
              x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
          }

          if (item.type === 'token-image' || item.type === 'asset') {
               await supabase.from("scene_tokens").insert({ scene_id: sceneId, x, y, scale: 1, label: item.name, custom_image_url: item.image });
               toast({ title: "Token Adicionado" });
          } 
          else if (item.type === 'npc' || item.type === 'character') {
               const payload: any = { scene_id: sceneId, x, y, scale: 1, [item.type === 'npc' ? 'npc_id' : 'character_id']: item.id };
               await supabase.from("scene_tokens").insert(payload);
               toast({ title: "Personagem Adicionado" });
          }
      } catch (err) { console.error("Erro no drop:", err); }
  };

  const createSceneFromImage = async (url: string, name: string) => {
      if (!tableId) return;
      const { data: newScene, error } = await supabase.from("scenes").insert({ table_id: tableId, name: name.split('.')[0], image_url: url, grid_active: true }).select().single();
      if (!error && newScene) { await supabase.from("game_states").update({ current_scene_id: newScene.id }).eq("table_id", tableId); toast({ title: "Novo Mapa Criado!" }); }
  };

  const handleUpdatePosition = async (tokenId: string, x: number, y: number) => { setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t)); await supabase.from("scene_tokens").update({ x, y }).eq("id", tokenId); };
  const confirmDeleteToken = async () => { if (!isMaster || !tokenToDelete) return; setTokens(prev => prev.filter(t => t.id !== tokenToDelete)); await supabase.from("scene_tokens").delete().eq("id", tokenToDelete); setTokenToDelete(null); };
  const triggerPingVisual = (x: number, y: number, color: string) => { const id = Date.now(); setActivePings(prev => [...prev, { id, x, y, color }]); setTimeout(() => setActivePings(prev => prev.filter(p => p.id !== id)), 1500); };
  const toggleFog = async () => { if(!scene) return; const newState = !scene.fog_active; setScene(prev => prev ? { ...prev, fog_active: newState } : null); await supabase.from("scenes").update({ fog_active: newState }).eq("id", scene.id); toast({ title: newState ? "Névoa Ativada" : "Névoa Desativada" }); };

  // --- RENDER ---
  const renderedTokens = useMemo(() => {
      return tokens.map(token => {
          const canMove = isMaster || (token.character_id && token.character?.data); 
          return (
              <MapToken 
                  key={token.id} 
                  token={token} 
                  isDraggable={!!canMove} 
                  isSelected={selectedTokenId === token.id}
                  onSelect={setSelectedTokenId}
                  onUpdatePosition={handleUpdatePosition} 
                  onDelete={isMaster ? (id) => setTokenToDelete(id) : undefined} 
                  onDoubleClick={handleTokenDoubleClick} 
                  containerRef={contentRef} 
              />
          );
      });
  }, [tokens, isMaster, selectedTokenId]);

  if (loading) return <div className="flex items-center justify-center h-full w-full"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div 
        ref={viewportRef}
        className={cn("relative w-full h-full flex items-center justify-center overflow-hidden bg-zinc-900/50 cursor-grab active:cursor-grabbing", className)}
        onWheel={handleWheel}
        onMouseDown={startPan}
        onMouseMove={doPan}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onDoubleClick={handleMapDoubleClick} 
        onDrop={handleDrop} 
        onDragOver={(e) => e.preventDefault()} 
    >
        {isUploading && <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm pointer-events-auto"><div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-3"><Loader2 className="animate-spin w-6 h-6 text-primary" /><span>A processar...</span></div></div>}

        <div 
            ref={contentRef} 
            className="relative transition-transform duration-75 ease-linear select-none"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: "center center", width: scene ? "auto" : "100%", height: scene ? "auto" : "100%" }}
        >
            {scene ? (
                <img ref={imageRef} src={scene.image_url} alt={scene.name} className="block max-w-none pointer-events-none shadow-2xl" draggable={false} onLoad={() => { if(imageRef.current) setDimensions({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight }); }} />
            ) : (
                <div className="w-[800px] h-[600px] flex flex-col items-center justify-center text-muted-foreground/30 pointer-events-none border-4 border-dashed border-white/5 rounded-3xl m-auto"><MapIcon className="w-24 h-24 opacity-20" /><p className="text-2xl font-bold opacity-50 mt-4">Arraste um Mapa</p></div>
            )}
            
            {scene && (
                <>
                    {scene.grid_active && <div className="absolute inset-0 pointer-events-none opacity-20 z-10" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '50px 50px' }} />}
                    {renderedTokens}
                    <MapCursors cursors={otherCursors} containerRef={contentRef} />
                    {activePings.map(ping => (<div key={ping.id} className="absolute z-50 pointer-events-none flex items-center justify-center" style={{ left: `${ping.x}%`, top: `${ping.y}%`, transform: 'translate(-50%, -50%)' }}><span className="relative flex h-12 w-12"><span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: ping.color }}></span><span className="relative inline-flex rounded-full h-12 w-12 border-4 border-white/80" style={{ borderColor: ping.color }}><MapPin className="w-full h-full p-2 text-white fill-current drop-shadow-lg" /></span></span></div>))}
                    {scene.fog_active && dimensions.width > 0 && <FogLayer sceneId={scene.id} fogData={scene.fog_data} isMaster={isMaster} containerWidth={dimensions.width} containerHeight={dimensions.height} />}
                </>
            )}
        </div>

        {/* --- MENU DE CONTEXTO --- */}
        {contextMenu && isMaster && (
            <div className="absolute z-50 flex flex-col bg-zinc-900/95 border border-white/10 rounded-lg shadow-2xl w-52 py-1 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-md" style={{ left: contextMenu.x, top: contextMenu.y }} onMouseDown={(e) => e.stopPropagation()}>
                {contextMenu.tokenId ? (
                    <>
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center gap-2"><User className="w-3 h-3"/> Token</div>
                        <ContextButton icon={<FileText size={14} className="text-blue-400"/>} label="Ficha do Personagem" onClick={() => { toast({ title: "Use o botão 'Olho' na Dock", description: "Para abrir a ficha completa." }); setContextMenu(null); }} />
                        <div className="grid grid-cols-2 gap-1 p-1">
                             <ContextButton icon={<EyeOff size={14}/>} label="Visível" onClick={() => updateTokenState(contextMenu.tokenId!, { is_hidden: !tokens.find(t => t.id === contextMenu.tokenId)?.is_hidden })} small />
                             <ContextButton icon={<Lock size={14}/>} label="Travar" onClick={() => updateTokenState(contextMenu.tokenId!, { is_locked: !tokens.find(t => t.id === contextMenu.tokenId)?.is_locked })} small />
                        </div>
                        <ContextButton icon={<Copy size={14} className="text-purple-400"/>} label="Duplicar Token" onClick={() => handleDuplicateToken(contextMenu.tokenId!)} />
                        <div className="h-px bg-white/5 my-1" />
                        <ContextButton icon={<Trash2 size={14} className="text-red-400"/>} label="Remover" className="text-red-400 hover:bg-red-900/20" onClick={() => { setTokenToDelete(contextMenu.tokenId!); setContextMenu(null); }} />
                    </>
                ) : (
                    <>
                        <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border-b border-white/5 mb-1 flex items-center gap-2"><MapIcon className="w-3 h-3"/> Mapa</div>
                        {scene && (
                            <>
                                <ContextButton icon={globalSceneId === scene.id ? <EyeOff size={14} className="text-red-400"/> : <MonitorPlay size={14} className="text-green-400"/>} label={globalSceneId === scene.id ? "Ocultar da Mesa" : "Projetar (Ativar)"} onClick={handleToggleGlobalActive} />
                                <ContextButton icon={scene.fog_active ? <Eye size={14} className="text-blue-400"/> : <CloudFog size={14} className="text-zinc-400"/>} label={scene.fog_active ? "Desativar Névoa" : "Ativar Névoa"} onClick={handleToggleSceneFog} />
                                <div className="h-px bg-white/5 my-1" />
                            </>
                        )}
                        <ContextButton icon={<MapPin size={14} className="text-blue-400"/>} label="Pingar Localização" onClick={() => { if(channelRef.current && contextMenu.mapX) { channelRef.current.send({ type: 'broadcast', event: 'ping', payload: { x: contextMenu.mapX, y: contextMenu.mapY, color: myColor } }); triggerPingVisual(contextMenu.mapX!, contextMenu.mapY!, myColor); } setContextMenu(null); }} />
                        <ContextButton icon={<Plus size={14} className="text-green-400"/>} label="Adicionar NPC Aqui" onClick={handleAddNpcHere} />
                        <ContextButton icon={<Settings size={14}/>} label={scene?.grid_active ? "Ocultar Grelha" : "Mostrar Grelha"} onClick={handleToggleGrid} />
                        <ContextButton icon={<Eraser size={14} className="text-red-400"/>} label="Limpar Fundo" className="text-red-400 hover:bg-red-900/20" onClick={handleClearBackground} />
                    </>
                )}
            </div>
        )}

        {/* HUD Zoom */}
        <div className="absolute bottom-24 right-4 z-40 flex flex-col gap-1 bg-black/80 p-1 rounded-lg border border-white/10 shadow-xl pointer-events-auto">
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setScale(s => Math.min(s + 0.1, 5))}><ZoomIn className="w-4 h-4"/></Button>
            <div className="text-[10px] text-center text-white/50 font-mono">{Math.round(scale * 100)}%</div>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}><ZoomOut className="w-4 h-4"/></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-white mt-1" onClick={() => { setScale(1); setPan({x:0, y:0}); }} title="Resetar"><Move className="w-3 h-3"/></Button>
            {isMaster && <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-blue-400 mt-1 border-t border-white/10 pt-1" onClick={(e) => { e.stopPropagation(); openMapMenu(window.innerWidth / 2, window.innerHeight / 2); }} title="Menu do Mapa"><MoreVertical className="w-4 h-4"/></Button>}
        </div>

        <AlertDialog open={!!tokenToDelete} onOpenChange={() => setTokenToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover Token?</AlertDialogTitle><AlertDialogDescription>O token será removido da cena.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteToken} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};

const ContextButton = ({ icon, label, onClick, className, small }: any) => (
    <button className={cn("flex items-center gap-2 px-3 py-1.5 text-sm text-zinc-200 hover:bg-white/10 transition-colors text-left w-full", small && "justify-center px-1", className)} onClick={(e) => { e.stopPropagation(); onClick(); }}>{icon}{!small && <span>{label}</span>}</button>
);