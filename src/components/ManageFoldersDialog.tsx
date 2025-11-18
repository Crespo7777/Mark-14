// src/components/ManageFoldersDialog.tsx
import { useState } from "react";
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
import { Trash2, FolderPlus, Folder, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FolderData {
  id: string;
  name: string;
}

interface ManageFoldersDialogProps {
  tableId: string;
  folders: FolderData[];
  tableName: "npc_folders" | "character_folders" | "journal_folders"; // <-- Agora aceita o nome da tabela
  title: string;
}

export const ManageFoldersDialog = ({ tableId, folders, tableName, title }: ManageFoldersDialogProps) => {
  const [newFolderName, setNewFolderName] = useState("");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newFolderName.trim()) return;
    
    // Usamos 'any' aqui porque o TypeScript pode reclamar que o nome da tabela é dinâmico
    const { error } = await supabase.from(tableName as any).insert({
      table_id: tableId,
      name: newFolderName.trim(),
    });

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      setNewFolderName("");
      toast({ title: "Pasta criada" });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from(tableName as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Pasta removida" });
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
              />
            </div>
            <Button onClick={handleCreate}><Plus className="w-4 h-4" /></Button>
          </div>
          
          <div className="space-y-2 mt-4">
            <Label>Pastas Existentes</Label>
            {folders.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma pasta criada.</p>}
            <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
              {folders.map(f => (
                <div key={f.id} className="flex items-center justify-between p-2 border rounded-md bg-muted/20">
                  <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-muted-foreground"/>
                      <span>{f.name}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDelete(f.id)}>
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