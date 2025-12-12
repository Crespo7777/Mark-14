import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { ChatPanel } from "./ChatPanel";
import { cn } from "@/lib/utils";

export const ChatOverlay = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false); // Futuro: Lógica de notificação

  return (
    <>
      {/* Botão Flutuante (Só aparece se fechado) */}
      <div className={cn(
          "fixed bottom-6 right-6 z-50 transition-all duration-300",
          isOpen ? "translate-x-[150%] opacity-0" : "translate-x-0 opacity-100"
      )}>
        <Button 
            onClick={() => setIsOpen(true)} 
            size="icon" 
            className="h-12 w-12 rounded-full shadow-xl bg-primary hover:bg-primary/90 border-2 border-white/10"
        >
            <MessageSquareText className="w-6 h-6" />
            {hasUnread && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-background" />
            )}
        </Button>
      </div>

      {/* Painel Lateral (Drawer) */}
      <div className={cn(
          "fixed inset-y-0 right-0 z-50 w-80 sm:w-96 shadow-2xl transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
      )}>
          {isOpen && <ChatPanel onClose={() => setIsOpen(false)} />}
      </div>
      
      {/* Overlay de fundo (opcional, para fechar ao clicar fora em mobile) */}
      {isOpen && (
          <div 
            className="fixed inset-0 bg-black/20 z-40 md:hidden" 
            onClick={() => setIsOpen(false)} 
          />
      )}
    </>
  );
};