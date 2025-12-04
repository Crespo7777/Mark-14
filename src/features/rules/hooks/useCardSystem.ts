import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "../types";
import { toast } from "sonner";

const DEFAULT_BACK = "https://placehold.co/240x336/8b0000/ffffff/png?text=VTT"; 
const DEFAULT_FRONT = "https://placehold.co/240x336/ffffff/000000/png?text=Carta";

export function useCardSystem(roomId: string) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    // 1. Pegar ID do usuário atual
    supabase.auth.getUser().then(({ data }) => {
      setMyId(data.user?.id || null);
    });

    fetchCards();

    const channel = supabase
      .channel('card-game-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_cards', filter: `room_id=eq.${roomId}` }, (payload) => {
          handleRealtimeUpdate(payload);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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

  // --- MOVIMENTO E LÓGICA DE MÃO ---

  const updateCardPosition = async (id: string, x: number, y: number, containerType: 'hand' | 'table') => {
    // Se o container for 'hand', definimos o dono como 'eu'. Se for 'table', removemos o dono.
    const newOwnerId = containerType === 'hand' ? myId : null;
    
    // Se for para a mão, reseta a rotação (destapada)
    const updates: any = { position_x: x, position_y: y, owner_id: newOwnerId };
    
    // Se mover para a mão, vira para cima automaticamente para o dono ver
    if (containerType === 'hand') {
        updates.is_face_up = true;
    }

    // UI Otimista
    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    
    await supabase.from('game_cards').update(updates).eq('id', id);
  };

  const flipCard = async (card: GameCard) => {
    // Se a carta está na mão de outra pessoa, não posso virar
    if (card.owner_id && card.owner_id !== myId) return;

    const newState = !card.is_face_up;
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_face_up: newState } : c));
    await supabase.from('game_cards').update({ is_face_up: newState }).eq('id', card.id);
  };

  const spawnDeck = async (frontUrl: string, count: number = 1) => {
    const finalFront = frontUrl && frontUrl.length > 5 ? frontUrl : DEFAULT_FRONT;
    const baseZIndex = Math.floor(Date.now() / 1000);
    const newCards = [];
    
    for (let i = 0; i < count; i++) {
      newCards.push({
        room_id: roomId,
        front_image: finalFront,
        back_image: DEFAULT_BACK,
        position_x: 200 + (i * 2), // Spawn no centro da mesa
        position_y: 200 - (i * 2),
        z_index: baseZIndex + i,
        is_face_up: false,
        owner_id: null // Começa na mesa (sem dono)
      });
    }
    
    const { error } = await supabase.from('game_cards').insert(newCards);
    if (error) toast.error("Erro ao criar: " + error.message);
    else toast.success(count > 1 ? "Baralho criado!" : "Carta criada!");
  };

  const clearTable = async () => {
    setCards([]);
    await supabase.from('game_cards').delete().eq('room_id', roomId);
  };

  // Separa as cartas
  const handCards = cards.filter(c => c.owner_id === myId);
  const tableCards = cards.filter(c => c.owner_id === null); // Só mostra cartas sem dono na mesa principal
  // (Nota: Cartas de oponentes (owner_id != null e != myId) poderiam ser mostradas como "mãos fantasmas" noutra atualização)

  return { 
    cards, // todas (para debug)
    handCards, 
    tableCards, 
    updateCardPosition, 
    flipCard, 
    spawnDeck, 
    clearTable,
    myId
  };
}