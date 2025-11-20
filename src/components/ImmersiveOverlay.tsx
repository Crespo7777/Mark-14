// src/components/ImmersiveOverlay.tsx

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Volume2, VolumeX, AlertCircle } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import ReactPlayer from 'react-player';
import { Slider } from "@/components/ui/slider";

interface GameState {
  active_cutscene_url: string | null;
  active_cutscene_type: 'image' | 'video' | 'none';
  active_music_url: string | null;
  is_music_playing: boolean;
}

export const ImmersiveOverlay = ({ tableId, isMaster }: { tableId: string, isMaster: boolean }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();
  
  // Estados de Áudio
  const [localVolume, setLocalVolume] = useState(0.5);
  // Começamos MUDO por padrão para garantir que o vídeo carrega (Autoplay Policy)
  const [isMuted, setIsMuted] = useState(true); 
  const [audioError, setAudioError] = useState(false);

  // 1. Escutar o Estado do Jogo em Tempo Real
  useEffect(() => {
    supabase.from("game_states").select("*").eq("table_id", tableId).maybeSingle()
      .then(({ data }) => { if (data) setGameState(data as any); });

    const channel = supabase.channel(`game-state:${tableId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
      (payload) => {
        setGameState(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // 2. Tentativa Automática de Unmute
  // Quando o player começa, tentamos tirar o mudo. Se falhar, o botão aparece.
  const handlePlayerStart = () => {
    console.log("▶️ Player Iniciado (Mudo). Tentando ativar som...");
    
    // Pequeno delay para garantir que o player está estável
    setTimeout(() => {
        setIsMuted(false); // Tenta tirar o mudo
        // Se o navegador bloquear, o estado visual não muda realmente sem interação,
        // mas podemos verificar se o áudio está a fluir ou assumir sucesso.
        // Para garantir, vamos deixar o botão de volume visível se estivermos 'mutados' logicamente.
    }, 500);
  };

  const handlePlayerError = (e: any) => {
    // Ignora AbortError (troca rápida de música ou pause)
    if (e && (e.name === 'AbortError' || e.message?.includes('interrupted'))) return;
    
    console.warn("⚠️ Erro no Player:", e);
    setAudioError(true);
  };

  const shouldPlay = Boolean(
    gameState?.is_music_playing && 
    gameState?.active_music_url
  );

  const handleCloseCutscene = async () => {
    await supabase.from("game_states").update({ 
      active_cutscene_type: 'none', 
      active_cutscene_url: null 
    }).eq("table_id", tableId);
    
    toast({ title: "Cutscene encerrada." });
  };

  // Se o sistema tentar "desmutar" mas o navegador bloquear, o ReactPlayer pode não atualizar o estado interno.
  // Vamos forçar o utilizador a interagir se ele não ouvir nada.

  if (!gameState) return null;

  return (
    <>
      {/* --- LEITOR DE ÁUDIO (Escondido mas carregado) --- */}
      <div 
        style={{ 
            position: 'fixed', 
            top: '200%', 
            left: 0, 
            width: '640px', 
            height: '360px', 
            opacity: 0, 
            pointerEvents: 'none',
            zIndex: -1 
        }}
      >
        <ReactPlayer
          url={gameState.active_music_url || ""}
          playing={shouldPlay}
          loop={true}
          volume={localVolume}
          muted={isMuted} // Controlado pelo estado: começa true, tenta virar false
          width="100%"
          height="100%"
          onStart={handlePlayerStart}
          onError={handlePlayerError}
          config={{
            youtube: { 
                playerVars: { 
                    autoplay: 1,
                    playsinline: 1,
                    controls: 0,
                    disablekb: 1,
                    origin: window.location.origin
                } 
            },
            file: { 
                forceAudio: true, 
                attributes: { preload: 'auto', autoPlay: true } 
            }
          }}
        />
      </div>

      {/* --- WIDGET DE CONTROLO (Sempre visível se houver música) --- */}
      {(gameState.active_music_url && gameState.is_music_playing) && (
          <div className={`fixed bottom-4 left-4 z-[90] flex items-center gap-2 p-2 rounded-full border shadow-lg animate-in slide-in-from-bottom-5 transition-colors duration-300 ${audioError || isMuted ? "bg-destructive/90 border-destructive text-white" : "bg-black/80 border-border/50"}`}>
             
             <Button 
                variant="ghost" 
                size="icon" 
                className={`h-8 w-8 rounded-full ${audioError || isMuted ? "hover:bg-destructive/80" : ""}`}
                onClick={() => {
                    // O clique do utilizador é a "Chave Mestra" para desbloquear o áudio
                    setIsMuted(false);
                    setAudioError(false);
                    // Força um pequeno "soluço" no volume para garantir que o player acorda
                    setLocalVolume(prev => prev === 1 ? 0.99 : prev + 0.001);
                }}
             >
                {(audioError || isMuted) ? <VolumeX className="w-4 h-4 animate-pulse" /> : <Volume2 className="w-4 h-4 text-green-400" />}
             </Button>
             
             {/* Se estiver tudo bem, mostra slider. Se houver erro/mudo, pede clique. */}
             {(!audioError && !isMuted) ? (
                 <div className="w-24 mr-2">
                    <Slider 
                        defaultValue={[localVolume]} 
                        max={1} 
                        step={0.01} 
                        onValueChange={(vals) => setLocalVolume(vals[0])}
                        className="cursor-pointer"
                    />
                 </div>
             ) : (
                 <span 
                    className="text-xs font-bold pr-2 cursor-pointer"
                    onClick={() => { setIsMuted(false); setAudioError(false); }}
                 >
                    {isMuted ? "Toque para ativar som" : "Erro: Toque aqui"}
                 </span>
             )}
          </div>
      )}

      {/* --- OVERLAY VISUAL (CUTSCENES) --- */}
      {gameState.active_cutscene_type !== 'none' && gameState.active_cutscene_url && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-700">
          {isMaster && (
            <Button 
              variant="destructive" size="icon" className="absolute top-6 right-6 z-[101]"
              onClick={handleCloseCutscene}
            >
              <X className="w-6 h-6" />
            </Button>
          )}

          {gameState.active_cutscene_type === 'image' && (
            <img src={gameState.active_cutscene_url} alt="Cutscene" className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"/>
          )}

          {gameState.active_cutscene_type === 'video' && (
            <div className="w-full h-full flex items-center justify-center">
                <ReactPlayer 
                    url={gameState.active_cutscene_url} 
                    playing={true} 
                    loop={true} 
                    controls={false} 
                    width="100%" 
                    height="100%" 
                    className="pointer-events-none"
                />
            </div>
          )}
        </div>
      )}
    </>
  );
};