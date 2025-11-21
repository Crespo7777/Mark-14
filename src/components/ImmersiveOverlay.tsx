// src/components/ImmersiveOverlay.tsx

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Radio, Volume2, VolumeX, Zap, AlertTriangle, ListMusic, Pause, Film } from "lucide-react";
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

// Helper para YouTube (Áudio)
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

// Helper para YouTube (Vídeo Visual - sem loop forçado de áudio)
const getVisualYouTubeUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) {
    // Controls=0 esconde a barra, autoplay=1 toca, mute=0 tenta som, loop=1 repete
    return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${match[2]}&playsinline=1`;
  }
  return null;
};

export const ImmersiveOverlay = ({ tableId, isMaster }: { tableId: string, isMaster: boolean }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();
  
  // Estado Local
  const [isRadioOn, setIsRadioOn] = useState(false); 
  const [volume, setVolume] = useState(0.5); 
  
  // Refs para controlo direto do DOM
  const audioRef = useRef<HTMLAudioElement>(null); // Player MP3 (Bardo)
  const videoRef = useRef<HTMLVideoElement>(null); // Player MP4 (Projeção)

  // 1. CONEXÃO AO SUPABASE (Realtime e Auto-Cura)
  useEffect(() => {
    const initGameState = async () => {
        const { data, error } = await supabase.from("game_states").select("*").eq("table_id", tableId).maybeSingle();
        if (data) {
            setGameState(data as any);
        } else {
            // Auto-cura se não existir
            const { data: newData } = await supabase.from("game_states").insert({ table_id: tableId }).select().single();
            if (newData) setGameState(newData as any);
        }
    };
    initGameState();

    const channel = supabase.channel(`game-state:${tableId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
      (payload) => setGameState(payload.new as any))
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // 2. Lógica de Playlist (Bardo)
  const playlist = useMemo(() => {
    if (!gameState?.active_music_url) return [];
    return gameState.active_music_url.split("|").filter(url => url.trim() !== "");
  }, [gameState?.active_music_url]);

  const currentTrackIndex = gameState?.active_music_index || 0;
  const currentUrl = playlist[currentTrackIndex] || "";

  // 3. CONTROLO UNIFICADO DE VOLUME E AUDIO
  useEffect(() => {
    // --- Controla o BARDO (Música de Fundo) ---
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isRadioOn && gameState?.is_music_playing) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }

    // --- Controla a PROJEÇÃO (Vídeo Visual) ---
    // Se houver um vídeo projetado, ele obedece ao mesmo volume e botão "Sintonizar"
    if (videoRef.current) {
      videoRef.current.volume = volume;
      // O vídeo deve estar sempre mudo se o rádio estiver desligado
      videoRef.current.muted = !isRadioOn;
    }
  }, [volume, isRadioOn, gameState?.is_music_playing, currentUrl, gameState?.active_cutscene_url]); 

  // Handler de Fim de Música (Playlist)
  const handleTrackEnd = async () => {
    if (isMaster && playlist.length > 0) {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        await supabase.from("game_states").update({ active_music_index: nextIndex }).eq("table_id", tableId);
    }
  };

  // Variáveis de Decisão de Renderização
  const shouldPlayAudio = isRadioOn && gameState?.is_music_playing && playlist.length > 0;
  const youtubeAudioUrl = shouldPlayAudio ? getYouTubeEmbedUrl(currentUrl) : null;
  const isDirectAudioUrl = shouldPlayAudio && !youtubeAudioUrl;

  // Decisão da Projeção Visual
  const showCutscene = gameState?.active_cutscene_type !== 'none' && gameState?.active_cutscene_url;
  const isVisualYoutube = showCutscene && getVisualYouTubeUrl(gameState?.active_cutscene_url || "") !== null;
  const visualYoutubeUrl = isVisualYoutube ? getVisualYouTubeUrl(gameState?.active_cutscene_url || "") : null;

  const handleCloseCutscene = async () => {
    await supabase.from("game_states").update({ active_cutscene_type: 'none', active_cutscene_url: null }).eq("table_id", tableId);
    toast({ title: "Projeção encerrada." });
  };

  if (!gameState) return null;

  return (
    <>
      {/* --- AUDIO ENGINES (BARDO) --- */}
      {youtubeAudioUrl && (
        <div style={{ position: 'fixed', top: '-9999px', left: '-9999px', visibility: 'hidden', width:0, height:0 }}>
          <iframe width="10" height="10" src={youtubeAudioUrl} title="Radio" allow="autoplay" />
        </div>
      )}
      {isDirectAudioUrl && (
        <audio ref={audioRef} src={currentUrl} onEnded={handleTrackEnd} style={{ display: 'none' }} />
      )}

      {/* --- WIDGET DE CONTROLO --- */}
      <div className={`fixed bottom-4 left-4 z-[90] flex items-center gap-3 p-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 ${!isRadioOn ? "bg-destructive/90 border-destructive/50" : "bg-black/80 border-green-500/30"}`}>
         <Button 
            variant="ghost" size="icon" 
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
                    Clique para ativar <br/>áudio e vídeo.
                 </div>
             ) : (
                 <div className="text-[10px] font-mono text-muted-foreground">
                    {/* Indicador do Bardo */}
                    {gameState.is_music_playing ? (
                        <div className="flex flex-col">
                            <span className="text-green-300 flex items-center gap-1">
                               <Zap className="w-3 h-3"/> Bardo Ativo
                            </span>
                            {playlist.length > 1 && (
                                <span className="text-[9px] text-white/50 flex items-center gap-1 mt-0.5">
                                   <ListMusic className="w-3 h-3"/> Faixa {currentTrackIndex + 1} / {playlist.length}
                                </span>
                            )}
                        </div>
                    ) : (
                        <span className="flex items-center gap-1 text-yellow-500">
                           <Pause className="w-3 h-3"/> Bardo em Pausa
                        </span>
                    )}
                 </div>
             )}

             {isRadioOn && (
                 <div className="flex items-center gap-2 mt-1">
                    <Volume2 className="w-3 h-3 text-muted-foreground"/>
                    <Slider 
                        defaultValue={[volume]} max={1} step={0.05} 
                        onValueChange={(vals) => setVolume(vals[0])}
                        className={`w-full ${youtubeAudioUrl ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        disabled={!!youtubeAudioUrl} 
                    />
                 </div>
             )}
         </div>
      </div>

      {/* --- VISUAL OVERLAY (PROJEÇÃO) --- */}
      {showCutscene && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-700">
          {/* Botão Fechar para o Mestre */}
          {isMaster && (
            <Button variant="destructive" size="icon" className="absolute top-6 right-6 z-[101] shadow-lg hover:scale-110 transition-transform" onClick={handleCloseCutscene}>
              <X className="w-6 h-6" />
            </Button>
          )}

          {/* 1. CASO SEJA YOUTUBE (Visual) */}
          {visualYoutubeUrl ? (
             <div className="w-full h-full">
                <iframe width="100%" height="100%" src={visualYoutubeUrl} title="Visual" allow="autoplay" className="pointer-events-none" />
             </div>
          ) : (
             /* 2. CASO SEJA ARQUIVO (Imagem ou Vídeo MP4/WebM) */
             gameState.active_cutscene_type === 'image' ? (
                <img src={gameState.active_cutscene_url!} alt="Cutscene" className="max-w-full max-h-full object-contain shadow-2xl drop-shadow-2xl" />
             ) : (
                /* Player de Vídeo Nativo Otimizado */
                <div className="relative w-full h-full flex items-center justify-center">
                   <video 
                      ref={videoRef}
                      src={gameState.active_cutscene_url!} 
                      autoPlay 
                      loop 
                      controls={false} 
                      className="max-w-full max-h-full shadow-2xl"
                      // Se o rádio estiver desligado, o vídeo toca mudo (visual funciona)
                      // Se estiver ligado, o useEffect sincroniza o volume
                      muted={!isRadioOn}
                   />
                   {/* Indicador se o som do vídeo estiver ativo */}
                   {isRadioOn && (
                      <div className="absolute bottom-8 right-8 bg-black/50 px-3 py-1 rounded-full text-xs text-white flex items-center gap-2">
                          <Film className="w-3 h-3" /> Som do Vídeo Ativo
                      </div>
                   )}
                </div>
             )
          )}
        </div>
      )}
    </>
  );
};