import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Music, Play, Pause, Square, SkipForward, FolderOpen, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { MediaLibrary } from "@/components/MediaLibrary";
import { cn } from "@/lib/utils";

export const BardPanel = ({ tableId, onClose }: { tableId: string, onClose: () => void }) => {
    const { toast } = useToast();
    const [musicUrl, setMusicUrl] = useState("");
    // Estado local sincronizado com o servidor para feedback visual e lógica de Resume
    const [serverState, setServerState] = useState<{ is_music_playing: boolean, active_music_url: string | null } | null>(null);

    // 1. Sincronizar com o estado real da mesa
    useEffect(() => {
        const fetchState = async () => {
            const { data } = await supabase.from("game_states").select("is_music_playing, active_music_url").eq("table_id", tableId).single();
            if (data) setServerState(data);
        };
        fetchState();

        const channel = supabase.channel(`bard-panel-${tableId}`)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
            (payload) => setServerState(payload.new as any))
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [tableId]);

    // 2. Handlers Inteligentes
    const handlePlayMusic = async () => {
        // Cenário A: Tocar nova música (Input preenchido)
        if (musicUrl) {
            await supabase.from("game_states").update({
                active_music_url: musicUrl,
                is_music_playing: true,
                active_music_index: 0 
            }).eq("table_id", tableId);
            toast({ title: "Bardo: Play (Nova Faixa) ▶️" });
        } 
        // Cenário B: Retomar música atual (Input vazio, mas existe música no server)
        else if (serverState?.active_music_url) {
            await supabase.from("game_states").update({ is_music_playing: true }).eq("table_id", tableId);
            toast({ title: "Bardo: Resume ▶️" });
        }
        // Cenário C: Erro
        else {
            toast({ title: "Selecione uma música primeiro.", variant: "destructive" });
        }
    };

    const handlePauseMusic = async () => {
        await supabase.from("game_states").update({ is_music_playing: false }).eq("table_id", tableId);
        toast({ title: "Bardo: Pause ⏸️" });
    };

    const handleStopMusic = async () => {
        await supabase.from("game_states").update({ is_music_playing: false, active_music_url: null }).eq("table_id", tableId);
        toast({ title: "Bardo: Parado ⏹️" });
        setMusicUrl(""); // Limpa input local também
    };

    const handleSkipTrack = async () => {
        const { data } = await supabase.from("game_states").select("active_music_url, active_music_index").eq("table_id", tableId).single();
        if (data && data.active_music_url) {
            const playlist = data.active_music_url.split("|");
            if (playlist.length <= 1) return toast({ title: "Apenas uma faixa na lista." });
            
            const nextIndex = ((data.active_music_index || 0) + 1) % playlist.length;
            await supabase.from("game_states").update({ active_music_index: nextIndex }).eq("table_id", tableId);
            toast({ title: "Bardo: Próxima Faixa ⏭️" });
        }
    };

    return (
        <Card className="w-80 bg-black/90 border-white/20 backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-5">
            <CardHeader className="p-3 border-b border-white/10 flex flex-row items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2 text-white">
                    <Music className={cn("w-4 h-4", serverState?.is_music_playing ? "text-green-400 animate-pulse" : "text-white/50")} /> 
                    O Bardo {serverState?.is_music_playing && "(A Tocar)"}
                </CardTitle>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-white/50 hover:text-white" onClick={onClose}>
                    <X className="w-3 h-3" />
                </Button>
            </CardHeader>
            <CardContent className="p-3 space-y-3">
                <div className="flex gap-2">
                    <Input 
                        placeholder="Link ou Playlist..." 
                        value={musicUrl} 
                        onChange={e => setMusicUrl(e.target.value)} 
                        className="h-8 text-xs bg-white/5 border-white/10"
                    />
                    <MediaLibrary 
                        filter="audio" 
                        multiSelect={true}
                        onSelect={(url) => setMusicUrl(url)} 
                        trigger={<Button variant="outline" size="icon" className="h-8 w-8"><FolderOpen className="w-3 h-3"/></Button>} 
                    />
                </div>
                <div className="grid grid-cols-4 gap-1">
                    <Button size="sm" onClick={handlePlayMusic} className={cn("h-8", serverState?.is_music_playing ? "bg-green-600/50" : "bg-green-600 hover:bg-green-700")}>
                        <Play className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handlePauseMusic} className={cn("h-8", !serverState?.is_music_playing && serverState?.active_music_url ? "bg-yellow-500/20" : "")}>
                        <Pause className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={handleSkipTrack} className="h-8"><SkipForward className="w-3 h-3" /></Button>
                    <Button size="sm" variant="destructive" onClick={handleStopMusic} className="h-8"><Square className="w-3 h-3" /></Button>
                </div>
            </CardContent>
        </Card>
    );
};