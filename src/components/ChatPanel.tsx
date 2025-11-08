import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Dices } from "lucide-react"; // <- CORREÇÃO: Trocado 'DiceRoll' por 'Dices'
import { useToast } from "@/hooks/use-toast";
import { parseDiceRoll, formatRollResult } from "@/lib/dice-parser";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    loadMessages();
    
    // Corrigido para retornar a função de unsubscribe
    const channel = subscribeToMessages();
    return () => {
      channel.unsubscribe();
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
            setMessages((prev) => [...prev, data]);
          }
        },
      )
      .subscribe();

    return channel; // Retorna o canal
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

    // Lógica de rolagem
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

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border/50">
        <h2 className="font-semibold">Chat da Mesa</h2>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "p-3 rounded-lg",
                msg.message_type === "roll"
                  ? "bg-accent/20 border border-accent/30 text-accent-foreground"
                  : "bg-muted/50",
                msg.message_type === "error" &&
                  "bg-destructive/20 border border-destructive/30 text-destructive-foreground",
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm flex items-center gap-2">
                  {/* <- CORREÇÃO: Trocado 'DiceRoll' por 'Dices' */}
                  {msg.message_type === "roll" && <Dices className="w-4 h-4" />}
                  {msg.user.display_name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
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
          <Button onClick={handleSend} disabled={loading} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};