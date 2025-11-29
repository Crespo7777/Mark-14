import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Pause, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Music, 
  Youtube,
  Upload,
  Trash2,
  RefreshCw
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useTableContext } from "@/features/table/TableContext";
// CORREÇÃO DA IMPORTAÇÃO (Evita erro do Vite)
import ReactPlayer from "react-player";

// Tipos para as músicas
interface MusicTrack {
  id: string;
  title: string;
  url: string;
  duration?: string;
  added_by: string;
}

export const BardPanel = () => {
  const { tableId } = useTableContext();
  const { toast } = useToast();
  
  // Estados do Player
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  
  // Estado para adicionar música
  const [newUrl, setNewUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Referência do Player
  const playerRef = useRef<ReactPlayer>(null);

  // Efeito para sincronizar estado via Supabase Realtime
  useEffect(() => {
    const channel = supabase.channel(`bard:${tableId}`)
      .on('broadcast', { event: 'player_state' }, (payload) => {
        console.log("Bard update received:", payload);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  const handleAddTrack = async () => {
    if (!newUrl) return;
    setIsLoading(true);
    
    // Simulação de adicionar à playlist
    const newTrack: MusicTrack = {
      id: crypto.randomUUID(),
      title: `Faixa ${playlist.length + 1} (Youtube)`,
      url: newUrl,
      added_by: "Mestre"
    };

    setPlaylist(prev => [...prev, newTrack]);
    setNewUrl("");
    setIsLoading(false);
    toast({ title: "Música adicionada à playlist" });

    // Se for a primeira, toca logo
    if (!currentTrack) {
        setCurrentTrack(newTrack);
        setIsPlaying(true);
    }
  };

  const togglePlay = () => setIsPlaying(!isPlaying);

  const toggleMute = () => setIsMuted(!isMuted);

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) setIsMuted(false);
  };

  const playTrack = (track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const removeTrack = (id: string) => {
    setPlaylist(prev => prev.filter(t => t.id !== id));
    if (currentTrack?.id === id) {
        setIsPlaying(false);
        setCurrentTrack(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-card/50 text-card-foreground">
      {/* --- HEADER --- */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-lg">O Bardo</h3>
        </div>

        {/* --- ÁREA DO PLAYER ATUAL --- */}
        <div className="bg-background/50 rounded-lg p-3 border border-border/50 shadow-inner space-y-3">
            <div className="flex items-center justify-between">
                <div className="overflow-hidden">
                    <p className="text-sm font-medium truncate text-primary">
                        {currentTrack ? currentTrack.title : "Nenhuma música tocando"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {isPlaying ? "Reproduzindo..." : "Pausado"}
                    </p>
                </div>
                {/* Player invisível */}
                <div className="hidden"> 
                    <ReactPlayer 
                        ref={playerRef}
                        url={currentTrack?.url}
                        playing={isPlaying}
                        volume={isMuted ? 0 : volume}
                        width="0"
                        height="0"
                        onEnded={() => setIsPlaying(false)}
                    />
                </div>
            </div>

            {/* CONTROLES PRINCIPAIS */}
            <div className="flex justify-center gap-4">
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={!currentTrack}>
                    <RefreshCw className="h-3 w-3" />
                </Button>
                <Button 
                    variant="default" 
                    size="icon" 
                    className="h-10 w-10 rounded-full shadow-lg hover:scale-105 transition-transform"
                    onClick={togglePlay}
                    disabled={!currentTrack}
                >
                    {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" disabled={!currentTrack}>
                    <SkipForward className="h-3 w-3 fill-current" />
                </Button>
            </div>

            {/* --- VOLUME (LAYOUT EM GRID AGORA) --- */}
            {/* O Grid garante colunas separadas: Botão (auto) | Slider (resto) */}
            <div className="grid grid-cols-[auto_1fr] items-center gap-4 px-2 pt-2">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-foreground" 
                    onClick={toggleMute}
                >
                    {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
                
                <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.01}
                    onValueChange={handleVolumeChange}
                    className="w-full cursor-pointer"
                />
            </div>
        </div>

        {/* --- ADICIONAR MÚSICA --- */}
        <div className="flex gap-2">
            <div className="relative flex-1">
                <Youtube className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Link do Youtube..." 
                    className="pl-8 h-9 text-xs"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                />
            </div>
            <Button size="sm" className="h-9 px-3" onClick={handleAddTrack} disabled={isLoading}>
                <Upload className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* --- PLAYLIST --- */}
      <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Playlist</h4>
              {playlist.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground/50 text-sm">
                      <Music className="h-8 w-8 mx-auto mb-2 opacity-20" />
                      Sem músicas na fila.
                  </div>
              ) : (
                  playlist.map((track) => (
                      <div 
                        key={track.id} 
                        className={`group flex items-center gap-3 p-2 rounded-md transition-colors border border-transparent ${currentTrack?.id === track.id ? "bg-accent border-accent-foreground/10" : "hover:bg-muted/50"}`}
                      >
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 shrink-0"
                            onClick={() => playTrack(track)}
                          >
                              {currentTrack?.id === track.id && isPlaying ? (
                                  <div className="flex gap-0.5 items-end h-3">
                                      <span className="w-0.5 h-full bg-primary animate-[bounce_1s_infinite]" />
                                      <span className="w-0.5 h-2 bg-primary animate-[bounce_1.2s_infinite]" />
                                      <span className="w-0.5 h-3 bg-primary animate-[bounce_0.8s_infinite]" />
                                  </div>
                              ) : (
                                  <Play className="h-4 w-4 fill-current text-muted-foreground group-hover:text-foreground" />
                              )}
                          </Button>
                          
                          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => playTrack(track)}>
                              <p className={`text-sm truncate ${currentTrack?.id === track.id ? "font-medium text-primary" : "text-foreground"}`}>
                                  {track.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">Youtube • {track.added_by}</p>
                          </div>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => removeTrack(track.id)}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                  ))
              )}
          </div>
      </ScrollArea>
    </div>
  );
};