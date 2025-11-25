// src/components/JournalEntryDialog.tsx

import { useState, useEffect, lazy, Suspense } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";

const RichTextEditor = lazy(() =>
  import("./RichTextEditor").then(module => ({ default: module.RichTextEditor }))
);

interface JournalEntryDialogProps {
  children: React.ReactNode;
  tableId: string;
  onEntrySaved: () => void;
  entry?: any;
  isPlayerNote?: boolean;
  characterId?: string;
  npcId?: string;
}

export const JournalEntryDialog = ({
  children,
  tableId,
  onEntrySaved,
  entry,
  isPlayerNote = false,
  characterId,
  npcId,
}: JournalEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); 
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { toast } = useToast();
  const isEditing = !!entry;

  const canShare = !isPlayerNote && !characterId && !npcId;

  // --- CORREÇÃO: Reset Controlado ---
  useEffect(() => {
    if (open) {
      if (isEditing && entry) {
        setTitle(entry.title || "");
        setContent(entry.content || "");
        setIsShared(entry.is_shared || false);
      } else {
        // Se for criar novo, limpa apenas se não estivermos já a editar (segurança)
        if (!isEditing) {
            setTitle("");
            setContent("");
            setIsShared(false);
        }
      }
    }
  }, [open, entry?.id]); // Dependência específica para evitar loops

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: "Erro", description: "O título é obrigatório", variant: "destructive" });
      return;
    }
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      toast({ title: "Erro", description: "Usuário não encontrado.", variant: "destructive" });
      return;
    }

    const contentToSave = (content && content.trim() !== "<p></p>") ? content.trim() : null;

    if (isEditing) {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          title: title.trim(),
          content: contentToSave,
          is_shared: canShare ? isShared : entry.is_shared,
        })
        .eq("id", entry.id);

      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Diário atualizado!", description: "Sua entrada foi salva." });
        onEntrySaved();
        setOpen(false);
      }
    } else {
      const entryData: any = {
        table_id: tableId,
        title: title.trim(),
        content: contentToSave,
        is_shared: false,
        player_id: null,
        character_id: null,
        npc_id: null,
      };

      if (isPlayerNote) {
        entryData.player_id = user.id;
      } else if (characterId) {
        entryData.character_id = characterId;
      } else if (npcId) {
        entryData.npc_id = npcId;
      } else {
        entryData.is_shared = isShared;
      }

      const { error } = await supabase
        .from("journal_entries")
        .insert(entryData);

      if (error) {
        toast({ title: "Erro ao criar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Entrada criada!", description: "Nova entrada no diário salva." });
        onEntrySaved();
        setOpen(false);
      }
    }
    setLoading(false);
  };

  const editorFallback = (
    <div className="space-y-2">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-[300px] w-full" />
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Entrada" : "Nova Entrada no Diário"}</DialogTitle>
          <DialogDescription>
            {isPlayerNote
              ? "Crie uma anotação privada. Apenas você e o Mestre podem vê-la."
              : characterId
              ? "Crie uma anotação para este personagem."
              : npcId
              ? "Crie uma anotação para este NPC."
              : "Crie uma nova entrada para o diário da mesa."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-y-auto pr-2 -mr-2">
          <div className="space-y-2">
            <Label htmlFor="entry-title">Título</Label>
            <Input
              id="entry-title"
              placeholder="Capítulo 1: A Chegada"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Conteúdo</Label>
            <Suspense fallback={editorFallback}>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Descreva aqui os eventos, regras da casa..."
              />
            </Suspense>
          </div>
        </div>
        
        <div className="pt-4 mt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            <div className="flex gap-4 items-center">
              {canShare && (
                <div className="flex items-center space-x-2">
                  <Switch id="is-shared" checked={isShared} onCheckedChange={setIsShared} />
                  <Label htmlFor="is-shared">Compartilhar com Jogadores</Label>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={loading}
              className="w-40"
            >
              {loading ? "Salvando..." : "Salvar Entrada"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};