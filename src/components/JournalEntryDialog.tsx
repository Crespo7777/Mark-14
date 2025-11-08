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
}

export const JournalEntryDialog = ({ 
  children, 
  tableId, 
  onEntrySaved, 
  entry 
}: JournalEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isEditing = !!entry;

  useEffect(() => {
    // Preenche o formulário se estiver no modo de edição
    if (isEditing && open) {
      setTitle(entry.title);
      setContent(entry.content || "");
      setIsShared(entry.is_shared);
    } else {
      // Reseta ao abrir para "Criar"
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

    if (isEditing) {
      // Atualizar entrada existente
      const { error } = await supabase
        .from("journal_entries")
        .update({
          title: title.trim(),
          content: content.trim() || null,
          is_shared: isShared,
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
      const { error } = await supabase
        .from("journal_entries")
        .insert({
          table_id: tableId,
          title: title.trim(),
          content: content.trim() || null,
          is_shared: isShared,
        });

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
            {isEditing ? "Edite os detalhes desta entrada." : "Crie uma nova entrada para o diário da mesa."}
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
          <div className="flex items-center space-x-2">
            <Switch id="is-shared" checked={isShared} onCheckedChange={setIsShared} />
            <Label htmlFor="is-shared">Compartilhar com jogadores</Label>
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Salvando..." : "Salvar Entrada"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};