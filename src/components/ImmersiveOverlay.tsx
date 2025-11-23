// src/components/ImmersiveOverlay.tsx

import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Radio, Volume2, VolumeX, Zap, AlertTriangle, ListMusic, Pause, Film } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface GameState {
  active_cutscene_url: string | null;
  active_cutscene_type: 'image' | 'video' | 'none';
  active_music_url: string | null;
  is_music_playing: boolean;
  active_music_index: number; 
}

// --- HELPERS ---
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  try {
    const listMatch = url.match(/[?&]list=([^#\&\?]+)/);
    if (listMatch) return `https://www.youtube.com/embed?listType=playlist&list=${listMatch[1]}&autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playsinline=1`;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${match[2]}&playsinline=1`;
  } catch (e) { console.error(e); }
  return null;
};

const getVisualYouTubeUrl = (url: string) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  if (match && match[2].length === 11) return `https://www.youtube.com/embed/${match[2]}?autoplay=1&controls=0&disablekb=1&fs=0&loop=1&playlist=${match[2]}&playsinline=1`;
  return null;
};

export const ImmersiveOverlay = ({ tableId, isMaster }: { tableId: string, isMaster: boolean }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();
  
  // Estados
  const [isRadioOn, setIsRadioOn] = useState(false); 
  const [volume, setVolume] = useState(0.5); 
  const [isExpanded, setIsExpanded] = useState(false); // Controla expansão ao passar o rato
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. CONEXÃO AO SUPABASE
  useEffect(() => {
    const initGameState = async () => {
        const { data } = await supabase.from("game_states").select("*").eq("table_id", tableId).maybeSingle();
        if (data) setGameState(data as any);
        else {
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

  // 2. Playlist
  const playlist = useMemo(() => {
    if (!gameState?.active_music_url) return [];
    return gameState.active_music_url.split("|").filter(url => url.trim() !== "");
  }, [gameState?.active_music_url]);

  const currentTrackIndex = gameState?.active_music_index || 0;
  const currentUrl = playlist[currentTrackIndex] || "";

  // 3. Controlo Volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isRadioOn && gameState?.is_music_playing) audioRef.current.play().catch(() => {});
      else audioRef.current.pause();
    }
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = !isRadioOn;
    }
  }, [volume, isRadioOn, gameState?.is_music_playing, currentUrl, gameState?.active_cutscene_url]); 

  const handleTrackEnd = async () => {
    if (isMaster && playlist.length > 0) {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        await supabase.from("game_states").update({ active_music_index: nextIndex }).eq("table_id", tableId);
    }
  };

  const shouldPlayAudio = isRadioOn && gameState?.is_music_playing && playlist.length > 0;
  const youtubeAudioUrl = shouldPlayAudio ? getYouTubeEmbedUrl(currentUrl) : null;
  const isDirectAudioUrl = shouldPlayAudio && !youtubeAudioUrl;

  const showCutscene = gameState?.active_cutscene_type !== 'none' && gameState?.active_cutscene_url;
  const visualYoutubeUrl = (showCutscene && getVisualYouTubeUrl(gameState?.active_cutscene_url || "")) || null;

  const handleCloseCutscene = async () => {
    await supabase.from("game_states").update({ active_cutscene_type: 'none', active_cutscene_url: null }).eq("table_id", tableId);
    toast({ title: "Projeção encerrada." });
  };

  // Lógica de Expansão Automática
  useEffect(() => {
    if (isRadioOn) {
        setIsExpanded(true);
        const timer = setTimeout(() => setIsExpanded(false), 3000);
        return () => clearTimeout(timer);
    }
  }, [isRadioOn]);

  if (!gameState) return null;

  // --- CONDIÇÃO DE VISIBILIDADE DO WIDGET ---
  // Só mostra o botão se houver música ativa OU cutscene ativa na mesa
  const hasActiveMedia = !!gameState.active_music_url || (gameState.active_cutscene_type !== 'none' && !!gameState.active_cutscene_url);

  if (!hasActiveMedia) return null; // Se nada estiver a acontecer, limpa o ecrã

  return (
    <>
      {/* MOTORES DE AUDIO (Escondidos) */}
      {youtubeAudioUrl && (
        <div className="fixed top-[-9999px] left-[-9999px] invisible w-0 h-0">
          <iframe width="10" height="10" src={youtubeAudioUrl} title="Radio" allow="autoplay" />
        </div>
      )}
      {isDirectAudioUrl && (
        <audio ref={audioRef} src={currentUrl} onEnded={handleTrackEnd} className="hidden" />
      )}

      {/* --- WIDGET MINIMALISTA (FAB) --- */}
      <div 
        className="fixed bottom-4 left-4 z-[90] flex items-center group"
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
         {/* Painel Deslizante (Volume/Info) */}
         <div className={cn(
             "flex items-center gap-3 bg-black/80 backdrop-blur-md border border-border/50 rounded-r-full pr-4 pl-10 py-1.5 h-10 -ml-9 transition-all duration-500 ease-in-out overflow-hidden",
             (isExpanded && isRadioOn) ? "max-w-[300px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-10"
         )}>
             <div className="flex items-center gap-3 ml-2">
                <div className="w-24">
                     <Slider defaultValue={[volume]} max={1} step={0.05} onValueChange={(v) => setVolume(v[0])} className={cn("cursor-pointer", !!youtubeAudioUrl && "opacity-50")} disabled={!!youtubeAudioUrl} />
                </div>
                
                {gameState.is_music_playing ? (
                    <Zap className="w-3 h-3 text-green-400 animate-pulse shrink-0" />
                ) : (
                    <Pause className="w-3 h-3 text-yellow-500 shrink-0" />
                )}
                
                {playlist.length > 1 && (
                   <span className="text-[9px] text-muted-foreground font-mono whitespace-nowrap">
                     {currentTrackIndex + 1}/{playlist.length}
                   </span>
                )}
             </div>
         </div>

         {/* Botão Principal (Sem texto, apenas ícone) */}
         <Button 
            size="icon" 
            className={cn(
                "h-10 w-10 rounded-full shadow-xl border-2 transition-all absolute left-0 z-10",
                !isRadioOn 
                  ? "bg-destructive text-white border-red-400 animate-pulse hover:bg-destructive/90 hover:scale-110" 
                  : "bg-green-600 text-white border-green-400 hover:bg-green-700 hover:scale-105"
            )}
            onClick={() => setIsRadioOn(!isRadioOn)}
            title={isRadioOn ? "Silenciar Bardo" : "Conectar ao Bardo"}
         >
            {!isRadioOn ? <VolumeX className="w-5 h-5" /> : <Radio className="w-5 h-5" />}
         </Button>
      </div>

      {/* --- VISUAL OVERLAY --- */}
      {showCutscene && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-700">
          {isMaster && (
            <Button variant="destructive" size="icon" className="absolute top-4 right-4 z-[101] rounded-full opacity-50 hover:opacity-100 transition-opacity" onClick={handleCloseCutscene}>
              <X className="w-5 h-5" />
            </Button>
          )}

          {visualYoutubeUrl ? (
             <div className="w-full h-full pointer-events-none">
                <iframe width="100%" height="100%" src={visualYoutubeUrl} title="Visual" allow="autoplay" />
             </div>
          ) : (
             gameState.active_cutscene_type === 'image' ? (
                <img src={gameState.active_cutscene_url!} alt="Cutscene" className="max-w-full max-h-full object-contain shadow-2xl" />
             ) : (
                <video 
                   ref={videoRef} src={gameState.active_cutscene_url!} 
                   autoPlay loop className="max-w-full max-h-full" muted={!isRadioOn} 
                />
             )
          )}
        </div>
      )}
    </>
  );
};