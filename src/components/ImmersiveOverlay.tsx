import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Radio, Volume2, VolumeX, Zap, Pause, AlertTriangle } from "lucide-react";
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

// Helpers
const getYouTubeEmbedUrl = (url: string) => {
  if (!url) return null;
  try {
    const listMatch = url.match(/[?&]list=([^#\&\?]+)/);
    if (listMatch) return `https://www.youtube.com/embed?listType=playlist&list=${listMatch[1]}&autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&loop=1`;
    const videoIdMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/)|youtube\.com\/shorts\/)([^#&?]*)/);
    if (videoIdMatch && videoIdMatch[1]) return `https://www.youtube.com/embed/${videoIdMatch[1]}?autoplay=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&loop=1&playlist=${videoIdMatch[1]}`;
  } catch (e) { console.error(e); }
  return null;
};

const getVisualYouTubeUrl = (url: string) => {
  const embed = getYouTubeEmbedUrl(url);
  return embed ? embed + "&mute=1" : null;
};

export const ImmersiveOverlay = ({ tableId, isMaster }: { tableId: string, isMaster: boolean }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const { toast } = useToast();
  
  const [isRadioOn, setIsRadioOn] = useState(false); 
  const [volume, setVolume] = useState(0.5); 
  const [isExpanded, setIsExpanded] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // 1. CONEXÃO SUPABASE + SYNC PULSE (Anti-Falha)
  useEffect(() => {
    const fetchState = async () => {
        const { data } = await supabase.from("game_states").select("*").eq("table_id", tableId).maybeSingle();
        if (data) setGameState(data as any);
    };
    
    fetchState(); // Inicial

    // Realtime
    const channel = supabase.channel(`game-state-overlay:${tableId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
      (payload) => setGameState(payload.new as any))
      .subscribe();

    // Polling de Segurança (A cada 5s verifica se estamos sincronizados)
    // Isto resolve o problema de "Botão não funciona" se o pacote Realtime se perder
    const interval = setInterval(fetchState, 5000);

    return () => { 
        supabase.removeChannel(channel); 
        clearInterval(interval);
    };
  }, [tableId]);

  // 2. Playlist
  const playlist = useMemo(() => {
    if (!gameState?.active_music_url) return [];
    return gameState.active_music_url.split("|").filter(url => url.trim() !== "");
  }, [gameState?.active_music_url]);

  const currentTrackIndex = gameState?.active_music_index || 0;
  const currentUrl = playlist[currentTrackIndex] || "";

  const isYouTube = currentUrl.includes("youtube") || currentUrl.includes("youtu.be");
  const shouldPlayAudio = gameState?.is_music_playing && playlist.length > 0 && isRadioOn;
  
  const youtubeAudioUrl = (shouldPlayAudio && isYouTube) ? getYouTubeEmbedUrl(currentUrl) : null;
  const isDirectAudio = (shouldPlayAudio && !isYouTube);

  // 3. Áudio Local
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isDirectAudio) {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
              playPromise.catch(error => {
                  console.warn("Autoplay bloqueado:", error);
                  setAutoplayBlocked(true);
                  setIsRadioOn(false);
              });
          }
      } else {
          audioRef.current.pause();
      }
    }
  }, [volume, isDirectAudio, currentUrl]); 

  const toggleRadio = () => {
      setAutoplayBlocked(false);
      setIsRadioOn(!isRadioOn);
      if (!isRadioOn) toast({ title: "🔊 Rádio Ligado" });
      else toast({ title: "🔇 Rádio Desligado" });
  };

  const handleTrackEnd = async () => {
    if (isMaster && playlist.length > 0) {
        const nextIndex = (currentTrackIndex + 1) % playlist.length;
        await supabase.from("game_states").update({ active_music_index: nextIndex }).eq("table_id", tableId);
    }
  };

  // 4. Cutscene (Prios)
  const showCutscene = gameState?.active_cutscene_type !== 'none' && gameState?.active_cutscene_url;
  const visualYoutubeUrl = (showCutscene && getVisualYouTubeUrl(gameState?.active_cutscene_url || "")) || null;

  const handleCloseCutscene = async () => {
    await supabase.from("game_states").update({ active_cutscene_type: 'none', active_cutscene_url: null }).eq("table_id", tableId);
    toast({ title: "Projeção encerrada." });
  };

  useEffect(() => {
    if (isRadioOn) { const t = setTimeout(() => setIsExpanded(false), 5000); return () => clearTimeout(t); }
  }, [isRadioOn]);

  if (!gameState) return null;

  return (
    <>
      {youtubeAudioUrl && (
        <div className="fixed bottom-0 left-0 w-[1px] h-[1px] opacity-0 pointer-events-none overflow-hidden z-0">
          <iframe width="100%" height="100%" src={youtubeAudioUrl} title="Bardo" allow="autoplay; encrypted-media" referrerPolicy="no-referrer" />
        </div>
      )}

      <audio ref={audioRef} src={isDirectAudio ? currentUrl : undefined} onEnded={handleTrackEnd} className="hidden" loop={playlist.length === 1} />

      <div className="fixed bottom-4 left-4 z-[90] flex items-center group" onMouseEnter={() => setIsExpanded(true)} onMouseLeave={() => setIsExpanded(false)}>
         <div className={cn("flex items-center gap-3 bg-black/90 backdrop-blur-xl border border-white/20 rounded-r-full pr-6 pl-10 py-2 h-12 -ml-9 transition-all duration-500 ease-out overflow-hidden shadow-2xl", (isExpanded || !isRadioOn) ? "max-w-[300px] opacity-100 translate-x-0" : "max-w-0 opacity-0 -translate-x-10")}>
             <div className="flex items-center gap-3 ml-2">
                <div className="w-24 group/slider"><Slider defaultValue={[volume]} max={1} step={0.01} onValueChange={(v) => setVolume(v[0])} className={cn("cursor-pointer", isYouTube && "opacity-50 hover:opacity-100 transition-opacity")} /></div>
                {gameState.is_music_playing ? <Zap className="w-4 h-4 text-green-400 animate-pulse shrink-0 fill-current" /> : <Pause className="w-4 h-4 text-yellow-500 shrink-0" />}
                <div className="flex flex-col justify-center min-w-0">
                    <span className="text-[10px] font-bold text-white leading-none truncate max-w-[100px]">{isYouTube ? "YouTube" : "Local"}</span>
                    {playlist.length > 0 && <span className="text-[9px] text-muted-foreground font-mono leading-none mt-0.5">{currentTrackIndex + 1}/{playlist.length}</span>}
                </div>
             </div>
         </div>
         <Button size="icon" className={cn("h-12 w-12 rounded-full shadow-[0_0_15px_rgba(0,0,0,0.5)] border-2 transition-all absolute left-0 z-10", autoplayBlocked ? "bg-red-600 border-red-400 animate-bounce" : !isRadioOn ? "bg-destructive text-white border-red-400 animate-pulse hover:bg-destructive/90 hover:scale-110" : "bg-green-600 text-white border-green-400 hover:bg-green-700 hover:scale-105")} onClick={toggleRadio} title={autoplayBlocked ? "Áudio Bloqueado! Clique para Ativar" : (isRadioOn ? "Silenciar" : "Ligar Rádio")}>
            {autoplayBlocked ? <AlertTriangle className="w-6 h-6 text-white"/> : (!isRadioOn ? <VolumeX className="w-6 h-6" /> : <Radio className="w-6 h-6" />)}
         </Button>
      </div>

      {showCutscene && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-700">
          {isMaster && <Button variant="destructive" size="icon" className="absolute top-4 right-4 z-[101] rounded-full opacity-50 hover:opacity-100 transition-opacity" onClick={handleCloseCutscene}><X className="w-5 h-5" /></Button>}
          {visualYoutubeUrl ? <div className="w-full h-full pointer-events-none"><iframe width="100%" height="100%" src={visualYoutubeUrl} title="Visual" allow="autoplay; encrypted-media" /></div> : gameState.active_cutscene_type === 'image' ? <img src={gameState.active_cutscene_url!} alt="Cutscene" className="max-w-full max-h-full object-contain shadow-2xl" /> : <video ref={videoRef} src={gameState.active_cutscene_url!} autoPlay loop className="max-w-full max-h-full" muted={!isRadioOn} />}
        </div>
      )}
    </>
  );
};