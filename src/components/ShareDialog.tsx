// src/components/ShareDialog.tsx

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTableContext } from "@/features/table/TableContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator"; // <-- 1. IMPORTAR SEPARATOR

interface ShareDialogProps {
  children: React.ReactNode;
  itemTitle: string;
  currentSharedWith: string[]; // array de UUIDs
  onSave: (newPlayerIds: string[]) => Promise<void>;
  disabled?: boolean;
}

export const ShareDialog = ({
  children,
  itemTitle,
  currentSharedWith,
  onSave,
  disabled = false,
}: ShareDialogProps) => {
  const [open, setOpen] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(currentSharedWith || []);
  const [loading, setLoading] = useState(false);
  const { members } = useTableContext();

  const players = members.filter(m => !m.isMaster);

  // --- 2. LÓGICA DO "SELECIONAR TODOS" ---
  const allPlayerIds = players.map(p => p.id);
  const isAllSelected = players.length > 0 && selectedPlayers.length === players.length;

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(allPlayerIds);
    } else {
      setSelectedPlayers([]);
    }
  };
  // --- FIM DA LÓGICA ---

  useEffect(() => {
    if (open) {
      setSelectedPlayers(currentSharedWith || []);
    }
  }, [currentSharedWith, open]);

  const handleCheckedChange = (playerId: string, checked: boolean) => {
    setSelectedPlayers(prev => 
      checked ? [...prev, playerId] : prev.filter(id => id !== playerId)
    );
  };

  const handleSave = async () => {
    setLoading(true);
    await onSave(selectedPlayers);
    setLoading(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild disabled={disabled}>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Compartilhar: {itemTitle}</DialogTitle>
          <DialogDescription>
            Selecione com quais jogadores você quer compartilhar este item.
          </DialogDescription>
        </DialogHeader>
        
        {/* --- 3. ADICIONAR CHECKBOX "COMPARTILHAR COM TODOS" --- */}
        {players.length > 0 && (
          <>
            <div className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
              <Checkbox
                id="share-all"
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAllChange(checked as boolean)}
              />
              <Label 
                htmlFor="share-all" 
                className="flex-1 cursor-pointer flex items-center gap-2 font-semibold"
              >
                <Users className="w-4 h-4" />
                Compartilhar com Todos
              </Label>
            </div>
            <Separator />
          </>
        )}
        {/* --- FIM DA ADIÇÃO --- */}

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-4">
            {players.length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                Não há jogadores nesta mesa para compartilhar.
              </p>
            )}
            {players.map(player => (
              <div key={player.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50">
                <Checkbox
                  id={`share-${player.id}`}
                  checked={selectedPlayers.includes(player.id)}
                  onCheckedChange={(checked) => handleCheckedChange(player.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`share-${player.id}`} 
                  className="flex-1 cursor-pointer flex items-center gap-2"
                >
                  <Avatar className="h-6 w-6">
                    <AvatarFallback>
                      {player.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {player.display_name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Salvando..." : <><UserCheck className="w-4 h-4 mr-2" /> Salvar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};