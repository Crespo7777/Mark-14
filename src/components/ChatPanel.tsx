// src/components/ChatPanel.tsx

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Dices, Trash2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatRollResult } from "@/lib/dice-parser"; 
import { cn } from "@/lib/utils";
import { useTableContext, TableMember } from "@/features/table/TableContext";
import DOMPurify from "dompurify";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface Message {
  id: string;
  message: string;
  message_type: string;
  created_at: string;
  user: {
    display_name: string;
  };
}

interface ChatPanelProps {
  tableId: string;
}

const fetchMessages = async (tableId: string) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select(
      `
      id,
      message,
      message_type,
      created_at,
      user:profiles!chat_messages_user_id_fkey(display_name)
    `
    )
    .eq("table_id", tableId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as Message[];
};

const escapeRegExp = (string: string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const parseMentions = (text: string, members: TableMember[]): string => {
  let parsedText = text;
  members.forEach(member => {
    const mentionRegex = new RegExp(`@${escapeRegExp(member.display_name)}`, 'gi');
    parsedText = parsedText.replace(mentionRegex, (match) => 
      `<strong class="mention">${match}</strong>`
    );
  });
  return parsedText;
};

export const ChatPanel = ({ tableId }: ChatPanelProps) => {
  const queryClient = useQueryClient();
  
  const { data: messages = [] } = useQuery({
    queryKey: ['chat_messages', tableId],
    queryFn: () => fetchMessages(tableId),
  });

  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { isMaster, tableId: contextTableId, members } = useTableContext();
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`chat-room:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_messages",
          filter: `table_id=eq.${tableId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['chat_messages', tableId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, queryClient]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent) return;
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const currentUser = members.find(m => m.id === user.id);
    const userName = currentUser ? currentUser.display_name : "Usuário";

    let messageToSend = messageContent;
    let messageType = "chat";
    let discordRollData: any = null; 

    if (messageContent.startsWith("/r ") || messageContent.startsWith("/roll ")) {
      const command = messageContent.replace(/(\/r|\/roll)\s+/, "");
      const result = parseDiceRoll(command);
      
      if (result) {
        messageToSend = formatRollResult(command, result);
        messageType = "roll";
        
        discordRollData = {
          rollType: "manual",
          command: command,
          result: result,
        };
        
      } else {
        messageToSend = `Comando de rolagem inválido: ${command}`;
        messageType = "error";
      }
    } else {
      messageToSend = parseMentions(messageContent, members);
      messageType = "chat";
    }
    
    const { error } = await supabase.from("chat_messages").insert({
      table_id: tableId,
      user_id: user.id,
      message: messageToSend,
      message_type: messageType,
      recipient_id: null,
    });
    
    if (error) {
      toast({ title: "Erro", description: "Não foi possível enviar a mensagem", variant: "destructive" });
    } else {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ['chat_messages', tableId] });

      if (messageType === "roll" && discordRollData) {
        supabase.functions.invoke('discord-roll-handler', {
          body: {
            tableId: contextTableId,
            rollData: discordRollData,
            userName: userName,
          }
        }).catch(console.error);
      }
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = async () => {
    setLoading(true);
    const { error } = await supabase.from("chat_messages").delete().eq("table_id", contextTableId);
    
    if (error) {
      toast({ title: "Erro ao limpar", description: error.message, variant: "destructive" });
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
         await supabase.from("chat_messages").insert({
          table_id: contextTableId,
          user_id: user.id,
          message: "O Mestre limpou o histórico do chat.",
          message_type: "info_clear",
          recipient_id: null,
        });
      }
      toast({ title: "Chat Limpo!" });
      queryClient.invalidateQueries({ queryKey: ['chat_messages', tableId] });
    }
    setLoading(false);
    setIsClearAlertOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-transparent">
      
      {/* Área de Rolagem das Mensagens */}
      <ScrollArea className="flex-1 p-4">
        {/* Botão de Limpar (apenas Mestre) - Agora dentro da área de scroll no topo, discreto */}
        {isMaster && messages.length > 0 && (
            <div className="flex justify-end mb-2">
                 <Button
                  variant="ghost"
                  size="xs"
                  className="text-xs text-muted-foreground hover:text-destructive h-6 px-2"
                  onClick={() => setIsClearAlertOpen(true)}
                  disabled={loading}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Limpar Histórico
                </Button>
            </div>
        )}

        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-3 rounded-lg text-sm",
                msg.message_type === "roll" ? "bg-accent/10 border border-accent/20" : "bg-muted/40 border border-white/5",
                msg.message_type === "error" && "bg-destructive/20 border border-destructive/30 text-destructive-foreground",
                msg.message_type === "info" && "bg-blue-900/20 border border-blue-500/20 text-center text-blue-200 italic",
                msg.message_type === "info_clear" && "bg-transparent text-center text-muted-foreground italic text-xs py-2 border-y border-white/5"
              )}
            >
              {msg.message_type.startsWith("info") ? (
                <div 
                   className="whitespace-pre-wrap" 
                   dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }} 
                />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-primary/90 flex items-center gap-2">
                      {msg.message_type === "roll" && <Dices className="w-3 h-3 text-accent" />}
                      {msg.user?.display_name || "Desconhecido"}
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-70">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div 
                    className="whitespace-pre-wrap break-words text-foreground/90 leading-relaxed" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }} 
                  />
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Área de Input */}
      <div className="p-3 border-t border-white/10 bg-muted/10">
        <div className="flex gap-2">
          <Input
            placeholder="/r 1d20+5..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            className="bg-background/50 border-white/10 focus:ring-accent/50 h-9 text-sm"
          />
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-white"><HelpCircle className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Comandos</DialogTitle>
                <DialogDescription>Use /r ou /roll para rolar dados.</DialogDescription>
              </DialogHeader>
              <div className="p-2 bg-muted rounded text-sm font-mono">/r 1d20+5</div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSend} disabled={loading} size="icon" className="h-9 w-9 bg-primary hover:bg-primary/90">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar tudo?</AlertDialogTitle>
            <AlertDialogDescription>Todas as mensagens serão apagadas para todos.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={handleClearChat} disabled={loading}>
              Limpar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};