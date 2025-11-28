import { useState, useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scene, SceneToken } from "@/types/map-types";
import { MapToken } from "./MapToken";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff, MapPin, UploadCloud, Map as MapIcon, Plus, ZoomIn, ZoomOut, Move } from "lucide-react";
import { cn } from "@/lib/utils"; 
import { FogLayer } from "./FogLayer"; 
import { MapCursors } from "./MapCursors";
import { Button } from "@/components/ui/button"; 
import { useTableContext } from "@/features/table/TableContext"; 
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface SceneBoardProps {
  sceneId: string | null;
  isMaster: boolean;
  className?: string;
}

const CURSOR_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#84cc16", "#10b981", "#06b6d4", "#3b82f6", "#8b5cf6", "#d946ef", "#f43f5e"];

export const SceneBoard = ({ sceneId, isMaster, className }: SceneBoardProps) => {
  const { tableId } = useTableContext();
  const [scene, setScene] = useState<Scene | null>(null);
  const [tokens, setTokens] = useState<SceneToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // --- ESTADOS DE NAVEGAÇÃO ---
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  
  // Referência para distinguir clique de arrasto
  const isPanningRef = useRef(false);

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [tokenToDelete, setTokenToDelete] = useState<string | null>(null);
  const [activePings, setActivePings] = useState<{id: number, x: number, y: number, color: string}[]>([]);
  
  const [otherCursors, setOtherCursors] = useState<Record<string, any>>({});
  const [myColor] = useState(() => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);

  // Refs de Performance
  const viewportRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const channelRef = useRef<any>(null);
  const userInfoRef = useRef<{ id: string, name: string } | null>(null);
  const lastCursorUpdate = useRef(0);
  
  const { toast } = useToast();

  // 1. Carregar User Info (Cache)
  useEffect(() => {
      const fetchUser = async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) userInfoRef.current = { id: user.id, name: user.email?.split('@')[0] || "User" };
      };
      fetchUser();
  }, []);

  // 2. Auxiliar para Tokens Novos
  const fetchNewToken = async (id: string) => {
      const { data } = await supabase.from("scene_tokens").select(`*, character:characters(name, data), npc:npcs(name, data)`).eq("id", id).single();
      if (data) setTokens(prev => prev.find(t => t.id === data.id) ? prev : [...prev, data as any]);
  };

  // 3. Setup Realtime
  useEffect(() => {
      if (!tableId || !sceneId) return;
      const channel = supabase.channel(`scene_tracking:${sceneId}`, { config: { presence: { key: (Math.random() + 1).toString(36).substring(7) } } });
      channel.on('presence', { event: 'sync' }, () => {
            const newState = channel.presenceState();
            const cursors: Record<string, any> = {};
            Object.values(newState).forEach((presences: any) => { presences.forEach((p: any) => { if (p.cursor && p.user_id !== userInfoRef.current?.id) cursors[p.user_id] = p.cursor; }); });
            setOtherCursors(cursors);
        }).on('broadcast', { event: 'ping' }, (payload) => triggerPingVisual(payload.payload.x, payload.payload.y, payload.payload.color)).subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && userInfoRef.current) await channel.track({ user_id: userInfoRef.current.id, online_at: new Date().toISOString(), cursor: null });
        });
      channelRef.current = channel;
      return () => { supabase.removeChannel(channel); };
  }, [sceneId, tableId]);

  // 4. Setup Dados e Listeners
  useEffect(() => {
    if (!sceneId) { setScene(null); setTokens([]); return; }
    const fetchData = async () => {
       setLoading(true);
       const { data: sceneData } = await supabase.from("scenes").select("*").eq("id", sceneId).maybeSingle();
       if(sceneData) {
           setScene(sceneData as Scene);
           const { data: tokensData } = await supabase.from("scene_tokens").select(`*, character:characters(name, data), npc:npcs(name, data)`).eq("scene_id", sceneId);
           if (tokensData) setTokens(tokensData as any);
           setScale(1); setPan({ x: 0, y: 0 }); // Reset View
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
      }).subscribe();
    return () => { supabase.removeChannel(dbChannel); };
  }, [sceneId]);

  // 5. Dimensões
  useEffect(() => {
      const updateDimensions = () => { if (imageRef.current) setDimensions({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight }); };
      window.addEventListener('resize', updateDimensions);
      const timer = setTimeout(updateDimensions, 200); 
      return () => { window.removeEventListener('resize', updateDimensions); clearTimeout(timer); };
  }, [scene?.image_url, tokens.length]);

  // --- NAVEGAÇÃO (ZOOM & PAN) ---

  const handleWheel = (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newScale = Math.min(Math.max(0.1, scale + delta), 5); 
      setScale(newScale);
  };

  const startPan = (e: React.MouseEvent) => {
      // Aceita Botão Esquerdo (0) ou Meio (1)
      if (e.button === 0 || e.button === 1) {
          // Nota: Não usamos preventDefault() aqui para permitir que o foco funcione, mas...
          // Se o alvo for o canvas ou imagem, queremos arrastar.
          setIsPanning(true);
          isPanningRef.current = false; // Reset: Assumimos que é um clique até que o rato se mova
          setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
      }
  };

  const doPan = (e: React.MouseEvent) => {
      if (isPanning) {
          e.preventDefault();
          const newX = e.clientX - panStart.x;
          const newY = e.clientY - panStart.y;
          
          // Lógica de Threshold: Só conta como Pan se mover mais de 5px
          // Isto permite diferenciar um "Clique" de um "Arrasto"
          if (!isPanningRef.current && (Math.abs(e.clientX - (pan.x + panStart.x)) > 5 || Math.abs(e.clientY - (pan.y + panStart.y)) > 5)) {
             isPanningRef.current = true;
          }

          setPan({ x: newX, y: newY });
      } else {
          handleMouseMove(e); // Envia cursor se não estiver a fazer pan
      }
  };

  const endPan = () => {
      setIsPanning(false);
      // Mantém o estado de "foi um pan" por um instante para bloquear o evento onClick subsequente
      setTimeout(() => { isPanningRef.current = false; }, 100);
  };

  // --- HANDLERS (Interação) ---

  const handleMouseMove = (e: React.MouseEvent) => {
      if (!contentRef.current || !channelRef.current || !userInfoRef.current) return;
      
      const now = Date.now();
      if (now - lastCursorUpdate.current < 50) return; // Throttle 50ms
      lastCursorUpdate.current = now;

      const rect = contentRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
          channelRef.current.track({
              user_id: userInfoRef.current.id,
              cursor: { x, y, color: myColor, name: userInfoRef.current.name }
          });
      }
  };

  const handleMapClick = (e: React.MouseEvent) => {
      // Se foi um movimento de Pan (arrasto), ignora o clique
      if (isPanningRef.current) return;

      if (e.target === contentRef.current || e.target === imageRef.current) setSelectedTokenId(null);
      
      if (e.altKey && contentRef.current && userInfoRef.current) {
          const rect = contentRef.current.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 100;
          const y = ((e.clientY - rect.top) / rect.height) * 100;
          triggerPingVisual(x, y, myColor);
          if (channelRef.current) channelRef.current.send({ type: 'broadcast', event: 'ping', payload: { x, y, color: myColor } });
      }
  };

  const triggerPingVisual = (x: number, y: number, color: string) => {
      const id = Date.now();
      setActivePings(prev => [...prev, { id, x, y, color }]);
      setTimeout(() => setActivePings(prev => prev.filter(p => p.id !== id)), 1500);
  };

  const handleUpdatePosition = async (tokenId: string, x: number, y: number) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t));
    await supabase.from("scene_tokens").update({ x, y }).eq("id", tokenId);
  };

  const confirmDeleteToken = async () => {
      if (!isMaster || !tokenToDelete) return;
      setTokens(prev => prev.filter(t => t.id !== tokenToDelete));
      await supabase.from("scene_tokens").delete().eq("id", tokenToDelete);
      setTokenToDelete(null);
  };
  
  const toggleFog = async () => {
      if(!scene) return;
      const newState = !scene.fog_active;
      setScene(prev => prev ? { ...prev, fog_active: newState } : null); 
      await supabase.from("scenes").update({ fog_active: newState }).eq("id", scene.id);
      toast({ title: newState ? "Névoa Ativada" : "Névoa Desativada" });
  };

  // --- DROP (Direto e Rápido) ---
  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      if (!isMaster) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          const file = e.dataTransfer.files[0];
          if (!file.type.startsWith('image/')) return toast({ title: "Apenas imagens", variant: "destructive" });
          setIsUploading(true);
          try {
              const fileName = `uploads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
              await supabase.storage.from("campaign-media").upload(fileName, file);
              const { data: publicUrl } = supabase.storage.from("campaign-media").getPublicUrl(fileName);
              
              if (!sceneId) await createSceneFromImage(publicUrl.publicUrl, file.name);
              else {
                  // Drop direto de ficheiro -> Token
                  // Precisamos calcular posição relativa ao conteúdo (considerando zoom/pan)
                  const rect = contentRef.current?.getBoundingClientRect();
                  if(rect) {
                      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
                      const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
                      await supabase.from("scene_tokens").insert({ scene_id: sceneId, x, y, scale: 1, label: file.name.split('.')[0], custom_image_url: publicUrl.publicUrl });
                      toast({ title: "Token Criado" });
                  }
              }
          } catch (err: any) { toast({ title: "Erro", description: err.message, variant: "destructive" }); } finally { setIsUploading(false); }
          return;
      }

      try {
          const dataStr = e.dataTransfer.getData("application/json");
          if (!dataStr) return;
          const item = JSON.parse(dataStr);
          
          if (item.type === 'scene') {
              if (tableId) { await supabase.from("game_states").update({ current_scene_id: item.id }).eq("table_id", tableId); toast({ title: "Mapa Carregado" }); }
              return;
          }
          if (!sceneId) { toast({ title: "Sem Mapa", description: "Arraste um mapa primeiro.", variant: "destructive" }); return; }

          // Drop de Token/NPC -> Token Direto (Sem Dialog)
          const rect = contentRef.current?.getBoundingClientRect();
          if(rect) {
              const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
              const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

              if (item.type === 'token-image' || item.type === 'asset') {
                   await supabase.from("scene_tokens").insert({ scene_id: sceneId, x, y, scale: 1, label: item.name, custom_image_url: item.image });
              } 
              else if (item.type === 'npc' || item.type === 'character') {
                   const payload: any = { scene_id: sceneId, x, y, scale: 1, [item.type === 'npc' ? 'npc_id' : 'character_id']: item.id };
                   await supabase.from("scene_tokens").insert(payload);
              }
              toast({ title: "Adicionado" });
          }
      } catch (err) { console.error("Erro no drop:", err); }
  };

  const createSceneFromImage = async (url: string, name: string) => {
      if (!tableId) return;
      const { data: newScene, error } = await supabase.from("scenes").insert({ table_id: tableId, name: name.split('.')[0], image_url: url, grid_active: true }).select().single();
      if (!error && newScene) { await supabase.from("game_states").update({ current_scene_id: newScene.id }).eq("table_id", tableId); toast({ title: "Novo Mapa Criado!" }); }
  };

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
        onDrop={handleDrop} 
        onDragOver={(e) => e.preventDefault()} 
    >
        {isUploading && <div className="absolute inset-0 z-[60] bg-black/50 flex items-center justify-center backdrop-blur-sm pointer-events-auto"><div className="bg-background p-4 rounded-lg shadow-lg flex items-center gap-3"><Loader2 className="animate-spin w-6 h-6 text-primary" /><span>A processar...</span></div></div>}

        <div 
            ref={contentRef} 
            className="relative transition-transform duration-75 ease-linear select-none"
            onClick={handleMapClick}
            style={{ 
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
                transformOrigin: "center center",
                width: scene ? "auto" : "100%", height: scene ? "auto" : "100%"
            }}
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

        {/* HUD DE ZOOM */}
        <div className="absolute bottom-24 right-4 z-40 flex flex-col gap-1 bg-black/80 p-1 rounded-lg border border-white/10 shadow-xl pointer-events-auto">
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setScale(s => Math.min(s + 0.1, 5))}><ZoomIn className="w-4 h-4"/></Button>
            <div className="text-[10px] text-center text-white/50 font-mono">{Math.round(scale * 100)}%</div>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-white" onClick={() => setScale(s => Math.max(s - 0.1, 0.1))}><ZoomOut className="w-4 h-4"/></Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-white/20 text-white mt-1" onClick={() => { setScale(1); setPan({x:0, y:0}); }} title="Resetar"><Move className="w-3 h-3"/></Button>
        </div>

        {isMaster && scene && (
            <div className="absolute top-20 right-4 z-50 pointer-events-auto">
                <Button size="sm" variant={scene.fog_active ? "default" : "secondary"} onClick={toggleFog} className="shadow-lg border border-white/10 bg-black/80 hover:bg-black/60 text-white">{scene.fog_active ? <Eye className="w-4 h-4 mr-2"/> : <EyeOff className="w-4 h-4 mr-2"/>} {scene.fog_active ? "Névoa ON" : "Névoa OFF"}</Button>
            </div>
        )}

        <AlertDialog open={!!tokenToDelete} onOpenChange={() => setTokenToDelete(null)}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remover Token?</AlertDialogTitle><AlertDialogDescription>O token será removido da cena.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={confirmDeleteToken} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remover</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </div>
  );
};