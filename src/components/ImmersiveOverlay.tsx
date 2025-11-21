// src/components/ImmersiveOverlay.tsx

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Radio, Volume2, VolumeX, Zap, AlertTriangle, ListMusic, Pause, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";

interface GameState {
  active_cutscene_url: string | null;
  active_cutscene_type: 'image' | 'video' | 'none';
  active_music_url: string | null;
  is_music_playing: boolean;
  active_music_index: number; 
}

const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  
  try {
    const listMatch = url.match(/[?&]list=([^#\&\?]+)/);
    if (listMatch) {
      return `https://www.youtube.com/embed?listType=playlist&list=${listMatch[1]}&autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playsinline=1`;
    }
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${match[2]}&playsinline=1`;
    }
  } catch (e) { console.error(e); }
  return null;
};

export const ImmersiveOverlay = ({ tableId, isMaster }: { tableId: string, isMaster: boolean }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();
  
  const [isRadioOn, setIsRadioOn] = useState(false); 
  const [volume, setVolume] = useState(0.5); 
  
  const audioRef = useRef<HTMLAudioElement>(null);

  // 1. CONEXÃO ROBUSTA AO SUPABASE (COM AUTO-CURA)
  useEffect(() => {
    const initGameState = async () => {
        // Tenta buscar o estado
        const { data, error } = await supabase.from("game_states").select("*").eq("table_id", tableId).maybeSingle();
        
        if (data) {
            setGameState(data as any);
        } else {
            // --- AUTO-CURA ---
            // Se não existir estado (o bug que encontraste), criamos um agora mesmo!
            console.warn("Estado de jogo não encontrado. Criando novo...");
            const { data: newData, error: createError } = await supabase
                .from("game_states")
                .insert({ table_id: tableId })
                .select()
                .single();
            
            if (newData) {
                setGameState(newData as any);
            } else if (createError) {
                console.error("Erro fatal ao criar estado:", createError);
                toast({ title: "Erro no Sistema", description: "Não foi possível iniciar o sistema de áudio.", variant: "destructive" });
            }
        }
    };
    
    initGameState();

    const channel = supabase.channel(`game-state:${tableId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
      (payload) => {
        setGameState(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // Analisa a Playlist
  const playlist = useMemo(() => {
    if (!gameState?.active_music_url) return [];
    return gameState.active_music_url.split("|").filter(url => url.trim() !== "");
  }, [gameState?.active_music_url]);

  const currentTrackIndex = gameState?.active_music_index || 0;
  const currentUrl = playlist[currentTrackIndex] || "";

  // Controlo de Volume e Play/Pause (MP3)
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isRadioOn && gameState?.is_music_playing) {
        audioRef.current.play().catch(() => console.log("Autoplay bloqueado aguardando interação"));
      } else {
        audioRef.current.pause();
      }
    }
  }, [volume, isRadioOn, gameState?.is_music_playing, currentUrl]); 

  // Handler de Fim de Música (AUTOMÁTICO)
  const handleTrackEnd = async () => {
    if (isMaster && playlist.length > 0) {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        await supabase.from("game_states").update({
            active_music_index: nextIndex
        }).eq("table_id", tableId);
    }
  };

  const shouldPlay = isRadioOn && gameState?.is_music_playing && playlist.length > 0;
  const youtubeUrl = shouldPlay ? getYouTubeEmbedUrl(currentUrl) : null;
  const isDirectAudioUrl = shouldPlay && !youtubeUrl;

  const handleCloseCutscene = async () => {
    await supabase.from("game_states").update({ active_cutscene_type: 'none', active_cutscene_url: null }).eq("table_id", tableId);
    toast({ title: "Projeção encerrada." });
  };

  // Se o gameState ainda estiver a carregar (ou a ser criado), não mostramos nada
  if (!gameState) return null;

  return (
    <>
      {/* --- AUDIO ENGINES --- */}
      {youtubeUrl && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden', width:0, height:0 }}>
          <iframe width="10" height="10" src={youtubeUrl} title="Radio" allow="autoplay" />
        </div>
      )}

      {isDirectAudioUrl && (
        <audio
          ref={audioRef}
          src={currentUrl}
          onEnded={handleTrackEnd} 
          style={{ display: 'none' }}
        />
      )}

      {/* --- WIDGET --- */}
      <div className={`fixed bottom-4 left-4 z-[90] flex items-center gap-3 p-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${!isRadioOn ? "bg-destructive/90 border-destructive/50" : "bg-black/80 border-green-500/30"}`}>
         
         <Button 
            variant="ghost" 
            size="icon" 
            className={`h-14 w-14 rounded-full border-2 shadow-inner transition-all ${!isRadioOn ? "bg-red-900/20 border-red-200 text-white animate-pulse" : "bg-green-900/20 border-green-500 text-green-400 hover:bg-green-900/40"}`}
            onClick={() => setIsRadioOn(!isRadioOn)}
         >
            {!isRadioOn ? <VolumeX className="w-6 h-6" /> : <Radio className="w-6 h-6" />}
         </Button>
         
         <div className="flex flex-col gap-1 min-w-[160px]">
             <div className="flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-widest ${!isRadioOn ? "text-red-100" : "text-green-400"}`}>
                    {isRadioOn ? "Sintonizado" : "Desconectado"}
                </span>
                {isRadioOn && <div className="h-2 w-2 rounded-full bg-green-500 animate-ping"/>}
             </div>

             {!isRadioOn ? (
                 <div className="text-[10px] text-white/90 leading-tight cursor-pointer hover:underline" onClick={() => setIsRadioOn(true)}>
                    Clique no botão para <br/>conectar ao áudio da mesa.
                 </div>
             ) : (
                 <div className="text-[10px] font-mono text-muted-foreground">
                    {gameState.is_music_playing ? (
                        <div className="flex flex-col">
                            <span className="text-green-300 flex items-center gap-1">
                               <Zap className="w-3 h-3"/> A transmitir...
                            </span>
                            {playlist.length > 1 && (
                                <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
                                   <ListMusic className="w-3 h-3"/> Faixa {currentTrackIndex + 1} / {playlist.length}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="flex items-center gap-1 text-yellow-500">
                           <Pause className="w-3 h-3"/> Em Pausa
                        </span>
                    )}
                 </div>
             )}

             {isRadioOn && (
                 <div className="flex items-center gap-2 mt-1">
                    <Volume2 className="w-3 h-3 text-muted-foreground"/>
                    <Slider 
                        defaultValue={[volume]} 
                        max={1} 
                        step={0.05} 
                        onValueChange={(vals) => setVolume(vals[0])}
                        className={`w-full ${youtubeUrl ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        disabled={!!youtubeUrl} 
                    />
                 </div>
             )}
         </div>
      </div>

      {/* --- VISUAL OVERLAY --- */}
      {gameState.active_cutscene_type !== 'none' && gameState.active_cutscene_url && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-700">
          {isMaster && (
            <Button variant="destructive" size="icon" className="absolute top-6 right-6 z-[101]" onClick={handleCloseCutscene}>
              <X className="w-6 h-6" />
            </Button>
          )}
          {gameState.active_cutscene_type === 'image' ? (
            <img src={gameState.active_cutscene_url} alt="Cutscene" className="max-w-full max-h-full object-contain shadow-2xl" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
               <video src={gameState.active_cutscene_url} autoPlay loop controls={false} className="max-w-full max-h-full" />
            </div>
          )}
        </div>
      )}
    </>
  );
};