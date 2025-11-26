// src/features/map/SceneBoard.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scene, SceneToken } from "@/types/map-types";
import { MapToken } from "./MapToken";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils"; 
import { FogLayer } from "./FogLayer"; 
import { Button } from "@/components/ui/button"; 

interface SceneBoardProps {
  sceneId: string | null;
  isMaster: boolean;
  userId?: string;
  className?: string;
}

export const SceneBoard = ({ sceneId, isMaster, className }: SceneBoardProps) => {
  const [scene, setScene] = useState<Scene | null>(null);
  const [tokens, setTokens] = useState<SceneToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const { toast } = useToast();

  // Atualizar dimensões
  useEffect(() => {
      const updateDimensions = () => {
          if (imageRef.current) {
              setDimensions({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight });
          } else if (containerRef.current) {
              setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
          }
      };
      window.addEventListener('resize', updateDimensions);
      const timer = setTimeout(updateDimensions, 100); 
      return () => {
          window.removeEventListener('resize', updateDimensions);
          clearTimeout(timer);
      };
  }, [scene?.image_url]);

  useEffect(() => {
    if (!sceneId) {
        setScene(null);
        setTokens([]);
        return;
    }
    
    const fetchData = async () => {
       setLoading(true);
       const { data: sceneData } = await supabase.from("scenes").select("*").eq("id", sceneId).single();
       setScene(sceneData as Scene);

       const { data: tokensData } = await supabase
        .from("scene_tokens")
        .select(`*, character:characters(name, data), npc:npcs(name, data)`)
        .eq("scene_id", sceneId);
        
       if (tokensData) setTokens(tokensData as any);
       setLoading(false);
    };

    fetchData();

    const sceneChannel = supabase.channel(`scene-meta:${sceneId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'scenes', filter: `id=eq.${sceneId}` }, 
      (payload) => setScene(payload.new as Scene))
      .subscribe();

    const tokensChannel = supabase.channel(`scene-tokens:${sceneId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scene_tokens', filter: `scene_id=eq.${sceneId}` }, 
      (payload) => {
         if (payload.eventType === 'INSERT') fetchData(); 
         else if (payload.eventType === 'DELETE') setTokens(prev => prev.filter(t => t.id !== payload.old.id));
         else if (payload.eventType === 'UPDATE') {
             setTokens(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
         }
      })
      .subscribe();

    return () => { 
        supabase.removeChannel(sceneChannel);
        supabase.removeChannel(tokensChannel);
    };
  }, [sceneId]);

  const handleUpdatePosition = async (tokenId: string, x: number, y: number) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t));
    const { error } = await supabase.from("scene_tokens").update({ x, y }).eq("id", tokenId);
    if (error) toast({ title: "Erro ao mover", variant: "destructive" });
  };

  const handleDeleteToken = async (tokenId: string) => {
      if (!isMaster) return;
      if (!confirm("Remover este token?")) return;
      setTokens(prev => prev.filter(t => t.id !== tokenId));
      const { error } = await supabase.from("scene_tokens").delete().eq("id", tokenId);
      if (error) toast({ title: "Erro", description: error.message });
  };
  
  const toggleFog = async () => {
      if(!scene) return;
      const newState = !scene.fog_active;
      setScene(prev => prev ? { ...prev, fog_active: newState } : null); 
      await supabase.from("scenes").update({ fog_active: newState }).eq("id", scene.id);
      toast({ title: newState ? "Névoa Ativada" : "Névoa Desativada" });
  };

  // --- NOVO: DRAG & DROP DA DOCK ---
  const handleDrop = async (e: React.DragEvent) => {
      e.preventDefault();
      if (!isMaster || !sceneId) return;

      try {
          const dataStr = e.dataTransfer.getData("application/json");
          if (!dataStr) return;
          const item = JSON.parse(dataStr);

          // Calcular posição do drop em % relativo ao container
          const container = containerRef.current;
          if (!container) return;
          const rect = container.getBoundingClientRect();
          
          let x = ((e.clientX - rect.left) / rect.width) * 100;
          let y = ((e.clientY - rect.top) / rect.height) * 100;
          
          x = Math.max(0, Math.min(100, x));
          y = Math.max(0, Math.min(100, y));

          if (item.type === 'npc' || item.type === 'character') {
               const payload: any = {
                 scene_id: sceneId,
                 x, y, scale: 1,
                 [item.type === 'npc' ? 'npc_id' : 'character_id']: item.id
               };
               // Optimistic UI: Adicionar localmente (opcional, mas o realtime é rápido)
               const { error } = await supabase.from("scene_tokens").insert(payload);
               if(!error) toast({ title: "Token Adicionado" });
          }
      } catch (err) {
          console.error("Erro no drop:", err);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); // Necessário para permitir o drop
  };

  if (loading) return <div className="flex items-center justify-center h-full w-full"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center overflow-hidden bg-black/90", className)}>
        
        {/* Botão Névoa (Mestre) */}
        {isMaster && scene && (
            <div className="absolute top-20 right-4 z-50">
                <Button 
                    size="sm" 
                    variant={scene.fog_active ? "default" : "secondary"}
                    onClick={toggleFog}
                    className="shadow-lg border border-white/10 bg-black/80 hover:bg-black/60 text-white"
                >
                    {scene.fog_active ? <Eye className="w-4 h-4 mr-2"/> : <EyeOff className="w-4 h-4 mr-2"/>}
                    {scene.fog_active ? "Névoa ON" : "Névoa OFF"}
                </Button>
            </div>
        )}

        <div 
            ref={containerRef}
            className="relative shadow-2xl transition-all duration-300"
            // --- HABILITAR DROP ---
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            // ----------------------
            style={{ 
                width: "auto",
                height: "auto",
                maxWidth: "100%", 
                maxHeight: "100%",
            }} 
        >
            {scene ? (
                <img 
                    ref={imageRef}
                    src={scene.image_url} 
                    alt={scene.name} 
                    className="block max-w-full max-h-screen object-contain pointer-events-none select-none"
                    draggable={false}
                    onLoad={() => {
                        if(imageRef.current) {
                             setDimensions({ width: imageRef.current.clientWidth, height: imageRef.current.clientHeight });
                        }
                    }}
                />
            ) : (
                <div className="w-[800px] h-[600px] bg-muted/10 flex items-center justify-center text-muted-foreground">
                    Sem Mapa
                </div>
            )}
            
            {/* Grid Overlay */}
            {scene && scene.grid_active && (
                <div 
                    className="absolute inset-0 pointer-events-none opacity-30 z-10" 
                    style={{ 
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                        backgroundSize: '50px 50px' 
                    }} 
                />
            )}

            {/* Tokens */}
            {tokens.map(token => {
                const canMove = isMaster || (token.character_id && token.character?.data); 
                return (
                    <MapToken 
                        key={token.id}
                        token={token}
                        isDraggable={!!canMove}
                        onUpdatePosition={handleUpdatePosition}
                        onDelete={handleDeleteToken}
                        containerRef={containerRef}
                    />
                );
            })}

            {/* Névoa de Guerra */}
            {scene && scene.fog_active && dimensions.width > 0 && (
                <FogLayer 
                    sceneId={scene.id}
                    fogData={scene.fog_data}
                    isMaster={isMaster}
                    containerWidth={dimensions.width}
                    containerHeight={dimensions.height}
                />
            )}
        </div>
    </div>
  );
};