// src/components/ManageFoldersDialog.tsx

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query"; // <-- IMPORTANTE
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2, FolderPlus, Folder, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FolderData {
  id: string;
  name: string;
}

interface ManageFoldersDialogProps {
  tableId: string;
  folders: FolderData[];
  tableName: "npc_folders" | "character_folders" | "journal_folders";
  title: string;
}

export const ManageFoldersDialog = ({ tableId, folders, tableName, title }: ManageFoldersDialogProps) => {
  const [newFolderName, setNewFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Helper para saber qual cache invalidar baseado na tabela
  const getQueryKey = () => {
    return [tableName, tableId];
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    
    const { error } = await supabase.from(tableName as any).insert({
      table_id: tableId,
      name: newFolderName.trim(),
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewFolderName("");
      toast({ title: "Pasta criada" });
      // ATUALIZAÇÃO IMEDIATA: Invalida o cache logo após o sucesso
      queryClient.invalidateQueries({ queryKey: getQueryKey() });
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    // Optimistic UI: Poderíamos remover visualmente antes, mas dado que é rápido, 
    // apenas mostramos loading no botão (se fosse complexo) ou invalidamos logo.
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);
    
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pasta removida" });
      queryClient.invalidateQueries({ queryKey: getQueryKey() });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FolderPlus className="w-4 h-4 mr-2" />
          Pastas
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gerenciar Pastas de {title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="folder">Nova Pasta</Label>
              <Input 
                id="folder" 
                placeholder="Nome da pasta..." 
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label>Pastas Existentes</Label>
            {folders.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pasta criada.</p>}
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
              {folders.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground"/>
                      <span className="truncate max-w-[200px]" title={f.name}>{f.name}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive hover:bg-destructive/10" 
                    onClick={() => handleDelete(f.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};