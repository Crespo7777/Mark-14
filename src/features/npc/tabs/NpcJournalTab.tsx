// src/features/npc/tabs/NpcJournalTab.tsx

import { useState, lazy, Suspense } from "react";
import { useNpcSheet } from "../NpcSheetContext";
import { useTableContext } from "@/features/table/TableContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Trash2, Edit, BookOpen } from "lucide-react"; 
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

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

type JournalEntry = Database["public"]["Tables"]["journal_entries"]["Row"];

const fetchJournalEntries = async (npcId: string) => {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("*")
    .eq("npc_id", npcId)
    .order("created_at", { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
};

export const NpcJournalTab = () => { 
  // --- 1. OBTER 'isReadOnly' ---
  const { npc, isReadOnly } = useNpcSheet();
  const { tableId } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal_entries", "npc", npc.id],
    queryFn: () => fetchJournalEntries(npc.id),
  });

  const onEntrySaved = () => {
    queryClient.invalidateQueries({ queryKey: ["journal_entries", "npc", npc.id] });
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
      onEntrySaved();
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
          Nenhuma anotação criada para este NPC ainda.
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
              {/* --- INÍCIO DA CORREÇÃO: Remover line-clamp --- */}
              <JournalRenderer content={entry.content} />
              {/* --- FIM DA CORREÇÃO --- */}
            </CardContent>
            {/* --- 2. ADICIONAR '&& !isReadOnly' --- */}
            {/* Só mostra botões de editar/excluir se for Mestre */}
            {!isReadOnly && ( 
              <CardFooter className="flex justify-end items-center gap-2">
                <Suspense fallback={<Button variant="outline" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
                  <JournalEntryDialog
                    tableId={tableId}
                    onEntrySaved={onEntrySaved}
                    entry={entry}
                    npcId={npc.id}
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
            )}
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
              <BookOpen /> Diário do NPC
            </CardTitle>
            <CardDescription>
              Anotações do Mestre, história e segredos sobre este NPC.
            </CardDescription>
          </div>
          {/* --- 3. ADICIONAR '&& !isReadOnly' --- */}
          {!isReadOnly && (
            <Suspense fallback={<Button size="sm" disabled><Plus className="w-4 h-4 mr-2" /> Carregando...</Button>}>
              <JournalEntryDialog
                tableId={tableId}
                onEntrySaved={onEntrySaved}
                npcId={npc.id}
              >
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Anotação
                </Button>
              </JournalEntryDialog>
            </Suspense>
          )}
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