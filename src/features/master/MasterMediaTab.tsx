// src/features/master/MasterMediaTab.tsx

import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Image as ImageIcon, Music, Play, Square, Film, Cast, MonitorPlay, FolderOpen } from "lucide-react";
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

  const handlePlayMusic = async () => {
    if (!musicUrl) return;
    await supabase.from("game_states").update({
        active_music_url: musicUrl,
        is_music_playing: true
    }).eq("table_id", tableId);
    toast({ title: "Música: Play" });
  };

  const handleStopMusic = async () => {
    await supabase.from("game_states").update({ is_music_playing: false }).eq("table_id", tableId);
    toast({ title: "Música: Stop" });
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

      {/* Controlo de Áudio */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
           <CardTitle className="flex items-center gap-2 text-xl">
             <Music className="text-accent" /> Ambiente Sonoro
           </CardTitle>
           <CardDescription>YouTube, SoundCloud, MP3 ou Biblioteca.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label>URL da Música</Label>
            <div className="flex gap-2">
                <Input 
                    // --- ATUALIZADO O PLACEHOLDER ---
                    placeholder="Cole link do YouTube, MP3..." 
                    value={musicUrl} 
                    onChange={e => setMusicUrl(e.target.value)} 
                    className="flex-1"
                />
                <MediaLibrary 
                  filter="audio" 
                  onSelect={handleLibrarySelect} 
                  trigger={<Button variant="outline" size="icon"><FolderOpen className="w-4 h-4"/></Button>} 
                />
            </div>
          </div>
          <div className="flex gap-2">
             <Button onClick={handlePlayMusic} className="flex-1" variant="outline">
                <Play className="w-4 h-4 mr-2 text-green-500"/> Tocar
             </Button>
             <Button onClick={handleStopMusic} className="flex-1" variant="outline">
                <Square className="w-4 h-4 mr-2 text-red-500"/> Parar
             </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};