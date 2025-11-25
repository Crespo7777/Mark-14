// src/features/master/MasterToolbar.tsx

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  EyeOff, 
  Settings,
  BookOpen,
  X
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription 
} from "@/components/ui/sheet";
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { MasterJournalTab } from "./MasterJournalTab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DiscordSettingsDialog } from "@/components/DiscordSettingsDialog"; // Importar o Dialog existente

interface MasterToolbarProps {
  tableId: string;
  onToggleChat: () => void;
  isChatOpen: boolean;
}

export const MasterToolbar = ({ tableId, onToggleChat, isChatOpen }: MasterToolbarProps) => {
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleStopProjection = async () => {
     await supabase.from("game_states").update({ current_scene_id: null }).eq("table_id", tableId);
     toast({ title: "Projeção Oculta", description: "Jogadores agora veem apenas a grelha." });
  };

  return (
    <>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-red-500/20 hover:text-red-400 text-white transition-colors" onClick={handleStopProjection}>
                    <EyeOff className="w-6 h-6" />
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>Parar Projeção</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-8 bg-white/20 mx-1" />

        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/10 text-white transition-colors" title="Diário">
                    <BookOpen className="w-6 h-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh]">
                <SheetHeader className="mb-4">
                    <SheetTitle>Diário da Mesa</SheetTitle>
                    <SheetDescription>Anotações e registos da campanha.</SheetDescription>
                </SheetHeader>
                <div className="h-full pb-12">
                    <MasterJournalTab tableId={tableId} />
                </div>
            </SheetContent>
        </Sheet>

        <Button 
            variant="ghost" size="icon" 
            className={`h-12 w-12 rounded-xl transition-colors ${isChatOpen ? "bg-white/20 text-white" : "hover:bg-accent/20 hover:text-accent text-white"}`}
            onClick={onToggleChat}
            title={isChatOpen ? "Fechar Chat" : "Abrir Chat"}
        >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </Button>

        {/* Botão de Configurações (Discord) */}
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl hover:bg-white/10 text-white transition-colors" title="Configurações">
                    <Settings className="w-6 h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                 {/* Reutilizamos o componente existente, mas dentro deste Dialog wrapper para controlar o estado se necessário, 
                     ou melhor, o DiscordSettingsDialog já tem o seu próprio Dialog, então podemos renderizá-lo diretamente 
                     se removermos o DialogTrigger daqui e usarmos o dele.
                     
                     Vamos simplificar: O DiscordSettingsDialog já é um botão que abre um dialog. 
                     Mas aqui queremos um ícone específico.
                     
                     A solução mais limpa sem alterar o outro ficheiro é clicar aqui e abrir o conteúdo.
                     Vou renderizar o conteúdo do DiscordSettingsDialog aqui manualmente ou simular o click?
                     
                     Melhor: Vou assumir que o DiscordSettingsDialog é um componente de botão. 
                     Vou substituir este botão pelo DiscordSettingsDialog mas estilizado.
                     
                     Para não complicar, vou usar uma versão simplificada aqui que chama a lógica.
                 */}
                 <div className="pt-4">
                    <h2 className="text-lg font-bold mb-4">Configurações da Mesa</h2>
                    <p className="text-sm text-muted-foreground mb-4">Configurações rápidas do sistema.</p>
                    <div className="flex flex-col gap-2">
                         {/* Aqui renderizamos o componente original que já tem a lógica toda */}
                         <DiscordSettingsDialog /> 
                    </div>
                 </div>
            </DialogContent>
        </Dialog>
    </>
  );
};