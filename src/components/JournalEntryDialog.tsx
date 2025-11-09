// src/components/JournalEntryDialog.tsx

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";

interface JournalEntryDialogProps {
  children: React.ReactNode;
  tableId: string;
  onEntrySaved: () => void;
  entry?: any; // Passar a entrada existente para edição
  isPlayerNote?: boolean; // <-- NOVA PROP
}

export const JournalEntryDialog = ({ 
  children, 
  tableId, 
  onEntrySaved, 
  entry,
  isPlayerNote = false, // <-- Valor padrão
}: JournalEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!entry;

  useEffect(() => {
    if (isEditing && open) {
      setTitle(entry.title);
      setContent(entry.content || "");
      setIsShared(entry.is_shared);
    } else {
      setTitle("");
      setContent("");
      setIsShared(false);
    }
  }, [entry, isEditing, open]);

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

    if (isEditing) {
      // Atualizar entrada existente
      // A RLS
      // garante que o jogador só pode editar a sua própria, e o mestre pode editar todas.
      const { error } = await supabase
        .from("journal_entries")
        .update({
          title: title.trim(),
          content: content.trim() || null,
          // Se for um jogador editando, ele não pode mudar o 'is_shared'
          is_shared: isPlayerNote ? entry.is_shared : isShared,
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
      // Criar nova entrada
      
      // --- LÓGICA ATUALIZADA ---
      let entryData;
      if (isPlayerNote) {
        // Se é um jogador criando, força is_shared=false e define o player_id
        entryData = {
          table_id: tableId,
          title: title.trim(),
          content: content.trim() || null,
          is_shared: false,
          player_id: user.id, // Define o dono da nota
        };
      } else {
        // Se é o mestre criando, player_id é NULL
        entryData = {
          table_id: tableId,
          title: title.trim(),
          content: content.trim() || null,
          is_shared: isShared,
          player_id: null,
        };
      }
      // --- FIM DA LÓGICA ATUALIZADA ---

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Entrada" : "Nova Entrada no Diário"}</DialogTitle>
          <DialogDescription>
            {isPlayerNote
              ? "Crie uma anotação privada. Apenas você e o Mestre podem vê-la."
              : "Crie uma nova entrada para o diário da mesa."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
            <Label htmlFor="entry-content">Conteúdo</Label>
            <Textarea
              id="entry-content"
              placeholder="Descreva aqui os eventos, regras da casa, NPCs importantes..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
            />
            <p className="text-xs text-muted-foreground">Você pode usar Markdown para formatação.</p>
          </div>
          
          {/* --- LÓGICA ATUALIZADA: Esconder o Switch se for um jogador --- */}
          {!isPlayerNote && (
            <div className="flex items-center space-x-2">
              <Switch id="is-shared" checked={isShared} onCheckedChange={setIsShared} />
              <Label htmlFor="is-shared">Compartilhar com jogadores</Label>
            </div>
          )}
          {/* --- FIM DA LÓGICA --- */}

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Entrada"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};