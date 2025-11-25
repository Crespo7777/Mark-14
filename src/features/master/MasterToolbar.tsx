// src/features/master/MasterToolbar.tsx

import { Button } from "@/components/ui/button";
import { MessageSquare, EyeOff, BookOpen, LayoutDashboard, Database, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MasterJournalTab } from "./MasterJournalTab";
import { MasterDatabaseTab } from "./MasterDatabaseTab";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MasterToolbarProps {
  tableId: string;
  onToggleChat: () => void;
  isChatOpen: boolean;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const MasterToolbar = ({ 
  tableId, 
  onToggleChat, 
  isChatOpen, 
  onToggleSidebar, 
  isSidebarOpen 
}: MasterToolbarProps) => {
  const { toast } = useToast();

  const handleStopProjection = async () => {
     await supabase.from("game_states").update({ current_scene_id: null }).eq("table_id", tableId);
     toast({ title: "Projeção Oculta", description: "Jogadores agora veem apenas a grelha." });
  };

  return (
    <>
        {/* Toggle Sidebar (Biblioteca) */}
        <Tooltip>
            <TooltipTrigger asChild>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className={`h-12 w-12 rounded-xl transition-colors ${isSidebarOpen ? "bg-white/20 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"}`}
                    onClick={onToggleSidebar}
                >
                    <LayoutDashboard className="w-6 h-6" />
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>Biblioteca (Cenas/Tokens)</p></TooltipContent>
        </Tooltip>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* Diário (Sheet Inferior) */}
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors" title="Diário">
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

        {/* Database (Dialog Central) */}
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-white/70 hover:bg-white/10 hover:text-white transition-colors" title="Database">
                    <Database className="w-6 h-6" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Compêndio de Regras & Itens</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    <MasterDatabaseTab tableId={tableId} />
                </div>
            </DialogContent>
        </Dialog>

        <div className="w-px h-8 bg-white/10 mx-1" />

        {/* Controlo de Projeção */}
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-12 w-12 rounded-xl text-white/70 hover:bg-red-500/20 hover:text-red-400 transition-colors" onClick={handleStopProjection}>
                    <EyeOff className="w-6 h-6" />
                </Button>
            </TooltipTrigger>
            <TooltipContent><p>Parar Projeção</p></TooltipContent>
        </Tooltip>

        {/* Toggle Chat */}
        <Button 
            variant="ghost" size="icon" 
            className={`h-12 w-12 rounded-xl transition-colors ${isChatOpen ? "bg-white/20 text-white" : "text-white/70 hover:bg-accent/20 hover:text-accent"}`}
            onClick={onToggleChat}
            title={isChatOpen ? "Fechar Chat" : "Abrir Chat"}
        >
            {isChatOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        </Button>
    </>
  );
};