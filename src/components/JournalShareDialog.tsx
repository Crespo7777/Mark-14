import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTableContext } from "@/features/table/TableContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserCheck, Users, ShieldAlert } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { JournalEntryWithRelations } from "@/types/app-types";

interface JournalShareDialogProps {
  entry: JournalEntryWithRelations | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

export const JournalShareDialog = ({ entry, open, onOpenChange, onSaved }: JournalShareDialogProps) => {
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { members } = useTableContext();
  const { toast } = useToast();

  const players = members.filter(m => !m.isMaster);
  const allPlayerIds = players.map(p => p.id);
  const isAllSelected = players.length > 0 && selectedPlayers.length === players.length;

  useEffect(() => {
    if (open && entry) {
      setSelectedPlayers(entry.shared_with_players || []);
    }
  }, [open, entry]);

  const handleSelectAllChange = (checked: boolean) => {
    setSelectedPlayers(checked ? allPlayerIds : []);
  };

  const handleCheckedChange = (playerId: string, checked: boolean) => {
    setSelectedPlayers(prev => 
      checked ? [...prev, playerId] : prev.filter(id => id !== playerId)
    );
  };

  const handleSave = async () => {
    if (!entry) return;
    setLoading(true);
    
    try {
      const isSharedGlobal = players.length > 0 && selectedPlayers.length === players.length;

      // ATENÇÃO: A coluna aqui é 'is_shared_with_players'
      const { error } = await supabase
        .from("journal_entries")
        .update({ 
            shared_with_players: selectedPlayers,
            is_shared_with_players: isSharedGlobal 
        })
        .eq("id", entry.id);

      if (error) throw error;

      toast({ title: "Visibilidade Atualizada", description: "Permissões do diário alteradas." });
      onSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast({ title: "Erro ao partilhar", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-background border-border shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> 
            Partilhar Diário
          </DialogTitle>
          <DialogDescription>
            Defina quem pode ler este documento.
          </DialogDescription>
        </DialogHeader>
        
        {players.length > 0 ? (
          <>
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-muted/40 border border-border/40 hover:bg-muted/60 transition-colors">
              <Checkbox
                id="share-all-journal"
                checked={isAllSelected}
                onCheckedChange={(c) => handleSelectAllChange(c as boolean)}
              />
              <Label htmlFor="share-all-journal" className="flex-1 cursor-pointer font-bold select-none text-sm">
                Todos os Jogadores
              </Label>
            </div>
            
            <Separator className="my-2" />

            <ScrollArea className="max-h-[280px] pr-4 -mr-4">
              <div className="space-y-1">
                {players.map(player => (
                  <div key={player.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={`share-journal-${player.id}`}
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={(c) => handleCheckedChange(player.id, c as boolean)}
                    />
                    <Label htmlFor={`share-journal-${player.id}`} className="flex-1 cursor-pointer flex items-center gap-3 select-none py-1">
                      <Avatar className="h-8 w-8 border border-border/50">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {player.display_name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{player.display_name}</span>
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
            <ShieldAlert className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm italic">Não há jogadores na mesa.</p>
          </div>
        )}
        
        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading} className="gap-2 min-w-[120px]">
            {loading ? "A guardar..." : <><UserCheck className="w-4 h-4" /> Confirmar</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};