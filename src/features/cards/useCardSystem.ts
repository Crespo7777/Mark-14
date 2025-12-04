import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GameCard } from "./types";
import { toast } from "sonner";

const DEFAULT_BACK = "https://placehold.co/240x336/8b0000/ffffff/png?text=VTT"; 
const DEFAULT_FRONT = "https://placehold.co/240x336/ffffff/000000/png?text=Carta";

export interface PlayerHandInfo {
  id: string;
  name: string;
  avatarUrl: string;
  cards: GameCard[];
}

export interface Counter {
  id: string;
  label: string;
  value: number;
  x: number;
  y: number;
}

export function useCardSystem(roomId: string) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [players, setPlayers] = useState<any[]>([]);
  const [myId, setMyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // <--- CORRIGIDO: Nome da variável
  
  const [counters, setCounters] = useState<Counter[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      if (isMounted) setMyId(userData.user?.id || null);

      const { data: playerData } = await supabase
        .from('table_members')
        .select('user_id, profiles(display_name, avatar_url)')
        .eq('table_id', roomId);
      
      if (isMounted && playerData) {
        setPlayers(playerData.map((p: any) => ({
            id: p.user_id,
            name: p.profiles?.display_name || "Jogador",
            avatarUrl: p.profiles?.avatar_url || ""
        })));
      }

      const { data: cardsData } = await supabase
        .from('game_cards')
        .select('*')
        .eq('room_id', roomId)
        .order('z_index', { ascending: true });
      
      if (isMounted) {
        if (cardsData) setCards(cardsData as unknown as GameCard[]);
        setIsLoading(false); // <--- CORRIGIDO: Setter correto
      }
    }

    init();

    const channel = supabase
      .channel('card-game-updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'game_cards', filter: `room_id=eq.${roomId}` }, (payload) => {
          handleRealtimeUpdate(payload);
      })
      .subscribe();

    return () => { 
      isMounted = false;
      supabase.removeChannel(channel); 
    };
  }, [roomId]);

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

  const updateCardPosition = async (id: string, x: number, y: number, containerType: 'hand' | 'table') => {
    const newOwnerId = containerType === 'hand' ? myId : null;
    const updates: any = { position_x: x, position_y: y, owner_id: newOwnerId };
    
    if (containerType === 'hand') {
        updates.is_face_up = true; 
        updates.is_tapped = false;
    }

    setCards(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    await supabase.from('game_cards').update(updates).eq('id', id);
  };

  const flipCard = async (card: GameCard) => {
    if (card.owner_id && card.owner_id !== myId) return;
    const newState = !card.is_face_up;
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_face_up: newState } : c));
    await supabase.from('game_cards').update({ is_face_up: newState }).eq('id', card.id);
  };

  const rotateCard = async (card: GameCard) => {
    if (card.owner_id && card.owner_id !== myId) return;
    const newTapState = !card.is_tapped;
    setCards(prev => prev.map(c => c.id === card.id ? { ...c, is_tapped: newTapState } : c));
    await supabase.from('game_cards').update({ is_tapped: newTapState }).eq('id', card.id);
  };

  const spawnDeck = async (frontUrl: string, x: number, y: number, count: number = 1) => {
    const finalFront = frontUrl && frontUrl.length > 5 ? frontUrl : DEFAULT_FRONT;
    const baseZIndex = Math.floor(Date.now() / 1000);
    
    const newCards = Array.from({ length: count }).map((_, i) => ({
        room_id: roomId,
        front_image: finalFront,
        back_image: DEFAULT_BACK,
        position_x: x, 
        position_y: y,
        z_index: baseZIndex + i,
        is_face_up: false,
        owner_id: null
    }));
    
    const { error } = await supabase.from('game_cards').insert(newCards);
    if (error) toast.error("Erro ao criar: " + error.message);
    else toast.success(count > 1 ? "Baralho criado!" : "Carta criada!");
  };

  const shuffleStack = async (x: number, y: number) => {
    const cardsInStack = cards.filter(c => 
        !c.owner_id && 
        Math.abs(c.position_x - x) < 80 && 
        Math.abs(c.position_y - y) < 80
    );

    if (cardsInStack.length < 2) {
        toast.error("Mínimo 2 cartas para embaralhar.");
        return;
    }

    const baseZ = Math.floor(Date.now() / 1000);
    const shuffled = [...cardsInStack].sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < shuffled.length; i++) {
        const card = shuffled[i];
        await supabase.from('game_cards').update({
            z_index: baseZ + i,
            position_x: x + (Math.random() * 4 - 2),
            position_y: y + (Math.random() * 4 - 2),
            is_face_up: false 
        }).eq('id', card.id);
    }
    toast.success("Embaralhado!");
  };

  const gatherAllToDeck = async (targetX: number, targetY: number) => {
    if(!confirm("Recolher TODAS as cartas da mesa para o baralho?")) return;
    const tableCardsList = cards.filter(c => !c.owner_id);
    const baseZ = Math.floor(Date.now() / 1000);

    for (let i = 0; i < tableCardsList.length; i++) {
        const card = tableCardsList[i];
        await supabase.from('game_cards').update({
            position_x: targetX, position_y: targetY, is_face_up: false, z_index: baseZ + i
        }).eq('id', card.id);
    }
    toast.success("Mesa limpa!");
  };

  const dealCards = async (sourceX: number, sourceY: number, countPerPlayer: number) => {
    const deckCards = cards
        .filter(c => !c.owner_id && Math.abs(c.position_x - sourceX) < 100 && Math.abs(c.position_y - sourceY) < 100)
        .sort((a, b) => b.z_index - a.z_index);

    if (deckCards.length < players.length * countPerPlayer) {
        toast.error(`Cartas insuficientes. Tem ${deckCards.length}, precisa de ${players.length * countPerPlayer}.`);
        return;
    }

    let cardIndex = 0;
    for (let round = 0; round < countPerPlayer; round++) {
        for (const player of players) {
            if (cardIndex >= deckCards.length) break;
            const card = deckCards[cardIndex];
            await supabase.from('game_cards').update({
                owner_id: player.id,
                is_face_up: true,
                is_tapped: false
            }).eq('id', card.id);
            cardIndex++;
        }
    }
    toast.success("Cartas distribuídas!");
  };

  const clearTable = async () => {
    if(!confirm("Isto apaga todas as cartas do jogo permanentemente. Continuar?")) return;
    setCards([]);
    await supabase.from('game_cards').delete().eq('room_id', roomId);
  };

  const addCounter = (label: string, x: number, y: number) => {
      const newCounter = { id: Math.random().toString(), label, value: 0, x, y };
      setCounters(prev => [...prev, newCounter]);
  };

  const updateCounter = (id: string, delta: number) => {
      setCounters(prev => prev.map(c => c.id === id ? { ...c, value: c.value + delta } : c));
  };

  const deleteCounter = (id: string) => {
      setCounters(prev => prev.filter(c => c.id !== id));
  };

  const safeCards = Array.isArray(cards) ? cards : [];
  const handCards = safeCards.filter(c => c.owner_id === myId);
  const tableCards = safeCards.filter(c => c.owner_id === null);
  
  const opponents = players
    .filter(p => p.id !== myId)
    .map(player => ({
        ...player,
        cards: safeCards.filter(c => c.owner_id === player.id)
    }));

  return { 
    cards: safeCards, handCards, tableCards, opponents,
    updateCardPosition, flipCard, rotateCard, spawnDeck, clearTable, shuffleStack, gatherAllToDeck, dealCards,
    counters, addCounter, updateCounter, deleteCounter,
    isLoading // <--- AGORA CORRETO
  };
}