import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "./types";
import { toast } from "sonner";

// Imagens Seguras (Placehold.co nunca apaga as imagens)
// Verso Vermelho Escuro com texto
const DEFAULT_BACK = "https://placehold.co/240x336/8b0000/ffffff/png?text=VTT"; 
const DEFAULT_FRONT = "https://placehold.co/240x336/ffffff/000000/png?text=Carta";

export function useCardSystem(roomId: string) {
  const [cards, setCards] = useState<GameCard[]>([]);

  useEffect(() => {
    fetchCards();

    const channel = supabase
      .channel('card-game-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_cards', filter: `room_id=eq.${roomId}` },
        (payload) => {
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);

  const fetchCards = async () => {
    const { data, error } = await supabase
      .from('game_cards')
      .select('*')
      .eq('room_id', roomId)
      .order('z_index', { ascending: true });
    
    if (error) console.error("Erro ao buscar cartas:", error);
    if (data) setCards(data as unknown as GameCard[]);
  };

  const handleRealtimeUpdate = (payload: any) => {
    if (payload.eventType === 'INSERT') {
      // Evita duplicar se já adicionamos localmente (embora o ID deva prevenir)
      setCards(prev => {
        if (prev.find(c => c.id === payload.new.id)) return prev;
        return [...prev, payload.new as GameCard];
      });
    } else if (payload.eventType === 'UPDATE') {
      setCards(prev => prev.map(c => c.id === payload.new.id ? payload.new as GameCard : c));
    } else if (payload.eventType === 'DELETE') {
      setCards(prev => prev.filter(c => c.id !== payload.old.id));
    }
  };

  const moveCard = async (id: string, x: number, y: number) => {
    // UI Otimista: Move logo na tela do jogador
    setCards(prev => prev.map(c => c.id === id ? { ...c, position_x: x, position_y: y } : c));
    // Envia para o servidor em background
    await supabase.from('game_cards').update({ position_x: x, position_y: y }).eq('id', id);
  };

  const flipCard = async (card: GameCard) => {
    const newState = !card.is_face_up;
    // UI Otimista
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_face_up: newState } : c));
    await supabase.from('game_cards').update({ is_face_up: newState }).eq('id', card.id);
  };

  const spawnDeck = async (frontUrl: string, count: number = 1) => {
    const finalFront = frontUrl && frontUrl.length > 5 ? frontUrl : DEFAULT_FRONT;
    
    // Z-index seguro (segundos em vez de milissegundos para caber no Integer)
    const baseZIndex = Math.floor(Date.now() / 1000);

    const newCards = [];
    for (let i = 0; i < count; i++) {
      newCards.push({
        room_id: roomId,
        front_image: finalFront,
        back_image: DEFAULT_BACK,
        position_x: 100 + (i * 15), // Mais espaço entre cartas ao criar (efeito cascata)
        position_y: 100,
        z_index: baseZIndex + i,
        is_face_up: false
      });
    }
    
    // Inserção no banco
    const { error } = await supabase.from('game_cards').insert(newCards);
    
    if (error) {
        console.error(error);
        toast.error("Erro ao criar: " + error.message);
    } else {
        toast.success(count > 1 ? "Baralho criado!" : "Carta criada!");
        // Não precisamos de setCards aqui porque o evento 'INSERT' do Realtime vai tratar disso
    }
  };

  const clearTable = async () => {
    // 1. Limpa VISUALMENTE agora mesmo (UI Otimista)
    setCards([]);
    
    // 2. Manda limpar no servidor
    const { error } = await supabase.from('game_cards').delete().eq('room_id', roomId);
    
    if (error) {
        toast.error("Erro ao limpar mesa");
        // Se falhar, recarregamos as cartas para não mentir ao usuário
        fetchCards();
    } else {
        toast.success("Mesa limpa!");
    }
  };

  return { cards, moveCard, flipCard, spawnDeck, clearTable };
}