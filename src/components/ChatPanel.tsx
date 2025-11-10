// src/components/ChatPanel.tsx

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Dices, Trash2, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatRollResult } from "@/lib/dice-parser";
import { cn } from "@/lib/utils";

import { useTableContext } from "@/features/table/TableContext";
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

export const ChatPanel = ({ tableId }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const { isMaster, tableId: contextTableId } = useTableContext();
  const [isClearAlertOpen, setIsClearAlertOpen] = useState(false);

  useEffect(() => {
    loadMessages();

    const channel = subscribeToMessages();
    return () => {
      if (channel && typeof channel.unsubscribe === "function") {
        channel.unsubscribe();
      }
    };
  }, [tableId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select(
        `
        id,
        message,
        message_type,
        created_at,
        user:profiles!chat_messages_user_id_fkey(display_name)
      `,
      )
      .eq("table_id", tableId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading messages:", error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`chat:${tableId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `table_id=eq.${tableId}`,
        },
        async (payload) => {
          if (!payload.new || !payload.new.id) {
            console.warn("Payload de chat recebido sem ID:", payload);
            return;
          }

          const { data } = await supabase
            .from("chat_messages")
            .select(
              `
              id,
              message,
              message_type,
              created_at,
              user:profiles!chat_messages_user_id_fkey(display_name)
            `,
            )
            .eq("id", payload.new.id)
            .single();

          if (data) {
            if (data.message_type === 'info_clear') {
              setMessages([data]);
            } else {
              setMessages((prev) => [...prev, data]);
            }
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "chat_messages",
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        },
      )
      .subscribe();

    return channel;
  };

  const handleSend = async () => {
    const messageContent = newMessage.trim();
    if (!messageContent) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    let messageToSend = messageContent;
    let messageType = "chat";

    if (messageContent.startsWith("/r ") || messageContent.startsWith("/roll ")) {
      const command = messageContent.replace(/(\/r|\/roll)\s+/, "");
      const result = parseDiceRoll(command);

      if (result) {
        messageToSend = formatRollResult(command, result);
        messageType = "roll";
      } else {
        messageToSend = `Comando de rolagem inválido: ${command}`;
        messageType = "error";
      }
    }

    const { error } = await supabase.from("chat_messages").insert({
      table_id: tableId,
      user_id: user.id,
      message: messageToSend,
      message_type: messageType,
      recipient_id: null,
    });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- INÍCIO DA CORREÇÃO ---
  // A lógica foi atualizada para limpar o estado local
  // imediatamente após o sucesso do delete.

  const handleClearChat = async () => {
    setLoading(true);
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("table_id", contextTableId);
    
    setLoading(false);
    setIsClearAlertOpen(false);

    if (error) {
      toast({
        title: "Erro ao limpar o chat",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // O delete foi bem-sucedido no banco.
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Criamos o objeto da mensagem 'info_clear'
        const clearMessage = {
          id: `local-${Date.now()}`, // ID temporário local
          message: "O Mestre limpou o histórico do chat.",
          message_type: "info_clear",
          created_at: new Date().toISOString(),
          user: { display_name: "Sistema" } // O usuário não importa aqui
        };

        // 1. Limpa o chat local IMEDIATAMENTE para o Mestre.
        setMessages([clearMessage as Message]);

        // 2. Envia a mensagem 'info_clear' para o banco,
        // para notificar os outros jogadores (que vão limpar via realtime)
        await supabase.from("chat_messages").insert({
          table_id: contextTableId,
          user_id: user.id,
          message: clearMessage.message,
          message_type: clearMessage.message_type,
          recipient_id: null,
        });
      }
      toast({
        title: "Chat Limpo!",
        description: "O histórico de mensagens foi removido.",
      });
    }
  };
  // --- FIM DA CORREÇÃO ---

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
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
                msg.message_type === "roll"
                  ? "bg-accent/20 border border-accent/30"
                  : "bg-muted/50",
                msg.message_type === "error" &&
                  "bg-destructive/20 border border-destructive/30 text-destructive-foreground",
                msg.message_type === "info" &&
                  "bg-blue-900/30 border border-blue-500/30 text-center text-blue-300 italic",
                msg.message_type === "info_clear" &&
                  "bg-muted border border-border text-center text-muted-foreground italic text-xs py-2"
              )}
            >
              {msg.message_type.startsWith("info") ? (
                <div
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: msg.message }}
                />
              ) : (
                <>
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-sm flex items-center gap-2 text-foreground">
                      {msg.message_type === "roll" && (
                        <Dices className="w-4 h-4 text-accent" />
                      )}
                      {msg.user.display_name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  
                  <div
                    className="text-sm whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: msg.message }}
                  />
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border/50">
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
              <Button variant="outline" size="icon">
                <HelpCircle className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Comandos do Chat</DialogTitle>
                <DialogDescription>
                  Comandos disponíveis para rolagens de dados.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-2">
                <p className="font-mono p-2 bg-muted rounded-md text-sm">
                  /r XdY+Z
                </p>
                <p>
                  Rola X dados de Y lados, somando Z como modificador.
                  (Ex: <code>/r 2d8+5</code>)
                </p>
                <p className="font-mono p-2 bg-muted rounded-md text-sm">
                  /roll XdY-Z
                </p>
                <p>
                  Rola X dados de Y lados, subtraindo Z como modificador.
                  (Ex: <code>/roll 1d20-2</code>)
                </p>
              </div>
            </DialogContent>
          </Dialog>

          <Button onClick={handleSend} disabled={loading} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <AlertDialog
        open={isClearAlertOpen}
        onOpenChange={setIsClearAlertOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar o Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover permanentemente **todas** as mensagens do
              chat para **todos** os jogadores nesta mesa. Isso não pode ser
precedido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={cn(buttonVariants({ variant: "destructive" }))}
              onClick={handleClearChat}
              disabled={loading}
            >
              {loading ? "Limpando..." : "Limpar Chat"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};