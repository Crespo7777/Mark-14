// src/features/character/tabs/CharacterJournalTab.tsx

import { useState, lazy, Suspense } from "react";
import { useCharacterSheet } from "../CharacterSheetContext";
import { useTableContext } from "@/features/table/TableContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";

// ######################################################
// ### CORREÇÃO AQUI ###
// ######################################################
import { Plus, Trash2, Edit, BookOpen } from "lucide-react"; // Adicionado 'BookOpen'
// ######################################################
// ### FIM DA CORREÇÃO ###
// ######################################################

import { Skeleton } from "@/components/ui/skeleton";
import { JournalRenderer } from "@/components/JournalRenderer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";

// Lazy load o diálogo de entrada
const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];

// Função para buscar entradas do diário
const fetchJournalEntries = async (characterId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("character_id", characterId)
    .order("created_at", { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
};

export const CharacterJournalTab = () => { 
  const { character } = useCharacterSheet();
  const { tableId } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  // Buscar as entradas de diário ligadas a este personagem
  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal_entries", "character", character.id],
    queryFn: () => fetchJournalEntries(character.id),
  });

  const onEntrySaved = () => {
    // Invalida a query para forçar o refetch
    queryClient.invalidateQueries({ queryKey: ["journal_entries", "character", character.id] });
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    const { error } = await supabase
      .from("journal_entries")
      .delete()
      .eq("id", entryToDelete.id);

    if (error) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Anotação excluída" });
      onEntrySaved(); // Re-busca os dados
    }
    setEntryToDelete(null);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      );
    }

    if (!entries || entries.length === 0) {
      return (
        <p className="text-muted-foreground text-center py-12">
          Nenhuma anotação criada para este personagem ainda.
        </p>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {entries.map((entry) => (
          <Card key={entry.id} className="border-border/50 flex flex-col">
            <CardHeader>
              <CardTitle>{entry.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              <JournalRenderer content={entry.content} className="line-clamp-4" />
            </CardContent>
            <CardFooter className="flex justify-end items-center gap-2">
              <Suspense fallback={<Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
                <JournalEntryDialog
                  tableId={tableId}
                  onEntrySaved={onEntrySaved}
                  entry={entry}
                  characterId={character.id}
                >
                  <Button variant="outline" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                </JournalEntryDialog>
              </Suspense>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setEntryToDelete(entry)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen /> Diário do Personagem
            </CardTitle>
            <CardDescription>
              Anotações, histórias e segredos ligados a este personagem.
            </CardDescription>
          </div>
          <Suspense fallback={<Button size="sm" disabled><Plus className="w-4 h-4 mr-2" /> Carregando...</Button>}>
            <JournalEntryDialog
              tableId={tableId}
              onEntrySaved={onEntrySaved}
              characterId={character.id}
            >
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Anotação
              </Button>
            </JournalEntryDialog>
          </Suspense>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle>
            <AlertDialogDescription>
              A anotação "{entryToDelete?.title}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className={buttonVariants({ variant: "destructive" })}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};