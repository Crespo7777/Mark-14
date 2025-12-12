import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, X, Terminal, Trash2 } from "lucide-react";
import { ChatBubble } from "./ChatBubble";
import { supabase } from "@/integrations/supabase/client";
import { useTableContext } from "@/features/table/TableContext";
import { parseDiceRoll, formatRollResult } from "@/lib/dice-parser";
import { useToast } from "@/hooks/use-toast";

// Imports do Modal
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

interface ChatPanelProps {
  onClose: () => void;
}

export const ChatPanel = ({ onClose }: ChatPanelProps) => {
  const { tableId, userId, members, isMaster } = useTableContext();
  const { toast } = useToast();
  
  const [messages, setMessages] = useState<any[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // --- MAPEAR DADOS ---
  const mapMessage = (msg: any) => ({
      ...msg,
      content: msg.message, 
      sender_name: members.find(m => m.id === msg.user_id)?.display_name || "Alguém"
  });

  // 1. Carregar mensagens e Configurar Realtime
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("table_id", tableId)
        .order("created_at", { ascending: true }) 
        .limit(50);
      
      if (data) {
          setMessages(data.map(mapMessage));
      }
    };
    fetchMessages();

    const channel = supabase.channel(`chat:${tableId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `table_id=eq.${tableId}` }, 
        (payload) => {
            const newMsg = mapMessage(payload.new);
            
            // --- CORREÇÃO DE DUPLICATAS ---
            // Verifica se a mensagem já existe (porque nós a adicionamos manualmente no handleSend)
            setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
            });
        })
        .on('broadcast', { event: 'CHAT_CLEAR' }, () => {
            setMessages([]); 
            toast({ title: "O histórico foi limpo." });
        })
        .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [tableId, members]);

  // Auto-scroll
  useEffect(() => {
      if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const text = inputValue.trim();
    setInputValue(""); 

    let contentToSave = text;
    let type = "chat";
    let rollData = null;

    // Lógica de Dados (/r)
    if (text.startsWith("/r ") || text.startsWith("/roll ")) {
        const formula = text.replace(/^\/(r|roll)\s+/, "");
        const rollResult = parseDiceRoll(formula);
        
        if (rollResult) {
            type = "roll";
            contentToSave = formatRollResult(formula, rollResult);
            rollData = { rollType: "manual", command: formula, result: rollResult };
        } else {
            toast({ title: "Erro na fórmula", description: "Use /r 1d20+5", variant: "destructive" });
            return;
        }
    }

    // --- CORREÇÃO CRÍTICA: .select().single() ---
    // Pedimos ao Supabase para devolver o dado inserido imediatamente
    const { data, error } = await supabase.from("chat_messages").insert({
        table_id: tableId,
        user_id: userId,
        message: contentToSave,
        message_type: type
    }).select().single();

    if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else if (data) {
        // --- ATUALIZAÇÃO IMEDIATA (Optimistic UI) ---
        // Adiciona à lista na hora, sem esperar pelo ciclo do Realtime
        const sentMsg = mapMessage(data);
        setMessages(prev => [...prev, sentMsg]);

        // Integração Discord
        if (type === "roll" && rollData) {
             const currentUser = members.find(m => m.id === userId);
             supabase.functions.invoke('discord-roll-handler', {
                body: { tableId, rollData, userName: currentUser?.display_name || "Alguém" }
              }).catch(console.error);
        }
    }
  };

  const executeClearChat = async () => {
      setIsAlertOpen(false);

      const { error } = await supabase
          .from("chat_messages")
          .delete()
          .eq("table_id", tableId);

      if (error) {
          toast({ title: "Erro ao limpar", description: error.message, variant: "destructive" });
      } else {
          setMessages([]);
          toast({ title: "Chat limpo!" });

          await supabase.channel(`chat:${tableId}`).send({
              type: 'broadcast',
              event: 'CHAT_CLEAR',
              payload: {}
          });
      }
  };

  return (
    <div className="flex flex-col h-full bg-background border-l border-border shadow-2xl animate-in slide-in-from-right-full duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-primary" />
            <span className="font-bold text-sm">Chat da Mesa</span>
        </div>
        <div className="flex items-center gap-1">
            {isMaster && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-muted-foreground hover:text-destructive" 
                    onClick={() => setIsAlertOpen(true)}
                    title="Limpar Chat"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            )}
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
                <X className="w-4 h-4" />
            </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="flex flex-col justify-end min-h-full">
            {messages.length === 0 && (
                <div className="text-center text-muted-foreground text-xs py-10 opacity-50 select-none">
                    Histórico vazio.
                </div>
            )}
            {messages.map((msg) => (
                <ChatBubble key={msg.id} message={msg} currentUserId={userId} />
            ))}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="p-3 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input 
                value={inputValue} 
                onChange={(e) => setInputValue(e.target.value)} 
                placeholder="Mensagem ou /r 1d20..." 
                className="flex-1 h-9 text-sm"
                autoFocus
            />
            <Button type="submit" size="icon" className="h-9 w-9" disabled={!inputValue.trim()}>
                <Send className="w-4 h-4" />
            </Button>
        </form>
      </div>

      {/* Modal de Limpeza */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar histórico?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apaga todas as mensagens para todos os jogadores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeClearChat} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Apagar Tudo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};