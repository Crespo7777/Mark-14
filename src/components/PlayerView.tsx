// src/components/PlayerView.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Button } from "@/components/ui/button"; // Botão não é mais necessário
import { Users, BookOpen } from "lucide-react"; // 'Plus' removido
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CharacterSheetSheet } from "./CharacterSheetSheet";

interface PlayerViewProps {
  tableId: string;
}

// 1. Tipagem para os dados que chegam
type SharedCharacter = {
  id: string;
  name: string;
  created_at: string;
  is_shared: boolean;
  player: {
    display_name: string;
  };
  player_id: string; // ID do dono
};

type SharedNpc = {
  id: string;
  name: string;
};

type JournalEntry = {
  id: string;
  title: string;
  content: string | null;
};

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<SharedCharacter[]>([]);
  const [sharedNpcs, setSharedNpcs] = useState<SharedNpc[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [userId, setUserId] = useState<string | null>(null); // State para o ID do usuário
  const { toast } = useToast();

  useEffect(() => {
    loadData();

    // Listener do Realtime para o Diário
    const journalChannel = supabase
      .channel(`journal-player:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "journal_entries",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          loadData();
        },
      )
      .subscribe();

    // Listener para Fichas (para quando o mestre compartilhar)
    const characterChannel = supabase
      .channel(`character-player:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "characters",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          loadData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(journalChannel);
      supabase.removeChannel(characterChannel);
    };
  }, [tableId]);

  const loadData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id); // Armazena o ID do usuário

    // 2. Query ATUALIZADA para Fichas
    // Pega fichas onde:
    // (A) O player_id é o meu
    // (B) OU is_shared é true
    const [charsRes, npcsRes, journalRes] = await Promise.all([
      supabase
        .from("characters")
        .select("*, player:profiles!characters_player_id_fkey(display_name)")
        .eq("table_id", tableId)
        .or(`player_id.eq.${user.id},is_shared.eq.true`), // <-- LÓGICA ATUALIZADA

      supabase
        .from("npcs")
        .select("id, name")
        .eq("table_id", tableId)
        .eq("is_shared", true),

      supabase
        .from("journal_entries")
        .select("id, title, content")
        .eq("table_id", tableId)
        .eq("is_shared", true) // RLS já cuida disso, mas é uma boa prática
        .order("created_at", { ascending: true }),
    ]);

    if (charsRes.data) setMyCharacters(charsRes.data as any); // RLS força 'any'
    if (npcsRes.data) setSharedNpcs(npcsRes.data);
    if (journalRes.data) setJournalEntries(journalRes.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">
          Gerencie suas fichas e veja o diário
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Minhas Fichas & Compartilhadas</h3>
          {/* 3. Botão "Nova Ficha" REMOVIDO */}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {myCharacters.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Você ainda não criou nenhum personagem. Peça ao Mestre!
            </p>
          ) : (
            myCharacters.map((char) => (
              <CharacterSheetSheet key={char.id} characterId={char.id}>
                <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{char.name}</CardTitle>
                    {/* 4. Descrição ATUALIZADA para mostrar o dono */}
                    <CardDescription>
                      {char.player_id === userId
                        ? "Sua Ficha"
                        : `Compartilhada (Dono: ${char.player.display_name})`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Clique para {char.player_id === userId ? "editar" : "ver"}
                    </p>
                  </CardContent>
                </Card>
              </CharacterSheetSheet>
            ))
          )}
        </div>
      </div>

      {sharedNpcs.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            NPCs Compartilhados
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {sharedNpcs.map((npc) => (
              <Card
                key={npc.id}
                className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer"
              >
                <CardHeader>
                  <CardTitle>{npc.name}</CardTitle>
                  <CardDescription>Compartilhado pelo mestre</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Clique para visualizar (Em breve)
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {journalEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Diário da Mesa
          </h3>
          <Accordion type="single" collapsible className="w-full">
            {journalEntries.map((entry) => (
              <AccordionItem value={entry.id} key={entry.id}>
                <AccordionTrigger>{entry.title}</AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {entry.content || "Sem conteúdo."}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      )}
    </div>
  );
};