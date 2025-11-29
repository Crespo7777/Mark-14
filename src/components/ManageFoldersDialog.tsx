// src/components/ManageFoldersDialog.tsx

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription, // <-- IMPORTADO
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

  const getQueryKey = () => {
    return [tableName, tableId];
  };

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    setLoading(true);
    
    try {
      const { error } = await supabase.from(tableName as any).insert({
        table_id: tableId,
        name: newFolderName.trim(),
      });

      if (error) throw error;

      setNewFolderName("");
      toast({ title: "Pasta criada com sucesso!" });
      await queryClient.invalidateQueries({ queryKey: getQueryKey() });
      
    } catch (error: any) {
      console.error("Erro ao criar pasta:", error);
      toast({ title: "Erro ao criar pasta", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from(tableName as any).delete().eq("id", id);
      
      if (error) throw error;

      toast({ title: "Pasta removida" });
      await queryClient.invalidateQueries({ queryKey: getQueryKey() });
      
      if (tableName === "character_folders") queryClient.invalidateQueries({ queryKey: ["characters", tableId] });
      if (tableName === "npc_folders") queryClient.invalidateQueries({ queryKey: ["npcs", tableId] });
      if (tableName === "journal_folders") queryClient.invalidateQueries({ queryKey: ["journal", tableId] });

    } catch (error: any) {
      console.error("Erro ao deletar pasta:", error);
      toast({ title: "Erro ao deletar", description: error.message, variant: "destructive" });
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
          {/* ADICIONADO DESCRIÇÃO */}
          <DialogDescription>
             Crie e organize pastas para seus {title.toLowerCase()}. Excluir uma pasta não apaga os itens dentro dela.
          </DialogDescription>
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
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
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