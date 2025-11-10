// src/components/JournalEntryDialog.tsx

import { useState, useEffect } from "react";
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

// --- 1. IMPORTAR O NOVO EDITOR ---
import { RichTextEditor } from "./RichTextEditor";
// --- FIM DA IMPORTAÇÃO ---

// Remover import de 'Upload', 'useRef', 'Textarea'

interface JournalEntryDialogProps {
  children: React.ReactNode;
  tableId: string;
  onEntrySaved: () => void;
  entry?: any;
  isPlayerNote?: boolean;
}

export const JournalEntryDialog = ({
  children,
  tableId,
  onEntrySaved,
  entry,
  isPlayerNote = false,
}: JournalEntryDialogProps) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState(""); // Este 'content' agora será HTML
  const [isShared, setIsShared] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // --- 2. REMOVER ESTADOS E REFS DE UPLOAD ---
  // const [isUploading, setIsUploading] = useState(false);
  // const fileInputRef = useRef<HTMLInputElement>(null);
  // const textareaRef = useRef<HTMLTextAreaElement>(null);
  // --- FIM DA REMOÇÃO ---

  const { toast } = useToast();
  const isEditing = !!entry;

  useEffect(() => {
    if (open) {
      if (isEditing) {
        setTitle(entry.title);
        setContent(entry.content || "");
        setIsShared(entry.is_shared);
      } else {
        setTitle("");
        setContent("");
        setIsShared(false);
      }
    }
  }, [entry, isEditing, open]);

  // --- 3. REMOVER TODAS AS FUNÇÕES DE IMAGEM ---
  // handleImageUpload, uploadImage, handlePaste FORAM REMOVIDAS
  // --- FIM DA REMOÇÃO ---

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

    // O 'content' agora é HTML gerado pelo Tiptap
    // Se estiver vazio, salva como nulo
    const contentToSave = (content && content.trim() !== "<p></p>") ? content.trim() : null;

    if (isEditing) {
      const { error } = await supabase
        .from("journal_entries")
        .update({
          title: title.trim(),
          content: contentToSave, // Salva o HTML
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
      let entryData;
      if (isPlayerNote) {
        entryData = {
          table_id: tableId,
          title: title.trim(),
          content: contentToSave, // Salva o HTML
          is_shared: false,
          player_id: user.id,
        };
      } else {
        entryData = {
          table_id: tableId,
          title: title.trim(),
          content: contentToSave, // Salva o HTML
          is_shared: isShared,
          player_id: null,
        };
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {/* Ajustado para um tamanho melhor para um editor de texto */}
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Entrada" : "Nova Entrada no Diário"}</DialogTitle>
          <DialogDescription>
            {isPlayerNote
              ? "Crie uma anotação privada. Apenas você e o Mestre podem vê-la."
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
            
            {/* --- 4. SUBSTITUIR TEXTAREA PELO EDITOR --- */}
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Descreva aqui os eventos, regras da casa..."
            />
            {/* --- FIM DA SUBSTITUIÇÃO --- */}
            
          </div>
        </div>
        
        {/* --- 5. RODAPÉ SIMPLIFICADO (SEM UPLOAD) --- */}
        <div className="pt-4 mt-2 border-t border-border/50">
          <div className="flex justify-between items-center">
            
            <div className="flex gap-4 items-center">
              {!isPlayerNote && (
                <div className="flex items-center space-x-2">
                  <Switch id="is-shared" checked={isShared} onCheckedChange={setIsShared} />
                  <Label htmlFor="is-shared">Compartilhar</Label>
                </div>
              )}
            </div>
            
            <Button 
              onClick={handleSave} 
              disabled={loading} // Não precisa mais verificar 'isUploading'
              className="w-40"
            >
              {loading ? "Salvando..." : "Salvar Entrada"}
            </Button>
          </div>
        </div>
        {/* --- FIM DA ATUALIZAÇÃO --- */}
      </DialogContent>
    </Dialog>
  );
};