// src/components/SharedEntityJournalTab.tsx

import { useState, lazy, Suspense } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Plus, Trash2, Edit, BookOpen, Eye } from "lucide-react"; 
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
import { JournalReadDialog } from "@/components/JournalReadDialog";
import { JournalEntryWithRelations } from "@/types/app-types";

const JournalEntryDialog = lazy(() =>
  import("@/components/JournalEntryDialog").then(module => ({ default: module.JournalEntryDialog }))
);

interface SharedEntityJournalTabProps {
  entityId: string;
  entityType: "character" | "npc";
  tableId: string;
  isReadOnly?: boolean;
}

const fetchEntityJournal = async (entityId: string, type: "character" | "npc") => {
  const column = type === "character" ? "character_id" : "npc_id";
  const { data, error } = await supabase
    .from("journal_entries")
    .select(`*, shared_with_players, player:profiles!journal_entries_player_id_fkey(display_name), character:characters!journal_entries_character_id_fkey(name), npc:npcs!journal_entries_npc_id_fkey(name)`)
    .eq(column, entityId)
    .order("created_at", { ascending: false });
  
  if (error) throw error;
  return data as JournalEntryWithRelations[];
};

export const SharedEntityJournalTab = ({ entityId, entityType, tableId, isReadOnly = false }: SharedEntityJournalTabProps) => { 
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [entryToDelete, setEntryToDelete] = useState<JournalEntryWithRelations | null>(null);
  const [entryToRead, setEntryToRead] = useState<JournalEntryWithRelations | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ["journal_entries", entityType, entityId],
    queryFn: () => fetchEntityJournal(entityId, entityType),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["journal_entries", entityType, entityId] });
    queryClient.invalidateQueries({ queryKey: ['journal', tableId] });
  };

  const handleDelete = async () => {
    if (!entryToDelete) return;
    const { error } = await supabase.from("journal_entries").delete().eq("id", entryToDelete.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Anotação excluída" });
      invalidate();
    }
    setEntryToDelete(null);
  };

  if (isLoading) {
    return <div className="grid gap-4 md:grid-cols-2"><Skeleton className="h-40 w-full" /><Skeleton className="h-40 w-full" /></div>;
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2"><BookOpen /> Diário</CardTitle>
            <CardDescription>Anotações e histórias ligadas a esta entidade.</CardDescription>
          </div>
          {!isReadOnly && (
            <Suspense fallback={<Button size="sm" disabled>...</Button>}>
              <JournalEntryDialog
                tableId={tableId}
                onEntrySaved={invalidate}
                characterId={entityType === "character" ? entityId : undefined}
                npcId={entityType === "npc" ? entityId : undefined}
              >
                <Button size="sm"><Plus className="w-4 h-4 mr-2" /> Nova Anotação</Button>
              </JournalEntryDialog>
            </Suspense>
          )}
        </CardHeader>
        <CardContent>
           {(!entries || entries.length === 0) && <p className="text-muted-foreground text-center py-12">Nenhuma anotação ainda.</p>}
           
           <div className="grid gap-4 md:grid-cols-2">
            {entries?.map((entry) => (
              <Card 
                key={entry.id} 
                className="border-border/50 flex flex-col h-[250px] hover:shadow-glow transition-shadow cursor-pointer group"
                onClick={() => setEntryToRead(entry)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="truncate">{entry.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden text-sm pt-2 pb-2 relative">
                  <JournalRenderer content={entry.content} className="line-clamp-5" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                    <span className="bg-background/80 px-3 py-1 rounded-full text-xs font-medium flex items-center shadow-sm"><Eye className="w-3 h-3 mr-1" /> Ler</span>
                  </div>
                </CardContent>
                {!isReadOnly && (
                  <CardFooter className="flex justify-end items-center gap-1 pt-0 pb-3 px-4 h-10" onClick={e => e.stopPropagation()}>
                    <Suspense fallback={<Button variant="ghost" size="icon" disabled><Edit className="w-4 h-4" /></Button>}>
                      <JournalEntryDialog
                        tableId={tableId}
                        onEntrySaved={invalidate}
                        entry={entry}
                        characterId={entityType === "character" ? entityId : undefined}
                        npcId={entityType === "npc" ? entityId : undefined}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                      </JournalEntryDialog>
                    </Suspense>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setEntryToDelete(entry)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </CardFooter>
                )}
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!entryToDelete} onOpenChange={(open) => !open && setEntryToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir esta Anotação?</AlertDialogTitle>
            <AlertDialogDescription>Ação irreversível.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <JournalReadDialog open={!!entryToRead} onOpenChange={(open) => !open && setEntryToRead(null)} entry={entryToRead} />
    </>
  );
};