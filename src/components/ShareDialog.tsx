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
import { Separator } from "@/components/ui/separator";

interface ShareDialogProps {
  children?: React.ReactNode;
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

  // Filtra apenas jogadores (não mostra o Mestre na lista de partilha)
  const players = members.filter(m => !m.isMaster);

  // --- LÓGICA DO "SELECIONAR TODOS" ---
  const allPlayerIds = players.map(p => p.id);
  const isAllSelected = players.length > 0 && selectedPlayers.length === players.length;

  const handleSelectAllChange = (checked: boolean) => {
    if (checked) {
      setSelectedPlayers(allPlayerIds);
    } else {
      setSelectedPlayers([]);
    }
  };

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
      {/* CORREÇÃO DO CRASH:
          Se 'children' existir, usamos 'asChild' para fundir o Trigger com o botão filho.
          Se não existir, renderizamos um botão padrão DENTRO do Trigger (sem asChild).
      */}
      {children ? (
        <DialogTrigger asChild disabled={disabled}>
          {children}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild disabled={disabled}>
          <Button variant="outline" size="sm">
            <Users className="w-4 h-4 mr-2" /> Partilhar
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Compartilhar: {itemTitle}</DialogTitle>
          <DialogDescription>
            Selecione com quais jogadores você quer compartilhar este item.
          </DialogDescription>
        </DialogHeader>
        
        {/* Checkbox Selecionar Todos */}
        {players.length > 0 && (
          <>
            <div className="flex items-center space-x-3 p-2 rounded-md bg-muted/50 border border-border/50">
              <Checkbox
                id="share-all"
                checked={isAllSelected}
                onCheckedChange={(checked) => handleSelectAllChange(checked as boolean)}
              />
              <Label 
                htmlFor="share-all" 
                className="flex-1 cursor-pointer flex items-center gap-2 font-semibold select-none"
              >
                <Users className="w-4 h-4 text-primary" />
                Compartilhar com Todos
              </Label>
            </div>
            <Separator className="my-2" />
          </>
        )}

        <ScrollArea className="max-h-[300px] pr-4 -mr-4">
          <div className="space-y-1 p-1">
            {players.length === 0 && (
              <p className="text-muted-foreground text-center py-8 text-sm italic">
                Não há jogadores nesta mesa para compartilhar.
              </p>
            )}
            {players.map(player => (
              <div 
                key={player.id} 
                className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent transition-colors"
              >
                <Checkbox
                  id={`share-${player.id}`}
                  checked={selectedPlayers.includes(player.id)}
                  onCheckedChange={(checked) => handleCheckedChange(player.id, checked as boolean)}
                />
                <Label 
                  htmlFor={`share-${player.id}`} 
                  className="flex-1 cursor-pointer flex items-center gap-3 select-none py-1"
                >
                  <Avatar className="h-8 w-8 border border-border">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {player.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{player.display_name}</span>
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <DialogClose asChild>
            <Button variant="outline" disabled={loading}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave} disabled={loading} className="min-w-[100px]">
            {loading ? "Salvando..." : <><UserCheck className="w-4 h-4 mr-2" /> Salvar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};