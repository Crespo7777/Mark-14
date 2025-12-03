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
import { UserX, Crown, Shield } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

interface MasterPlayersTabProps {
  tableId: string;
}

export const MasterPlayersTab = ({ tableId }: MasterPlayersTabProps) => {
  const { members, setMembers } = useTableContext();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [playerToRemove, setPlayerToRemove] = useState<TableMember | null>(null);

  // Função para Alternar status de Ajudante
  const handleToggleHelper = async (member: TableMember) => {
    const newStatus = !member.isHelper;

    // 1. Atualiza no Banco de Dados
    const { error } = await supabase
        .from("table_members")
        .update({ is_helper: newStatus })
        .eq("table_id", tableId)
        .eq("user_id", member.id);

    if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
    }

    // 2. Atualiza o Estado Local (Feedback Imediato)
    setMembers(prev => prev.map(m => 
        m.id === member.id ? { ...m, isHelper: newStatus } : m
    ));

    toast({ 
        title: newStatus ? "Ajudante Promovido!" : "Permissão Removida", 
        description: newStatus 
            ? `${member.display_name} agora tem acesso às ferramentas de Mestre.` 
            : `${member.display_name} voltou a ser um jogador comum.`
    });
  };

  const handleRemovePlayer = async () => {
    if (!playerToRemove) return;
    
    const { error } = await supabase
      .from("table_members")
      .delete()
      .eq("table_id", tableId)
      .eq("user_id", playerToRemove.id);

    if (!error) {
        await supabase
          .from("characters")
          .delete()
          .eq("table_id", tableId)
          .eq("player_id", playerToRemove.id);
          
        toast({ title: "Jogador removido com sucesso." });
        queryClient.invalidateQueries({ queryKey: ['characters', tableId] });
        // Atualiza a lista visualmente
        setMembers(prev => prev.filter(m => m.id !== playerToRemove.id));
    } else {
        toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    }
    setPlayerToRemove(null);
  };

  // Filtra apenas jogadores (exclui o Mestre principal da lista)
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
            <Card key={member.id} className={`border-border/50 transition-all ${member.isHelper ? "border-yellow-500/50 bg-yellow-500/5" : ""}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    {/* Helper ganha avatar dourado */}
                    <AvatarFallback className={`${member.isHelper ? "bg-yellow-600 text-white" : "bg-primary/20 text-primary"}`}>
                      {member.display_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex flex-col">
                      <CardTitle className="text-base truncate max-w-[150px]" title={member.display_name}>
                        {member.display_name}
                      </CardTitle>
                      {member.isHelper && <Badge variant="outline" className="text-[10px] h-4 px-1 border-yellow-600 text-yellow-600 w-fit">Ajudante</Badge>}
                  </div>
                </div>
                
                <div className="flex gap-1">
                    {/* Botão de Promover a Helper (Coroa/Escudo) */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`${member.isHelper ? "text-yellow-600 hover:text-yellow-700 bg-yellow-100/50" : "text-muted-foreground hover:text-yellow-600"}`}
                      onClick={() => handleToggleHelper(member)}
                      title={member.isHelper ? "Remover permissão de Ajudante" : "Promover a Ajudante do Mestre"}
                    >
                      {member.isHelper ? <Shield className="w-4 h-4" /> : <Crown className="w-4 h-4" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setPlayerToRemove(member)}
                      title="Remover Jogador"
                    >
                      <UserX className="w-5 h-5" />
                    </Button>
                </div>
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