// src/features/master/MasterPlayersTab.tsx

import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { UserX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useTableContext, TableMember } from "@/features/table/TableContext";

interface MasterPlayersTabProps {
  tableId: string;
}

export const MasterPlayersTab = ({ tableId }: MasterPlayersTabProps) => {
  const { members } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerToRemove, setPlayerToRemove] = useState<TableMember | null>(null);

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    
    // Remove da tabela de membros
    const { error } = await supabase
      .from("table_members")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", playerToRemove.id);

    if (!error) {
        // Remove também os personagens desse jogador nesta mesa (opcional, mas limpa a DB)
        await supabase
          .from("characters")
          .delete()
          .eq("table_id", tableId)
          .eq("player_id", playerToRemove.id);
          
        toast({ title: "Jogador removido com sucesso." });
        // Invalidar caches relevantes
        queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
        // A lista de membros atualiza via Realtime no TableContext, mas podemos forçar reload se necessário
    } else {
        toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
    setPlayerToRemove(null);
  };

  // Filtra apenas os jogadores (exclui o próprio Mestre da lista visual)
  const players = members.filter(m => !m.isMaster);

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold mb-4">Jogadores na Mesa ({players.length})</h3>
      
      {players.length === 0 ? (
        <p className="text-muted-foreground text-center py-8 border rounded-lg border-dashed">
          Nenhum jogador entrou na sua mesa ainda. Partilhe o ID da mesa com eles!
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {players.map((member) => (
            <Card key={member.id} className="border-border/50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback className="bg-primary/20 text-primary">
                      {member.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <CardTitle className="text-base truncate max-w-[150px]" title={member.display_name}>
                    {member.display_name}
                  </CardTitle>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setPlayerToRemove(member)}
                >
                  <UserX className="w-5 h-5" />
                </Button>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      <AlertDialog open={!!playerToRemove} onOpenChange={(open) => !open && setPlayerToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Jogador?</AlertDialogTitle>
            <AlertDialogDescription>
                Você tem certeza que quer remover <span className="font-bold text-destructive">{playerToRemove?.display_name}</span>? 
                <br/><br/>
                Isso irá removê-lo da mesa e <strong>apagar todas as fichas</strong> que ele criou nesta mesa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePlayer} className={buttonVariants({ variant: "destructive" })}>
              Remover Jogador
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};