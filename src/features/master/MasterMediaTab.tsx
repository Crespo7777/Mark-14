// src/features/master/MasterMediaTab.tsx

import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image as ImageIcon, Music, Play, Pause, Square, Film, Cast, MonitorPlay, FolderOpen, ListMusic, SkipForward } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { MediaLibrary } from "@/components/MediaLibrary";

const detectMediaType = (url: string): 'image' | 'video' => {
  if (!url) return 'image';
  const cleanUrl = url.split('?')[0].toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  if (videoExtensions.some(ext => cleanUrl.endsWith(ext))) return 'video';
  return 'image';
};

export const MasterMediaTab = ({ tableId }: { tableId: string }) => {
  const { toast } = useToast();
  const [mediaUrl, setMediaUrl] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [loading, setLoading] = useState(false);

  const detectedType = useMemo(() => detectMediaType(mediaUrl), [mediaUrl]);

  // Verifica se é playlist manual (vários URLs separados por |)
  const isPlaylist = musicUrl.includes("|");
  const playlistCount = isPlaylist ? musicUrl.split("|").length : 0;

  // --- VISUAL (IMAGEM/VIDEO) ---
  const handleShowMedia = async () => {
    if (!mediaUrl) return;
    setLoading(true);
    const type = detectMediaType(mediaUrl);

    const { error } = await supabase.from("game_states").update({
      active_cutscene_url: mediaUrl,
      active_cutscene_type: type
    }).eq("table_id", tableId);
    
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "A projetar para todos!" });
    setLoading(false);
  };

  const handleStopMedia = async () => {
    setLoading(true);
    await supabase.from("game_states").update({
      active_cutscene_type: 'none',
      active_cutscene_url: null
    }).eq("table_id", tableId);
    toast({ title: "Projeção encerrada." });
    setLoading(false);
  };

  // --- ÁUDIO (PLAY / PAUSE / STOP / SKIP) ---
  
  const handlePlayMusic = async () => {
    if (!musicUrl) return;
    // Reseta o índice para 0 sempre que damos Play numa nova lista/música
    await supabase.from("game_states").update({
        active_music_url: musicUrl,
        is_music_playing: true,
        active_music_index: 0 
    }).eq("table_id", tableId);
    toast({ title: "Música: Play ▶️" });
  };

  const handlePauseMusic = async () => {
    await supabase.from("game_states").update({ 
        is_music_playing: false 
    }).eq("table_id", tableId);
    toast({ title: "Música: Pause ⏸️" });
  };

  const handleStopMusic = async () => {
    await supabase.from("game_states").update({ 
        is_music_playing: false,
        active_music_url: null,
        active_music_index: 0
    }).eq("table_id", tableId);
    toast({ title: "Música: Parada ⏹️" });
  };

  const handleSkipTrack = async () => {
    // Para pular, precisamos saber o estado atual.
    const { data } = await supabase.from("game_states").select("active_music_url, active_music_index").eq("table_id", tableId).single();
    
    if (data && data.active_music_url) {
        const playlist = data.active_music_url.split("|");
        const currentIndex = data.active_music_index || 0;
        
        // Lógica de Loop: Se for a última, volta para a 0, senão +1
        const nextIndex = (currentIndex + 1) % playlist.length;

        await supabase.from("game_states").update({
            active_music_index: nextIndex
        }).eq("table_id", tableId);

        toast({ title: "Música: Próxima Faixa ⏭️" });
    }
  };

  const handleLibrarySelect = (url: string, type: 'image' | 'video' | 'audio') => {
    if (type === 'audio') {
      setMusicUrl(url);
    } else {
      setMediaUrl(url);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      
      {/* Controlo de Visual */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <MonitorPlay className="text-primary" /> Projeção Visual
          </CardTitle>
          <CardDescription>Imagens e vídeos em ecrã cheio.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
             <div className="flex justify-between items-center">
                <Label>URL da Mídia</Label>
                {mediaUrl && (
                    <Badge variant="outline" className="text-xs font-normal">
                    {detectedType === 'image' ? <ImageIcon className="w-3 h-3 mr-1"/> : <Film className="w-3 h-3 mr-1"/>}
                    {detectedType === 'image' ? 'Imagem' : 'Vídeo'}
                    </Badge>
                )}
             </div>
             <div className="flex gap-2">
                <Input 
                    placeholder="Cole link ou selecione..." 
                    value={mediaUrl} 
                    onChange={e => setMediaUrl(e.target.value)} 
                    className="flex-1"
                />
                <MediaLibrary 
                  filter="image" 
                  multiSelect={false}
                  onSelect={handleLibrarySelect} 
                  trigger={<Button variant="outline" size="icon"><FolderOpen className="w-4 h-4"/></Button>} 
                />
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={handleShowMedia} disabled={loading || !mediaUrl} className="w-full bg-primary hover:bg-primary/90">
               <Cast className="w-4 h-4 mr-2"/> Projetar
            </Button>
            <Button onClick={handleStopMedia} variant="destructive" className="w-full" disabled={loading}>
               <Square className="w-4 h-4 mr-2"/> Parar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controlo de Áudio (Agora "Bardo") */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-xl">
             <Music className="text-accent" /> Bardo
           </CardTitle>
           <CardDescription>YouTube (Automático) ou Biblioteca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>URL / Playlist</Label>
                {isPlaylist && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                        <ListMusic className="w-3 h-3" /> {playlistCount} faixas
                    </Badge>
                )}
            </div>
            <div className="flex gap-2">
                <Input 
                    placeholder="Link ou Seleção Múltipla..." 
                    value={musicUrl} 
                    onChange={e => setMusicUrl(e.target.value)} 
                    className="flex-1"
                />
                <MediaLibrary 
                  filter="audio" 
                  multiSelect={true}
                  onSelect={handleLibrarySelect} 
                  trigger={<Button variant="outline" size="icon"><FolderOpen className="w-4 h-4"/></Button>} 
                />
            </div>
          </div>
          
          {/* BARRA DE CONTROLO */}
          <div className="flex gap-2">
             <Button onClick={handlePlayMusic} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                <Play className="w-4 h-4 mr-2"/> Play
             </Button>
             <Button onClick={handlePauseMusic} variant="secondary" className="flex-1 border border-input">
                <Pause className="w-4 h-4 mr-2"/> Pause
             </Button>
             
             {/* BOTÃO PULAR */}
             <Button onClick={handleSkipTrack} variant="outline" className="flex-1" title="Próxima Faixa">
                <SkipForward className="w-4 h-4 mr-2"/> Pular
             </Button>

             <Button onClick={handleStopMedia} variant="destructive" size="icon" title="Parar">
                <Square className="w-4 h-4"/>
             </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};