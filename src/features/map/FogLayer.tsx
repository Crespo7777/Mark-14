// src/features/map/FogLayer.tsx

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Eraser, Brush, Square, Ban, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface FogLayerProps {
  sceneId: string;
  fogData: string | null;
  isMaster: boolean;
  containerWidth: number;
  containerHeight: number;
}

type ToolType = 'reveal' | 'hide';
type ShapeType = 'brush' | 'rect';
type ActionType = 'fill' | 'clear' | null;

const BUCKET_NAME = "campaign-media";

export const FogLayer = ({ sceneId, fogData, isMaster, containerWidth, containerHeight }: FogLayerProps) => {
  const mainCanvasRef = useRef<HTMLCanvasElement>(null);
  const uiCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{x: number, y: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [toolMode, setToolMode] = useState<ToolType>('reveal');
  const [shapeMode, setShapeMode] = useState<ShapeType>('brush');
  const [brushSize, setBrushSize] = useState(50);
  
  const [localData, setLocalData] = useState<string | null>(fogData);
  const [pendingAction, setPendingAction] = useState<ActionType>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    const canvas = mainCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = containerWidth;
    canvas.height = containerHeight;

    if (localData) {
      const img = new Image();
      img.crossOrigin = "Anonymous"; 
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = localData;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }, [containerWidth, containerHeight, localData]);

  useEffect(() => {
    const uiCanvas = uiCanvasRef.current;
    if(uiCanvas) {
        uiCanvas.width = containerWidth;
        uiCanvas.height = containerHeight;
    }
  }, [containerWidth, containerHeight]);

  useEffect(() => {
      if (fogData !== localData) {
          setLocalData(fogData);
      }
  }, [fogData]);

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
    if (shapeMode === 'brush') drawBrush(x, y);
  };

  const moveAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaster) return;
    const { x, y } = getCoords(e);
    const uiCtx = uiCanvasRef.current?.getContext('2d');
    if(uiCtx) uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    if (isDrawing && startPos) {
        if (shapeMode === 'brush') {
            drawBrush(x, y);
            drawCursor(x, y, uiCtx);
        } else if (shapeMode === 'rect') {
            drawRectPreview(startPos.x, startPos.y, x - startPos.x, y - startPos.y, uiCtx);
        }
    } else {
        drawCursor(x, y, uiCtx);
    }
  };

  const endAction = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMaster || !isDrawing) return;
    if (shapeMode === 'rect' && startPos) {
        const { x, y } = getCoords(e);
        applyRectToMain(startPos.x, startPos.y, x - startPos.x, y - startPos.y);
    }
    setIsDrawing(false);
    setStartPos(null);
    const uiCtx = uiCanvasRef.current?.getContext('2d');
    if(uiCtx) uiCtx.clearRect(0, 0, uiCtx.canvas.width, uiCtx.canvas.height);
    saveFogState();
  };

  const drawBrush = (x: number, y: number) => {
    const ctx = mainCanvasRef.current?.getContext('2d');
    if (!ctx) return;
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

  const saveFogState = async () => {
      const canvas = mainCanvasRef.current;
      if (!canvas) return;
      setIsSaving(true);
      canvas.toBlob(async (blob) => {
          if (!blob) { setIsSaving(false); return; }
          const fileName = `fog/${sceneId}.webp`;
          const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, blob, { upsert: true, contentType: 'image/webp' });
          if (uploadError) { setIsSaving(false); return; }
          
          const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
          const publicUrlWithTimestamp = `${publicUrlData.publicUrl}?t=${Date.now()}`;
          
          await supabase.from("scenes").update({ fog_data: publicUrlWithTimestamp }).eq("id", sceneId);
          setLocalData(publicUrlWithTimestamp);
          setIsSaving(false);
      }, 'image/webp', 0.8);
  };

  const confirmGlobalAction = () => {
      if (!pendingAction) return;
      const ctx = mainCanvasRef.current?.getContext('2d');
      if(!ctx) return;
      
      if (pendingAction === 'fill') {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = "black";
          ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      } else if (pendingAction === 'clear') {
          ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }
      
      saveFogState();
      setPendingAction(null);
  };

  return (
    <>
      <canvas ref={mainCanvasRef} className={`absolute inset-0 z-30 pointer-events-none ${isMaster ? 'opacity-60' : 'opacity-100'}`} />
      <canvas ref={uiCanvasRef} className={cn("absolute inset-0 z-40 touch-none", isMaster ? "cursor-none" : "pointer-events-none")} onMouseDown={startAction} onMouseMove={moveAction} onMouseUp={endAction} onMouseLeave={endAction} onTouchStart={startAction} onTouchMove={moveAction} onTouchEnd={endAction} />

      {isMaster && (
          <div className="absolute top-4 right-4 z-50 flex flex-col gap-2 bg-black/90 p-2.5 rounded-xl border border-white/10 backdrop-blur-md shadow-2xl w-14 items-center transition-all hover:bg-black">
              <div className="h-4 w-4 flex items-center justify-center">{isSaving && <Loader2 className="w-3 h-3 animate-spin text-accent" />}</div>

              <div className="flex flex-col gap-1 w-full">
                  <Button size="icon" variant={toolMode === 'reveal' ? "default" : "ghost"} className={cn("h-9 w-9 rounded-lg", toolMode === 'reveal' && "bg-white text-black hover:bg-white/90")} onClick={() => setToolMode('reveal')} title="Revelar"><Eraser className="w-4 h-4" /></Button>
                  <Button size="icon" variant={toolMode === 'hide' ? "default" : "ghost"} className={cn("h-9 w-9 rounded-lg", toolMode === 'hide' && "bg-black border border-white/20")} onClick={() => setToolMode('hide')} title="Esconder"><Ban className="w-4 h-4" /></Button>
              </div>
              <Separator className="bg-white/10 w-8" />
              <div className="flex flex-col gap-1 w-full">
                  <Button size="icon" variant={shapeMode === 'brush' ? "secondary" : "ghost"} className="h-9 w-9 rounded-lg" onClick={() => setShapeMode('brush')} title="Pincel"><Brush className="w-4 h-4" /></Button>
                  <Button size="icon" variant={shapeMode === 'rect' ? "secondary" : "ghost"} className="h-9 w-9 rounded-lg" onClick={() => setShapeMode('rect')} title="Retângulo"><Square className="w-4 h-4" /></Button>
              </div>
              {shapeMode === 'brush' && (
                  <div className="flex flex-col gap-1.5 items-center py-1">
                      <div className={`w-1.5 h-1.5 rounded-full bg-white cursor-pointer transition-all ${brushSize===30 ? 'scale-150 ring-2 ring-primary' : 'opacity-40'}`} onClick={() => setBrushSize(30)} />
                      <div className={`w-2.5 h-2.5 rounded-full bg-white cursor-pointer transition-all ${brushSize===50 ? 'scale-125 ring-2 ring-primary' : 'opacity-40'}`} onClick={() => setBrushSize(50)} />
                      <div className={`w-4 h-4 rounded-full bg-white cursor-pointer transition-all ${brushSize===80 ? 'scale-110 ring-2 ring-primary' : 'opacity-40'}`} onClick={() => setBrushSize(80)} />
                  </div>
              )}
              <Separator className="bg-white/10 w-8" />
              <div className="flex flex-col gap-1 w-full">
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/50 hover:text-white" onClick={() => setPendingAction('fill')} title="Cobrir Tudo" disabled={isSaving}><EyeOff className="w-4 h-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-9 w-9 text-white/50 hover:text-white" onClick={() => setPendingAction('clear')} title="Revelar Tudo" disabled={isSaving}><Eye className="w-4 h-4" /></Button>
              </div>
          </div>
      )}

      <AlertDialog open={!!pendingAction} onOpenChange={() => setPendingAction(null)}>
          <AlertDialogContent>
              <AlertDialogHeader>
                  <AlertDialogTitle>{pendingAction === 'fill' ? 'Cobrir Mapa?' : 'Revelar Mapa?'}</AlertDialogTitle>
                  <AlertDialogDescription>
                      {pendingAction === 'fill' ? 'Toda a área será coberta pela névoa.' : 'Toda a névoa será removida.'}
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmGlobalAction}>Confirmar</AlertDialogAction>
              </AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>
    </>
  );
};