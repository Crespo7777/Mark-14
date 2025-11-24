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
import DOMPurify from "dompurify"; // <-- IMPORTANTE
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
    <div className="flex flex-col h-full bg-card">
      <div className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Chat da Mesa</h2>
          {isMaster && (
            <Button
              variant="destructive"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsClearAlertOpen(true)}
              disabled={loading}
            >
              <Trash2 className="w-4 h-4" />
              <span className="sr-only">Limpar Chat</span>
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-3 rounded-lg",
                msg.message_type === "roll" ? "bg-accent/20 border border-accent/30" : "bg-muted/50",
                msg.message_type === "error" && "bg-destructive/20 border border-destructive/30 text-destructive-foreground",
                msg.message_type === "info" && "bg-blue-900/30 border border-blue-500/30 text-center text-blue-300 italic",
                msg.message_type === "info_clear" && "bg-muted border border-border text-center text-muted-foreground italic text-xs py-2"
              )}
            >
              {/* AQUI ESTÁ A CORREÇÃO DE SEGURANÇA */}
              {msg.message_type.startsWith("info") ? (
                <div 
                   className="text-sm whitespace-pre-wrap" 
                   dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }} 
                />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm flex items-center gap-2 text-foreground">
                      {msg.message_type === "roll" && <Dices className="w-4 h-4 text-accent" />}
                      {msg.user?.display_name || "Desconhecido"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div 
                    className="text-sm whitespace-pre-wrap" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message) }} 
                  />
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            placeholder="Digite /r 1d20+5 para rolar..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="icon"><HelpCircle className="w-4 h-4" /></Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Comandos do Chat</DialogTitle>
                <DialogDescription>Comandos disponíveis para rolagens de dados.</DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p className="font-mono p-2 bg-muted rounded-md text-sm">/r XdY+Z</p>
                <p>Rola X dados de Y lados, somando Z. (Ex: <code>/r 2d8+5</code>)</p>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSend} disabled={loading} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar o Chat?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação removerá permanentemente todas as mensagens.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction className={cn(buttonVariants({ variant: "destructive" }))} onClick={handleClearChat} disabled={loading}>
              {loading ? "Limpando..." : "Limpar Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};