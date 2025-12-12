import { cn } from "@/lib/utils";
import { User, ShieldAlert, Dices } from "lucide-react";

interface ChatBubbleProps {
  message: {
    id: string;
    content: string;
    message_type: string; // 'chat' | 'roll' | 'error' | 'info'
    user_id: string;
    created_at: string;
    sender_name?: string;
  };
  currentUserId: string;
}

export const ChatBubble = ({ message, currentUserId }: ChatBubbleProps) => {
  const isMe = message.user_id === currentUserId;
  const isRoll = message.message_type === 'roll';
  const isSystem = message.message_type === 'info' || message.message_type === 'error';

  // Formata a hora
  const time = new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={cn(
      "flex flex-col gap-1 mb-3 max-w-[90%]",
      isMe ? "self-end items-end" : "self-start items-start",
      isSystem && "self-center items-center max-w-full w-full"
    )}>
      {/* Nome do Remetente (se não for sistema) */}
      {!isSystem && (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1 px-1">
          {isMe ? "Você" : message.sender_name || "Desconhecido"} 
          <span className="opacity-50"> • {time}</span>
        </span>
      )}

      {/* Conteúdo da Mensagem */}
      <div className={cn(
        "px-3 py-2 text-sm shadow-sm break-words relative",
        // Estilos baseados no tipo
        !isRoll && !isSystem && isMe && "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm",
        !isRoll && !isSystem && !isMe && "bg-muted text-foreground rounded-2xl rounded-tl-sm",
        
        // Estilo de Rolagem (Foundry Style)
        isRoll && "bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-md w-64 font-mono",
        
        // Estilo de Sistema
        isSystem && "bg-transparent text-xs text-muted-foreground text-center italic w-full"
      )}>
        {isRoll && (
            <div className="absolute -top-3 -left-3 bg-zinc-800 p-1 rounded-full border border-zinc-700">
                <Dices className="w-4 h-4 text-orange-400" />
            </div>
        )}
        
        {/* Renderiza HTML para rolagens (para suportar cores e formatação do parser) */}
        {isRoll ? (
            <div 
                className="space-y-1 [&_span.text-primary-foreground]:text-orange-400 [&_span.font-bold]:font-black"
                dangerouslySetInnerHTML={{ __html: message.content }} 
            />
        ) : (
            <span>{message.content}</span>
        )}
      </div>
    </div>
  );
};