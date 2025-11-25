// src/features/map/SceneBoard.tsx

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Scene, SceneToken } from "@/types/map-types";
import { MapToken } from "./MapToken";
import { useToast } from "@/hooks/use-toast";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils"; 

interface SceneBoardProps {
  sceneId: string | null; // Agora pode ser null (para usar apenas o Grid)
  isMaster: boolean;
  userId?: string;
  className?: string;
}

export const SceneBoard = ({ sceneId, isMaster, className }: SceneBoardProps) => {
  const [scene, setScene] = useState<Scene | null>(null);
  const [tokens, setTokens] = useState<SceneToken[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Se não houver sceneId, limpamos a cena mas mantemos o board "vivo" para tokens (futuro)
  useEffect(() => {
    if (!sceneId) {
        setScene(null);
        setTokens([]); // Ou tokens globais se existissem
        return;
    }
    
    const fetchData = async () => {
       setLoading(true);
       const { data: sceneData, error: sceneError } = await supabase.from("scenes").select("*").eq("id", sceneId).single();
       if (sceneError) { 
           console.error(sceneError);
           toast({ title: "Erro ao carregar cena", variant: "destructive"}); 
           setLoading(false);
           return; 
       }
       setScene(sceneData as Scene);

       const { data: tokensData } = await supabase
        .from("scene_tokens")
        .select(`*, character:characters(name, data), npc:npcs(name, data)`)
        .eq("scene_id", sceneId);
        
       if (tokensData) setTokens(tokensData as any);
       setLoading(false);
    };

    fetchData();

    const channel = supabase.channel(`scene:${sceneId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'scene_tokens', filter: `scene_id=eq.${sceneId}` }, 
      (payload) => {
         if (payload.eventType === 'INSERT') fetchData(); 
         else if (payload.eventType === 'DELETE') setTokens(prev => prev.filter(t => t.id !== payload.old.id));
         else if (payload.eventType === 'UPDATE') setTokens(prev => prev.map(t => t.id === payload.new.id ? { ...t, ...payload.new } : t));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [sceneId]);

  const handleUpdatePosition = async (tokenId: string, x: number, y: number) => {
    setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, x, y } : t));
    const { error } = await supabase.from("scene_tokens").update({ x, y }).eq("id", tokenId);
    if (error) toast({ title: "Erro ao mover", variant: "destructive" });
  };

  const handleDeleteToken = async (tokenId: string) => {
      if (!isMaster) return;
      if (!confirm("Remover este token?")) return;
      const { error } = await supabase.from("scene_tokens").delete().eq("id", tokenId);
      if (error) toast({ title: "Erro", description: error.message });
  };

  if (loading) return <div className="flex items-center justify-center h-full w-full"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>;

  return (
    <div className={cn("relative w-full h-full flex items-center justify-center", className)}>
        <div 
            ref={containerRef}
            className="relative transition-all duration-300 ease-out"
            style={{ 
                width: scene ? "auto" : "100%",
                height: scene ? "auto" : "100%",
                maxWidth: "100%", 
                maxHeight: "100%",
                aspectRatio: "auto"
            }} 
        >
            {scene ? (
                <img 
                    src={scene.image_url} 
                    alt={scene.name} 
                    className="block max-w-full max-h-full object-contain pointer-events-none select-none shadow-2xl rounded-sm"
                    style={{ maxHeight: '100vh', maxWidth: '100vw' }} 
                    draggable={false}
                />
            ) : (
                // Se não houver cena, o container ocupa tudo para permitir tokens (futuro) ou apenas mostrar vazio
                <div className="w-full h-full" />
            )}
            
            {/* Renderiza Grid sobre a imagem se ativado na cena */}
            {scene && scene.grid_active && (
                <div 
                    className="absolute inset-0 pointer-events-none opacity-30" 
                    style={{ 
                        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', 
                        backgroundSize: '50px 50px' 
                    }} 
                />
            )}

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
        </div>
    </div>
  );
};