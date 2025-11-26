// src/features/map/FogLayer.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Eraser, Brush, Square, Ban, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface FogLayerProps {
  sceneId: string;
  fogData: string | null;
  isMaster: boolean;
  containerWidth: number;
  containerHeight: number;
}

type ToolType = 'reveal' | 'hide';
type ShapeType = 'brush' | 'rect';

const BUCKET_NAME = "campaign-media";

export const FogLayer = ({ sceneId, fogData, isMaster, containerWidth, containerHeight }: FogLayerProps) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null); // Canvas da Névoa (Persistente)
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);   // Canvas de Interface (Temporário/Previsão)
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Configurações da Ferramenta
  const [toolMode, setToolMode] = useState<ToolType>('reveal'); // Revelar (Borracha) vs Esconder (Pincel)
  const [shapeMode, setShapeMode] = useState<ShapeType>('brush'); // Pincel Livre vs Retângulo
  const [brushSize, setBrushSize] = useState(50);
  
  // Estado local para sincronia imediata (Optimistic UI)
  const [localData, setLocalData] = useState<string | null>(fogData);
  const { toast } = useToast();

  // 1. Inicializar e Sincronizar Canvas Principal
  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Ajustar resolução para bater certo com o container
    canvas.width = containerWidth;
    canvas.height = containerHeight;

    if (localData) {
      const img = new Image();
      // IMPORTANTE: Permite manipular o canvas sem o marcar como "tainted" (sujo/inseguro)
      img.crossOrigin = "Anonymous"; 
      
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.onerror = () => {
        console.error("Erro ao carregar imagem da névoa:", localData);
      };
      img.src = localData;
    } else {
      // Padrão: Se não houver dados, assume tudo coberto (Preto)
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [containerWidth, containerHeight, localData]);

  // 2. Ajustar Canvas de UI (Sempre limpo e do mesmo tamanho)
  useEffect(() => {
    const uiCanvas = uiCanvasRef.current;
    if(uiCanvas) {
        uiCanvas.width = containerWidth;
        uiCanvas.height = containerHeight;
    }
  }, [containerWidth, containerHeight]);

  // 3. Sincronia Realtime (Quando o servidor manda um novo URL)
  useEffect(() => {
      // Só atualiza se o URL for diferente para evitar flicker
      if (fogData !== localData) {
          setLocalData(fogData);
      }
  }, [fogData]);


  // --- FUNÇÕES DE INTERAÇÃO ---

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = uiCanvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    let clientX, clientY;
    if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
    }
    return {
        x: clientX - rect.left,
        y: clientY - rect.top
    };
  };

  const startAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaster || isSaving) return;
    setIsDrawing(true);
    const { x, y } = getCoords(e);
    setStartPos({ x, y });

    // Se for Brush, desenha imediatamente
    if (shapeMode === 'brush') drawBrush(x, y);
  };

  const moveAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaster) return;
    const { x, y } = getCoords(e);

    // Limpa o UI Canvas a cada frame para desenhar o cursor/previsão
    const uiCtx = uiCanvasRef.current?.getContext('2d');
    if(uiCtx) uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);

    if (isDrawing && startPos) {
        if (shapeMode === 'brush') {
            drawBrush(x, y);
            // Desenha o cursor do brush no UI para feedback visual
            drawCursor(x, y, uiCtx);
        } else if (shapeMode === 'rect') {
            // Desenha o retângulo de previsão no UI
            drawRectPreview(startPos.x, startPos.y, x - startPos.x, y - startPos.y, uiCtx);
        }
    } else {
        // Apenas hover: desenha cursor
        drawCursor(x, y, uiCtx);
    }
  };

  const endAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaster || !isDrawing) return;
    
    // Se for retângulo, aplica agora no canvas principal de forma definitiva
    if (shapeMode === 'rect' && startPos) {
        const { x, y } = getCoords(e);
        const w = x - startPos.x;
        const h = y - startPos.y;
        applyRectToMain(startPos.x, startPos.y, w, h);
    }

    setIsDrawing(false);
    setStartPos(null);
    
    // Limpa UI
    const uiCtx = uiCanvasRef.current?.getContext('2d');
    if(uiCtx) uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    
    // Salva no servidor
    saveFogState();
  };

  // --- FUNÇÕES DE DESENHO ---

  const drawBrush = (x: number, y: number) => {
    const ctx = mainCanvasRef.current?.getContext('2d');
    if (!ctx) return;
    
    // 'destination-out' apaga (torna transparente), 'source-over' pinta
    ctx.globalCompositeOperation = toolMode === 'reveal' ? 'destination-out' : 'source-over';
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawCursor = (x: number, y: number, ctx?: CanvasRenderingContext2D | null) => {
    if (!ctx || shapeMode !== 'brush') return;
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.strokeStyle = toolMode === 'reveal' ? 'white' : 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const drawRectPreview = (x: number, y: number, w: number, h: number, ctx?: CanvasRenderingContext2D | null) => {
    if (!ctx) return;
    ctx.fillStyle = toolMode === 'reveal' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.5)';
    ctx.strokeStyle = toolMode === 'reveal' ? 'white' : 'black';
    ctx.lineWidth = 1;
    ctx.fillRect(x, y, w, h);
    ctx.strokeRect(x, y, w, h);
  };

  const applyRectToMain = (x: number, y: number, w: number, h: number) => {
      const ctx = mainCanvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.globalCompositeOperation = toolMode === 'reveal' ? 'destination-out' : 'source-over';
      ctx.fillStyle = "black";
      ctx.fillRect(x, y, w, h);
  };

  // --- SALVAR NO STORAGE (OTIMIZAÇÃO) ---
  const saveFogState = async () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;

      setIsSaving(true);

      // 1. Converter Canvas para Blob (WebP para melhor compressão)
      canvas.toBlob(async (blob) => {
          if (!blob) {
              setIsSaving(false);
              return;
          }

          // 2. Nome do ficheiro: fog/{sceneId}.webp
          const fileName = `fog/${sceneId}.webp`;

          // 3. Upload para o Storage (Upsert = sobrescrever)
          const { error: uploadError } = await supabase.storage
              .from(BUCKET_NAME)
              .upload(fileName, blob, { upsert: true, contentType: 'image/webp' });

          if (uploadError) {
              console.error("Erro no upload da névoa:", uploadError);
              toast({ title: "Erro ao salvar névoa", variant: "destructive" });
              setIsSaving(false);
              return;
          }

          // 4. Obter URL Público
          const { data: publicUrlData } = supabase.storage
              .from(BUCKET_NAME)
              .getPublicUrl(fileName);

          // 5. Adicionar Timestamp para Cache Busting
          // Isto garante que o React veja uma string diferente e recarregue a imagem
          const publicUrlWithTimestamp = `${publicUrlData.publicUrl}?t=${Date.now()}`;

          // 6. Atualizar Base de Dados com o novo URL
          const { error: dbError } = await supabase
              .from("scenes")
              .update({ fog_data: publicUrlWithTimestamp })
              .eq("id", sceneId);

          if (dbError) {
              console.error("Erro ao atualizar BD:", dbError);
          } else {
              // Atualizar localmente apenas para garantir consistência imediata
              // (Embora o upload já tenha acontecido)
              setLocalData(publicUrlWithTimestamp);
          }
          
          setIsSaving(false);

      }, 'image/webp', 0.8); // Qualidade 0.8
  };

  // Ações Globais
  const fillAll = () => {
      if(!confirm("Cobrir tudo com névoa?")) return;
      const ctx = mainCanvasRef.current?.getContext('2d');
      if(!ctx) return;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      saveFogState();
  };

  const clearAll = () => {
      if(!confirm("Revelar tudo?")) return;
      const ctx = mainCanvasRef.current?.getContext('2d');
      if(!ctx) return;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      saveFogState();
  };

  return (
    <>
      {/* 1. Canvas Principal (Dados da Névoa) */}
      <canvas
        ref={mainCanvasRef}
        className={`absolute inset-0 z-30 pointer-events-none ${isMaster ? 'opacity-60' : 'opacity-100'}`}
      />

      {/* 2. Canvas de Interface (Interação) - Só ativo para o Mestre */}
      <canvas
        ref={uiCanvasRef}
        className={cn(
            "absolute inset-0 z-40 touch-none",
            isMaster ? "cursor-none" : "pointer-events-none"
        )}
        onMouseDown={startAction}
        onMouseMove={moveAction}
        onMouseUp={endAction}
        onMouseLeave={endAction}
        onTouchStart={startAction}
        onTouchMove={moveAction}
        onTouchEnd={endAction}
      />

      {/* Toolbar do Mestre */}
      {isMaster && (
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl w-14 items-center transition-all hover:bg-black">
              
              {/* Indicador de Salvamento */}
              <div className="h-4 w-4 flex items-center justify-center">
                  {isSaving && <Loader2 className="w-3 h-3 animate-spin text-accent" />}
              </div>

              {/* Modo (Revelar/Esconder) */}
              <div className="flex flex-col gap-1 w-full">
                  <Button 
                    size="icon" variant={toolMode === 'reveal' ? "default" : "ghost"} 
                    className={cn("h-9 w-9 rounded-lg", toolMode === 'reveal' && "bg-white text-black hover:bg-white/90")}
                    onClick={() => setToolMode('reveal')} title="Revelar (Borracha)"
                  >
                      <Eraser className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" variant={toolMode === 'hide' ? "default" : "ghost"} 
                    className={cn("h-9 w-9 rounded-lg", toolMode === 'hide' && "bg-black border border-white/20")}
                    onClick={() => setToolMode('hide')} title="Esconder (Névoa)"
                  >
                      <Ban className="w-4 h-4" />
                  </Button>
              </div>
              
              <Separator className="bg-white/10 w-8" />

              {/* Forma (Pincel/Retângulo) */}
              <div className="flex flex-col gap-1 w-full">
                  <Button 
                    size="icon" variant={shapeMode === 'brush' ? "secondary" : "ghost"} 
                    className="h-9 w-9 rounded-lg"
                    onClick={() => setShapeMode('brush')} title="Pincel Livre"
                  >
                      <Brush className="w-4 h-4" />
                  </Button>
                  <Button 
                    size="icon" variant={shapeMode === 'rect' ? "secondary" : "ghost"} 
                    className="h-9 w-9 rounded-lg"
                    onClick={() => setShapeMode('rect')} title="Retângulo"
                  >
                      <Square className="w-4 h-4" />
                  </Button>
              </div>

              {/* Tamanho do Pincel (Só se estiver em modo Brush) */}
              {shapeMode === 'brush' && (
                  <div className="flex flex-col gap-1.5 items-center py-1">
                      <div className={`w-1.5 h-1.5 rounded-full bg-white cursor-pointer transition-all ${brushSize===30 ? 'scale-150 ring-2 ring-primary' : 'opacity-40'}`} onClick={() => setBrushSize(30)} />
                      <div className={`w-2.5 h-2.5 rounded-full bg-white cursor-pointer transition-all ${brushSize===50 ? 'scale-125 ring-2 ring-primary' : 'opacity-40'}`} onClick={() => setBrushSize(50)} />
                      <div className={`w-4 h-4 rounded-full bg-white cursor-pointer transition-all ${brushSize===80 ? 'scale-110 ring-2 ring-primary' : 'opacity-40'}`} onClick={() => setBrushSize(80)} />
                  </div>
              )}

              <Separator className="bg-white/10 w-8" />

              {/* Ações Globais */}
              <div className="flex flex-col gap-1 w-full">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/50 hover:text-white" onClick={fillAll} title="Cobrir Tudo" disabled={isSaving}>
                      <EyeOff className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/50 hover:text-white" onClick={clearAll} title="Revelar Tudo" disabled={isSaving}>
                      <Eye className="w-4 h-4" />
                  </Button>
              </div>
          </div>
      )}
    </>
  );
};