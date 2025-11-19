// src/components/ImmersiveOverlay.tsx

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

interface GameState {
  active_cutscene_url: string | null;
  active_cutscene_type: 'image' | 'video' | 'none';
  active_music_url: string | null;
  is_music_playing: boolean;
}

export const ImmersiveOverlay = ({ tableId, isMaster }: { tableId: string, isMaster: boolean }) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // 1. Escutar o Estado do Jogo em Tempo Real
  useEffect(() => {
    // Carregar estado inicial
    supabase.from("game_states").select("*").eq("table_id", tableId).single()
      .then(({ data }) => { if (data) setGameState(data as any); });

    // Subscrever mudanças
    const channel = supabase.channel(`game-state:${tableId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'game_states', filter: `table_id=eq.${tableId}` }, 
      (payload) => {
        setGameState(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId]);

  // 2. Gestão de Áudio (Simples - suporta MP3/WAV diretos)
  // Nota: Youtube requer Iframe API, para MVP usamos links diretos ou ficheiros do Storage
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
    }

    const audio = audioRef.current;

    if (gameState?.active_music_url && gameState.active_music_url !== audio.src) {
       audio.src = gameState.active_music_url;
    }

    if (gameState?.is_music_playing) {
      // Navegadores bloqueiam autoplay se não houver interação. 
      // O utilizador pode precisar clicar na página uma vez.
      audio.play().catch(e => console.log("Autoplay bloqueado, à espera de interação", e));
    } else {
      audio.pause();
    }
  }, [gameState?.active_music_url, gameState?.is_music_playing]);

  // Função para o Mestre fechar a cutscene para todos
  const handleCloseCutscene = async () => {
    await supabase.from("game_states").update({ 
      active_cutscene_type: 'none', 
      active_cutscene_url: null 
    }).eq("table_id", tableId);
    
    toast({ title: "Cutscene encerrada." });
  };

  if (!gameState) return null;

  // 3. Renderizar Cutscene (Overlay)
  if (gameState.active_cutscene_type !== 'none' && gameState.active_cutscene_url) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center animate-in fade-in duration-500">
        
        {/* Botão de Fechar (Só Mestre vê ou se quiseres que jogadores fechem localmente, tira a condição) */}
        {isMaster && (
          <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-4 right-4 z-[101]"
            onClick={handleCloseCutscene}
          >
            <X className="w-6 h-6" />
          </Button>
        )}

        {gameState.active_cutscene_type === 'image' && (
          <img 
            src={gameState.active_cutscene_url} 
            alt="Cutscene" 
            className="max-w-full max-h-full object-contain shadow-2xl border-4 border-black rounded-lg"
          />
        )}

        {gameState.active_cutscene_type === 'video' && (
          <video 
            src={gameState.active_cutscene_url} 
            autoPlay 
            loop 
            controls={false} // Esconde controlos para ser mais cinematográfico
            className="max-w-full max-h-full"
          />
        )}
      </div>
    );
  }

  return null; // Nada a mostrar
};