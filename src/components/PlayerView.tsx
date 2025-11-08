import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, BookOpen } from "lucide-react";
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

export const PlayerView = ({ tableId }: PlayerViewProps) => {
  const [myCharacters, setMyCharacters] = useState<any[]>([]);
  const [sharedNpcs, setSharedNpcs] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadData();

    // Listener do Realtime para o Diário
    const channel = supabase
      .channel(`journal-player:${tableId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'journal_entries', filter: `table_id=eq.${tableId}` },
        (payload) => {
          loadData(); // Recarrega os dados para ver o que foi compartilhado/descompartilhado
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [charsRes, npcsRes, journalRes] = await Promise.all([
      supabase.from("characters").select("*").eq("table_id", tableId).eq("player_id", user.id),
      supabase.from("npcs").select("*").eq("table_id", tableId).eq("is_shared", true),
      // RLS (Row Level Security) garante que o jogador só veja entradas 'is_shared: true'
      supabase.from("journal_entries").select("*").eq("table_id", tableId).order("created_at", { ascending: true }),
    ]);

    if (charsRes.data) setMyCharacters(charsRes.data);
    if (npcsRes.data) setSharedNpcs(npcsRes.data);
    if (journalRes.data) setJournalEntries(journalRes.data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold mb-2">Painel do Jogador</h2>
        <p className="text-muted-foreground">Gerencie suas fichas e veja o diário</p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Minhas Fichas</h3>
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nova Ficha
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {myCharacters.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">
              Você ainda não criou nenhum personagem. Clique em "Nova Ficha" para começar!
            </p>
          ) : (
            myCharacters.map((char) => (
              <CharacterSheetSheet key={char.id} characterId={char.id}>
                <Card className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle>{char.name}</CardTitle>
                    <CardDescription>Clique para editar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Criado em {new Date(char.created_at).toLocaleDateString("pt-BR")}
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
              <Card key={npc.id} className="border-border/50 hover:shadow-glow transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle>{npc.name}</CardTitle>
                  <CardDescription>Compartilhado pelo mestre</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Apenas visualização</p>
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