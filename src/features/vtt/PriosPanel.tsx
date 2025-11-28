// src/features/vtt/PriosPanel.tsx

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MonitorPlay, Cast, Square, X, Film, Image as ImageIcon, FolderOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MediaLibrary } from "@/components/MediaLibrary";
import { Badge } from "@/components/ui/badge";

const detectMediaType = (url: string): 'image' | 'video' => {
  if (!url) return 'image';
  const cleanUrl = url.split('?')[0].toLowerCase();
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov'];
  if (videoExtensions.some(ext => cleanUrl.endsWith(ext))) return 'video';
  return 'image';
};

export const PriosPanel = ({ tableId, onClose }: { tableId: string, onClose: () => void }) => {
    const { toast } = useToast();
    const [mediaUrl, setMediaUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const detectedType = useMemo(() => detectMediaType(mediaUrl), [mediaUrl]);

    const handleShowMedia = async () => {
        if (!mediaUrl) return;
        setLoading(true);
        const { error } = await supabase.from("game_states").update({
            active_cutscene_url: mediaUrl,
            active_cutscene_type: detectedType
        }).eq("table_id", tableId);
        
        if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
        else toast({ title: "Prios: A projetar!" });
        setLoading(false);
    };

    const handleStopMedia = async () => {
        setLoading(true);
        await supabase.from("game_states").update({ active_cutscene_type: 'none', active_cutscene_url: null }).eq("table_id", tableId);
        toast({ title: "Prios: Parado" });
        setLoading(false);
    };

    return (
        <Card className="w-96 bg-black/90 border-white/20 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-5">
            <CardHeader className="p-3 border-b border-white/10 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <MonitorPlay className="w-4 h-4 text-blue-400" /> Prios (Projetor)
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white" onClick={onClose}>
                    <X className="w-3 h-3" />
                </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
                <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                        <Input 
                            placeholder="URL da Imagem/Vídeo..." 
                            value={mediaUrl} 
                            onChange={e => setMediaUrl(e.target.value)} 
                            className="h-8 text-xs bg-white/5 border-white/10 pr-16"
                        />
                        {mediaUrl && (
                            <div className="absolute right-1 top-1.5">
                                <Badge variant="outline" className="text-[9px] h-5 px-1 bg-black/50 border-none text-white/70">
                                    {detectedType === 'image' ? 'IMG' : 'VID'}
                                </Badge>
                            </div>
                        )}
                    </div>
                    <MediaLibrary 
                        filter="image" 
                        multiSelect={false}
                        onSelect={(url) => setMediaUrl(url)} 
                        trigger={<Button variant="outline" size="icon" className="h-8 w-8 shrink-0"><FolderOpen className="w-3 h-3"/></Button>} 
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" onClick={handleShowMedia} disabled={loading || !mediaUrl} className="bg-blue-600 hover:bg-blue-700 h-8">
                        <Cast className="w-3 h-3 mr-2"/> Projetar
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleStopMedia} disabled={loading} className="h-8">
                        <Square className="w-3 h-3 mr-2"/> Parar
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};